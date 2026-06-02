const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"
});

async function run() {
  console.log("Fetching products with .0 EANs...");
  const rs = await client.execute("SELECT ean, nombre_estandarizado, marca, contenido_neto, unidad_medida, categoria_id, url_imagen FROM ProductoMaestro WHERE ean LIKE '%.0'");
  
  console.log(`Found ${rs.rows.length} products to fix.`);
  
  let fixedCount = 0;
  for (const row of rs.rows) {
    const oldEan = row.ean;
    const newEan = oldEan.slice(0, -2);
    
    // Check if newEan already exists
    const existsRs = await client.execute({ sql: "SELECT ean FROM ProductoMaestro WHERE ean = ?", args: [newEan] });
    
    if (existsRs.rows.length === 0) {
      // Insert newEan
      await client.execute({
        sql: "INSERT INTO ProductoMaestro (ean, nombre_estandarizado, marca, contenido_neto, unidad_medida, categoria_id, url_imagen) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [newEan, row.nombre_estandarizado, row.marca, row.contenido_neto, row.unidad_medida, row.categoria_id, row.url_imagen]
      });
    }
    
    // Update SucursalPrecio (with conflict resolution if the supermarket is already there)
    const precios = await client.execute({ sql: "SELECT * FROM SucursalPrecio WHERE producto_ean = ?", args: [oldEan] });
    
    for (const p of precios.rows) {
      // Try to update or insert
      try {
        await client.execute({
          sql: `INSERT INTO SucursalPrecio (producto_ean, supermercado_id, precio_actual, precio_lista, disponible_online, url_imagen, product_url, ultima_actualizacion) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(producto_ean, supermercado_id) DO UPDATE SET 
                  precio_actual=excluded.precio_actual,
                  precio_lista=excluded.precio_lista,
                  disponible_online=excluded.disponible_online,
                  ultima_actualizacion=excluded.ultima_actualizacion`,
          args: [newEan, p.supermercado_id, p.precio_actual, p.precio_lista, p.disponible_online, p.url_imagen, p.product_url, p.ultima_actualizacion]
        });
      } catch (e) {
        console.error("Error updating price:", e);
      }
    }
    
    // Delete old SucursalPrecio
    await client.execute({ sql: "DELETE FROM SucursalPrecio WHERE producto_ean = ?", args: [oldEan] });
    
    // Delete old ProductoMaestro
    await client.execute({ sql: "DELETE FROM ProductoMaestro WHERE ean = ?", args: [oldEan] });
    
    fixedCount++;
    if (fixedCount % 100 === 0) console.log(`Fixed ${fixedCount} products...`);
  }
  
  console.log(`Finished fixing ${fixedCount} products.`);
}

run().catch(console.error);

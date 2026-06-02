const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"
});

async function run() {
  console.log("Starting fast DB fix...");

  // 1. Insert clean EANs into ProductoMaestro if they don't exist
  console.log("Inserting clean ProductoMaestro...");
  const res1 = await client.execute(`
    INSERT OR IGNORE INTO ProductoMaestro (ean, nombre_estandarizado, marca, contenido_neto, unidad_medida, categoria_id, url_imagen)
    SELECT substr(ean, 1, length(ean)-2), nombre_estandarizado, marca, contenido_neto, unidad_medida, categoria_id, url_imagen
    FROM ProductoMaestro
    WHERE ean LIKE '%.0'
  `);
  console.log("Rows affected:", res1.rowsAffected);

  // 2. Insert or replace SucursalPrecio
  console.log("Updating SucursalPrecio...");
  const res2 = await client.execute(`
    INSERT OR REPLACE INTO SucursalPrecio 
    (producto_ean, supermercado_id, precio_actual, precio_lista, disponible_online, url_imagen, product_url, ultima_actualizacion)
    SELECT 
      substr(producto_ean, 1, length(producto_ean)-2), 
      supermercado_id, 
      precio_actual, 
      precio_lista, 
      disponible_online, 
      url_imagen, 
      product_url, 
      ultima_actualizacion
    FROM SucursalPrecio
    WHERE producto_ean LIKE '%.0'
  `);
  console.log("Rows affected:", res2.rowsAffected);

  // 3. Delete old SucursalPrecio
  console.log("Deleting old SucursalPrecio...");
  const res3 = await client.execute("DELETE FROM SucursalPrecio WHERE producto_ean LIKE '%.0'");
  console.log("Rows affected:", res3.rowsAffected);

  // 4. Delete old ProductoMaestro
  console.log("Deleting old ProductoMaestro...");
  const res4 = await client.execute("DELETE FROM ProductoMaestro WHERE ean LIKE '%.0'");
  console.log("Rows affected:", res4.rowsAffected);

  console.log("Done!");
}

run().catch(console.error);

const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"
});

async function run() {
  const rs = await client.execute(`
    SELECT pm.ean, pm.nombre_estandarizado, sp.supermercado_id, sp.precio_actual
    FROM ProductoMaestro pm
    JOIN SucursalPrecio sp ON pm.ean = sp.producto_ean
    WHERE pm.nombre_estandarizado LIKE '%COCA%2250%'
       OR pm.nombre_estandarizado LIKE '%COCA%2.25%'
  `);
  console.log("Variations of Coca Cola 2.25L:");
  console.log(rs.rows);
}

run().catch(console.error);

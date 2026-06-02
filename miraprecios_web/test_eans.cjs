const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"
});

async function run() {
  const rs1 = await client.execute("SELECT COUNT(*) as count FROM ProductoMaestro WHERE ean LIKE 'SYN-%'");
  console.log("Synthetic EANs:", rs1.rows[0].count);

  const rs2 = await client.execute("SELECT COUNT(*) as count FROM ProductoMaestro WHERE ean NOT LIKE 'SYN-%'");
  console.log("Real EANs:", rs2.rows[0].count);
  
  // Look at EAN lengths to see if some are internal SKUs
  const rs3 = await client.execute("SELECT LENGTH(ean) as len, COUNT(*) as c FROM ProductoMaestro WHERE ean NOT LIKE 'SYN-%' GROUP BY len ORDER BY c DESC LIMIT 10");
  console.log("EAN Length Distribution:", rs3.rows);

  // Supermarkets and synthetic EANs
  const rs4 = await client.execute(`
    SELECT supermercado_id, 
           SUM(CASE WHEN producto_ean LIKE 'SYN-%' THEN 1 ELSE 0 END) as syn_count,
           SUM(CASE WHEN producto_ean NOT LIKE 'SYN-%' THEN 1 ELSE 0 END) as real_count
    FROM SucursalPrecio 
    GROUP BY supermercado_id
  `);
  console.log("Synthetic vs Real per supermarket:");
  console.log(rs4.rows);
}

run().catch(console.error);

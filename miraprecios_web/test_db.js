import { createClient } from '@libsql/client';

const client = createClient({
  url: "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"
});

async function run() {
  const rs = await client.execute("SELECT supermercado_id, COUNT(*) as count FROM SucursalPrecio GROUP BY supermercado_id");
  console.log("SucursalPrecio counts:", rs.rows);
  const rs2 = await client.execute("SELECT supermercado_id, COUNT(*) as count FROM SucursalPrecio WHERE disponible_online=1 GROUP BY supermercado_id");
  console.log("SucursalPrecio disponible_online=1:", rs2.rows);
  const rs3 = await client.execute("SELECT COUNT(*) as count FROM ProductoMaestro");
  console.log("ProductoMaestro total:", rs3.rows);
}

run().catch(console.error);

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');

const libsql = createClient({
  url: "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function run() {
  const searchQuery = "COCA";
  const productos = await prisma.productoMaestro.findMany({
      where: {
          OR: [
              { nombre_estandarizado: { contains: searchQuery } },
              { marca: { contains: searchQuery } }
          ]
      },
      include: {
          precios_sucursales: {
              where: {
                  disponible_online: true,
                  precio_actual: { gt: 10 }
              },
              orderBy: { precio_actual: 'asc' }
          }
      },
      take: 2
  });
  console.log(JSON.stringify(productos, null, 2));
}

run().catch(console.error);

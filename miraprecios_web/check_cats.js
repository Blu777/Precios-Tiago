const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.productoMaestro.findMany({
    where: {
      categoria_id: { not: null }
    },
    select: {
      categoria_id: true
    },
    distinct: ['categoria_id'],
    take: 20
  });
  console.log("Categorias:", cats);
}
main().catch(console.error).finally(() => prisma.$disconnect());

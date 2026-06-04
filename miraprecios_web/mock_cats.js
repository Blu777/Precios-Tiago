const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.productoMaestro.findMany({ take: 20 });
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const cat = i < 10 ? 'almacen' : 'bebidas';
    await prisma.productoMaestro.update({
      where: { ean: p.ean },
      data: { categoria_id: cat }
    });
  }
  console.log('Done updating 20 products.');
}
main().catch(console.error).finally(() => prisma.$disconnect());

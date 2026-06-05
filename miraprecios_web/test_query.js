const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Running query...");
        const start = Date.now();
        const descuentos = await prisma.$queryRaw`
            SELECT count(*) as count
            FROM SucursalPrecio s
            WHERE s.precio_lista > s.precio_actual
        `;
        const end = Date.now();
        console.log(`Query took ${end - start}ms`);
        console.log("Count:", descuentos[0].count.toString());
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

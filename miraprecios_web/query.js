const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const prods = await prisma.productoMaestro.findMany({
        where: {
            nombre_estandarizado: {
                contains: 'COCA COLA'
            }
        },
        include: {
            precios_sucursales: true
        }
    });

    const targetProds = prods.filter(p => p.nombre_estandarizado.includes('600'));
    
    for (const p of targetProds) {
        console.log(`EAN: ${p.ean} | Grupo: ${p.grupo_id} | Nombre: ${p.nombre_estandarizado}`);
        for (const s of p.precios_sucursales) {
            console.log(`  - ${s.supermercado_id}: ${s.precio_actual}`);
        }
    }
}
main().then(() => prisma.$disconnect());

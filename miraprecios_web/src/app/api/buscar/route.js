import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page')) || 1;

    if (!query || query.length < 3) {
        return Response.json({ page: 1, results: [] });
    }

    const searchQuery = query.trim().toUpperCase(); // Uppercase porque SEPA normaliza en MAYÚSCULAS

    try {
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
                        disponible_online: true,   // Filtrar no disponibles
                        precio_actual: { gt: 10 }   // Filtrar precios inválidos fantasma (<= 10 pesos)
                    },
                    orderBy: { precio_actual: 'asc' }
                }
            },
            take: 24,
            skip: (page - 1) * 24
        });

        // Filtrar productos que quedaron sin sucursales válidas y armar estructura para ProductCard
        const finalResults = productos
            .filter(prod => prod.precios_sucursales.length > 0)
            .map(prod => {
                const lowestPrice = prod.precios_sucursales.length > 0 ? prod.precios_sucursales[0].precio_actual : null;
                const highestPrice = prod.precios_sucursales.length > 0 ? prod.precios_sucursales.at(-1).precio_actual : null;

                return {
                    barcode: prod.ean,
                    name: prod.nombre_estandarizado,
                    brand: prod.marca,
                    image_url: prod.url_imagen || prod.precios_sucursales.find(s => s.url_imagen)?.url_imagen || null,
                    lowestPrice: lowestPrice,
                    highestPrice: highestPrice,
                    sucursales: prod.precios_sucursales.map(s => ({
                        id: s.supermercado_id, // clave que espera ProductCard.jsx (ej. 'jumbo', 'coto')
                        precio: s.precio_actual,
                        precioLista: s.precio_lista,
                        product_url: s.product_url,
                        updated_at: s.ultima_actualizacion
                    }))
                };
            });

        return Response.json({
            page,
            results: finalResults
        });

    } catch (error) {
        console.error("Error buscando productos en BD:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

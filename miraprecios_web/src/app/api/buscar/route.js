import { prisma } from '../../../lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
        return Response.json([]);
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
                        disponible_online: true,   // NUEVO: Filtrar no disponibles
                        precio_actual: { gt: 10 }   // NUEVO: Filtrar precios inválidos fantasma (<= 10 pesos)
                    },
                    orderBy: { precio_actual: 'asc' }
                }
            },
            take: 50
        });

        // NUEVO: Filtrar productos que quedaron sin sucursales válidas
        const resultadoFinal = productos
            .filter(prod => prod.precios_sucursales.length > 0)
            .map(prod => ({
                barcode: prod.ean,
                name: prod.nombre_estandarizado,
                brand: prod.marca,
                weight: prod.contenido_neto,
                unit: prod.unidad_medida,
                image_url: prod.url_imagen || prod.precios_sucursales.find(s => s.url_imagen)?.url_imagen || null,
                precios: Object.fromEntries(
                    prod.precios_sucursales.map(sucursal => [
                        sucursal.supermercado_id,
                        {
                            precio_actual: sucursal.precio_actual,
                            precio_lista: sucursal.precio_lista,
                            product_url: sucursal.product_url
                        }
                    ])
                )
            }));

        return Response.json(resultadoFinal);

    } catch (error) {
        console.error("Error buscando productos en BD:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

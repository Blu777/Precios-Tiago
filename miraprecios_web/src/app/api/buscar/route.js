import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
// Although we want caching, we use cache-control headers directly on the response 
// rather than relying on route segment configs which might conflict with prisma connections.

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page')) || 1;

    if (!query || query.length < 3) {
        return Response.json({ page: 1, results: [] });
    }

    const searchQuery = query.trim().toUpperCase();
    const searchTerms = searchQuery.split(/\s+/).filter(w => w.length > 0);
    
    const andConditions = searchTerms.map(term => ({
        nombre_estandarizado: { contains: term }
    }));

    try {
        const productos = await prisma.productoMaestro.findMany({
            where: {
                OR: [
                    { AND: andConditions },
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
            take: Math.max(300, page * 24 + 100)
        });

        const productosValidos = productos.filter(prod => prod.precios_sucursales.length > 0);

        // Agrupar por grupo_id o ean (si no tiene grupo)
        const groupsMap = new Map();

        for (const prod of productosValidos) {
            const key = prod.grupo_id || prod.ean;
            const existingGroup = groupsMap.get(key);

            if (!existingGroup) {
                groupsMap.set(key, {
                    ...prod,
                    precios_sucursales: [...prod.precios_sucursales]
                });
            } else {
                // Fusionar sucursales
                existingGroup.precios_sucursales = [...existingGroup.precios_sucursales, ...prod.precios_sucursales];
                
                // Deduplicar sucursales por supermercado
                const uniqueSucursales = new Map();
                for (const s of existingGroup.precios_sucursales) {
                    const existing = uniqueSucursales.get(s.supermercado_id);
                    if (!existing) {
                        uniqueSucursales.set(s.supermercado_id, s);
                    } else {
                        if (s.product_url && !existing.product_url) {
                            uniqueSucursales.set(s.supermercado_id, s);
                        } else if (!s.product_url && existing.product_url) {
                            continue;
                        } else if (s.precio_actual < existing.precio_actual) {
                            uniqueSucursales.set(s.supermercado_id, s);
                        }
                    }
                }
                existingGroup.precios_sucursales = Array.from(uniqueSucursales.values());
                existingGroup.precios_sucursales.sort((a, b) => a.precio_actual - b.precio_actual);
                
                if (prod.url_imagen && !existingGroup.url_imagen) {
                    existingGroup.url_imagen = prod.url_imagen;
                }
            }
        }

        const groupedProducts = Array.from(groupsMap.values());

        const startIndex = (page - 1) * 24;
        const endIndex = startIndex + 24;
        
        const finalResults = groupedProducts
            .slice(startIndex, endIndex)
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
                        id: s.supermercado_id,
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
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });

    } catch (error) {
        console.error("Error buscando productos en BD:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

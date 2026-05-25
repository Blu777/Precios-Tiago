import { prisma } from '../../../lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // 1. Defensivo: validar la query antes de intentar procesar
    if (!query || query.length < 3) {
        return Response.json([]);
    }

    const searchQuery = query.trim().toLowerCase();

    try {
        // Import prisma locally if path alias fails
        const { prisma: localPrisma } = await import('../../../lib/prisma.js');
        const db = localPrisma || prisma;

        // Buscar productos por coincidencia de nombre o marca
        // Y traer los precios de sus sucursales
        const productos = await db.productoMaestro.findMany({
            where: {
                OR: [
                    { nombre_estandarizado: { contains: searchQuery } },
                    { marca: { contains: searchQuery } }
                ]
            },
            include: {
                precios_sucursales: {
                    orderBy: {
                        precio_actual: 'asc'
                    }
                }
            },
            take: 50 // Limitamos a 50 resultados para performance
        });

        // Formatear la salida para que sea compatible con el Frontend actual
        const resultadoFinal = productos.map(prod => {
            // Transformar array de precios_sucursales a un objeto / array como espera el front
            // El front actual lee "sucursales" construidas dinámicamente o "precios" { supId: { precio_actual, product_url } }
            // Si miramos SearchClient.jsx:
            // "if (current.precios)" o "if (current.supermercado)"
            // El front reconstruye todo usando "barcode" o "name" como key
            
            const precios = Object.fromEntries(
                prod.precios_sucursales.map(sucursal => [
                    sucursal.supermercado_id,
                    {
                        precio_actual: sucursal.precio_actual,
                        precio_lista: sucursal.precio_lista,
                        product_url: sucursal.product_url
                    }
                ])
            );

            // Para asegurar la retrocompatibilidad con SearchClient.jsx
            // SearchClient usa current.barcode o current.name para agrupar.
            return {
                barcode: prod.ean,
                name: prod.nombre_estandarizado,
                brand: prod.marca,
                weight: prod.contenido_neto,
                unit: prod.unidad_medida,
                // Podemos enviar la mejor imagen disponible de las sucursales
                image_url: prod.precios_sucursales.find(s => s.url_imagen)?.url_imagen || null,
                precios: precios
            };
        });

        return Response.json(resultadoFinal);

    } catch (error) {
        console.error("Error buscando productos en BD:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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
            take: Math.max(300, page * 24 + 100) // Extraer suficientes para agrupar antes de paginar
        });

        // --- Inicio Algoritmo de Agrupación (Fuzzy Clustering) ---
        const MUST_MATCH_WORDS = new Set(['ZERO', 'LIGHT', 'AZUCAR', 'LIVIANO', 'DIET', 'DESCREMADA', 'ENTERA', 'CLASICA']);

        const tokenize = (name) => {
            let s = name.toUpperCase().replace(/[,.-]/g, ' '); 
            s = s.replace(/\bLTS\b/g, 'L').replace(/\bLT\b/g, 'L').replace(/\bCM3\b/g, 'CC').replace(/\bML\b/g, 'CC');
            s = s.replace(/\b2\s*25\s*L\b/g, '2250 CC');
            s = s.replace(/\b1\s*5\s*L\b/g, '1500 CC');
            s = s.replace(/\b1\s*75\s*L\b/g, '1750 CC');
            s = s.replace(/\b2\s*5\s*L\b/g, '2500 CC');
            s = s.replace(/\b3\s*L\b/g, '3000 CC');
            const words = s.split(/\s+/).filter(w => w.length > 2 || /\d/.test(w));
            return new Set(words);
        };

        const calculateSimilarity = (set1, set2) => {
            for (const w of MUST_MATCH_WORDS) {
                if (set1.has(w) !== set2.has(w)) return 0;
            }
            
            const nums1 = Array.from(set1).filter(w => /^\d+$/.test(w));
            const nums2 = Array.from(set2).filter(w => /^\d+$/.test(w));
            if (nums1.length > 0 && nums2.length > 0) {
                const sorted1 = nums1.sort().join(',');
                const sorted2 = nums2.sort().join(',');
                if (sorted1 !== sorted2) return 0;
            }

            let intersection = 0;
            for (let word of set1) {
                if (set2.has(word)) intersection++;
            }
            const union = set1.size + set2.size - intersection;
            return union === 0 ? 0 : intersection / union;
        };

        const groupedProducts = [];

        const productosValidos = productos.filter(prod => prod.precios_sucursales.length > 0);

        for (const prod of productosValidos) {
            const prodTokens = tokenize(prod.nombre_estandarizado);
            let merged = false;

            for (const group of groupedProducts) {
                const sim = calculateSimilarity(prodTokens, group.tokens);
                
                // Umbral de 0.50 con las restricciones numéricas funciona perfecto
                if (sim >= 0.50) {
                    // Fusionar sucursales
                    group.precios_sucursales = [...group.precios_sucursales, ...prod.precios_sucursales];
                    
                    // Deduplicar sucursales por supermercado
                    const uniqueSucursales = new Map();
                    for (const s of group.precios_sucursales) {
                        const existing = uniqueSucursales.get(s.supermercado_id);
                        if (!existing || s.precio_actual < existing.precio_actual) {
                            uniqueSucursales.set(s.supermercado_id, s);
                        }
                    }
                    group.precios_sucursales = Array.from(uniqueSucursales.values());
                    
                    // Ordenar de menor a mayor
                    group.precios_sucursales.sort((a, b) => a.precio_actual - b.precio_actual);
                    
                    merged = true;
                    break;
                }
            }

            if (!merged) {
                groupedProducts.push({
                    ...prod,
                    tokens: prodTokens
                });
            }
        }
        // --- Fin Algoritmo de Agrupación ---

        // Armar estructura final, paginando LOS RESULTADOS AGRUPADOS
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
        });

    } catch (error) {
        console.error("Error buscando productos en BD:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

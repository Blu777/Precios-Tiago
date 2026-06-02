const { prisma } = require('./miraprecios_web/src/lib/prisma.js');

async function test() {
    const searchQuery = 'COCA COLA 2.25';
    // Mismo fetch que route.js
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
        take: 24
    });

    console.log("Productos crudos:", productos.length);

    // Mismo algoritmo
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
            if (sim >= 0.50) {
                group.precios_sucursales = [...group.precios_sucursales, ...prod.precios_sucursales];
                
                const uniqueSucursales = new Map();
                for (const s of group.precios_sucursales) {
                    const existing = uniqueSucursales.get(s.supermercado_id);
                    if (!existing || s.precio_actual < existing.precio_actual) {
                        uniqueSucursales.set(s.supermercado_id, s);
                    }
                }
                group.precios_sucursales = Array.from(uniqueSucursales.values());
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

    console.log("Productos agrupados:", groupedProducts.length);
    for (const p of groupedProducts) {
        console.log(`- ${p.nombre_estandarizado} (${p.precios_sucursales.map(s => s.supermercado_id).join(',')})`);
    }
}
test().catch(console.error);

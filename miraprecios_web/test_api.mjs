import { createClient } from '@libsql/client';

const client = createClient({
  url: "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"
});

async function run() {
  const rs = await client.execute(`
    SELECT pm.ean, pm.nombre_estandarizado, pm.marca, sp.supermercado_id, sp.precio_actual
    FROM ProductoMaestro pm
    JOIN SucursalPrecio sp ON pm.ean = sp.producto_ean
    WHERE pm.nombre_estandarizado LIKE '%COCA%2250%'
       OR pm.nombre_estandarizado LIKE '%COCA%2.25%'
  `);
  
  // Transform to prisma-like structure
  const prodMap = new Map();
  for (const row of rs.rows) {
      if (!prodMap.has(row.ean)) {
          prodMap.set(row.ean, {
              ean: row.ean,
              nombre_estandarizado: row.nombre_estandarizado,
              marca: row.marca,
              precios_sucursales: []
          });
      }
      prodMap.get(row.ean).precios_sucursales.push({
          supermercado_id: row.supermercado_id,
          precio_actual: row.precio_actual
      });
  }
  const productos = Array.from(prodMap.values());
  console.log("Productos crudos:", productos.length);

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

  for (const prod of productos) {
      const prodTokens = tokenize(prod.nombre_estandarizado);
      let merged = false;

      for (const group of groupedProducts) {
          const sim = calculateSimilarity(prodTokens, group.tokens);
          if (sim >= 0.50) {
              group.precios_sucursales = [...group.precios_sucursales, ...prod.precios_sucursales];
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
      console.log(`- ${p.nombre_estandarizado} (${p.precios_sucursales.map(s => s.supermercado_id).join(', ')})`);
  }
}
run().catch(console.error);

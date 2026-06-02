const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"
});

const MUST_MATCH_WORDS = new Set(['ZERO', 'LIGHT', 'AZUCAR', 'LIVIANO', 'DIET', 'DESCREMADA', 'ENTERA', 'CLASICA']);
const tokenize = (name) => {
    if (!name) return new Set();
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

async function run() {
  console.log("Fetching all products...");
  const rs = await client.execute("SELECT ean, nombre_estandarizado, marca FROM ProductoMaestro");
  const products = rs.rows;
  console.log("Total products:", products.length);

  const groupedProducts = [];
  let mergeCount = 0;
  
  for (const prod of products) {
      const prodTokens = tokenize(prod.nombre_estandarizado);
      let merged = false;

      for (const group of groupedProducts) {
          const sim = calculateSimilarity(prodTokens, group.tokens);
          if (sim >= 0.50) {
              group.children.push(prod);
              mergeCount++;
              merged = true;
              break;
          }
      }

      if (!merged) {
          groupedProducts.push({
              ...prod,
              tokens: prodTokens,
              children: [prod]
          });
      }
  }

  console.log("Total unique groups:", groupedProducts.length);
  console.log("Total merges that would happen:", mergeCount);
}

run().catch(console.error);

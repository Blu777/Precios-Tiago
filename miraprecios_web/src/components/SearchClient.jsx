'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const TEXTOS = {
  noEncontramos: 'No encontramos',
  sugerencia: 'Asegurate de escribir bien la marca o intentá buscar algo más genérico.'
};

function getGroupKey(item) {
  let normName = (item.name || '').toUpperCase()
    .replace(/([0-9]+)(CC|ML|L|LT|LTS|GR|G|KG)/g, '$1 $2')
    .replace(/CC/g, 'ML')
    .replace(/LTS?/g, 'LT')
    .replace(/[,.]/g, '');
    
  let tokens = normName.split(/\s+/);
  const ignoreWords = ['GASEOSA', 'SABOR', 'LATA', 'BOTELLA', 'PET', 'X', 'DE', 'EL', 'LA'];
  tokens = tokens.filter(t => !ignoreWords.includes(t));
  
  let brandStr = (item.brand || '').toUpperCase().replace(/COKE\/COCACOLA/g, 'COCA COLA');
  let brandTokens = brandStr.split(/\s+/).filter(Boolean);
  
  let allTokens = [...new Set([...brandTokens, ...tokens])];
  allTokens.sort();
  
  return allTokens.join(' ');
}

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
    <div className="w-full h-36 bg-gray-200 rounded-lg" />
    <div className="h-3 bg-gray-200 rounded w-1/3" />
    <div className="h-4 bg-gray-300 rounded w-3/4" />
    <div className="h-4 bg-gray-300 rounded w-1/2" />
    <div className="h-8 bg-gray-200 rounded-lg mt-2" />
  </div>
);

export default function SearchClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Implementación del Debounce usando useEffect
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetch(`/api/buscar?q=${encodeURIComponent(query.toUpperCase())}`, {
        signal: controller.signal
      })
        .then(res => res.json())
        .then(data => {
          // Agrupación y compactación de productos repetidos usando Map para mayor seguridad
          const agrupados = data.reduce((acc, current) => {
            const key = getGroupKey(current); // Agrupar usando heurística de tokens para juntar el mismo producto de distintos súper
            
            if (!acc.has(key)) {
              acc.set(key, {
                barcode: current.barcode,
                name: current.name,
                brand: current.brand,
                weight: current.weight,
                image_url: current.image_url,
                sucursales: []
              });
            } else {
              // Quedarnos con el nombre más largo y descriptivo
              const existing = acc.get(key);
              if (current.name && current.name.length > existing.name.length && !current.name.includes('CCSO')) {
                existing.name = current.name;
              }
              if (!existing.image_url && current.image_url) {
                existing.image_url = current.image_url;
              }
            }
            
            const productGroup = acc.get(key);

            // Consolidar sucursales (Soporta formato con objeto "precios" o formato plano)
            if (current.precios) {
              for (const [supId, priceData] of Object.entries(current.precios)) {
                if (priceData && priceData.precio_actual) {
                  // Evitar duplicados del mismo súper para el mismo producto
                  if (!productGroup.sucursales.some(s => s.id === supId)) {
                    productGroup.sucursales.push({
                      id: supId,
                      precio: priceData.precio_actual,
                      precioLista: priceData.precio_lista || priceData.precio_actual,
                      product_url: priceData.product_url
                    });
                  }
                }
              }
            } else if (current.supermercado) {
              if (!productGroup.sucursales.some(s => s.id === current.supermercado)) {
                productGroup.sucursales.push({
                  id: current.supermercado,
                  precio: current.precio || current.precio_actual,
                  precioLista: current.precio_lista || current.precio || current.precio_actual,
                  product_url: current.product_url
                });
              }
            }
            return acc;
          }, new Map());

          // Calcular metadatos dinámicos y ordenar array de sucursales de MENOR a MAYOR
          const productosUnificados = Array.from(agrupados.values()).map(prod => {
            prod.sucursales.sort((a, b) => a.precio - b.precio);
            if (prod.sucursales.length > 0) {
              prod.lowestPrice = prod.sucursales[0].precio;
              prod.highestPrice = prod.sucursales.at(-1).precio;
            } else {
              prod.lowestPrice = null;
              prod.highestPrice = null;
            }
            return prod;
          });

          setResults(productosUnificados);
          setLoading(false);
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          console.error("Error fetching data:", err);
          setLoading(false);
        });
    }, 300); // 300ms de gracia

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query]);

  return (
    <>
      <div className="max-w-4xl mx-auto text-center mb-10">
        <div className="relative w-full max-w-2xl mx-auto">
          <input
            type="text"
            className="w-full px-6 py-4 rounded-full border-2 border-gray-200 shadow-sm focus:outline-none focus:border-blue-500 text-lg transition-colors"
            placeholder="Buscar producto (ej. 'Aceite Girasol', 'Marolio')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar producto por nombre o marca"
          />
          {loading && (
            <div className="absolute right-6 top-5">
              <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent text-blue-600 rounded-full"></span>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
        {loading 
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : results.map((producto) => (
              <ProductCard key={producto.barcode || producto.name} producto={producto} />
            ))
        }
      </main>

      {/* Estado Vacío */}
      {query.length >= 3 && !loading && results.length === 0 && (
        <div className="text-center mt-12 bg-white max-w-lg mx-auto p-8 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-600 text-lg font-medium mb-2">{TEXTOS.noEncontramos} "{query}".</p>
          <p className="text-gray-400 text-sm">{TEXTOS.sugerencia}</p>
        </div>
      )}
    </>
  );
}

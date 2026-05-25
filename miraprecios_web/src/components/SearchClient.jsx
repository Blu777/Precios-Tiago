'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const TEXTOS = {
  noEncontramos: 'No encontramos',
  sugerencia: 'Asegurate de escribir bien la marca o intentá buscar algo más genérico.'
};

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

    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetch(`/api/buscar?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          // Agrupación y compactación de productos repetidos usando Map para mayor seguridad
          const agrupados = data.reduce((acc, current) => {
            const key = current.barcode || current.name;
            
            if (!acc.has(key)) {
              acc.set(key, {
                barcode: current.barcode,
                name: current.name,
                brand: current.brand,
                weight: current.weight,
                image_url: current.image_url,
                sucursales: []
              });
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
          console.error("Error fetching data:", err);
          setLoading(false);
        });
    }, 300); // 300ms de gracia

    return () => clearTimeout(delayDebounceFn);
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

      <main className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {results.map((producto, idx) => (
          <ProductCard key={idx} producto={producto} />
        ))}
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

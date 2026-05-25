'use client';

import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

const TEXTOS = {
  subtitulo: 'Encontrá tu producto y compará.',
  noEncontramos: 'No encontramos',
  sugerencia: 'Asegurate de escribir bien la marca o intentá buscar algo más genérico.'
};

export default function Home() {
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
          setResults(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching data:", err);
          setLoading(false);
        });
    }, 300); // 300ms de gracia

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Función formateadora de pesos ARS
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(precio);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <header className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
          🛒 MiraPrecios
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          {TEXTOS.subtitulo}
        </p>
        
        <div className="relative w-full max-w-2xl mx-auto">
          <input
            type="text"
            className="w-full px-6 py-4 rounded-full border-2 border-gray-200 shadow-sm focus:outline-none focus:border-blue-500 text-lg transition-colors"
            placeholder="Buscar producto (ej. 'Aceite Girasol', 'Marolio')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <div className="absolute right-6 top-5">
              <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent text-blue-600 rounded-full"></span>
            </div>
          )}
        </div>
      </header>

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
    </div>
  );
}

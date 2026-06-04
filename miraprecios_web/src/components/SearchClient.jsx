'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import CategoryNav from './CategoryNav';

const TEXTOS = {
  noEncontramos: 'No encontramos',
  sugerencia: 'Asegurate de escribir bien la marca o intentá buscar algo más genérico.',
  errorConexion: 'Ocurrió un error al conectar con la base de datos.',
  sinResultadosCat: 'No hay productos en esta categoría.'
};

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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Todo el cálculo pesado (deduplicación, joins, ordenamiento) ahora ocurre en el servidor
  useEffect(() => {
    if (query.trim().length < 3 && !selectedCategory) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let url = `/api/buscar?page=1`;
        if (query.trim().length >= 3) {
            url += `&q=${encodeURIComponent(query)}`;
        }
        if (selectedCategory) {
            url += `&categoria=${encodeURIComponent(selectedCategory)}`;
        }
        
        const response = await fetch(url, {
          signal: controller.signal
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || TEXTOS.errorConexion);
        }
        
        setResults(data.results || []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Error fetching data:", err);
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults();
    }, 350);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query, selectedCategory]);

  return (
    <>
      <div className="max-w-4xl mx-auto text-center mb-10">
        <div className="relative w-full max-w-2xl mx-auto mb-6">
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
        <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      </div>

      {/* Manejo de Errores Limpio */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Grilla Responsiva de Productos */}
      <main className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
        {loading 
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : results.map((producto) => (
              <ProductCard key={producto.barcode} producto={producto} />
            ))
        }
      </main>

      {/* Estado Vacío / Sin Resultados */}
      {((query.trim().length >= 3) || selectedCategory) && !loading && !error && results.length === 0 && (
        <div className="text-center mt-12 bg-white max-w-lg mx-auto p-8 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-600 text-lg font-medium mb-2">{TEXTOS.noEncontramos} {query ? `"${query}"` : 'en esta categoría'}.</p>
          <p className="text-gray-400 text-sm">{TEXTOS.sugerencia}</p>
        </div>
      )}
    </>
  );
}

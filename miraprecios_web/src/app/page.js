'use client';

import { useState, useEffect } from 'react';

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
          Encontrá tu producto y compará.
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

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {results.map((producto, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow hover:shadow-xl transition-shadow overflow-hidden flex flex-col border border-gray-100">
            {/* Header del Producto */}
            <div className="p-6 flex-grow flex flex-col items-center">
              {producto.image_url ? (
                <img src={producto.image_url} alt={producto.name} className="h-40 object-contain mb-4 mix-blend-multiply" />
              ) : (
                <div className="h-40 w-full bg-gray-100 flex items-center justify-center mb-4 rounded-xl">
                  <span className="text-gray-400 font-medium">Sin Imagen</span>
                </div>
              )}
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-center">
                {producto.brand || 'Sin Marca'}
              </span>
              <h2 className="text-lg font-semibold text-center text-gray-800 line-clamp-2">
                {producto.name}
              </h2>
            </div>
            
            {/* Cajas de Comparativa Lado a Lado */}
            <div className="flex border-t border-gray-100 bg-gray-50">
              
              {/* Bloque Supermercado Dia */}
              <div className="flex-1 p-5 border-r border-gray-200 flex flex-col justify-between items-center group hover:bg-red-50 transition-colors">
                <span className="text-[10px] font-black text-red-600 mb-2 tracking-widest uppercase bg-red-100 px-2 py-1 rounded-sm">Dia</span>
                {producto.precios.dia ? (
                  <>
                    <span className="text-2xl font-bold text-gray-900 mb-1">
                      {formatearPrecio(producto.precios.dia.precio_actual)}
                    </span>
                    <a 
                      href={producto.precios.dia.product_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium"
                    >
                      Ver en tienda ↗
                    </a>
                  </>
                ) : (
                  <span className="text-sm text-gray-400 font-medium italic mt-2 opacity-60">No disponible</span>
                )}
              </div>

              {/* Bloque ChangoMás */}
              <div className="flex-1 p-5 flex flex-col justify-between items-center group hover:bg-yellow-50 transition-colors">
                <span className="text-[10px] font-black text-yellow-600 mb-2 tracking-widest uppercase bg-yellow-100 px-2 py-1 rounded-sm">ChangoMás</span>
                {producto.precios.changomas ? (
                  <>
                    <span className="text-2xl font-bold text-gray-900 mb-1">
                      {formatearPrecio(producto.precios.changomas.precio_actual)}
                    </span>
                    <a 
                      href={producto.precios.changomas.product_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-yellow-600 hover:text-yellow-700 hover:underline font-medium"
                    >
                      Ver en tienda ↗
                    </a>
                  </>
                ) : (
                  <span className="text-sm text-gray-400 font-medium italic mt-2 opacity-60">No disponible</span>
                )}
              </div>

            </div>
          </div>
        ))}
      </main>

      {/* Estado Vacío */}
      {query.length >= 3 && !loading && results.length === 0 && (
        <div className="text-center mt-12 bg-white max-w-lg mx-auto p-8 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-600 text-lg font-medium mb-2">No encontramos "{query}".</p>
          <p className="text-gray-400 text-sm">Asegurate de escribir bien la marca o intentá buscar algo más genérico.</p>
        </div>
      )}
    </div>
  );
}

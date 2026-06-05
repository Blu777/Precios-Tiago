'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';

export default function BestDiscountsClient({ descuentos }) {
  const [show, setShow] = useState(false);

  if (!descuentos || descuentos.length === 0) {
    return null;
  }

  return (
    <section className="mb-12 flex flex-col items-center">
      {!show ? (
        <button 
          onClick={() => setShow(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <span className="text-xl">🔥</span>
          Ver Mayores Descuentos de Hoy
        </button>
      ) : (
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                🔥 Los Mejores Descuentos
              </h2>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                ¡Aprovechá hoy!
              </span>
            </div>
            <button 
              onClick={() => setShow(false)} 
              className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full"
            >
              Ocultar
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4 w-full">
            {descuentos.map((producto, idx) => (
              <ProductCard key={`${producto.ean}-${producto.sucursales[0].id}-${idx}`} producto={producto} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

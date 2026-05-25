'use client';
import { useState } from 'react';
import { useCart } from '../context/CartContext';

const SUPERMERCADOS = {
  dia: { nombre: 'Dia', logo: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/dia_supermercado_logo_icon_170701.png', colorText: 'text-red-600', bg: 'bg-red-50' },
  changomas: { nombre: 'ChangoMás', logo: 'https://changomas.com.ar/favicon.ico', colorText: 'text-yellow-600', bg: 'bg-yellow-50' },
  jumbo: { nombre: 'Jumbo', logo: 'https://jumbo.vtexassets.com/assets/vtex.file-manager-graphql/images/a570cbf0-eab9-42b4-8ab3-772c68e0d42d___54d898c69818b2b7ea00840c885bbd1f.png', colorText: 'text-green-700', bg: 'bg-green-50' },
  vea: { nombre: 'Vea', logo: 'https://veaargentina.vtexassets.com/assets/vtex.file-manager-graphql/images/ebec6476-cda1-4a92-9a57-b0b30be347cd___9dfde8be91a13e2dfb9ff23db12ba11a.png', colorText: 'text-blue-600', bg: 'bg-blue-50' }
};

const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
};

export default function ProductCard({ producto }) {
  const [showAllPrices, setShowAllPrices] = useState(false);
  const { cart, addToCart, removeFromCart } = useCart();
  
  const inCart = cart.some(p => p.name === producto.name);

  let minPrice = Infinity;
  let maxPrice = 0;
  let cheapestId = null;
  const validPrices = [];

  for (const [key, val] of Object.entries(producto.precios)) {
    if (val && val.precio_actual) {
      if (val.precio_actual < minPrice) {
        minPrice = val.precio_actual;
        cheapestId = key;
      }
      if (val.precio_actual > maxPrice) {
        maxPrice = val.precio_actual;
      }
      validPrices.push({ id: key, ...val });
    }
  }
  
  // Sort prices lowest to highest
  validPrices.sort((a, b) => a.precio_actual - b.precio_actual);

  const cheapestSup = SUPERMERCADOS[cheapestId] || { nombre: cheapestId };

  return (
    <div className="group relative flex flex-row sm:flex-col bg-white rounded-2xl sm:rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-3 sm:p-4 gap-4 w-full">
      
      {/* Imagen */}
      <div className="w-24 h-24 sm:w-full sm:h-48 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center relative p-2">
        {producto.image_url ? (
          <img 
            src={producto.image_url} 
            alt={producto.name} 
            className="object-contain w-full h-full group-hover:scale-105 transition-transform mix-blend-multiply"
          />
        ) : (
          <span className="text-gray-400 font-medium text-xs">Sin Imagen</span>
        )}
      </div>

      {/* Info y Precios */}
      <div className="flex flex-col flex-1 justify-between">
        
        {/* Cabecera */}
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{producto.brand || 'Varias Marcas'}</span>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight mt-0.5 line-clamp-2">
            {producto.name}
          </h3>
        </div>

        {/* Precio Ganador */}
        <div className="mt-2 sm:mt-4">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {validPrices.length > 0 ? formatearPrecio(minPrice) : 'N/A'}
            </span>
          </div>
          
          {validPrices.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-medium text-gray-600">Mejor opción en:</span>
              <span className={`text-xs font-bold ${cheapestSup.colorText || 'text-gray-800'}`}>
                {cheapestSup.nombre}
              </span>
            </div>
          )}

          {/* Acordeón para otros precios */}
          {validPrices.length > 1 && (
            <div className="mt-3 border-t border-gray-100 pt-2">
              <button 
                onClick={() => setShowAllPrices(!showAllPrices)}
                className="text-xs font-medium text-gray-500 hover:text-emerald-600 flex items-center justify-between w-full transition-colors"
              >
                <span>Ver {validPrices.length - 1} precios más (hasta {formatearPrecio(maxPrice)})</span>
                <svg className={`w-4 h-4 transform transition-transform ${showAllPrices ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Desplegable de precios */}
              {showAllPrices && (
                <div className="mt-2 space-y-1.5">
                  {validPrices.slice(1).map((priceData) => {
                    const sup = Reflect.get(SUPERMERCADOS, priceData.id) || { nombre: priceData.id, colorText: 'text-gray-600' };
                    return (
                      <div key={priceData.id} className="flex justify-between items-center text-xs py-1">
                        <span className="font-medium text-gray-600">{sup.nombre}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${sup.colorText}`}>{formatearPrecio(priceData.precio_actual)}</span>
                          <a href={priceData.product_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ir↗</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Botón Agregar a Lista */}
          <div className="mt-3">
            <button 
              onClick={() => inCart ? removeFromCart(producto.name) : addToCart(producto)}
              className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                inCart 
                  ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {inCart ? 'Quitar de la lista' : '+ Sumar a la lista'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

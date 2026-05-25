'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';

const SUPERMERCADOS = new Map([
  ['dia', { nombre: 'Dia', logo: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/dia_supermercado_logo_icon_170701.png', colorText: 'text-red-600', bg: 'bg-red-50' }],
  ['changomas', { nombre: 'ChangoMás', logo: 'https://changomas.com.ar/favicon.ico', colorText: 'text-yellow-600', bg: 'bg-yellow-50' }],
  ['jumbo', { nombre: 'Jumbo', logo: 'https://jumbo.vtexassets.com/assets/vtex.file-manager-graphql/images/a570cbf0-eab9-42b4-8ab3-772c68e0d42d___54d898c69818b2b7ea00840c885bbd1f.png', colorText: 'text-green-700', bg: 'bg-green-50' }],
  ['vea', { nombre: 'Vea', logo: 'https://veaargentina.vtexassets.com/assets/vtex.file-manager-graphql/images/ebec6476-cda1-4a92-9a57-b0b30be347cd___9dfde8be91a13e2dfb9ff23db12ba11a.png', colorText: 'text-blue-600', bg: 'bg-blue-50' }],
  ['coto', { nombre: 'Coto', logo: 'https://www.coto.com.ar/favicon.ico', colorText: 'text-blue-800', bg: 'bg-blue-100' }],
  ['carrefour', { nombre: 'Carrefour', logo: 'https://www.carrefour.com.ar/favicon.ico', colorText: 'text-blue-500', bg: 'bg-blue-50' }]
]);

const TEXTOS = {
  sinImagen: 'Sin Imagen',
  soloDisponibleEn: 'Solo disponible en ',
  verEn: 'Ver en ',
  supermercados: ' supermercados',
  ganador: 'Ganador',
  variasMarcas: 'Varias Marcas',
  na: 'N/A',
  quitarLista: 'Quitar de la lista',
  sumarLista: '+ Sumar a la lista'
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

  // Utiliza los datos consolidados generados en SearchClient
  const sucursales = producto.sucursales || [];
  const validPrices = sucursales;
  const lowestPrice = producto.lowestPrice;

  // Obtener el supermercado ganador (índice 0, ya que vienen ordenados de MENOR a MAYOR)
  const cheapestBranch = validPrices.length > 0 ? validPrices[0] : null;
  const cheapestSup = cheapestBranch ? (SUPERMERCADOS.get(cheapestBranch.id) || { nombre: cheapestBranch.id }) : null;

  return (
    <div className="group relative flex flex-row sm:flex-col bg-white rounded-2xl sm:rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-3 sm:p-4 gap-4 w-full">
      
      {/* Imagen */}
      <div className="w-24 h-24 sm:w-full sm:h-48 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center relative p-2">
        {producto.image_url ? (
          <Image 
            src={producto.image_url} 
            alt={producto.name || "Producto"} 
            fill
            sizes="(max-width: 640px) 96px, 100vw"
            className="object-contain group-hover:scale-105 transition-transform mix-blend-multiply p-2"
          />
        ) : (
          <span className="text-gray-400 font-medium text-xs">{TEXTOS.sinImagen}</span>
        )}
      </div>

      {/* Info y Precios */}
      <div className="flex flex-col flex-1 justify-between">
        
        {/* Cabecera */}
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{producto.brand || TEXTOS.variasMarcas}</span>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight mt-0.5 line-clamp-2" title={producto.name}>
            {producto.name}
          </h3>
        </div>

        {/* Precio y Comparativa */}
        <div className="mt-2 sm:mt-4">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {lowestPrice !== null ? formatearPrecio(lowestPrice) : TEXTOS.na}
            </span>
          </div>
          
          {/* Disponibilidad: 1 supermercado vs múltiples */}
          {validPrices.length === 1 && (
            <div className="mt-1">
              <span className="text-xs text-gray-500 italic">
                {TEXTOS.soloDisponibleEn} <span className="font-semibold">{cheapestSup?.nombre}</span>
              </span>
            </div>
          )}

          {validPrices.length > 1 && (
            <div className="mt-3 border-t border-gray-100 pt-2">
              <button 
                onClick={() => setShowAllPrices(!showAllPrices)}
                className="text-xs font-medium text-gray-600 hover:text-emerald-700 flex items-center justify-between w-full transition-colors"
                aria-expanded={showAllPrices}
              >
                <span>{TEXTOS.verEn}{validPrices.length}{TEXTOS.supermercados}</span>
                <svg className={`w-4 h-4 transform transition-transform ${showAllPrices ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Desplegable de sucursales con animación CSS sutil */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showAllPrices ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-1.5 flex flex-col">
                  {validPrices.map((sucursal, index) => {
                    const sup = SUPERMERCADOS.get(sucursal.id) || { nombre: sucursal.id, colorText: 'text-gray-600' };
                    const isWinner = index === 0;
                    
                    return (
                      <div 
                        key={sucursal.id} 
                        className={`flex justify-between items-center text-xs p-1.5 rounded-md border ${
                          isWinner ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${isWinner ? 'text-emerald-800' : 'text-gray-700'}`}>
                            {sup.nombre}
                          </span>
                          {isWinner && (
                            <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide shadow-sm">
                              {TEXTOS.ganador}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isWinner ? 'text-emerald-700' : sup.colorText}`}>
                            {formatearPrecio(sucursal.precio)}
                          </span>
                          {sucursal.product_url && (
                            <a 
                              href={sucursal.product_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-500 hover:text-blue-700 hover:underline" 
                              title={`Ver en ${sup.nombre}`}
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
              {inCart ? TEXTOS.quitarLista : TEXTOS.sumarLista}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

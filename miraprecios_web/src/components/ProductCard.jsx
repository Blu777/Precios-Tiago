'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';

const SUPERMERCADOS = new Map([
  // Grupo Cencosud
  ['jumbo', { nombre: 'Jumbo', logo: 'https://jumbo.vtexassets.com/assets/vtex.file-manager-graphql/images/a570cbf0-eab9-42b4-8ab3-772c68e0d42d___54d898c69818b2b7ea00840c885bbd1f.png', colorText: 'text-green-700', bg: 'bg-green-50' }],
  ['disco', { nombre: 'Disco', logo: 'https://discovirtual.com.ar/favicon.ico', colorText: 'text-purple-700', bg: 'bg-purple-50' }],
  ['vea', { nombre: 'Vea', logo: 'https://veaargentina.vtexassets.com/assets/vtex.file-manager-graphql/images/ebec6476-cda1-4a92-9a57-b0b30be347cd___9dfde8be91a13e2dfb9ff23db12ba11a.png', colorText: 'text-blue-600', bg: 'bg-blue-50' }],
  // ChangoMás
  ['changomas', { nombre: 'ChangoMás', logo: 'https://changomas.com.ar/favicon.ico', colorText: 'text-yellow-600', bg: 'bg-yellow-50' }],
  // Supermercados Día
  ['dia', { nombre: 'Día', logo: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/dia_supermercado_logo_icon_170701.png', colorText: 'text-red-600', bg: 'bg-red-50' }],
  // Carrefour (todos los formatos)
  ['carrefour', { nombre: 'Carrefour', logo: 'https://www.carrefour.com.ar/favicon.ico', colorText: 'text-blue-500', bg: 'bg-blue-50' }],
  ['carrefour_express', { nombre: 'Carrefour Express', logo: 'https://www.carrefour.com.ar/favicon.ico', colorText: 'text-sky-600', bg: 'bg-sky-50' }],
  ['carrefour_maxi', { nombre: 'Carrefour Maxi', logo: 'https://www.carrefour.com.ar/favicon.ico', colorText: 'text-indigo-700', bg: 'bg-indigo-50' }],
  // Coto
  ['coto', { nombre: 'Coto', logo: 'https://www.coto.com.ar/favicon.ico', colorText: 'text-orange-700', bg: 'bg-orange-50' }],
  // La Anónima
  ['la_anonima', { nombre: 'La Anónima', logo: 'https://www.laanonima.com.ar/favicon.ico', colorText: 'text-teal-700', bg: 'bg-teal-50' }],
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
  sumarLista: '+ Sumar a la lista',
  noDisponible: 'No disponible',
  verComparativaCompleta: 'Ver comparativa completa',
  preciosTodos: 'Precios en todos los supermercados',
  elMasBarato: 'El más barato'
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
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
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
    <>
      <div className="group relative flex flex-row sm:flex-col bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-2 sm:p-3 gap-2 sm:gap-3 w-full">
        
        {/* Imagen */}
        <div 
          onClick={() => setShowModal(true)}
          className="w-20 h-20 sm:w-full sm:h-36 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center relative p-1 sm:p-2 cursor-pointer"
        >
          {producto.image_url && !imageError ? (
            <Image 
              src={producto.image_url} 
              alt={producto.name || "Producto"} 
              fill
              sizes="(max-width: 640px) 96px, 100vw"
              className="object-contain group-hover:scale-105 transition-transform mix-blend-multiply p-2"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-gray-400 font-medium text-xs">{TEXTOS.sinImagen}</span>
          )}
        </div>

        {/* Info y Precios */}
        <div className="flex flex-col flex-1 justify-between">
          
          {/* Cabecera */}
          <div onClick={() => setShowModal(true)} className="cursor-pointer">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{producto.brand || TEXTOS.variasMarcas}</span>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight mt-0.5 line-clamp-2 hover:text-emerald-700 transition-colors" title={producto.name}>
              {producto.name}
            </h3>
          </div>

          {/* Precio y Comparativa */}
          <div className="mt-2 sm:mt-4">
            <div className="flex items-end gap-2" onClick={() => setShowModal(true)}>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 tracking-tight cursor-pointer hover:text-emerald-500 transition-colors">
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
                  onClick={() => setShowModal(true)}
                  className="text-xs font-medium text-gray-600 hover:text-emerald-700 flex items-center justify-between w-full transition-colors"
                >
                  <span>{TEXTOS.verComparativaCompleta}</span>
                  <svg className="w-4 h-4 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex justify-between items-start p-5 border-b border-gray-100">
              <div className="flex gap-4">
                <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center relative p-1">
                  {producto.image_url && !imageError ? (
                    <Image 
                      src={producto.image_url} 
                      alt={producto.name || "Producto"} 
                      fill
                      sizes="64px"
                      className="object-contain mix-blend-multiply"
                    />
                  ) : (
                    <span className="text-gray-400 text-[10px]">{TEXTOS.sinImagen}</span>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{producto.brand || TEXTOS.variasMarcas}</span>
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">{producto.name}</h2>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                aria-label="Cerrar modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Lista de precios */}
            <div className="overflow-y-auto p-5 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 mb-4 px-1">{TEXTOS.preciosTodos}</h3>
              <div className="space-y-2">
                {Array.from(SUPERMERCADOS.entries()).map(([id, sup], index) => {
                  const sucursalValida = validPrices.find(p => p.id === id);
                  const isWinner = sucursalValida && cheapestBranch && sucursalValida.precio === cheapestBranch.precio;

                  return (
                    <div 
                      key={id} 
                      className={`flex justify-between items-center p-3 rounded-xl border transition-all ${
                        sucursalValida 
                          ? isWinner 
                            ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                            : 'bg-white border-gray-200 shadow-sm'
                          : 'bg-gray-100/50 border-transparent opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${sup.bg} ${sup.colorText}`}>
                          {sup.nombre.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-semibold text-sm ${sucursalValida ? 'text-gray-900' : 'text-gray-500'}`}>
                            {sup.nombre}
                          </span>
                          {isWinner && (
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                              {TEXTOS.elMasBarato}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        {sucursalValida ? (
                          <div className="flex items-center gap-2">
                            <span className={`font-extrabold text-base ${isWinner ? 'text-emerald-700' : 'text-gray-900'}`}>
                              {formatearPrecio(sucursalValida.precio)}
                            </span>
                            {sucursalValida.product_url && (
                              <a 
                                href={sucursalValida.product_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="bg-blue-50 text-blue-600 p-1.5 rounded hover:bg-blue-100 transition-colors" 
                                title={`Ver en ${sup.nombre}`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {TEXTOS.noDisponible}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <button 
                onClick={() => inCart ? removeFromCart(producto.name) : addToCart(producto)}
                className={`w-full py-3 rounded-xl text-sm font-bold shadow-sm transition-all ${
                  inCart 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                }`}
              >
                {inCart ? TEXTOS.quitarLista : TEXTOS.sumarLista}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

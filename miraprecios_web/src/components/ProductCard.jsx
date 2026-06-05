'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';

const SUPERMERCADOS = new Map([
  // Grupo Cencosud
  ['jumbo', { nombre: 'Jumbo', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.jumbo.com.ar&size=128', colorText: 'text-green-700', bg: 'bg-green-50' }],
  ['disco', { nombre: 'Disco', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.disco.com.ar&size=128', colorText: 'text-purple-700', bg: 'bg-purple-50' }],
  ['vea', { nombre: 'Vea', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.vea.com.ar&size=128', colorText: 'text-blue-600', bg: 'bg-blue-50' }],
  // ChangoMás
  ['changomas', { nombre: 'ChangoMás', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.masonline.com.ar&size=128', colorText: 'text-yellow-600', bg: 'bg-yellow-50' }],
  // Supermercados Día
  ['dia', { nombre: 'Día', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://diaonline.com.ar&size=128', colorText: 'text-red-600', bg: 'bg-red-50' }],
  // Carrefour
  ['carrefour', { nombre: 'Carrefour', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.carrefour.com.ar&size=128', colorText: 'text-blue-500', bg: 'bg-blue-50' }],
  // Coto
  ['coto', { nombre: 'Coto', logo: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.coto.com.ar&size=128', colorText: 'text-orange-700', bg: 'bg-orange-50' }],
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

  let discountPercent = 0;
  let hasDiscount = false;

  if (cheapestBranch && cheapestBranch.precioLista && cheapestBranch.precioLista > cheapestBranch.precio) {
    discountPercent = Math.round((1 - (cheapestBranch.precio / cheapestBranch.precioLista)) * 100);
    // Sanity check: ignorar descuentos absurdos (errores de data de la fuente)
    if (discountPercent <= 80) {
      hasDiscount = true;
    }
  }

  return (
    <>
      <div className="group relative flex flex-row sm:flex-col bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 ease-out p-2 sm:p-3 gap-2 sm:gap-3 w-full">

        {/* Imagen */}
        <div
          onClick={() => setShowModal(true)}
          className="w-20 h-20 sm:w-full sm:h-36 flex-shrink-0 bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden flex items-center justify-center relative p-1 sm:p-2 cursor-pointer"
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
          <div className="mt-2 sm:mt-4 flex flex-col gap-1">
            {lowestPrice !== null ? (
              <div 
                className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => setShowModal(true)}
              >
                {/* Promoción si existe */}
                {cheapestBranch?.promocion && (
                  <div className="flex items-center mb-1">
                    <span className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded shadow-sm truncate">
                      🔥 {cheapestBranch.promocion}
                    </span>
                  </div>
                )}
                {/* Descuento si existe */}
                {hasDiscount && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400 line-through font-medium">
                      {formatearPrecio(cheapestBranch.precioLista)}
                    </span>
                    <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded shadow-sm">
                      -{discountPercent}%
                    </span>
                  </div>
                )}
                
                {/* Precio y Supermercados */}
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 tracking-tight">
                    {formatearPrecio(lowestPrice)}
                  </span>
                  <div className="flex items-center">
                    {cheapestSup && cheapestSup.logo && (
                      <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-sm border border-gray-200 p-0.5 overflow-hidden flex-shrink-0 relative hover:scale-110 transition-transform" title={`El más barato en ${cheapestSup.nombre}`}>
                         <img src={cheapestSup.logo} alt={cheapestSup.nombre} className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xl sm:text-2xl font-extrabold text-gray-400 tracking-tight">
                {TEXTOS.na}
              </div>
            )}

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
                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${inCart
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
                      className={`flex justify-between items-center p-3 rounded-xl border transition-all ${sucursalValida
                          ? isWinner
                            ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                            : 'bg-white border-gray-200 shadow-sm'
                          : 'bg-gray-100/50 border-transparent opacity-75'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-sm border border-gray-100 p-0.5 ${!sup.logo ? sup.bg : ''}`}>
                          {sup.logo ? (
                            <img src={sup.logo} alt={sup.nombre} className="w-full h-full object-contain" />
                          ) : (
                            <span className={`font-bold text-xs ${sup.colorText}`}>{sup.nombre.charAt(0)}</span>
                          )}
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
                          <div className="flex flex-col items-end gap-1">
                            {sucursalValida.promocion && (
                              <span className="text-[10px] font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded shadow-sm">
                                🔥 {sucursalValida.promocion}
                              </span>
                            )}
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
                className={`w-full py-3 rounded-xl text-sm font-bold shadow-sm transition-all ${inCart
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

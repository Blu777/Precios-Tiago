'use client';

import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';

const SUPERMERCADOS = {
  dia: { id: 'dia', nombre: 'Dia', colorBg: 'bg-red-500', colorText: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  changomas: { id: 'changomas', nombre: 'ChangoMás', colorBg: 'bg-yellow-500', colorText: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  jumbo: { id: 'jumbo', nombre: 'Jumbo', colorBg: 'bg-green-600', colorText: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  vea: { id: 'vea', nombre: 'Vea', colorBg: 'bg-blue-600', colorText: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' }
};

const TEXTOS = {
  cargando: 'Cargando...',
  listaVacia: 'Tu lista está vacía',
  instrucciones: 'Buscá productos y sumalos a tu lista para comparar el ticket total.',
  empezar: 'Empezar a buscar',
  comparativa: 'Tu Comparativa',
  mejorOpcion: 'Mejor Opción',
  faltan: 'Faltan',
  productos: 'productos',
  detalleEn: 'Detalle en',
  noDisponible: 'No disponible',
  producto: 'Producto',
  totalCompra: 'Total de Compra'
};

const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
};

export default function ListaPage() {
  const { cart, removeFromCart, isLoaded } = useCart();
  const [selectedSup, setSelectedSup] = useState(null);

  if (!isLoaded) return <div className="p-6 text-center">{TEXTOS.cargando}</div>;

  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{TEXTOS.listaVacia}</h2>
        <p className="text-gray-500 mb-6">{TEXTOS.instrucciones}</p>
        <Link href="/" className="bg-emerald-500 text-white px-6 py-3 rounded-full font-bold hover:bg-emerald-600 transition-colors">
          {TEXTOS.empezar}
        </Link>
      </div>
    );
  }

  // Calcular totales
  const totales = Object.values(SUPERMERCADOS).map(sup => {
    let total = 0;
    let missingCount = 0;
    cart.forEach(item => {
      const precioSup = Reflect.get(item.precios, sup.id);
      if (precioSup && precioSup.precio_actual) {
        total += precioSup.precio_actual;
      } else {
        missingCount++;
      }
    });
    return { ...sup, total, missingCount };
  }).sort((a, b) => a.total - b.total); // Ordenar por más barato

  const ganador = totales[0];
  const perdedor = totales.at(-1);
  const ahorroMaximo = perdedor.total - ganador.total;

  // Set initial selected supermarket for mobile view
  if (!selectedSup) setSelectedSup(ganador.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{TEXTOS.comparativa}</h1>
        <p className="text-gray-500 mt-2">
          {cart.length} productos en la lista. Llevándolos en {ganador.nombre} ahorrás hasta <span className="font-bold text-emerald-600">{formatearPrecio(ahorroMaximo)}</span>.
        </p>
      </div>

      {/* VISTA MÓVIL: "Tickets Deslizables" */}
      <div className="md:hidden">
        {/* Cabecera Carrusel */}
        <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar">
          {totales.map((t, idx) => (
            <div 
              key={t.id} 
              onClick={() => setSelectedSup(t.id)}
              className={`snap-center shrink-0 w-[85%] rounded-2xl p-5 border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                selectedSup === t.id ? `border-${t.colorBg.split('-')[1]}-500 bg-white ring-4 ring-${t.colorBg.split('-')[1]}-50` : 'border-gray-100 bg-gray-50 opacity-80'
              }`}
            >
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">{TEXTOS.mejorOpcion}</div>
              )}
              <h3 className={`text-sm font-black uppercase tracking-widest ${t.colorText}`}>{t.nombre}</h3>
              <div className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">{formatearPrecio(t.total)}</div>
              {t.missingCount > 0 && (
                <div className="text-xs text-red-500 font-medium mt-1">
                  {TEXTOS.faltan} {t.missingCount} {TEXTOS.productos}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detalle del Supermercado Seleccionado */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-700">{TEXTOS.detalleEn} {Reflect.get(SUPERMERCADOS, selectedSup).nombre}</span>
            <span className="text-xs text-gray-500">{cart.length} ítems</span>
          </div>
          <div className="divide-y divide-gray-100">
            {cart.map((item, i) => {
              const p = Reflect.get(item.precios, selectedSup);
              return (
                <div key={i} className="p-4 flex gap-3 items-center">
                  <button onClick={() => removeFromCart(item.name)} className="text-gray-300 hover:text-red-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <img src={item.image_url} alt="" className="w-10 h-10 object-contain rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                  </div>
                  <div className="text-right">
                    {p && p.precio_actual ? (
                      <span className="font-bold text-gray-900">{formatearPrecio(p.precio_actual)}</span>
                    ) : (
                      <span className="text-xs text-gray-400">{TEXTOS.noDisponible}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VISTA ESCRITORIO: "Matriz Comparativa" */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                {TEXTOS.producto}
              </th>
              {Object.values(SUPERMERCADOS).map(sup => (
                <th key={sup.id} scope="col" className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${sup.colorText}`}>
                  {sup.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {cart.map((item, i) => {
              // Encontrar el min precio para esta fila
              let minRowPrice = Infinity;
              Object.values(SUPERMERCADOS).forEach(sup => {
                const val = Reflect.get(item.precios, sup.id)?.precio_actual;
                if (val && val < minRowPrice) minRowPrice = val;
              });

              return (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => removeFromCart(item.name)} className="text-gray-300 hover:text-red-500 shrink-0">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <img src={item.image_url} alt="" className="w-10 h-10 object-contain rounded shrink-0 mix-blend-multiply" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.brand}</div>
                      </div>
                    </div>
                  </td>
                  
                  {Object.values(SUPERMERCADOS).map(sup => {
                    const price = Reflect.get(item.precios, sup.id)?.precio_actual;
                    const isMin = price === minRowPrice;
                    return (
                      <td key={sup.id} className={`px-6 py-4 text-center ${isMin ? 'bg-emerald-50/50' : ''}`}>
                        {price ? (
                          <div className={`text-sm font-bold ${isMin ? 'text-emerald-700' : 'text-gray-900'}`}>
                            {formatearPrecio(price)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">N/A</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td className="px-6 py-6 text-right font-bold text-gray-700 uppercase tracking-wider text-sm">
                {TEXTOS.totalCompra}
              </td>
              {Object.values(SUPERMERCADOS).map(sup => {
                const tData = totales.find(t => t.id === sup.id);
                const isWinner = tData.id === ganador.id;
                return (
                  <td key={sup.id} className={`px-6 py-6 text-center`}>
                    <div className={`text-2xl font-extrabold tracking-tight ${isWinner ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {formatearPrecio(tData.total)}
                    </div>
                    {isWinner && (
                      <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {TEXTOS.mejorOpcion}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
}

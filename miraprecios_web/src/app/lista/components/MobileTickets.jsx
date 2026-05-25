import Image from 'next/image';
import { SUPERMERCADOS, MAPA_ESTILOS, TEXTOS, formatearPrecio } from '../constants';

export default function MobileTickets({ cart, removeFromCart, totales, ganador, selectedSup, setSelectedSup }) {
  if (!selectedSup) return null;

  return (
    <div className="md:hidden">
      {/* Cabecera Carrusel */}
      <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar">
        {totales.map((t, idx) => (
          <div 
            key={t.id} 
            onClick={() => setSelectedSup(t.id)}
            className={`snap-center shrink-0 w-[85%] rounded-2xl p-5 border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden ${
              selectedSup === t.id ? `${Reflect.get(MAPA_ESTILOS, t.id) || ''} bg-white ring-4` : 'border-gray-100 bg-gray-50 opacity-80'
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
                <button onClick={() => removeFromCart(item.name)} className="text-gray-300 hover:text-red-500" aria-label="Eliminar producto de la lista">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <Image src={item.image_url} alt="" width={40} height={40} className="object-contain rounded" />
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
  );
}

import Image from 'next/image';
import { SUPERMERCADOS, TEXTOS, formatearPrecio } from '../constants';

export default function DesktopComparisonTable({ cart, removeFromCart, totales, ganador }) {
  return (
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
                    <button onClick={() => removeFromCart(item.name)} className="text-gray-300 hover:text-red-500 shrink-0" aria-label="Eliminar producto de la lista">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <Image src={item.image_url} alt="" width={40} height={40} className="object-contain rounded shrink-0 mix-blend-multiply" />
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
  );
}

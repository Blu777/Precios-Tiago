import { SUPERMERCADOS } from '../app/lista/constants';

export function useComparativeTotals(cart) {
  if (!cart || cart.length === 0) return { totales: [], ganador: null, perdedor: null, ahorroMaximo: 0 };

  const totales = Object.values(SUPERMERCADOS).map(sup => {
    let total = 0;
    let missingCount = 0;
    cart.forEach(item => {
      const precioSup = item.sucursales?.find(s => s.id === sup.id);
      if (precioSup && precioSup.precio) {
        total += precioSup.precio;
      } else {
        missingCount++;
      }
    });
    return { ...sup, total, missingCount };
  }).sort((a, b) => a.total - b.total); // Ordenar por más barato

  const ganador = totales[0];
  const perdedor = totales.at(-1);
  const ahorroMaximo = perdedor.total - ganador.total;

  return { totales, ganador, perdedor, ahorroMaximo };
}

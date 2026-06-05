import { prisma } from '../lib/prisma';
import ProductCard from './ProductCard';
import { unstable_cache } from 'next/cache';

const getDiscounts = unstable_cache(
  async () => {
    try {
      const descuentos = await prisma.$queryRaw`
        SELECT 
            p.nombre_estandarizado as name,
            p.marca as brand,
            p.url_imagen as image_url,
            p.ean as ean,
            s.precio_actual as price,
            s.precio_lista as list_price,
            s.supermercado_id as supermarket,
            s.product_url,
            ((s.precio_lista - s.precio_actual) / s.precio_lista) * 100 as discount_percentage
        FROM SucursalPrecio s
        JOIN ProductoMaestro p ON s.producto_ean = p.ean
        WHERE s.precio_lista > s.precio_actual
            AND s.precio_lista IS NOT NULL
            AND s.precio_actual > 0
            AND p.url_imagen IS NOT NULL
        ORDER BY discount_percentage DESC
        LIMIT 12
      `;
      
      // Formatear para que coincida con el prop que espera ProductCard
      return descuentos.map(d => ({
        name: d.name,
        brand: d.brand,
        image_url: d.image_url,
        ean: d.ean,
        lowestPrice: d.price,
        sucursales: [{
          id: d.supermarket,
          precio: d.price,
          precioLista: d.list_price,
          product_url: d.product_url
        }]
      }));
    } catch (e) {
      console.error("Error fetching discounts:", e);
      return [];
    }
  },
  ['best-discounts'],
  { revalidate: 3600 } // Cachear por 1 hora
);

export default async function BestDiscounts() {
  const descuentos = await getDiscounts();

  if (!descuentos || descuentos.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          🔥 Los Mejores Descuentos
        </h2>
        <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
          ¡Aprovechá hoy!
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {descuentos.map((producto, idx) => (
          <ProductCard key={`${producto.ean}-${producto.sucursales[0].id}-${idx}`} producto={producto} />
        ))}
      </div>
    </section>
  );
}

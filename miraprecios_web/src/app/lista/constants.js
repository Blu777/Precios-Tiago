export const SUPERMERCADOS = {
  dia: { id: 'dia', nombre: 'Dia', colorBg: 'bg-red-500', colorText: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  changomas: { id: 'changomas', nombre: 'ChangoMás', colorBg: 'bg-yellow-500', colorText: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  jumbo: { id: 'jumbo', nombre: 'Jumbo', colorBg: 'bg-green-600', colorText: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  vea: { id: 'vea', nombre: 'Vea', colorBg: 'bg-blue-600', colorText: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' }
};

export const MAPA_ESTILOS = {
  dia: 'border-red-500 ring-red-50',
  changomas: 'border-yellow-500 ring-yellow-50',
  jumbo: 'border-green-500 ring-green-50',
  vea: 'border-blue-500 ring-blue-50'
};

export const TEXTOS = {
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

export const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
};

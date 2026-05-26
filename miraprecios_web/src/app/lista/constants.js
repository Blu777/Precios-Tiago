export const SUPERMERCADOS = {
  // Grupo Cencosud
  jumbo: { id: 'jumbo', nombre: 'Jumbo', colorBg: 'bg-green-600', colorText: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  disco: { id: 'disco', nombre: 'Disco', colorBg: 'bg-purple-600', colorText: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  vea: { id: 'vea', nombre: 'Vea', colorBg: 'bg-blue-600', colorText: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  // ChangoMás
  changomas: { id: 'changomas', nombre: 'ChangoMás', colorBg: 'bg-yellow-500', colorText: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  // Supermercados Día
  dia: { id: 'dia', nombre: 'Día', colorBg: 'bg-red-500', colorText: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  // Carrefour (todos los formatos)
  carrefour: { id: 'carrefour', nombre: 'Carrefour', colorBg: 'bg-blue-500', colorText: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  carrefour_express: { id: 'carrefour_express', nombre: 'Carrefour Express', colorBg: 'bg-sky-500', colorText: 'text-sky-600', badge: 'bg-sky-100 text-sky-700' },
  carrefour_maxi: { id: 'carrefour_maxi', nombre: 'Carrefour Maxi', colorBg: 'bg-indigo-600', colorText: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  // Coto
  coto: { id: 'coto', nombre: 'Coto', colorBg: 'bg-orange-600', colorText: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  // La Anónima
  la_anonima: { id: 'la_anonima', nombre: 'La Anónima', colorBg: 'bg-teal-600', colorText: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
};

export const MAPA_ESTILOS = {
  jumbo: 'border-green-500 ring-green-50',
  disco: 'border-purple-500 ring-purple-50',
  vea: 'border-blue-500 ring-blue-50',
  changomas: 'border-yellow-500 ring-yellow-50',
  dia: 'border-red-500 ring-red-50',
  carrefour: 'border-blue-400 ring-blue-50',
  carrefour_express: 'border-sky-400 ring-sky-50',
  carrefour_maxi: 'border-indigo-500 ring-indigo-50',
  coto: 'border-orange-500 ring-orange-50',
  la_anonima: 'border-teal-500 ring-teal-50',
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

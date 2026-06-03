export const SUPERMERCADOS = {
  // Grupo Cencosud
  jumbo: { id: 'jumbo', nombre: 'Jumbo', colorBg: 'bg-green-600', colorText: 'text-green-700', badge: 'bg-green-100 text-green-700', logo: 'https://jumbo.vtexassets.com/assets/vtex.file-manager-graphql/images/a570cbf0-eab9-42b4-8ab3-772c68e0d42d___54d898c69818b2b7ea00840c885bbd1f.png' },
  disco: { id: 'disco', nombre: 'Disco', colorBg: 'bg-purple-600', colorText: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', logo: 'https://discovirtual.com.ar/favicon.ico' },
  vea: { id: 'vea', nombre: 'Vea', colorBg: 'bg-blue-600', colorText: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', logo: 'https://veaargentina.vtexassets.com/assets/vtex.file-manager-graphql/images/ebec6476-cda1-4a92-9a57-b0b30be347cd___9dfde8be91a13e2dfb9ff23db12ba11a.png' },
  // ChangoMás
  changomas: { id: 'changomas', nombre: 'ChangoMás', colorBg: 'bg-yellow-500', colorText: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', logo: 'https://changomas.com.ar/favicon.ico' },
  // Supermercados Día
  dia: { id: 'dia', nombre: 'Día', colorBg: 'bg-red-500', colorText: 'text-red-600', badge: 'bg-red-100 text-red-700', logo: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/dia_supermercado_logo_icon_170701.png' },
  // Carrefour (todos los formatos)
  carrefour: { id: 'carrefour', nombre: 'Carrefour', colorBg: 'bg-blue-500', colorText: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', logo: 'https://www.carrefour.com.ar/favicon.ico' },
  carrefour_express: { id: 'carrefour_express', nombre: 'Carrefour Express', colorBg: 'bg-sky-500', colorText: 'text-sky-600', badge: 'bg-sky-100 text-sky-700', logo: 'https://www.carrefour.com.ar/favicon.ico' },
  carrefour_maxi: { id: 'carrefour_maxi', nombre: 'Carrefour Maxi', colorBg: 'bg-indigo-600', colorText: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', logo: 'https://www.carrefour.com.ar/favicon.ico' },
  // Coto
  coto: { id: 'coto', nombre: 'Coto', colorBg: 'bg-orange-600', colorText: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', logo: 'https://www.coto.com.ar/favicon.ico' },
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

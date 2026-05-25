import SearchClient from '../components/SearchClient';

export const metadata = {
  title: 'MiraPrecios - Comparador de Supermercados',
  description: 'Buscá, compará y ahorrá. Encontrá tu producto en Dia, ChangoMás, Jumbo y Vea para conseguir el mejor precio de Argentina.',
  openGraph: {
    title: 'MiraPrecios - Ahorrá en tu compra del súper',
    description: 'Armá tu lista y descubrí en qué supermercado gastás menos.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'MiraPrecios',
  },
};

const TEXTOS = {
  subtitulo: 'Encontrá tu producto y compará.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <header className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
          🛒 MiraPrecios
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          {TEXTOS.subtitulo}
        </p>
      </header>

      <SearchClient />
    </div>
  );
}

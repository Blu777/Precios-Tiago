import SearchClient from '../components/SearchClient';
import BestDiscounts from '../components/BestDiscounts';

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
    <div className="min-h-screen p-6 pt-10">
      <header className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 drop-shadow-sm">🛒 MiraPrecios</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          {TEXTOS.subtitulo}
        </p>
      </header>

      <div className="max-w-7xl mx-auto">
        <BestDiscounts />
      </div>

      <SearchClient />
    </div>
  );
}

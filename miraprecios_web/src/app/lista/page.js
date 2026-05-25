'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import { TEXTOS, formatearPrecio } from './constants';
import { useComparativeTotals } from '../../hooks/useComparativeTotals';
import MobileTickets from './components/MobileTickets';
import DesktopComparisonTable from './components/DesktopComparisonTable';

export default function ListaPage() {
  const { cart, removeFromCart, isLoaded } = useCart();
  const { totales, ganador, ahorroMaximo } = useComparativeTotals(cart);
  const [selectedSup, setSelectedSup] = useState(null);

  // Set initial selected supermarket for mobile view
  useEffect(() => {
    if (ganador && !selectedSup) {
      setSelectedSup(ganador.id);
    }
  }, [ganador, selectedSup]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{TEXTOS.comparativa}</h1>
        <p className="text-gray-500 mt-2">
          {cart.length} productos en la lista. Llevándolos en {ganador?.nombre} ahorrás hasta <span className="font-bold text-emerald-600">{formatearPrecio(ahorroMaximo)}</span>.
        </p>
      </div>

      <MobileTickets 
        cart={cart} 
        removeFromCart={removeFromCart} 
        totales={totales} 
        ganador={ganador} 
        selectedSup={selectedSup} 
        setSelectedSup={setSelectedSup} 
      />

      <DesktopComparisonTable 
        cart={cart} 
        removeFromCart={removeFromCart} 
        totales={totales} 
        ganador={ganador} 
      />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TEXTOS = {
  logo: 'Mirá',
  buscar: 'Buscar',
  miLista: 'Mi Lista',
  inicial: 'T'
};

export default function Header() {
  const pathname = usePathname();

  // Ocultamos el header global en mobile ya que la navegación ahí la controla el BottomNav
  // En desktop, mostramos un header amplio.
  return (
    <header className="hidden md:flex w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="text-xl font-extrabold tracking-tight text-emerald-600">
            {TEXTOS.logo}
          </span>
        </Link>

        {/* Navegación Desktop */}
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {TEXTOS.buscar}
          </Link>
          <Link 
            href="/lista" 
            className={`text-sm font-medium transition-colors ${pathname === '/lista' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {TEXTOS.miLista}
          </Link>
        </nav>

        {/* Perfil */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
            {TEXTOS.inicial}
          </div>
        </div>
      </div>
    </header>
  );
}

import "./globals.css";
import { Outfit } from 'next/font/google';
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { CartProvider } from "../context/CartContext";

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: "MiraPrecios",
  description: "Comparador de precios de supermercados argentinos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${outfit.variable} font-sans`}>
      <body className="antialiased bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/50 via-slate-50 to-gray-100 text-slate-800 pb-16 md:pb-0 min-h-screen">
        <CartProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}

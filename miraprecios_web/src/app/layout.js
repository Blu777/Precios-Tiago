import "./globals.css";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { CartProvider } from "../context/CartContext";

export const metadata = {
  title: "MiraPrecios",
  description: "Comparador de precios de supermercados argentinos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-50 text-gray-900 pb-16 md:pb-0">
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

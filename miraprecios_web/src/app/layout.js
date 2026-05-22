import "./globals.css";

export const metadata = {
  title: "MiraPrecios",
  description: "Comparador de precios de supermercados argentinos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}

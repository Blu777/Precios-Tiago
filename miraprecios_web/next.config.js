/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compila la aplicación aislando solo los módulos de node y archivos estrictamente 
  // necesarios en la carpeta .next/standalone. Reduce el tamaño del contenedor y uso de RAM drásticamente.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  }
};

module.exports = nextConfig;

# 🛒 MiraPrecios (Self-Hosted Clone)

MiraPrecios es un comparador de precios de supermercados argentinos (actualmente Dia y ChangoMás) diseñado para ejecutarse de forma 100% autónoma en un entorno *self-hosted* (como TrueNAS o cualquier servidor Docker). 

El sistema extrae los precios diarios desde las APIs internas de los supermercados (arquitectura VTEX) y los expone a través de una interfaz web moderna, ultraliviana y responsiva construida con Next.js.

## 🏗️ Arquitectura del Proyecto

El proyecto se divide en dos componentes principales que se comunican a través de un volumen de datos compartido (`/data`).

1. **Scraper (Python / Scrapy)**: `miraprecios_scraper/`
   - Se encarga de la extracción de datos.
   - Utiliza arañas dinámicas que leen el árbol de categorías de VTEX para evitar el límite técnico de paginación de 2500 productos.
   - Limpia los datos, verifica el stock activo y extrae precios base y de lista.
   - Guarda los resultados en archivos estáticos JSON separados por tienda (`precios_dia_AAAA_MM_DD.json`).
   - Pensado para ejecutarse secuencialmente (una tienda tras otra) diariamente vía script.

2. **Frontend Web (Next.js / Tailwind CSS)**: `miraprecios_web/`
   - Aplicación web con React 18 y el nuevo App Router.
   - Cuenta con una API interna (`/api/buscar`) que lee los JSON del día desde el volumen compartido, cruza los datos por nombre de producto y sirve los resultados unificados.
   - UI estéticamente prolija con comparativa "Side-by-Side" inmediata.
   - Buscador con *debounce* (300ms) para no saturar el servidor de disco con lecturas compulsivas.
   - Dockerizado usando un *Multi-stage build* con salida `standalone`, inyectando `libc6-compat` para máxima velocidad y ocupando solo ~120MB de espacio final.

## 🚀 Despliegue en TrueNAS (Docker / Custom App)

Este proyecto está optimizado para servidores NAS con recursos limitados. Para desplegarlo usando la interfaz de "Custom App":

### 1. Preparar las Imágenes Docker
Dado que TrueNAS necesita descargar las imágenes desde un registro en la nube (como GitHub Container Registry - `ghcr.io`), primero debes compilar y subir las imágenes desde tu máquina de desarrollo local:

```powershell
# Para el Frontend Web
cd miraprecios_web
docker build -t ghcr.io/tu_usuario/miraprecios-web:latest .
docker push ghcr.io/tu_usuario/miraprecios-web:latest

# Para el Scraper
cd ../miraprecios_scraper
docker build -t ghcr.io/tu_usuario/miraprecios-scraper:latest .
docker push ghcr.io/tu_usuario/miraprecios-scraper:latest
```

### 2. Configurar el Dataset en TrueNAS
Crea un dataset persistente en tu pool de almacenamiento (ej: `/mnt/tu_pool/datos/miraprecios_data`) con permisos adecuados. Este dataset será el "puente de comunicación" entre ambos contenedores.

### 3. Instalar la Custom App
Copia el contenido del archivo de ayuda `docker-compose.truenas.example.yml` que se encuentra en la raíz, y pégalo en el recuadro de configuración de Compose de TrueNAS.
Asegúrate de:
- Reemplazar las credenciales de la imagen por tu usuario real de GitHub.
- Reemplazar las rutas de los volúmenes (`/mnt/tu_pool/...`) por la ruta absoluta de tu dataset creado en el paso 2.

### 4. Automatizar la Araña Diaria (Cron Jobs)
El contenedor web correrá permanentemente respondiendo a tus visitas, pero el scraper está configurado para detenerse al terminar su ciclo de scraping (`restart: "no"`). 

Para que los precios de los supermercados se actualicen automáticamente todos los días:
1. Ve al menú lateral de TrueNAS -> **System Settings -> Advanced -> Cron Jobs** (o Scheduled Tasks).
2. Programa el siguiente comando para que se ejecute de madrugada (ej: a las 03:00 AM):
   ```bash
   docker start miraprecios_crawler
   ```

## 💻 Desarrollo Local

Si deseas probar, ampliar o modificar el código en tu PC local:

### Correr el Scraper Localmente
```powershell
cd miraprecios_scraper
# (Recomendado: Activar tu entorno virtual de Python)

# Raspar una tienda específica
scrapy crawl vtex_dinamico -a tienda=dia
scrapy crawl vtex_dinamico -a tienda=changomas

# O ejecutar el script completo que raspa ambas y renombra el JSON
bash run_scraper.sh
```

### Correr la Web Localmente
Asegúrate de tener la carpeta `data/` con algunos JSON generados por el scraper (o copiada dentro de `miraprecios_web`) antes de encender la web, o la búsqueda te devolverá cero resultados.
```powershell
cd miraprecios_web
npm install
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

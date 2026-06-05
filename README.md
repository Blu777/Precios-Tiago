# 🛒 MiraPrecios (Self-Hosted Clone)

MiraPrecios es un comparador de precios de supermercados argentinos (actualmente Dia, ChangoMás, Jumbo, Vea, Disco, Carrefour y Coto) diseñado para ejecutarse de forma 100% autónoma en un entorno *self-hosted* (como TrueNAS o cualquier servidor Docker). 

El sistema extrae los precios diarios usando Scrapy desde las APIs de los supermercados y los expone a través de una interfaz web moderna, ultraliviana y responsiva construida con Next.js y base de datos SQLite.

## 🏗️ Arquitectura del Proyecto

El proyecto se divide en dos componentes principales que se comunican a través de un volumen de datos compartido (`/data`).

1. **Scraper (Python / Scrapy)**: `miraprecios_scraper/`
   - Se encarga de la extracción de datos.
   - Utiliza arañas dinámicas que leen el árbol de categorías de VTEX para evitar el límite técnico de paginación de 2500 productos.
   - Limpia los datos, verifica el stock activo y extrae precios base y de lista.
   - Guarda los resultados en una base de datos local SQLite (`miraprecios.db`) o en una base de datos en la nube (Turso).
   - Realiza un *clustering* difuso para agrupar productos idénticos de diferentes supermercados.
   - Pensado para ejecutarse automáticamente en paralelo diariamente vía el demonio integrado.

2. **Frontend Web (Next.js / Prisma / Tailwind CSS)**: `miraprecios_web/`
   - Aplicación web con React 18 y el nuevo App Router.
   - Cuenta con una API interna (`/api/buscar`) que consulta la base de datos SQLite (o Turso) desde el volumen compartido para servir resultados unificados.
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

### 4. Automatización Diaria (Smart Daemon)
A diferencia de versiones anteriores, el scraper ahora funciona como un "Smart Daemon". En lugar de requerir que configures tareas programadas (Cron Jobs) en el sistema operativo o en TrueNAS, el contenedor se gestiona a sí mismo.

Al encender el contenedor (`docker-compose up -d`), el script detecta la hora actual. Si no son las **10:00 AM**, calculará automáticamente los segundos restantes y entrará en modo suspensión (sleep) hasta alcanzar esa hora exacta.

A las 10:00 AM, despertará y ejecutará la secuencia completa:
1. Reemplaza la base de datos local de manera atómica con los datos frescos del día.
2. Ejecuta las arañas de Scrapy en paralelo para visitar los supermercados (Dia, ChangoMás, Jumbo, Vea, Disco, Carrefour, Coto) y obtener precios e información en tiempo real.
3. Ejecuta el algoritmo de agrupamiento (*clustering*) para consolidar los mismos productos bajo un único grupo.

**Importante:** Solo asegúrate de que tu `docker-compose.yml` mantenga la directiva `restart: always` para el contenedor del scraper, y que el huso horario (`TZ=America/Argentina/Buenos_Aires`) sea correcto.

## 💻 Desarrollo Local

Si deseas probar, ampliar o modificar el código en tu PC local:

### Correr el Scraper Localmente
```powershell
cd miraprecios_scraper
# (Recomendado: Activar tu entorno virtual de Python)
pip install -r requirements.txt

# Iniciar el demonio completo localmente
python daemon.py

# O raspar una tienda específica manualmente (ej: dia, coto)
scrapy crawl vtex_dinamico -a tienda=dia
scrapy crawl coto
```

### Correr la Web Localmente
Asegúrate de que el scraper haya generado el archivo `miraprecios.db` en la carpeta `data` (o configurado las variables de entorno en `.env`) antes de encender la web.
```powershell
cd miraprecios_web
npm install
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

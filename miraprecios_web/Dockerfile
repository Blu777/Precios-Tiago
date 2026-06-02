# ----------------------------------------
# Fase 1: Dependencias (deps)
# ----------------------------------------
FROM node:18-alpine AS deps
# libc6-compat asegura compatibilidad de ciertos binarios nativos (como process.dlopen) en Alpine Linux
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copiamos los archivos de manifiesto de npm
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# ----------------------------------------
# Fase 2: Construcción (builder)
# ----------------------------------------
FROM node:18-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivar la telemetría de Next.js por privacidad y velocidad
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL "file:/app/data/miraprecios.db"

# Generar cliente de Prisma para SQLite
RUN npx prisma generate

# Compilar la aplicación. Al tener output: "standalone" configurado, 
# se generará una versión auto-contenida ultraliviana.
RUN mkdir -p /app/data
RUN npm run build

# ----------------------------------------
# Fase 3: Entorno de Ejecución (runner)
# ----------------------------------------
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL "file:///app/data/miraprecios.db"

# Instalar openssl requerido por el motor de Prisma
RUN apk add --no-cache openssl

# Crear el directorio para montar el volumen de datos (correrá como root)
RUN mkdir -p data/products

# Copiamos recursos estáticos
COPY --from=builder /app/public ./public

# Crear enlace simbólico para que las imágenes descargadas en el volumen se sirvan públicamente
RUN ln -s /app/data/products /app/public/products

# Copiar esquema de prisma para poder ejecutar migraciones/push en producción
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copiamos el build standalone generado y los estáticos
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

# Standalone mode inyecta un server.js nativo súper eficiente en node
CMD ["node", "server.js"]

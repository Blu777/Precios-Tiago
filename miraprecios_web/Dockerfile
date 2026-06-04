# ----------------------------------------
# Fase 1: Dependencias (deps)
# ----------------------------------------
FROM public.ecr.aws/docker/library/node:18-slim AS deps
# libc6-compat no es necesario en Debian, pero instalamos openssl y certificados
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copiamos los archivos de manifiesto de npm
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# ----------------------------------------
# Fase 2: Construcción (builder)
# ----------------------------------------
FROM public.ecr.aws/docker/library/node:18-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivar la telemetría de Next.js por privacidad y velocidad
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:///app/data/miraprecios.db"

# Generar cliente de Prisma para SQLite
RUN npx prisma generate

# Compilar la aplicación. Al tener output: "standalone" configurado, 
# se generará una versión auto-contenida ultraliviana.
RUN mkdir -p /app/data
RUN npm run build

# ----------------------------------------
# Fase 3: Entorno de Ejecución (runner)
# ----------------------------------------
FROM public.ecr.aws/docker/library/node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:///app/data/miraprecios.db"

# Instalar openssl requerido por el motor de Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

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
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
RUN chown -R node:node /app

USER node
EXPOSE 3000
ENV PORT=3000

# Standalone mode inyecta un server.js nativo súper eficiente en node
CMD ["node", "server.js"]

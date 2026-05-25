# ----------------------------------------
# Fase 1: Dependencias (deps)
# ----------------------------------------
FROM node:18-alpine AS deps
# libc6-compat asegura compatibilidad de ciertos binarios nativos (como process.dlopen) en Alpine Linux
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiamos los archivos de manifiesto de npm
COPY package.json package-lock.json* ./

# Instalar dependencias limpiamente para producción
RUN npm ci || npm install

# ----------------------------------------
# Fase 2: Construcción (builder)
# ----------------------------------------
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivar la telemetría de Next.js por privacidad y velocidad
ENV NEXT_TELEMETRY_DISABLED 1

# Generar cliente de Prisma para SQLite
RUN npx prisma generate

# Compilar la aplicación. Al tener output: "standalone" configurado, 
# se generará una versión auto-contenida ultraliviana.
RUN npm run build

# ----------------------------------------
# Fase 3: Entorno de Ejecución (runner)
# ----------------------------------------
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Seguridad: Crear grupo y usuario de sistema sin privilegios root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Crear el directorio para montar el volumen de datos e igualar permisos
RUN mkdir data && chown nextjs:nodejs data

# Copiamos recursos estáticos
COPY --from=builder /app/public ./public

# Copiamos el build standalone generado y los estáticos, asignando propiedad al usuario seguro
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar al usuario sin privilegios
USER nextjs

EXPOSE 3000
ENV PORT 3000

# Standalone mode inyecta un server.js nativo súper eficiente en node
CMD ["node", "server.js"]

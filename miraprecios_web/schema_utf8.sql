-- CreateTable
CREATE TABLE "ProductoMaestro" (
    "ean" TEXT NOT NULL PRIMARY KEY,
    "nombre_estandarizado" TEXT NOT NULL,
    "marca" TEXT,
    "contenido_neto" REAL,
    "unidad_medida" TEXT,
    "categoria_id" TEXT,
    "url_imagen" TEXT
);

-- CreateTable
CREATE TABLE "SucursalPrecio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "producto_ean" TEXT NOT NULL,
    "supermercado_id" TEXT NOT NULL,
    "precio_actual" REAL NOT NULL,
    "precio_lista" REAL,
    "disponible_online" BOOLEAN NOT NULL DEFAULT true,
    "url_imagen" TEXT,
    "product_url" TEXT,
    "ultima_actualizacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SucursalPrecio_producto_ean_fkey" FOREIGN KEY ("producto_ean") REFERENCES "ProductoMaestro" ("ean") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProductoMaestro_nombre_estandarizado_idx" ON "ProductoMaestro"("nombre_estandarizado");

-- CreateIndex
CREATE INDEX "ProductoMaestro_marca_idx" ON "ProductoMaestro"("marca");

-- CreateIndex
CREATE INDEX "SucursalPrecio_producto_ean_idx" ON "SucursalPrecio"("producto_ean");

-- CreateIndex
CREATE INDEX "SucursalPrecio_disponible_online_idx" ON "SucursalPrecio"("disponible_online");

-- CreateIndex
CREATE UNIQUE INDEX "SucursalPrecio_producto_ean_supermercado_id_key" ON "SucursalPrecio"("producto_ean", "supermercado_id");


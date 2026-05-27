-- Optimizaciones recomendadas para SQLite en un servidor
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;

-- 1. Cadenas de Supermercados
CREATE TABLE IF NOT EXISTS chains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- 2. Sucursales / Zonas
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    chain_id TEXT REFERENCES chains(id),
    name TEXT NOT NULL,
    format TEXT
);

-- 3. Productos Unificados
CREATE TABLE IF NOT EXISTS products (
    ean TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    image_url TEXT
);

-- 4. Historial / Precios Actuales
CREATE TABLE IF NOT EXISTS prices (
    product_ean TEXT REFERENCES products(ean),
    store_id TEXT REFERENCES stores(id),
    price REAL NOT NULL,
    list_price REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_ean, store_id)
);

-- Índices críticos para optimizar consultas de JOIN y ordenamiento
CREATE INDEX IF NOT EXISTS idx_prices_ean ON prices(product_ean);
CREATE INDEX IF NOT EXISTS idx_prices_store ON prices(store_id);
CREATE INDEX IF NOT EXISTS idx_prices_price ON prices(price);

-- 5. Tabla Virtual FTS5 para búsqueda ultra rápida
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(ean, name, brand, tokenize='porter');

-- 6. Triggers para mantener FTS5 sincronizado con la tabla `products`
CREATE TRIGGER IF NOT EXISTS after_product_insert AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(ean, name, brand) VALUES (new.ean, new.name, new.brand);
END;

CREATE TRIGGER IF NOT EXISTS after_product_delete AFTER DELETE ON products BEGIN
    DELETE FROM products_fts WHERE ean = old.ean;
END;

CREATE TRIGGER IF NOT EXISTS after_product_update AFTER UPDATE ON products BEGIN
    DELETE FROM products_fts WHERE ean = old.ean;
    INSERT INTO products_fts(ean, name, brand) VALUES (new.ean, new.name, new.brand);
END;

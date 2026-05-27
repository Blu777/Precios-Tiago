import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Conexión estricta a la base de datos en modo lectura (Safe para el Frontend)
// Si estamos en un contenedor Docker, DATABASE_PATH estará seteada a /app/data/miraprecios.sqlite
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), '..', 'data', 'miraprecios.sqlite');

let db;
try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
    // Forzamos optimizaciones de concurrencia en Node.js
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
} catch (error) {
    console.error(`Error al conectar a SQLite en ${dbPath}:`, error);
    db = null;
}

export async function GET(request) {
    if (!db) {
        return NextResponse.json({ error: "Base de datos no disponible. Asegúrese de que el entorno esté inicializado." }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = 24; // Mostrar 24 productos únicos por página
    const offset = (page - 1) * limit;

    if (!query || query.trim().length < 3) {
        return NextResponse.json({ error: "Query demasiado corta (mínimo 3 caracteres)" }, { status: 400 });
    }

    try {
        // En FTS5, agregar '*' al final habilita la búsqueda de prefijos (ej. "gira*" -> "girasol")
        const cleanQuery = `${query.replace(/[^a-zA-Z0-9 ]/g, '')}*`;

        // Subquery inteligente: Primero encontramos los EANs únicos que matchean la búsqueda de texto,
        // les aplicamos la paginación, y LUEGO hacemos JOIN con precios para no romper el LIMIT.
        const statement = db.prepare(`
            SELECT 
                p.ean,
                p.name,
                p.brand,
                p.image_url,
                c.name AS chain_name,
                s.name AS store_name,
                s.format AS store_format,
                pr.price,
                pr.list_price,
                pr.timestamp
            FROM (
                SELECT ean FROM products_fts 
                WHERE products_fts MATCH ? 
                LIMIT ? OFFSET ?
            ) f
            JOIN products p ON f.ean = p.ean
            JOIN prices pr ON p.ean = pr.product_ean
            JOIN stores s ON pr.store_id = s.id
            JOIN chains c ON s.chain_id = c.id
            ORDER BY p.ean ASC, pr.price ASC
        `);

        const rows = statement.all(cleanQuery, limit, offset);

        // Agrupamos en el servidor para entregarle al Frontend una estructura limpia y fácil de iterar
        const groupedResults = rows.reduce((acc, row) => {
            if (!acc[row.ean]) {
                acc[row.ean] = {
                    barcode: row.ean,
                    name: row.name,
                    brand: row.brand,
                    image_url: row.image_url,
                    lowestPrice: row.price,
                    highestPrice: row.price,
                    sucursales: []
                };
            }
            
            acc[row.ean].sucursales.push({
                chain: row.chain_name,
                store: row.store_name,
                format: row.store_format,
                precio: row.price,
                precioLista: row.list_price,
                updated_at: row.timestamp
            });
            
            // Actualizamos los márgenes de precios dinámicamente
            if (row.price < acc[row.ean].lowestPrice) acc[row.ean].lowestPrice = row.price;
            if (row.price > acc[row.ean].highestPrice) acc[row.ean].highestPrice = row.price;

            return acc;
        }, {});

        const finalResults = Object.values(groupedResults);
        
        // Garantizamos que las tiendas internas estén ordenadas de más barata a más cara
        finalResults.forEach(prod => {
            prod.sucursales.sort((a, b) => a.precio - b.precio);
        });

        return NextResponse.json({
            page,
            results: finalResults
        });

    } catch (error) {
        console.error("Error crítico en la búsqueda FTS5:", error);
        return NextResponse.json({ error: "Error interno del servidor al procesar la búsqueda" }, { status: 500 });
    }
}

import fs from 'fs';
import path from 'path';

// Helper function to find the latest json file for a given supermarket prefix
function getLatestFile(dataFolder, prefix) {
    const normalizedDataFolder = path.normalize(dataFolder);
    const basePath = path.normalize(process.cwd());
    if (!normalizedDataFolder.startsWith(basePath)) {
        return null;
    }
    if (!fs.existsSync(normalizedDataFolder)) {
        return null;
    }
    try {
        const files = fs.readdirSync(normalizedDataFolder);
        // Match files like: precios_dia_2026_05_22.json
        const pattern = /^precios_([a-z]+)_\d{4}_\d{2}_\d{2}\.json$/;
        const matchingFiles = files.filter(f => {
            const match = f.match(pattern);
            return match && match[1] === prefix;
        });
        if (matchingFiles.length === 0) {
            return null;
        }
        // Alphabetical sort is safe for YYYY_MM_DD suffix
        matchingFiles.sort();
        const latestFile = matchingFiles.at(-1);
        return path.normalize(path.join(normalizedDataFolder, latestFile));
    } catch (error) {
        console.error(`Error reading data folder to find latest ${prefix} file:`, error);
        return null;
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // 1. Defensivo: validar la query antes de intentar procesar
    if (!query || query.length < 3) {
        return Response.json([]);
    }

    const searchQuery = query.toLowerCase();

    // 2. Calcular fecha dinámica
    const today = new Date();
    const anio = today.getFullYear();
    const mes = String(today.getMonth() + 1).padStart(2, '0');
    const dia = String(today.getDate()).padStart(2, '0');
    const fechaStr = `${anio}_${mes}_${dia}`;

    // 3. Determinar la ruta a la carpeta compartida 'data/'
    // (Asumimos que el root del proyecto de Next tiene una carpeta data o un symlink apuntando allí)
    const dataFolder = path.join(process.cwd(), 'data');

    const tiendas = ['dia', 'changomas', 'jumbo', 'vea'];
    let productosRaw = [];

    const basePath = path.normalize(process.cwd());

    tiendas.forEach(tienda => {
        const fileTienda = path.join(dataFolder, `precios_${tienda}_${fechaStr}.json`);
        let pathTienda = path.normalize(fileTienda);
        
        if (!pathTienda.startsWith(basePath)) {
            console.error("Invalid path detected.");
            return;
        }

        // 4. Lectura defensiva comprobando fs.existsSync con fallback al último disponible
        if (!fs.existsSync(pathTienda)) {
            console.warn(`Archivo no encontrado para hoy: ${fileTienda}. Buscando último disponible...`);
            const latestTienda = getLatestFile(dataFolder, tienda);
            if (latestTienda) {
                pathTienda = path.normalize(latestTienda);
                if (!pathTienda.startsWith(basePath)) {
                    return;
                }
                console.log(`Usando archivo fallback para ${tienda}: ${pathTienda}`);
            } else {
                console.warn(`No se encontró ningún archivo de datos para ${tienda}.`);
            }
        }

        if (fs.existsSync(pathTienda)) {
            try {
                const dataTienda = JSON.parse(fs.readFileSync(pathTienda, 'utf-8'));
                // Garantizar consistencia del nombre del supermercado
                const dataNormalizada = dataTienda.map(p => ({
                    ...p,
                    supermarket: p.supermarket ? p.supermarket.toLowerCase() : tienda
                }));
                productosRaw = productosRaw.concat(dataNormalizada);
            } catch (error) {
                console.error(`Error al leer archivo de ${tienda} (${pathTienda}):`, error);
            }
        }
    });

    // 5. Filtrar por coincidencia en nombre o marca
    const productosFiltrados = productosRaw.filter(p => {
        const nombreMatch = p.name ? p.name.toLowerCase().includes(searchQuery) : false;
        const marcaMatch = p.brand ? p.brand.toLowerCase().includes(searchQuery) : false;
        return nombreMatch || marcaMatch;
    });

    // 6. Agrupar productos idénticos
    // Se usa el nombre en minúsculas y sin espacios laterales como llave de cruce
    const productosAgrupados = new Map();

    productosFiltrados.forEach(p => {
        // En un caso real a gran escala, el cruce suele hacerse por EAN/UPC o modelos NLP,
        // para este proyecto el nombre normalizado funciona como primer gran filtro.
        const key = p.name.toLowerCase().trim();

        if (!productosAgrupados.has(key)) {
            productosAgrupados.set(key, {
                name: p.name,
                brand: p.brand,
                image_url: p.image_url,
                precios: {}
            });
        }

        // Asignamos el precio a la llave de su respectivo súper
        let superId = p.supermarket.toLowerCase().replace('más', 'mas').replace(' ', '');
        
        // Si hay varios idénticos dentro del mismo súper, nos quedamos con el primero
        const prod = productosAgrupados.get(key);
        if (!prod.precios[superId]) {
            prod.precios[superId] = {
                precio_actual: p.precio_actual,
                precio_lista: p.precio_lista,
                product_url: p.product_url
            };
        }
    });

    // Convertir a Array para que el Front iteré más fácil
    const resultadoFinal = Array.from(productosAgrupados.values());

    return Response.json(resultadoFinal);
}

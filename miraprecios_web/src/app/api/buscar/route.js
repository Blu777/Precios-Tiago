import fs from 'fs';
import path from 'path';

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

    const fileDia = path.join(dataFolder, `precios_dia_${fechaStr}.json`);
    const fileChangoMas = path.join(dataFolder, `precios_changomas_${fechaStr}.json`);

    let productosRaw = [];

    // 4. Lectura defensiva comprobando fs.existsSync
    if (fs.existsSync(fileDia)) {
        try {
            const dataDia = JSON.parse(fs.readFileSync(fileDia, 'utf-8'));
            productosRaw = productosRaw.concat(dataDia);
        } catch (error) {
            console.error("Error al leer archivo de Dia:", error);
        }
    } else {
        console.warn(`Archivo no encontrado: ${fileDia}`);
    }

    if (fs.existsSync(fileChangoMas)) {
        try {
            const dataChango = JSON.parse(fs.readFileSync(fileChangoMas, 'utf-8'));
            productosRaw = productosRaw.concat(dataChango);
        } catch (error) {
            console.error("Error al leer archivo de ChangoMas:", error);
        }
    } else {
        console.warn(`Archivo no encontrado: ${fileChangoMas}`);
    }

    // 5. Filtrar por coincidencia en nombre o marca
    const productosFiltrados = productosRaw.filter(p => {
        const nombreMatch = p.name ? p.name.toLowerCase().includes(searchQuery) : false;
        const marcaMatch = p.brand ? p.brand.toLowerCase().includes(searchQuery) : false;
        return nombreMatch || marcaMatch;
    });

    // 6. Agrupar productos idénticos
    // Se usa el nombre en minúsculas y sin espacios laterales como llave de cruce
    const productosAgrupados = {};

    productosFiltrados.forEach(p => {
        // En un caso real a gran escala, el cruce suele hacerse por EAN/UPC o modelos NLP,
        // para este proyecto el nombre normalizado funciona como primer gran filtro.
        const key = p.name.toLowerCase().trim();

        if (!productosAgrupados[key]) {
            productosAgrupados[key] = {
                name: p.name,
                brand: p.brand,
                image_url: p.image_url,
                precios: {}
            };
        }

        // Asignamos el precio a la llave de su respectivo súper
        const superId = p.supermarket.toLowerCase() === 'dia' ? 'dia' : 'changomas';
        
        // Si hay varios idénticos dentro del mismo súper, nos quedamos con el primero
        if (!productosAgrupados[key].precios[superId]) {
            productosAgrupados[key].precios[superId] = {
                precio_actual: p.precio_actual,
                precio_lista: p.precio_lista,
                product_url: p.product_url
            };
        }
    });

    // Convertir a Array para que el Front iteré más fácil
    const resultadoFinal = Object.values(productosAgrupados);

    return Response.json(resultadoFinal);
}

import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Obtenemos categorías únicas usando groupby y count
        const categoriasData = await prisma.productoMaestro.groupBy({
            by: ['categoria_id'],
            _count: {
                categoria_id: true,
            },
            where: {
                categoria_id: {
                    not: null,
                },
            },
            orderBy: {
                _count: {
                    categoria_id: 'desc',
                },
            },
        });

        const categorias = categoriasData.map(c => ({
            id: c.categoria_id,
            nombre: c.categoria_id.charAt(0).toUpperCase() + c.categoria_id.slice(1),
            count: c._count.categoria_id
        }));

        return Response.json({ categorias }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

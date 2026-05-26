from rapidfuzz import fuzz, process
import sqlite3
import argparse
import os

def reconcile_synthetic_eans(db_path):
    print(f"[*] Iniciando reconciliación de EANs en {db_path}...")
    if not os.path.exists(db_path):
        print(f"[-] Base de datos no encontrada en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Obtener todos los productos sintéticos
    cursor.execute("SELECT ean, nombre_estandarizado, marca FROM ProductoMaestro WHERE ean LIKE 'SYN-%'")
    synthetic = cursor.fetchall()

    if not synthetic:
        print("[+] No se encontraron EANs sintéticos para reconciliar.")
        conn.close()
        return

    # Obtener todos los productos reales (EAN numérico)
    cursor.execute("SELECT ean, nombre_estandarizado, marca FROM ProductoMaestro WHERE ean NOT LIKE 'SYN-%'")
    real_products = cursor.fetchall()

    if not real_products:
        print("[-] No hay productos reales en la base de datos para comparar.")
        conn.close()
        return

    real_names = [f"{r[1]} {r[2] or ''}".strip() for r in real_products]

    merges = []
    print(f"[*] Comparando {len(synthetic)} sintéticos contra {len(real_products)} reales...")
    for syn_ean, syn_nombre, syn_marca in synthetic:
        search_name = f"{syn_nombre} {syn_marca or ''}".strip()
        results = process.extract(search_name, real_names, scorer=fuzz.token_sort_ratio, limit=1)

        if results and results[0][1] >= 88:  # Umbral de similitud 88%
            best_match_idx = real_names.index(results[0][0])
            real_ean = real_products[best_match_idx][0]
            merges.append((syn_ean, real_ean, results[0][1]))
            print(f"[+] MERGE: '{syn_nombre}' (SYN) → '{real_products[best_match_idx][1]}' (REAL={real_ean}) [{results[0][1]:.1f}%]")

    if not merges:
        print("[+] No se encontraron coincidencias suficientes para realizar merges.")
        conn.close()
        return

    # Aplicar merges: redirigir SucursalPrecio del EAN sintético al EAN real
    print(f"[*] Aplicando {len(merges)} merges en la base de datos...")
    
    exitos = 0
    errores = 0
    for syn_ean, real_ean, score in merges:
        try:
            # Actualizar FK en SucursalPrecio, evitando violar la UniqueConstraint
            # Si el supermercado ya existe para el real_ean, no lo movemos
            cursor.execute(
                "UPDATE SucursalPrecio SET producto_ean = ? WHERE producto_ean = ? "
                "AND supermercado_id NOT IN (SELECT supermercado_id FROM SucursalPrecio WHERE producto_ean = ?)",
                (real_ean, syn_ean, real_ean)
            )
            # Eliminar el registro sintético si quedó huérfano (Cascade deletes lo manejarían también)
            cursor.execute("DELETE FROM ProductoMaestro WHERE ean = ?", (syn_ean,))
            exitos += 1
        except sqlite3.IntegrityError as e:
            errores += 1
            print(f"  [-] Conflicto en merge {syn_ean} → {real_ean}: {e}")

    conn.commit()
    print(f"\\n✅ Reconciliación completada: {exitos} unificados, {errores} fallidos.")
    conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reconciliar EANs sintéticos vs reales")
    parser.add_argument("--db", type=str, default="../../data/miraprecios.db", help="Ruta a la base de datos SQLite")
    args = parser.parse_args()
    
    reconcile_synthetic_eans(args.db)

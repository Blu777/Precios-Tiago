import os
import sqlite3
import re
from collections import defaultdict

def normalize_name(name, brand):
    if not name:
        name = ""
    if not brand:
        brand = ""
        
    text = f"{name} {brand}".lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    
    # Standardize measurements
    text = re.sub(r'(\d+)\s*(ml|cc|l|gr|g|kg)', r'\1\2', text)
    text = text.replace('cc', 'ml').replace('gr', 'g')
    
    words = text.split()
    
    stopwords = {'gaseosa', 'sabor', 'original', 'x', 'unidad', 'unidades', 'ud', 'uds', 'pack', 'botella', 'lata', 'pet'}
    filtered = set()
    for w in words:
        if w not in stopwords and len(w) > 1:
            filtered.add(w)
            
    return "".join(sorted(list(filtered)))

def run_clustering():
    db_path = os.environ.get('DB_PATH', '/app/data/miraprecios.db')
    if not os.path.exists(db_path):
        print(f"[-] Database {db_path} not found.")
        return
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    print("[*] Iniciando clustering ultrarrápido por EAN y Hash...")
    cur.execute("SELECT ean, nombre_estandarizado, marca FROM ProductoMaestro")
    productos = cur.fetchall()
    
    print(f"[*] {len(productos)} productos leídos.")
    
    graph = defaultdict(set)
    product_nodes = []
    
    for p in productos:
        ean = p['ean']
        name = p['nombre_estandarizado']
        brand = p['marca']
        
        normalized_ean = ean.lstrip('0')
        is_global_ean = len(normalized_ean) >= 8 and normalized_ean.isdigit()
        
        name_hash = normalize_name(name, brand)
        
        node_hash = f"HASH:{name_hash}"
        product_node_info = {'ean': ean, 'node_hash': node_hash, 'node_ean': None}
        
        if is_global_ean:
            node_ean = f"EAN:{normalized_ean}"
            graph[node_hash].add(node_ean)
            graph[node_ean].add(node_hash)
            product_node_info['node_ean'] = node_ean
            
        product_nodes.append(product_node_info)

    visited = set()
    components = []
    
    for node in list(graph.keys()):
        if node not in visited:
            comp = set()
            queue = [node]
            while queue:
                curr = queue.pop(0)
                if curr not in visited:
                    visited.add(curr)
                    comp.add(curr)
                    for neighbor in graph[curr]:
                        if neighbor not in visited:
                            queue.append(neighbor)
            components.append(comp)
            
    node_to_group_id = {}
    
    for idx, comp in enumerate(components):
        eans = [n for n in comp if n.startswith("EAN:")]
        hashes = [n for n in comp if n.startswith("HASH:")]
        
        if eans:
            base_id = sorted(eans)[0].replace("EAN:", "")
            group_id = f"grp_{base_id}"
        else:
            base_id = sorted(hashes)[0].replace("HASH:", "")
            group_id = f"grp_hash_{base_id}"
            
        for n in comp:
            node_to_group_id[n] = group_id
            
    updates = []
    for p in product_nodes:
        if p['node_ean'] and p['node_ean'] in node_to_group_id:
            g_id = node_to_group_id[p['node_ean']]
        elif p['node_hash'] in node_to_group_id:
            g_id = node_to_group_id[p['node_hash']]
        else:
            g_id = f"grp_h_{p['node_hash'].replace('HASH:', '')}"
            
        updates.append((g_id, p['ean']))
        
    print(f"[*] Generados {len(updates)} asignaciones de grupo_id.")
    
    cur.execute("BEGIN TRANSACTION")
    cur.executemany("UPDATE ProductoMaestro SET grupo_id = ? WHERE ean = ?", updates)
    conn.commit()
    print("[+] Base de datos actualizada con éxito.")
    
if __name__ == '__main__':
    run_clustering()

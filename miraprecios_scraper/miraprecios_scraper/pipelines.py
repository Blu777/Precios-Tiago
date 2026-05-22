import os
import json
from datetime import datetime

class DataCleaningPipeline:
    def process_item(self, item, spider):
        # 1. Limpieza y conversión a float del precio
        if item.get('price'):
            try:
                price_str = str(item['price']).replace('$', '').replace('.', '').replace(',', '.').strip()
                item['price'] = float(price_str)
            except ValueError:
                item['price'] = None

        # 2. Limpieza de strings
        if item.get('name'):
            item['name'] = str(item['name']).strip()
        if item.get('brand'):
            item['brand'] = str(item['brand']).strip()

        # 3. Asignación de fecha/hora si no existe
        if not item.get('timestamp'):
            item['timestamp'] = datetime.utcnow().isoformat()

        return item

class JsonWriterPipeline:
    """
    Escribe el resultado temporal en un directorio 'data' mapeado como volumen, 
    para que el script de bash luego lo renombre con la fecha del día.
    """
    def open_spider(self, spider):
        # Aseguramos que la carpeta data exista (esto estará mapeado al volumen en Docker)
        os.makedirs('data', exist_ok=True)
        self.filepath = 'data/temp_results.json'
        
        self.file = open(self.filepath, 'w', encoding='utf-8')
        self.file.write('[\n')
        self.first_item = True

    def close_spider(self, spider):
        self.file.write('\n]')
        self.file.close()

    def process_item(self, item, spider):
        line = json.dumps(dict(item), ensure_ascii=False)
        if not self.first_item:
            self.file.write(',\n')
        self.file.write(line)
        self.first_item = False
        return item

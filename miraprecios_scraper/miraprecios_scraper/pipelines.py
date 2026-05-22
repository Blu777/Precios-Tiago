import os
import json

class PriceSanitizationPipeline:
    def process_item(self, item, spider):
        # 1. Limpieza de strings en nombres y marcas
        if item.get('name'):
            item['name'] = str(item['name']).strip()
        if item.get('brand'):
            item['brand'] = str(item['brand']).strip()

        # 2. Validación y seguridad de precios (asegurar floats)
        for field in ['precio_actual', 'precio_lista']:
            if item.get(field) is not None:
                try:
                    item[field] = float(item[field])
                except (ValueError, TypeError):
                    item[field] = None

        return item

class JsonWriterPipeline:
    """
    Escribe el resultado en 'data/temp_results.json' de forma asíncrona, 
    creando la carpeta local y el archivo en open_spider, y cerrándolo ordenadamente.
    """
    def open_spider(self, spider):
        os.makedirs('data', exist_ok=True)
        self.filepath = 'data/temp_results.json'
        
        # Modo 'w' recrea y limpia el archivo en cada corrida
        self.file = open(self.filepath, 'w', encoding='utf-8')
        self.file.write('[\n')
        self.first_item = True

    def close_spider(self, spider):
        self.file.write('\n]')
        self.file.close()

    def process_item(self, item, spider):
        # ensure_ascii=False respeta acentos y caracteres especiales latinos
        line = json.dumps(dict(item), ensure_ascii=False)
        if not self.first_item:
            self.file.write(',\n')
        self.file.write(line)
        self.first_item = False
        return item

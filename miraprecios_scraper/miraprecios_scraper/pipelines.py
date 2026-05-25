import re
import unicodedata

class DataNormalizationPipeline:
    """
    Pipeline encargado de:
    1. Normalizar textos (mayúsculas, sin tildes, sin espacios extra).
    2. Extraer Contenido Neto y Unidad de Medida (UOM) vía Regex.
    3. Castear precios a Float para seguridad matemática.
    """
    # Regex para extraer número (entero o decimal) seguido de un espacio opcional y la unidad
    # Ejemplos: 1.5L, 500g, 1 kg, 750 ML, 3.5 cc
    UOM_PATTERN = re.compile(r'(\d+(?:[.,]\d+)?)\s*(kg|g|gr|l|ml|cc)\b', re.IGNORECASE)

    def normalize_text(self, text):
        if not text:
            return ""
        # 1. Pasar a mayúsculas
        text = str(text).upper()
        # 2. Quitar tildes y diacríticos
        text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
        # 3. Remover espacios múltiples y bordes
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def process_item(self, item, spider):
        # Guardamos el nombre original para extraer medidas antes de normalizar
        raw_name = item.get('name', '')
        
        # 1. Limpieza de strings en nombres y marcas
        item['name'] = self.normalize_text(raw_name)
        if item.get('brand'):
            item['brand'] = self.normalize_text(item['brand'])

        # 2. Extracción de Contenido Neto y Unidad de Medida
        item['net_content'] = None
        item['unit'] = None
        
        if raw_name:
            match = self.UOM_PATTERN.search(raw_name)
            if match:
                value_str = match.group(1).replace(',', '.') # Normalizar coma a punto decimal
                unit_str = match.group(2).upper()
                
                # Estandarizar unidades similares
                if unit_str == 'GR':
                    unit_str = 'G'
                elif unit_str == 'CC':
                    unit_str = 'ML'
                    
                try:
                    item['net_content'] = float(value_str)
                    item['unit'] = unit_str
                except ValueError:
                    pass

        # 3. Validación y seguridad de precios (asegurar floats)
        for field in ['precio_actual', 'precio_lista', 'price']:
            if item.get(field) is not None:
                try:
                    item[field] = float(item[field])
                except (ValueError, TypeError):
                    item[field] = None

        return item

# Supermercados Objetivo e Infraestructura Web

Este documento sirve como referencia arquitectónica y estratégica para el desarrollo de los scrapers (bots) del proyecto MiraPrecios, detallando las particularidades técnicas y el modelo de negocio de cada cadena.

## 1. El Grupo Cencosud (Ecosistema VTEX)
Es uno de los actores más grandes. Lo bueno es que sus tres marcas usan la infraestructura de VTEX, por lo que si lográs scrapear o pegarle a la API interna de una, el formato de respuesta para las otras dos es prácticamente idéntico.

- **Jumbo:** Apunta a un target ABC1. Precios más altos pero excelente variedad de stock y productos importados.
- **Disco:** Concentrado fuertemente en CABA y GBA (muy fuerte en barrios como Caballito o Belgrano). Precios intermedios.
- **Vea:** La opción masiva y económica del grupo, con muchísima presencia en el interior del país y sucursales de cercanía.

## 2. Carrefour Argentina (Ecosistema VTEX)
Es el jugador con mayor capilaridad territorial (está en casi todas las provincias). Para un bot es clave porque maneja tres formatos de tienda bajo el mismo dominio web:

- **Hipermercados / Market:** Surtido completo de alimentos y electro.
- **Express:** Tiendas de cercanía. Ojo acá: los precios de Carrefour Express suelen ser un porcentaje más caros que los del Hipermercado, un detalle clave a registrar en la base de datos.
- **Maxi:** Su formato mayorista, ideal si el bot busca comparar compras en cantidad.

## 3. Coto (Infraestructura Propia)
Coto Digital es enorme, especialmente en AMBA.

- **Desafío técnico:** A diferencia de Carrefour o Cencosud, Coto no usa un backend estándar como VTEX. Su estructura web es propia y suele requerir que el bot maneje bien las cookies de sesión, los headers de navegación y la selección de la "zona de envío" (sucursal) al inicio de la sesión para renderizar los precios correctos.

## 4. Supermercados Día (Ecosistema VTEX)
La cadena de cercanía por excelencia en Buenos Aires.

- **Interés para el bot:** Es un termómetro espectacular para las marcas propias ("Marca Día") y los productos de consumo diario más económicos. Al correr también sobre VTEX, la extracción de datos repite los patrones de Carrefour o Jumbo.

## 5. ChangoMás (Ex-Walmart)
El grupo GDN opera bajo las marcas Hiper ChangoMás y ChangoMás.

- **Desafío técnico:** Tiene un volumen de ventas masivo en todo el país. Su plataforma web se renovó bastante en el último tiempo, orientándose a arquitecturas modernas de Javascript que facilitan la intercepción de sus peticiones JSON internas.

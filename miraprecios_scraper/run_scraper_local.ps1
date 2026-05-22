Write-Host "[+] Iniciando extracción de datos VTEX con Scrapy..." -ForegroundColor Cyan
$fecha = Get-Date -Format "yyyy_MM_dd"

# Asegurar que exista la carpeta data local
if (!(Test-Path "data")) {
    New-Item -ItemType Directory -Force -Path "data" | Out-Null
}

# 1. Raspado de Dia
Write-Host "`n[+] Raspando supermercados Dia..." -ForegroundColor Yellow
scrapy crawl vtex_dinamico -a tienda=dia
if (Test-Path "data\temp_results.json") {
    # Mover y renombrar
    Move-Item -Path "data\temp_results.json" -Destination "data\precios_dia_$fecha.json" -Force
    Write-Host "[✔] Dia completado exitosamente." -ForegroundColor Green
} else {
    Write-Host "[!] Error: No se generó el archivo de Dia." -ForegroundColor Red
}

# 2. Raspado de ChangoMás
Write-Host "`n[+] Raspando supermercados ChangoMás..." -ForegroundColor Yellow
scrapy crawl vtex_dinamico -a tienda=changomas
if (Test-Path "data\temp_results.json") {
    Move-Item -Path "data\temp_results.json" -Destination "data\precios_changomas_$fecha.json" -Force
    Write-Host "[✔] ChangoMás completado exitosamente." -ForegroundColor Green
} else {
    Write-Host "[!] Error: No se generó el archivo de ChangoMás." -ForegroundColor Red
}

# 3. Sincronización local con el Frontend Web
Write-Host "`n[+] Copiando base de datos generada hacia el proyecto Frontend..." -ForegroundColor Cyan
if (!(Test-Path "..\miraprecios_web\data")) {
    New-Item -ItemType Directory -Force -Path "..\miraprecios_web\data" | Out-Null
}
Copy-Item -Path "data\*.json" -Destination "..\miraprecios_web\data\" -Force

Write-Host "`n[✔] ¡Extracción total completada! Los archivos están listos para ser leídos por la Web." -ForegroundColor Green

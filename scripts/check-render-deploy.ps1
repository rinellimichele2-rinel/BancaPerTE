# Script per verificare la configurazione prima del deployment su Render

Write-Host "=== Controllo Configurazione per Render ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verifica file render.yaml
Write-Host "1. Verifica render.yaml..." -ForegroundColor Yellow
if (Test-Path "render.yaml") {
    Write-Host "   ✓ render.yaml trovato" -ForegroundColor Green
} else {
    Write-Host "   ✗ render.yaml NON trovato!" -ForegroundColor Red
    exit 1
}

# 2. Verifica package.json scripts
Write-Host ""
Write-Host "2. Verifica script package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$requiredScripts = @("server:build", "server:prod")
$missingScripts = @()

foreach ($script in $requiredScripts) {
    if (-not $packageJson.scripts.$script) {
        $missingScripts += $script
    }
}

if ($missingScripts.Count -eq 0) {
    Write-Host "   ✓ Tutti gli script richiesti sono presenti" -ForegroundColor Green
} else {
    Write-Host "   ✗ Script mancanti: $($missingScripts -join ', ')" -ForegroundColor Red
    exit 1
}

# 3. Test build locale
Write-Host ""
Write-Host "3. Test build server..." -ForegroundColor Yellow
Write-Host "   Eseguo: npm run server:build" -ForegroundColor Gray
npm run server:build
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Build server completato con successo" -ForegroundColor Green
} else {
    Write-Host "   ✗ Build server fallito!" -ForegroundColor Red
    exit 1
}

# 4. Verifica file necessari
Write-Host ""
Write-Host "4. Verifica file necessari..." -ForegroundColor Yellow
$requiredFiles = @(
    "server/index.ts",
    "server/routes.ts",
    "server/storage.ts",
    "server/storage.pg.ts",
    "server/db.pg.ts",
    "shared/schema.pg.ts",
    "drizzle.config.ts"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Host "   ✓ Tutti i file necessari sono presenti" -ForegroundColor Green
} else {
    Write-Host "   ✗ File mancanti:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "     - $_" -ForegroundColor Red }
    exit 1
}

# 5. Checklist finale
Write-Host ""
Write-Host "=== Checklist Deployment Render ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prima di fare il deployment, assicurati di:" -ForegroundColor Yellow
Write-Host "  1. Aver fatto commit di tutte le modifiche" -ForegroundColor White
Write-Host "  2. Aver fatto push su GitHub" -ForegroundColor White
Write-Host "  3. Configurare ADMIN_PASSWORD su Render" -ForegroundColor White
Write-Host "  4. NON configurare EXPO_PUBLIC_API_URL (usa default)" -ForegroundColor White
Write-Host ""
Write-Host "Dopo il deployment:" -ForegroundColor Yellow
Write-Host "  1. Verifica che il database sia attivo" -ForegroundColor White
Write-Host "  2. Controlla i log per errori" -ForegroundColor White
Write-Host "  3. Testa il login all'URL fornito da Render" -ForegroundColor White
Write-Host ""
Write-Host "✓ Configurazione pronta per il deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Per deployare:" -ForegroundColor Cyan
Write-Host "  1. Vai su https://render.com" -ForegroundColor White
Write-Host "  2. New → Web Service" -ForegroundColor White
Write-Host "  3. Connetti GitHub repository" -ForegroundColor White
Write-Host "  4. Render rileverà render.yaml automaticamente" -ForegroundColor White
Write-Host ""
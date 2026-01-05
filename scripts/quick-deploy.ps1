# Script PowerShell per deployment rapido su Render
# Per Windows

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 Quick Deploy - Render (Windows)          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Funzione per chiedere conferma
function Ask-Confirmation {
    param([string]$Message)
    $response = Read-Host "$Message (s/n)"
    return $response -eq "s"
}

# 1. Verifica Git
Write-Host "🔍 Verificando Git..." -ForegroundColor Yellow
try {
    git --version | Out-Null
    Write-Host "✅ Git installato`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Git non installato. Installalo da https://git-scm.com/`n" -ForegroundColor Red
    exit 1
}

# 2. Controlla .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  File .env non trovato!" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "📝 Creo .env da .env.example..." -ForegroundColor Cyan
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env creato!`n" -ForegroundColor Green
        Write-Host "📝 IMPORTANTE: Modifica .env prima di continuare:" -ForegroundColor Yellow
        Write-Host "   - ADMIN_PASSWORD" -ForegroundColor White
        Write-Host "   - DATABASE_URL (lo otterrai da Render)" -ForegroundColor White
        Write-Host "   - EXPO_PUBLIC_API_URL (lo otterrai dopo il deployment)`n" -ForegroundColor White
        
        if (Ask-Confirmation "Vuoi aprire .env per modificarlo ora?") {
            notepad .env
        }
        
        Read-Host "`n⏸  Premi Invio quando hai configurato .env"
    } else {
        Write-Host "❌ .env.example non trovato!`n" -ForegroundColor Red
        exit 1
    }
}

# 3. Controlla modifiche Git
Write-Host "`n📝 Controllo modifiche..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "📋 Modifiche rilevate:`n" -ForegroundColor Cyan
    git status --short
    
    $message = Read-Host "`n💬 Messaggio commit (o premi Invio per default)"
    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "Deploy update"
    }
    
    Write-Host "`n📦 Committando modifiche..." -ForegroundColor Yellow
    git add .
    git commit -m $message
    Write-Host "✅ Commit completato!`n" -ForegroundColor Green
} else {
    Write-Host "✅ Nessuna modifica da committare`n" -ForegroundColor Green
}

# 4. Controlla remote GitHub
Write-Host "🔗 Controllo configurazione GitHub..." -ForegroundColor Yellow
$remotes = git remote -v
if ($remotes -notmatch "github.com") {
    Write-Host "❌ Repository GitHub non configurato!`n" -ForegroundColor Red
    Write-Host "📝 Passi da seguire:" -ForegroundColor Yellow
    Write-Host "1. Vai su https://github.com/new" -ForegroundColor White
    Write-Host "2. Crea un nuovo repository (pubblico o privato)" -ForegroundColor White
    Write-Host "3. NON inizializzare con README" -ForegroundColor White
    Write-Host "4. Copia l'URL del repository`n" -ForegroundColor White
    
    $repoUrl = Read-Host "🔗 Incolla l'URL del repository GitHub"
    
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        Write-Host "❌ URL non valido!`n" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n🔗 Aggiungendo remote GitHub..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    Write-Host "✅ GitHub configurato!`n" -ForegroundColor Green
} else {
    Write-Host "✅ GitHub già configurato`n" -ForegroundColor Green
}

# 5. Push su GitHub
Write-Host "🚀 Pushing su GitHub..." -ForegroundColor Yellow
try {
    git push origin main 2>&1 | Out-Null
    Write-Host "✅ Codice caricato su GitHub!`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Tentativo di push alla branch main fallito. Provo con master..." -ForegroundColor Yellow
    try {
        git push origin master 2>&1 | Out-Null
        Write-Host "✅ Codice caricato su GitHub!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Push fallito. Verifica la configurazione Git.`n" -ForegroundColor Red
        Write-Host "Prova manualmente: git push origin main`n" -ForegroundColor Yellow
    }
}

# 6. Istruzioni Render
Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        📝 Configurazione Render                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Vai su Render Dashboard e segui questi passi:`n" -ForegroundColor Yellow
Write-Host "1️⃣  Crea Database PostgreSQL:" -ForegroundColor Cyan
Write-Host "   - Vai su https://dashboard.render.com" -ForegroundColor White
Write-Host "   - Click 'New +' → 'PostgreSQL'" -ForegroundColor White
Write-Host "   - Name: bank-db" -ForegroundColor White
Write-Host "   - Region: Scegli la tua" -ForegroundColor White
Write-Host "   - Plan: Free" -ForegroundColor White
Write-Host "   - Click 'Create Database'`n" -ForegroundColor White

Write-Host "2️⃣  Crea Web Service:" -ForegroundColor Cyan
Write-Host "   - Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "   - Connetti il tuo repository GitHub" -ForegroundColor White
Write-Host "   - Render userà automaticamente render.yaml`n" -ForegroundColor White

Write-Host "3️⃣  Configura Environment Variables:" -ForegroundColor Cyan
Write-Host "   - Aggiungi EXPO_PUBLIC_API_URL con URL Render" -ForegroundColor White
Write-Host "   - Aggiungi ADMIN_PASSWORD" -ForegroundColor White
Write-Host "   - DATABASE_URL sarà automatico dal database`n" -ForegroundColor White

Write-Host "4️⃣  Inizializza Database:" -ForegroundColor Cyan
Write-Host "   - Nella Shell di Render: npm run db:push`n" -ForegroundColor White

if (Ask-Confirmation "`nVuoi aprire Render Dashboard nel browser?") {
    Start-Process "https://dashboard.render.com"
}

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✅ DEPLOYMENT PREPARATO!             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📱 Dopo aver completato i passi su Render:" -ForegroundColor Yellow
Write-Host "1. Aggiorna .env locale con l'URL Render" -ForegroundColor White
Write-Host "2. Testa l'app: npm run expo:dev`n" -ForegroundColor White

Write-Host "`nScript completato. Premi Ctrl+C per chiudere." -ForegroundColor Green
Start-Sleep -Seconds 5

# Script PowerShell per deployment rapido su Render

Write-Host "🚀 Inizio procedura di invio codice a GitHub..." -ForegroundColor Cyan

# Spostati nella root del progetto
Set-Location "$PSScriptRoot/.."

# Configura remote se non esiste (sicurezza)
git remote remove origin 2>$null
git remote add origin https://github.com/rinellimichele2-rinel/BancaPerTE.git

# Aggiungi tutti i file
Write-Host "📦 Preparazione file..." -ForegroundColor Yellow
git add .

# Commit
git commit -m "Aggiornamento per Render deployment" 2>$null

# Push
Write-Host "⬆️ Invio file a GitHub..." -ForegroundColor Yellow
Write-Host "NOTA: Se appare una finestra di login o ti viene chiesta la password, inseriscila." -ForegroundColor Magenta
git push -u origin main

if ($?) {
    Write-Host "✅ Codice inviato con successo!" -ForegroundColor Green
    Write-Host "👉 Ora vai su Render.com:" -ForegroundColor White
    Write-Host "   1. Clicca su 'New +'" -ForegroundColor White
    Write-Host "   2. Seleziona 'Blueprint'" -ForegroundColor White
    Write-Host "   3. Seleziona il repository 'BancaPerTE'" -ForegroundColor White
    Write-Host "   4. Render troverà automaticamente il file render.yaml" -ForegroundColor White
} else {
    Write-Host "❌ Errore durante l'invio. Controlla le credenziali o la connessione." -ForegroundColor Red
}

Read-Host -Prompt "Premi Invio per uscire"

# 🚀 Guida al Deployment su Render

## 1. Invia il Codice a GitHub
Il motivo per cui Render non trova `render.yaml` è che il file esiste solo sul tuo computer. Devi inviarlo a GitHub.

**Esegui questo comando nel terminale:**
```powershell
.\scripts\quick-deploy.ps1
```
oppure manualmente:
```bash
git add .
git commit -m "Aggiunto render.yaml"
git push -u origin main
```

## 2. Crea il Blueprint su Render
Una volta che il codice è su GitHub:

1. Vai nella dashboard di [Render](https://dashboard.render.com).
2. Clicca sul bottone **New +** in alto a destra.
3. Seleziona **Blueprint**.
4. Collega il tuo repository `rinellimichele2-rinel/BancaPerTE`.
5. Clicca su **Apply** / **Create Blueprint**.

## 3. Configurazione Finale
Dopo che il deploy è completato:
1. Copia l'URL del tuo sito (es. `https://bank-interface-flow.onrender.com`).
2. Vai nelle impostazioni del servizio web su Render -> **Environment**.
3. Aggiungi la variabile `EXPO_PUBLIC_API_URL` con il valore del tuo URL.
4. Fai un **Manual Deploy** -> **Clear build cache & deploy**.

# 🚀 Guida al Deployment su Render

Questa guida ti aiuterà a pubblicare la tua app bancaria online usando Render.

## 📋 Prerequisiti

1. Account GitHub (per ospitare il codice)
2. Account Render gratuito: https://render.com
3. Il progetto deve essere in un repository GitHub

---

## 🔧 Passo 1: Preparazione del Repository

### 1.1 Crea file .env.example

Crea un file `.env.example` nella root del progetto (Bank-Interface-Flow/):

```env
# Admin password per accesso panel amministrativo
ADMIN_PASSWORD=your_secure_password_here

# Porta server (lasciare 5000 per Render)
PORT=5000

# Ambiente (production per Render)
NODE_ENV=production

# URL del database PostgreSQL (verrà fornito da Render)
DATABASE_URL=postgresql://user:password@host:5432/database

# URL pubblico dell'API (il tuo URL Render, es: https://your-app.onrender.com)
EXPO_PUBLIC_API_URL=https://your-app.onrender.com

# OpenAI API Key per il consulente AI (opzionale se usi Replit AI)
OPENAI_API_KEY=your_openai_api_key_here
```

### 1.2 Aggiorna .gitignore

Assicurati che il file `.gitignore` contenga:

```
.env
.env.local
*.db
node_modules/
dist/
server_dist/
static-build/
```

### 1.3 Commit e Push su GitHub

```bash
git add .
git commit -m "Preparazione per deployment Render"
git push origin main
```

---

## 🗄️ Passo 2: Crea Database PostgreSQL su Render

1. Vai su https://dashboard.render.com
2. Click su **"New +"** → **"PostgreSQL"**
3. Configurazione:
   - **Name**: `bank-db` (o nome a tua scelta)
   - **Database**: `bank`
   - **User**: `bank_user`
   - **Region**: Scegli la regione più vicina a te
   - **Instance Type**: **Free** (per iniziare)
4. Click **"Create Database"**
5. ⏱️ Attendi 2-3 minuti che il database sia pronto
6. 📋 **IMPORTANTE**: Copia la stringa **"External Database URL"** dalla pagina del database
   - Si trova nella sezione "Connections"
   - Formato: `postgresql://user:password@host.region.render.com:5432/database`

---

## 🌐 Passo 3: Crea Web Service su Render

1. Torna su https://dashboard.render.com
2. Click su **"New +"** → **"Web Service"**
3. Connetti il tuo repository GitHub
4. Configurazione:

### Impostazioni Base
- **Name**: `bank-interface-flow` (o nome a tua scelta)
- **Region**: Stessa regione del database
- **Branch**: `main`
- **Root Directory**: `Bank-Interface-Flow`
- **Runtime**: **Node**
- **Build Command**: 
  ```bash
  npm install && npm run server:build
  ```
- **Start Command**: 
  ```bash
  npm run server:prod
  ```

### Variabili d'Ambiente (Environment Variables)

Click su **"Advanced"** → **"Add Environment Variable"** per ogni variabile:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DATABASE_URL` | *Incolla l'URL del database copiato al Passo 2* |
| `ADMIN_PASSWORD` | *La tua password admin sicura* |
| `EXPO_PUBLIC_API_URL` | *Lascia vuoto per ora, lo compilerai dopo* |

5. **Instance Type**: **Free** (per iniziare)
6. Click **"Create Web Service"**

⏱️ Il deployment richiederà circa 5-10 minuti.

---

## ⚙️ Passo 4: Configura URL pubblico

1. Una volta completato il deployment, vedrai l'URL del tuo servizio
   - Esempio: `https://bank-interface-flow-xyz.onrender.com`
2. Copia questo URL
3. Vai nelle **Environment Variables** del tuo web service
4. Modifica `EXPO_PUBLIC_API_URL` e incolla l'URL copiato
5. Salva e attendi che il servizio si riavvii automaticamente

---

## 🗃️ Passo 5: Inizializza il Database

Dopo il primo deployment, devi creare le tabelle del database:

### Opzione A: Usando Render Shell (Consigliato)

1. Vai alla pagina del tuo Web Service su Render
2. Click su **"Shell"** nel menu laterale
3. Esegui:
   ```bash
   npm run db:push
   ```

### Opzione B: Usando Drizzle Studio Locale

1. Sul tuo computer, imposta la variabile `DATABASE_URL`:
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://user:password@host.region.render.com:5432/database"
   
   # Mac/Linux
   export DATABASE_URL="postgresql://user:password@host.region.render.com:5432/database"
   ```
2. Esegui:
   ```bash
   npm run db:push
   ```

---

## 📱 Passo 6: Configura App Mobile (Expo)

### 6.1 Aggiorna il file .env locale

Nel tuo file `.env` locale, imposta:

```env
EXPO_PUBLIC_API_URL=https://your-render-url.onrender.com
```

### 6.2 Testa l'app

```bash
npm run expo:dev
```

Apri l'app sul tuo telefono usando Expo Go e verifica che:
- ✅ Riesci a fare login
- ✅ Le transazioni vengono salvate
- ✅ Il consulente AI risponde

---

## 🎉 Deployment Completato!

Il tuo server è ora online su Render! Puoi accedere a:

- **Landing Page**: `https://your-render-url.onrender.com`
- **Admin Panel**: `https://your-render-url.onrender.com/admin`
- **API**: `https://your-render-url.onrender.com/api/*`

---

## 🔍 Troubleshooting

### ❌ Errore: "DATABASE_URL mancante"

**Causa**: La variabile `DATABASE_URL` non è configurata correttamente.

**Soluzione**:
1. Verifica che la variabile sia presente nelle Environment Variables
2. Controlla che l'URL sia corretto (copia-incolla dal database Render)
3. Riavvia il servizio

### ❌ Build fallito su Render

**Causa**: Dipendenze mancanti o errori di compilazione.

**Soluzione**:
1. Controlla i log del build su Render
2. Verifica che `package.json` includa tutte le dipendenze
3. Testa il build localmente:
   ```bash
   npm run server:build
   ```

### ❌ App mobile non si connette

**Causa**: `EXPO_PUBLIC_API_URL` non configurato o errato.

**Soluzione**:
1. Verifica l'URL nel file `.env`
2. Riavvia Metro bundler:
   ```bash
   npm run expo:dev
   ```
3. Assicurati che l'URL non contenga spazi o caratteri extra

### ❌ Render Free Tier va in sleep

**Causa**: I servizi gratuiti di Render vanno in sleep dopo 15 minuti di inattività.

**Soluzione**:
1. Upgrade a un piano a pagamento ($7/mese)
2. Oppure, usa un servizio di ping (es: UptimeRobot) per mantenere attivo il servizio

### ❌ Database è pieno

**Causa**: Il database free tier ha un limite di 1GB.

**Soluzione**:
1. Elimina vecchie transazioni
2. Upgrade al piano a pagamento

---

## 🔐 Sicurezza - Best Practices

1. **Password Admin**: Usa una password complessa e unica
2. **Database URL**: Non condividere mai il DATABASE_URL pubblicamente
3. **Environment Variables**: Non committare mai il file `.env` su GitHub
4. **HTTPS**: Render fornisce HTTPS automaticamente
5. **Rate Limiting**: Considera di aggiungere rate limiting alle API

---

## 📊 Monitoraggio

Render fornisce:
- **Logs**: Visualizza i log in tempo reale
- **Metrics**: CPU, memoria, traffico di rete
- **Alerts**: Notifiche via email per problemi

Accedi a tutti questi strumenti dalla dashboard del tuo servizio.

---

## 🆙 Upgrade Opzionali

Per migliorare le performance in produzione:

1. **Redis Cache**: Aggiungi caching per query frequenti
2. **CDN**: Usa Cloudflare per servire asset statici
3. **Monitoring**: Integra Sentry per error tracking
4. **Backup**: Configura backup automatici del database

---

## 📞 Supporto

- **Render Docs**: https://docs.render.com
- **Community**: https://community.render.com
- **Status**: https://status.render.com

---

## 🎯 Checklist Finale

Prima di considerare il deployment completo:

- [ ] Database PostgreSQL creato su Render
- [ ] Web Service creato e deployed
- [ ] Tutte le variabili d'ambiente configurate
- [ ] Database inizializzato con `db:push`
- [ ] App mobile si connette correttamente
- [ ] Login funziona
- [ ] Transazioni vengono salvate
- [ ] Consulente AI risponde (se configurato)
- [ ] Admin panel accessibile
- [ ] `.env` non è committato su GitHub

---

**Buon deployment! 🚀**
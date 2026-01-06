# EquisCash - App Bancaria Mobile

App bancaria mobile costruita con React Native, Expo e PostgreSQL.

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ installato
- PostgreSQL installato (per sviluppo locale) o account Render (per deployment)
- Expo CLI

### Installazione Locale

1. **Clona il repository**
   ```bash
   cd Bank-Interface-Flow
   npm install
   ```

2. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Modifica `.env` con le tue configurazioni.

3. **Avvia il database locale (SQLite per sviluppo)**
   ```bash
   # Il progetto usa SQLite in modalità development
   # Non serve configurare nulla
   ```

4. **Avvia il server**
   ```bash
   npm run server:dev
   ```

5. **Avvia l'app mobile (in un nuovo terminale)**
   ```bash
   npm run expo:dev
   ```

6. **Scansiona il QR code** con Expo Go sul tuo telefono

---

## 🌐 Deployment Online

Vedi la [Guida Completa al Deployment](./DEPLOYMENT.md) per pubblicare l'app su Render.

### Deployment Rapido

1. Crea database PostgreSQL su Render
2. Crea Web Service su Render collegando il repository GitHub
3. Configura le variabili d'ambiente
4. Esegui `npm run db:push` per inizializzare il database
5. L'app sarà online!

---

## 📱 Utilizzo

### Per Utenti
1. Apri l'app con Expo Go
2. Inserisci un username (verrà creato automaticamente se nuovo)
3. Imposta un PIN a 5 cifre
4. Esplora le funzionalità bancarie!

### Per Admin
- Accedi al pannello admin: `http://localhost:5000/admin`
- Password: quella impostata in `.env` (ADMIN_PASSWORD)

---

## 🛠 Script Disponibili

```bash
# Sviluppo
npm run expo:dev          # Avvia Expo in modalità development
npm run server:dev        # Avvia server Express in modalità development
npm run all:dev           # Avvia entrambi simultaneamente

# Build e Produzione
npm run server:build      # Compila il server per produzione
npm run server:prod       # Avvia il server in modalità production
npm run expo:static:build # Build statico dell'app Expo

# Database
npm run db:push           # Sincronizza schema con database

# Code Quality
npm run lint              # Controlla errori di linting
npm run lint:fix          # Corregge automaticamente errori di linting
npm run check:types       # Controlla errori TypeScript
npm run format            # Formatta il codice con Prettier
```

---

## 🏗 Struttura del Progetto

```
Bank-Interface-Flow/
├── client/              # App React Native
│   ├── components/      # Componenti riutilizzabili
│   ├── screens/         # Schermate dell'app
│   ├── navigation/      # Configurazione navigazione
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Context e utility
│   └── constants/      # Tema e costanti
├── server/             # Server Express
│   ├── routes.ts       # Definizione route API
│   ├── storage.ts      # Layer di accesso dati (SQLite)
│   ├── storage.pg.ts   # Layer di accesso dati (PostgreSQL)
│   ├── db.ts           # Configurazione database SQLite
│   ├── db.pg.ts        # Configurazione database PostgreSQL
├── shared/             # Codice condiviso
│   ├── schema.ts       # Schema database SQLite
│   ├── schema.pg.ts    # Schema database PostgreSQL
│   └── presets.ts      # Transazioni predefinite
└── scripts/            # Script di build
```

---

## 🔒 Sicurezza

- ✅ Validazione server-side di tutte le operazioni
- ✅ PIN a 5 cifre per autenticazione
- ✅ Le modifiche al saldo sono controllate solo server-side
- ✅ Trasferimenti validati con controlli atomici
- ✅ Password admin per pannello amministrativo

---

## 🌟 Funzionalità

- 💳 Gestione account bancari
- 💰 Visualizzazione saldo e transazioni
- 🔄 Trasferimenti P2P
- 🎲 Generazione transazioni casuali
- 🤖 Consulente AI finanziario
- 📊 Dashboard amministrativa
- 🔐 Autenticazione sicura con PIN
- 📱 Interfaccia mobile nativa

---

## 🧪 Testing

```bash
# Controlla tipi TypeScript
npm run check:types

# Lint del codice
npm run lint
```

---

## 📝 Tecnologie Utilizzate

### Frontend
- React Native
- Expo SDK 54
- React Navigation
- TanStack React Query
- TypeScript

### Backend
- Express.js
- Drizzle ORM
- PostgreSQL / SQLite

### DevOps
- Render (deployment)
- GitHub (versioning)

---

## 🐛 Troubleshooting

### Errore: "DATABASE_URL mancante"
Assicurati di aver configurato la variabile `DATABASE_URL` nel file `.env` o nelle variabili d'ambiente di Render.

### App non si connette al server
1. Verifica che `EXPO_PUBLIC_API_URL` sia corretto nel `.env`
2. Riavvia Metro bundler con `npm run expo:dev`
3. Controlla che il server sia in esecuzione

### Build fallito
1. Elimina `node_modules/` e reinstalla: `npm install`
2. Pulisci cache: `npm cache clean --force`
3. Riprova il build

---

## 📄 Licenza

Questo progetto è privato.

---

## 🤝 Supporto

Per problemi o domande, consulta la [Guida al Deployment](./DEPLOYMENT.md).
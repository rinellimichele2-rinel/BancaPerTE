#!/usr/bin/env node

/**
 * Script di deployment automatico per Render
 * Automatizza il processo di commit, push e deployment
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function exec(command, options = {}) {
  try {
    console.log(`\n🔧 Eseguendo: ${command}`);
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf-8',
      ...options 
    });
    return output;
  } catch (error) {
    console.error(`❌ Errore durante l'esecuzione di: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

async function checkGitInstalled() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    console.error('❌ Git non è installato. Installalo da https://git-scm.com/');
    process.exit(1);
  }
}

async function checkGitHubRemote() {
  try {
    const remotes = execSync('git remote -v', { encoding: 'utf-8' });
    return remotes.includes('github.com');
  } catch {
    return false;
  }
}

async function setupGitHub() {
  console.log('\n📦 Configurazione GitHub');
  console.log('='.repeat(50));
  
  const hasGitHub = await checkGitHubRemote();
  
  if (!hasGitHub) {
    console.log('\n❌ Repository GitHub non configurato!');
    console.log('\n📝 Segui questi passi:');
    console.log('1. Vai su https://github.com/new');
    console.log('2. Crea un nuovo repository (pubblico o privato)');
    console.log('3. NON inizializzare con README, .gitignore o licenza');
    console.log('4. Copia l\'URL del repository (es: https://github.com/tuousername/nome-repo.git)');
    
    const repoUrl = await ask('\n🔗 Incolla l\'URL del repository GitHub: ');
    
    if (!repoUrl.trim()) {
      console.error('❌ URL non valido. Esci.');
      process.exit(1);
    }
    
    console.log('\n🔗 Aggiungendo remote GitHub...');
    exec(`git remote add origin ${repoUrl.trim()}`);
    
    console.log('✅ GitHub configurato!');
  } else {
    console.log('✅ Repository GitHub già configurato');
  }
}

async function commitAndPush() {
  console.log('\n📝 Commit e Push');
  console.log('='.repeat(50));
  
  // Controlla se ci sono modifiche
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    
    if (!status.trim()) {
      console.log('✅ Nessuna modifica da committare');
      return;
    }
    
    console.log('\n📋 Modifiche rilevate:');
    exec('git status --short');
    
    const commitMessage = await ask('\n💬 Messaggio commit (o premi Invio per default): ');
    const message = commitMessage.trim() || 'Deploy update';
    
    exec('git add .');
    exec(`git commit -m "${message}"`);
    
    console.log('\n🚀 Pushing su GitHub...');
    exec('git push origin main');
    
    console.log('✅ Codice caricato su GitHub!');
    
  } catch (error) {
    console.error('❌ Errore durante commit/push');
    throw error;
  }
}

async function checkRenderCLI() {
  try {
    execSync('render --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function setupRenderCLI() {
  console.log('\n🔧 Setup Render CLI');
  console.log('='.repeat(50));
  
  const hasRenderCLI = await checkRenderCLI();
  
  if (!hasRenderCLI) {
    console.log('\n❌ Render CLI non installato');
    console.log('\n📦 Installo Render CLI...');
    
    try {
      exec('npm install -g @renderinc/cli');
      console.log('✅ Render CLI installato!');
    } catch {
      console.log('\n⚠️  Installazione automatica fallita.');
      console.log('Installa manualmente: npm install -g @renderinc/cli');
      process.exit(1);
    }
  } else {
    console.log('✅ Render CLI già installato');
  }
  
  // Login a Render
  console.log('\n🔐 Login a Render');
  const answer = await ask('Hai già fatto login a Render CLI? (s/n): ');
  
  if (answer.toLowerCase() !== 's') {
    console.log('\n🌐 Apro browser per login...');
    exec('render login');
  }
}

async function checkEnvFile() {
  const fs = require('fs');
  
  if (!fs.existsSync('.env')) {
    console.log('\n⚠️  File .env non trovato!');
    console.log('📝 Creo .env da .env.example...');
    
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      console.log('✅ .env creato!');
      console.log('\n📝 IMPORTANTE: Modifica .env con le tue configurazioni:');
      console.log('   - ADMIN_PASSWORD');
      console.log('   - DATABASE_URL (dopo aver creato il database su Render)');
      console.log('   - EXPO_PUBLIC_API_URL (dopo il deployment)');
      
      await ask('\n⏸  Premi Invio quando hai configurato .env...');
    }
  }
}

async function createRenderService() {
  console.log('\n🌐 Creazione servizio Render');
  console.log('='.repeat(50));
  
  console.log('\n📋 Userò le configurazioni da render.yaml');
  
  const answer = await ask('\nHai già creato il servizio su Render? (s/n): ');
  
  if (answer.toLowerCase() === 's') {
    console.log('✅ Servizio già configurato');
    return;
  }
  
  console.log('\n📝 Passi da seguire su Render Dashboard:');
  console.log('1. Vai su https://dashboard.render.com');
  console.log('2. Click "New +" → "PostgreSQL" per creare database');
  console.log('3. Click "New +" → "Web Service" per creare il servizio');
  console.log('4. Connetti il tuo repository GitHub');
  console.log('5. Render userà automaticamente render.yaml per la configurazione');
  console.log('\n⚠️  IMPORTANTE: Dopo aver creato il servizio:');
  console.log('   - Copia l\'URL Render (es: https://your-app.onrender.com)');
  console.log('   - Aggiungi EXPO_PUBLIC_API_URL nelle Environment Variables');
  console.log('   - Aggiungi ADMIN_PASSWORD nelle Environment Variables');
  
  await ask('\n⏸  Premi Invio quando hai completato la configurazione su Render...');
}

async function runPostDeployTasks() {
  console.log('\n⚙️  Task Post-Deployment');
  console.log('='.repeat(50));
  
  const runDbPush = await ask('\nVuoi inizializzare il database? (s/n): ');
  
  if (runDbPush.toLowerCase() === 's') {
    console.log('\n⚠️  Assicurati che DATABASE_URL sia configurato nel .env');
    const confirm = await ask('DATABASE_URL è configurato? (s/n): ');
    
    if (confirm.toLowerCase() === 's') {
      console.log('\n🗄️  Inizializzando database...');
      exec('npm run db:push');
      console.log('✅ Database inizializzato!');
    }
  }
}

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🚀 Script Deployment Automatico - Render    ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  try {
    // 1. Check Git
    await checkGitInstalled();
    
    // 2. Check .env
    await checkEnvFile();
    
    // 3. Setup GitHub
    await setupGitHub();
    
    // 4. Commit e Push
    await commitAndPush();
    
    // 5. Setup Render (manuale via dashboard)
    await createRenderService();
    
    // 6. Post-deployment tasks
    await runPostDeployTasks();
    
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║            ✅ DEPLOYMENT COMPLETATO!          ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n📱 Prossimi passi:');
    console.log('1. Verifica che il servizio sia online su Render Dashboard');
    console.log('2. Testa l\'API: https://your-app.onrender.com/api/server-date');
    console.log('3. Aggiorna EXPO_PUBLIC_API_URL nel tuo .env locale');
    console.log('4. Testa l\'app mobile con npm run expo:dev');
    console.log('\n🎉 Il tuo progetto è online!');
    
  } catch (error) {
    console.error('\n❌ Deployment fallito:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Esegui script
main();
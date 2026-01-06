
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:5000';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiRequest(method: string, endpoint: string, body?: any) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`[${method}] ${url}`);
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const text = await res.text();
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch {
      return { status: res.status, data: text };
    }
  } catch (err: any) {
    console.error(`Request failed: ${err.message}`);
    return null;
  }
}

async function runTest() {
  console.log('🚀 Starting API Test Flow...');

  // 1. Health Check (Server Date)
  console.log('\n--- 1. Health Check ---');
  // Retry connection a few times in case server is just starting
  let dateRes;
  for (let i = 0; i < 5; i++) {
    dateRes = await apiRequest('GET', '/api/server-date');
    if (dateRes && dateRes.status === 200) break;
    console.log('Waiting for server...');
    await delay(1000);
  }

  if (!dateRes || dateRes.status !== 200) {
    console.error('❌ Server not reachable or error. Is it running?');
    process.exit(1);
  }
  console.log('✅ Server is up:', dateRes.data.romeDate);

  // 2. Login (Create new user)
  console.log('\n--- 2. Authentication (Login/Register) ---');
  const username = `test_user_${Date.now()}`;
  const loginRes = await apiRequest('POST', '/api/auth/login', { username });
  
  if (loginRes?.status !== 200) {
    console.error('❌ Login failed:', loginRes);
    process.exit(1);
  }
  
  const { userId, needsSetup } = loginRes.data;
  console.log(`✅ Logged in as ${username} (ID: ${userId})`);
  console.log(`ℹ️ Needs Setup: ${needsSetup}`);

  // 3. Setup PIN
  if (needsSetup) {
    console.log('\n--- 3. Setup PIN ---');
    const pinRes = await apiRequest('POST', '/api/auth/setup-pin', { userId, pin: '12345' });
    if (pinRes?.status !== 200) {
      console.error('❌ PIN Setup failed:', pinRes);
      process.exit(1);
    }
    console.log('✅ PIN set successfully');
  }

  // 4. Verify PIN
  console.log('\n--- 4. Verify PIN ---');
  const verifyRes = await apiRequest('POST', '/api/auth/verify-pin', { userId, pin: '12345' });
  if (verifyRes?.status !== 200) {
    console.error('❌ PIN Verification failed:', verifyRes);
    process.exit(1);
  }
  console.log('✅ PIN verified. User Balance:', verifyRes.data.user.balance);

  // 5. Create Transaction (Expense)
  console.log('\n--- 5. Create Expense Transaction ---');
  const expenseRes = await apiRequest('POST', '/api/transactions', {
    userId,
    description: 'Test Expense',
    amount: '5.00',
    type: 'expense',
    category: 'Shopping',
    date: new Date().toISOString()
  });

  if (expenseRes?.status !== 200) {
    console.error('❌ Expense creation failed:', expenseRes);
  } else {
    console.log('✅ Expense created. New Balance:', expenseRes.data.newBalance);
  }

  // 6. Get Updated User Data
  console.log('\n--- 6. Verify Final State ---');
  const userRes = await apiRequest('GET', `/api/user/${userId}`);
  if (userRes?.status === 200) {
    console.log('✅ Final User Balance:', userRes.data.balance);
  } else {
    console.error('❌ Failed to fetch user data');
  }
  
  console.log('\n🎉 Test Flow Completed!');
}

runTest();

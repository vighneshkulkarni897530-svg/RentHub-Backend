// Quick test for Ollama and the AI assistant endpoint
const BASE = 'http://localhost:5000/api/v1';
const OLLAMA = 'http://127.0.0.1:11434';

async function testOllama() {
  console.log('\n=== Test 1: Ollama direct chat ===');
  try {
    const res = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        stream: false,
        options: { temperature: 0.2, num_predict: 50 },
      }),
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data.message?.content?.slice(0, 300));
  } catch (err) {
    console.log('Ollama direct error:', err.message);
  }
}

async function testHealth() {
  console.log('\n=== Test 2: AI Health endpoint ===');
  try {
    const res = await fetch(`${BASE}/ai/health`);
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Health:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Health error:', err.message);
  }
}

async function testAssistant(msg) {
  console.log(`\n=== Test 3: AI Assistant - "${msg}" ===`);
  try {
    const res = await fetch(`${BASE}/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });
    const text = await res.text();
    const data = JSON.parse(text);
    console.log('Status:', res.status);
    console.log('  intent:', data?.data?.intent);
    console.log('  message:', data?.data?.message);
    console.log('  nav:', JSON.stringify(data?.data?.navigation));
    console.log('  products:', data?.data?.products?.length || 0);
  } catch (err) {
    console.log('Assistant error:', err.message);
  }
}

async function main() {
  await testOllama();
  await testHealth();
  await testAssistant('I want a camera');
  await testAssistant('Show me laptops');
  await testAssistant('I need a projector under ₹800 per day');
  await testAssistant('Show gaming products');
  await testAssistant('Show products available for pickup');
  await testAssistant('Take me to my rentals');
  await testAssistant('Show my notifications');
}

main();
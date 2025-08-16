const readline = require('node:readline');

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  const url = await question('Target URL: ');
  const description = await question('Test description: ');
  rl.close();

  const res = await fetch('http://localhost:3000/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, description })
  });
  const { id } = await res.json();
  console.log('Test submitted with id:', id);

  async function poll() {
    const r = await fetch(`http://localhost:3000/tests/${id}/results`);
    const data = await r.json();
    console.log('Status:', data.status);
    if (data.status === 'running') {
      setTimeout(poll, 2000);
    } else {
      console.log('Result:', data.result || data.error);
      if (data.screenshot) console.log('Screenshot data URL:', data.screenshot.slice(0, 80) + '...');
    }
  }
  poll();
}

main();

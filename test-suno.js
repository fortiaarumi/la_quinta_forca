const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env.local', 'utf8');
const line = env.split('\n').find(l => l.startsWith('SUNO_COOKIES='));
const val = line.substring(13).trim().replace(/^"|"$/g, '');

const parts = val.split(';').map(p => p.trim());
const essential = parts.filter(p => 
  p.startsWith('__session=') || 
  p.startsWith('__client_uat=') || 
  p.startsWith('__client=')
);
const minCookie = essential.join('; ');

console.log(`Cookie original: ${val.length} chars`);
console.log(`Cookie minima: ${minCookie.length} chars`);
console.log('');
console.log('--- Provant cookie minima amb Clerk ---');

const options = {
  hostname: 'clerk.suno.com',
  path: '/v1/client?_clerk_js_version=5.26.1',
  method: 'GET',
  headers: {
    'Cookie': minCookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    const sessions = parsed.response?.sessions || [];
    if (sessions.length > 0) {
      console.log('✅ COOKIE MINIMA FUNCIONA!');
      console.log('');
      console.log('Copia EXACTAMENT aquesta linia i posa-la a Vercel SUNO_COOKIES:');
      console.log('');
      console.log(minCookie);
    } else {
      console.log('❌ Cookie minima NO funciona, provant amb la completa...');
    }
  });
});
req.on('error', e => console.error(e));
req.end();

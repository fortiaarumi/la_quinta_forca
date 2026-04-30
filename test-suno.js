const fs = require('fs');
const https = require('https');

const envStr = fs.readFileSync('.env.local', 'utf8');
const cookiesLine = envStr.split('\\n').find(l => l.startsWith('SUNO_COOKIES='));
const cookiesStr = cookiesLine ? cookiesLine.split('=')[1].replace(/"/g, '') : '';
const cookies = cookiesStr.split(',').map(c => c.trim());

const cookie = cookies[0];

const options = {
  hostname: 'clerk.suno.com',
  port: 443,
  path: '/v1/client?_clerk_js_version=5.26.1',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Cookie': cookie
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let data = '';
  res.on('data', d => {
    data += d;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();




function extractSessionToken(cookieStr) {
  const match = cookieStr.match(/__session=([^;]+)/);
  if (!match) throw new Error('Cookie no conté __session');
  return match[1].trim();
}

async function testSuno() {
  const cookiesStr = process.env.SUNO_COOKIES;
  if (!cookiesStr) {
    console.log("No SUNO_COOKIES found");
    return;
  }
  const token = extractSessionToken(cookiesStr);
  console.log("Token starts with:", token.substring(0, 15));

  try {
    const res = await fetch('https://studio-api.suno.com/api/billing/info/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log("Billing Status:", res.status);
    const data = await res.text();
    console.log("Billing Data:", data);

    // Try generate
    const payload = {
        prompt: "A song about geographic fails",
        title: 'Sátira Geogràfica',
        tags: 'pop',
        make_instrumental: false,
        mv: 'chirp-v3-5'
    };

    console.log("Testing generation...");
    const genRes = await fetch('https://studio-api.suno.com/api/generate/v2/', {

        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify(payload)
    });
    console.log("Generate Status:", genRes.status);
    const genData = await genRes.text();
    console.log("Generate Data:", genData);
  } catch(e) {
    console.error(e);
  }
}

testSuno();

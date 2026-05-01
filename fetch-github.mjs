

async function test() {
    const res = await fetch('https://raw.githubusercontent.com/GCui-art/suno-api/main/utils/index.js');
    const text = await res.text();
    const lines = text.split('\n');
    lines.forEach(line => {
        if (line.includes('http')) {
            console.log(line);
        }
    });
}
test();

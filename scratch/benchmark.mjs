import http from 'http';
import { performance } from 'perf_hooks';

async function fetchUrl(url, hostHeader = null) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 3000,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: hostHeader ? { Host: hostHeader } : {},
    };

    const req = http.request(options, (res) => {
      let ttfb = null;
      let data = '';
      
      res.once('readable', () => {
        ttfb = performance.now() - start;
      });

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const total = performance.now() - start;
        resolve({
          statusCode: res.statusCode,
          ttfb: ttfb ? Math.round(ttfb * 10) / 10 : Math.round(total * 10) / 10,
          totalTime: Math.round(total * 10) / 10,
          bodySize: Buffer.byteLength(data, 'utf8'),
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function benchmark(name, url, hostHeader = null, runs = 5) {
  console.log(`\nTesting: ${name} (${runs} requests)...`);
  const results = [];

  // Warm-up run
  try {
    await fetchUrl(url, hostHeader);
  } catch (e) {
    console.error(`Warm-up failed for ${name}:`, e.message);
  }

  for (let i = 0; i < runs; i++) {
    try {
      const res = await fetchUrl(url, hostHeader);
      results.push(res);
      // Brief pause between requests
      await new Promise((r) => setTimeout(r, 80));
    } catch (e) {
      console.error(`Run ${i + 1} failed:`, e.message);
    }
  }

  if (results.length === 0) {
    console.log(`❌ All requests failed for ${name}`);
    return;
  }

  const avgTTFB = Math.round((results.reduce((a, b) => a + b.ttfb, 0) / results.length) * 10) / 10;
  const minTTFB = Math.min(...results.map((r) => r.ttfb));
  const maxTTFB = Math.max(...results.map((r) => r.ttfb));
  const avgTotal = Math.round((results.reduce((a, b) => a + b.totalTime, 0) / results.length) * 10) / 10;
  const sizeKb = Math.round((results[0].bodySize / 1024) * 10) / 10;

  console.log(`- Status: ${results[0].statusCode}`);
  console.log(`- Payload Size: ${sizeKb} KB`);
  console.log(`- TTFB (Time to First Byte): Avg ${avgTTFB} ms (Min: ${minTTFB} ms, Max: ${maxTTFB} ms)`);
  console.log(`- Total Response Time: Avg ${avgTotal} ms`);
}

async function run() {
  console.log("=========================================");
  console.log(" DZMenu Production Performance Benchmark ");
  console.log("=========================================");

  await benchmark("Health API (/api/health)", "http://localhost:3000/api/health", null, 5);
  await benchmark("Customer Menu Direct Path (/m/salem)", "http://localhost:3000/m/salem", null, 5);
  await benchmark("Customer Menu Subdomain (salem.localhost:3000/)", "http://localhost:3000/", "salem.localhost:3000", 5);
  await benchmark("Homepage (/) ", "http://localhost:3000/", null, 5);

  console.log("\n=========================================");
  console.log(" Benchmark Finished ");
  console.log("=========================================");
}

run();

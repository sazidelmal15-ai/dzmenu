import http from 'http';
import { performance } from 'perf_hooks';

const CONCURRENT_USERS = 100;
const URL_TO_TEST = 'http://localhost:3000/';
const HOST_HEADER = 'salem.localhost:3000';

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,
});

async function singleRequest(id) {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = http.request(
      URL_TO_TEST,
      {
        agent,
        headers: {
          Host: HOST_HEADER,
        },
      },
      (res) => {
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
            id,
            status: res.statusCode,
            ttfb: ttfb ? Math.round(ttfb * 10) / 10 : Math.round(total * 10) / 10,
            totalTime: Math.round(total * 10) / 10,
            size: Buffer.byteLength(data, 'utf8'),
            success: res.statusCode === 200,
          });
        });
      }
    );

    req.on('error', (err) => {
      const total = performance.now() - start;
      resolve({
        id,
        status: 'ERROR',
        ttfb: null,
        totalTime: Math.round(total * 10) / 10,
        size: 0,
        success: false,
        error: err.message,
      });
    });

    req.end();
  });
}

async function runLoadTest() {
  console.log("=================================================");
  console.log(` Starting Concurrency Load Test: ${CONCURRENT_USERS} Simultaneous Users `);
  console.log(` Target: ${HOST_HEADER} (${URL_TO_TEST}) `);
  console.log("=================================================\n");

  const overallStart = performance.now();

  // Fire 100 concurrent requests simultaneously
  const promises = Array.from({ length: CONCURRENT_USERS }, (_, i) => singleRequest(i + 1));
  const results = await Promise.all(promises);

  const overallTotalTime = performance.now() - overallStart;

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const totalTimes = successful.map((r) => r.totalTime).sort((a, b) => a - b);
  const ttfbs = successful.map((r) => r.ttfb).sort((a, b) => a - b);

  const avgTime = Math.round((totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length) * 10) / 10;
  const p50 = totalTimes[Math.floor(totalTimes.length * 0.5)];
  const p90 = totalTimes[Math.floor(totalTimes.length * 0.9)];
  const p95 = totalTimes[Math.floor(totalTimes.length * 0.95)];
  const maxTime = totalTimes[totalTimes.length - 1];
  const minTime = totalTimes[0];

  const rps = Math.round((successful.length / (overallTotalTime / 1000)) * 10) / 10;

  console.log(`📊 RESULTS FOR ${CONCURRENT_USERS} CONCURRENT USERS:`);
  console.log(`-------------------------------------------------`);
  console.log(`- Total Requests Sent:   ${CONCURRENT_USERS}`);
  console.log(`- Successful (200 OK):   ${successful.length} (${(successful.length / CONCURRENT_USERS) * 100}%)`);
  console.log(`- Failed / Errors:       ${failed.length}`);
  console.log(`- Total Time for Batch:  ${Math.round(overallTotalTime * 10) / 10} ms (${(overallTotalTime / 1000).toFixed(2)}s)`);
  console.log(`- Throughput:            ${rps} Requests / Second\n`);

  console.log(`⏱️ LATENCY PERCENTILES:`);
  console.log(`- Fastest Response (Min):   ${minTime} ms`);
  console.log(`- Average Response (Mean):  ${avgTime} ms`);
  console.log(`- Median Response (P50):    ${p50} ms`);
  console.log(`- 90% of Users (P90):       <= ${p90} ms`);
  console.log(`- 95% of Users (P95):       <= ${p95} ms`);
  console.log(`- Slowest Response (Max):   ${maxTime} ms`);

  if (failed.length > 0) {
    console.log(`\n❌ Failure Details (first 3):`, failed.slice(0, 3));
  }
}

runLoadTest();

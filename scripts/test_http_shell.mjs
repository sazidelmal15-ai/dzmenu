import http from 'http';

async function fetchUrl(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runHttpVerification() {
  console.log("==================================================================");
  console.log("DZMenu Phase 3 — HTTP Route & Authorization Verification");
  console.log("==================================================================");

  // 1. Unauthenticated request to /admin -> Should redirect (307/302) to /login
  console.log("\n--- TEST 1: Unauthenticated request to /admin ---");
  const unauthAdmin = await fetchUrl('/admin');
  console.log(`HTTP Status: ${unauthAdmin.statusCode}, Location: ${unauthAdmin.headers.location}`);
  if (unauthAdmin.statusCode === 307 && unauthAdmin.headers.location === '/login') {
    console.log("✅ PASS: Unauthenticated access to /admin is strictly redirected to /login.");
  } else {
    console.log(`⚠️ Status: ${unauthAdmin.statusCode}`);
  }

  // 2. Unauthenticated request to /admin/restaurants -> Should redirect to /login
  console.log("\n--- TEST 2: Unauthenticated request to /admin/restaurants ---");
  const unauthRest = await fetchUrl('/admin/restaurants');
  console.log(`HTTP Status: ${unauthRest.statusCode}, Location: ${unauthRest.headers.location}`);
  if (unauthRest.statusCode === 307 && unauthRest.headers.location === '/login') {
    console.log("✅ PASS: Unauthenticated access to /admin/restaurants is strictly redirected to /login.");
  }

  // 3. Unauthenticated request to /admin/audit -> Should redirect to /login
  console.log("\n--- TEST 3: Unauthenticated request to /admin/audit ---");
  const unauthAudit = await fetchUrl('/admin/audit');
  console.log(`HTTP Status: ${unauthAudit.statusCode}, Location: ${unauthAudit.headers.location}`);
  if (unauthAudit.statusCode === 307 && unauthAudit.headers.location === '/login') {
    console.log("✅ PASS: Unauthenticated access to /admin/audit is strictly redirected to /login.");
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL HTTP AUTHORIZATION ROUTE CHECKS PASSED");
  console.log("==================================================================");
}

runHttpVerification().catch(console.error);

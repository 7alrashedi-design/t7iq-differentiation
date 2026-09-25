const https = require("https");
const { performance } = require("perf_hooks");

const targets = [
  ["health", "https://diff.t7iq.com/api/health", 2500],
  ["workshop", "https://diff.t7iq.com/w/DEMO26", 4000],
];

function request(url) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = https.get(url, { headers: { "User-Agent": "t7iq-safe-performance-acceptance/1.0" }, timeout: 8000 }, res => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode, ms: performance.now() - start }));
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

(async () => {
  for (const [name, url, maxMs] of targets) {
    const samples = [];
    // Deliberately sequential and tiny: acceptance check, not load testing.
    for (let i = 0; i < 3; i++) samples.push(await request(url));
    const bad = samples.find(x => x.status !== 200);
    if (bad) throw new Error(`${name}: expected 200, got ${bad.status}`);
    const worst = Math.max(...samples.map(x => x.ms));
    console.log(`${name}: ${samples.map(x => Math.round(x.ms)+"ms").join(", ")}; worst=${Math.round(worst)}ms`);
    if (worst > maxMs) throw new Error(`${name}: worst response ${Math.round(worst)}ms exceeds safe acceptance threshold ${maxMs}ms`);
  }
  console.log("Safe production performance acceptance: PASS");
})().catch(e => { console.error(e); process.exit(1); });

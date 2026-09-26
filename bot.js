#!/usr/bin/env node
/**
 * DOMAIN RADAR // CLI ENGINE
 * Real-time registry scanner for available .com and multi-TLD domains
 */

const { generateBrandNames } = require("./generator");
const { batchCheckDomains } = require("./checker");

// Parse arguments
const args = process.argv.slice(2);
const options = {
  keyword: "",
  theme: "all",
  count: 25,
  tlds: [".com"],
  onlyAvailable: true
};

function printHelp() {
  console.log(`
\x1b[36mDOMAIN RADAR // CLI MANUAL\x1b[0m
Automated real-time scanner checking official Verisign RDAP & Google DNS.

\x1b[1mUSAGE:\x1b[0m
  node bot.js [options]

\x1b[1mOPTIONS:\x1b[0m
  --keyword=<word>     Seed keyword root (e.g. --keyword=north)
  --theme=<style>      Archetype: all, compound, invented, short, agency
                       (Default: all)
  --count=<num>        Batch size: 1 to 100 (Default: 25)
  --tld=<extensions>   Comma-separated TLDs (e.g. --tld=com,net,io)
  --all                Show both taken and unclaimed domains in output
  --help, -h           Show this manual

\x1b[1mEXAMPLES:\x1b[0m
  node bot.js
  node bot.js --keyword=apex --count=30
  node bot.js --theme=compound --tld=com,net
  node bot.js --theme=agency --keyword=north --all
`);
  process.exit(0);
}

for (const arg of args) {
  if (arg === "--help" || arg === "-h") printHelp();
  if (arg.startsWith("--keyword=")) options.keyword = arg.split("=")[1];
  if (arg.startsWith("-k=")) options.keyword = arg.split("=")[1];
  if (arg.startsWith("--theme=")) options.theme = arg.split("=")[1];
  if (arg.startsWith("-t=")) options.theme = arg.split("=")[1];
  if (arg.startsWith("--count=")) options.count = parseInt(arg.split("=")[1], 10) || 25;
  if (arg.startsWith("-c=")) options.count = parseInt(arg.split("=")[1], 10) || 25;
  if (arg.startsWith("--tld=")) {
    options.tlds = arg.split("=")[1].split(",").map(t => t.trim());
  }
  if (arg === "--all") options.onlyAvailable = false;
}

console.log("\x1b[36m%s\x1b[0m", `
╔═══════════════════════════════════════════════════════╗
║   DOMAIN RADAR // REGISTRY DISCOVERY ENGINE           ║
╚═══════════════════════════════════════════════════════╝`);
console.log("[CONFIG] Theme: \x1b[33m" + options.theme + "\x1b[0m | Seed: \x1b[33m" + (options.keyword || "Random Neo-Roots") + "\x1b[0m | TLDs: \x1b[33m" + options.tlds.join(", ") + "\x1b[0m | Buffer: \x1b[33m" + options.count + "\x1b[0m");
console.log("[NETWORK] Official RDAP Protocol: \x1b[32mCONNECTED\x1b[0m\n");

const foundAvailable = [];
const taken = [];

// Graceful interrupt handler
process.on("SIGINT", () => {
  console.log("\n\x1b[33m[ABORT] Scan interrupted by user. Showing partial findings...\x1b[0m");
  printResults();
  process.exit(0);
});

function printResults() {
  console.log("\x1b[36m%s\x1b[0m", "\n═══════════════════════════════════════════════════════");
  console.log("📡 RADAR SCAN COMPLETE: \x1b[32m" + foundAvailable.length + " UNCLAIMED DOMAIN(S)\x1b[0m IDENTIFIED");
  console.log("\x1b[36m%s\x1b[0m", "═══════════════════════════════════════════════════════\n");

  if (foundAvailable.length > 0) {
    foundAvailable.forEach((f, i) => {
      console.log("\x1b[32m" + (i + 1).toString().padStart(2, "0") + ".\x1b[0m \x1b[1m" + f.name.padEnd(18) + "\x1b[0m -> \x1b[36mhttps://" + f.domain + "\x1b[0m");
      console.log("    \x1b[90mClaim: " + f.buyUrl + "\x1b[0m\n");
    });
  } else {
    console.log("No 100% unregistered domains found in this batch. Re-run or expand buffer: node bot.js --count=50");
  }
}

(async () => {
  const candidates = generateBrandNames(options);

  await batchCheckDomains(candidates, 3, (result, done, total) => {
    const isAvail = result.available;
    const status = isAvail ? "\x1b[32m[UNCLAIMED]\x1b[0m" : "\x1b[31m[REGISTERED]\x1b[0m";
    const tag = result.style ? "\x1b[90m// " + result.style + "\x1b[0m" : "";

    if (!options.onlyAvailable || isAvail) {
      console.log("[" + done.toString().padStart(2, "0") + "/" + total + "] " + status + " " + result.domain.padEnd(26) + " " + tag);
    } else {
      process.stdout.write("\rScanning registry... [" + done + "/" + total + "] - Found: " + foundAvailable.length + " available");
    }

    if (isAvail) foundAvailable.push(result);
    else taken.push(result);
  });

  if (options.onlyAvailable && taken.length > 0) {
    process.stdout.write("\r" + " ".repeat(60) + "\r");
  }

  printResults();
})();

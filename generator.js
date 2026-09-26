/**
 * BRAND NAME GENERATOR ENGINE
 * Generates elite, memorable, punchy brand names across multiple naming archetypes:
 * 1. Compound / Two-Word (Northlane, LeadPulse, ScalePeak, ApexFlow)
 * 2. Modern Tech / Neologisms (Veltro, Stratis, Kynex, Novaris)
 * 3. Power Suffix (Veltix, Scalara, Nexora, Amplifio)
 * 4. Agency & Growth Brands (NorthlaneMedia, ApexGrowth, PulseDigital)
 * 5. Short Punchy 5-7 letter abstract brands
 */

const PREFIXES = [
  "North", "Apex", "Peak", "Vanguard", "Crest", "Nova", "Aura", "Iron", "Volt", "Echo",
  "Strat", "Omni", "Pulse", "Synt", "Flux", "Core", "Prime", "Val", "Axon", "Aero",
  "Verd", "Zen", "Sol", "Velo", "Cobalt", "Slate", "Atlas", "Onyx", "Kite", "Forge",
  "Scale", "Metric", "Hyper", "Terra", "Strive", "Vector", "Optima", "Arc", "Bold", "Loom",
  "Beacon", "True", "Swift", "Clear", "High", "Grand", "Front", "Deep", "Rise", "Spark"
];

const ROOTS = [
  "lane", "path", "crest", "wave", "point", "flow", "bridge", "line", "reach", "base",
  "vault", "craft", "shift", "beam", "bloom", "forge", "spark", "grid", "gate", "mark",
  "node", "stack", "pulse", "link", "field", "view", "track", "helm", "spire", "dock",
  "loom", "bound", "scale", "cast", "stride", "drive", "scope", "wing", "yard", "port"
];

const SUFFIXES = [
  "ix", "ora", "is", "ex", "ara", "on", "us", "io", "eo", "ium", "aero", "ify", "ly", "ops"
];

const TECH_SYLLABLES_START = [
  "vel", "nov", "strat", "kyn", "nex", "zen", "lum", "ark", "pyr", "zep",
  "vol", "tal", "bre", "sol", "cal", "mar", "cyr", "aer", "fen", "drak"
];

const TECH_SYLLABLES_END = [
  "tra", "tor", "tis", "ron", "tix", "aris", "alis", "onic", "ora", "ent",
  "ion", "aro", "eus", "ark", "est", "ix", "ium", "ex", "is", "ant", "yx"
];

const AGENCY_QUALIFIERS = [
  "media", "growth", "ads", "digital", "hq", "scale", "marketing", "lab", "studio", "group"
];

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate brand name candidates
 * @param {Object} options
 * @param {string} [options.theme='all'] - 'all', 'compound', 'invented', 'short', 'agency'
 * @param {string} [options.keyword] - custom root or prefix word if desired
 * @param {number} [options.count=30] - number of candidates to produce
 * @param {string[]} [options.tlds=['.com']] - TLD extensions to target
 * @returns {Array<{ name: string, domain: string, style: string }>}
 */
function generateBrandNames(options = {}) {
  const count = Math.max(1, Math.min(options.count || 30, 200));
  const rawKeyword = (options.keyword || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  const theme = (options.theme || "all").toLowerCase();

  const rawTlds = Array.isArray(options.tlds) && options.tlds.length > 0 ? options.tlds : [".com"];
  const tlds = rawTlds.map(t => (t.startsWith(".") ? t.toLowerCase() : "." + t.toLowerCase()));

  const seenDomains = new Set();
  const results = [];

  function addCandidate(rawName, style) {
    if (!rawName) return;
    const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const baseDomain = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (baseDomain.length < 3 || baseDomain.length > 25) return;

    for (const tld of tlds) {
      const domain = baseDomain + tld;
      if (!seenDomains.has(domain)) {
        seenDomains.add(domain);
        results.push({ name: cleanName, domain, style });
      }
    }
  }

  // 1. If keyword provided, build around it
  if (rawKeyword) {
    const kwCap = capitalize(rawKeyword);
    // keyword + root
    for (const r of ROOTS) {
      addCandidate(kwCap + capitalize(r), "Keyword Compound");
    }
    // prefix + keyword
    for (const p of PREFIXES) {
      addCandidate(p + kwCap, "Keyword Compound");
    }
    // keyword + suffix
    for (const s of SUFFIXES) {
      addCandidate(kwCap + s, "Invented Keyword");
    }
    // keyword + agency qualifiers
    for (const q of AGENCY_QUALIFIERS) {
      addCandidate(kwCap + capitalize(q), "Agency Keyword Variant");
    }
  }

  // 2. High-Caliber Two-Word Compound Brands (like Northlane)
  if (theme === "all" || theme === "compound") {
    for (let i = 0; i < 200; i++) {
      const p = pickRandom(PREFIXES);
      const r = pickRandom(ROOTS);
      addCandidate(p + capitalize(r), "Two-Word Premium Compound");
    }
  }

  // 3. Invented Neologisms & Tech Names (like Veltis, Straton, Nexora)
  if (theme === "all" || theme === "invented") {
    for (let i = 0; i < 150; i++) {
      const start = pickRandom(TECH_SYLLABLES_START);
      const end = pickRandom(TECH_SYLLABLES_END);
      addCandidate(capitalize(start + end), "Invented Modern Tech");
    }
  }

  // 4. Punchy Suffix Variations / Brandmarks
  if (theme === "all" || theme === "short") {
    for (let i = 0; i < 150; i++) {
      const p = pickRandom(PREFIXES).toLowerCase();
      const s = pickRandom(SUFFIXES);
      addCandidate(capitalize(p + s), "Punchy Brandmark");
    }
  }

  // 5. Agency & Growth Brand Archetypes
  if (theme === "all" || theme === "agency") {
    for (let i = 0; i < 150; i++) {
      const p = pickRandom(PREFIXES);
      const q = pickRandom(AGENCY_QUALIFIERS);
      addCandidate(p + capitalize(q), "Agency & Growth Brand");
    }
  }

  // Fisher-Yates unbiased shuffle
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = results[i];
    results[i] = results[j];
    results[j] = temp;
  }

  return results.slice(0, count);
}

module.exports = {
  generateBrandNames,
  PREFIXES,
  ROOTS,
  SUFFIXES,
  AGENCY_QUALIFIERS
};

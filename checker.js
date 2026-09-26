/**
 * DOMAIN AVAILABILITY CHECKER
 * Multi-layer real-time verification for domain names:
 * 1. Primary: Official RDAP Registry (Registration Data Access Protocol)
 *    - Verisign for .com, .net
 *    - PIR for .org
 *    - Identity Digital for .io
 *    - Google Registry for .dev, .app
 *    - 200 HTTP = Registered (Taken)
 *    - 404 HTTP = Available for registration!
 * 2. Secondary: Google Public DNS over HTTPS (DoH)
 *    - Status 3 = NXDOMAIN (Domain does not exist in DNS, likely available)
 *    - Status 0 = Active DNS zone
 */

function sanitizeDomain(input) {
  let s = (input || "").toLowerCase().trim();
  // Strip protocol
  s = s.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
  // Strip paths, query params, fragments
  s = s.split("/")[0].split("?")[0].split("#")[0];
  // Remove disallowed characters
  s = s.replace(/[^a-z0-9.-]/g, "");
  // Remove leading/trailing dots and hyphens
  s = s.replace(/^[.-]+|[.-]+$/g, "");
  // Auto-append .com if no extension is present
  if (!s.includes(".")) {
    s += ".com";
  }
  return s;
}

function getRdapEndpoint(domain) {
  const lower = domain.toLowerCase();
  const parts = lower.split(".");
  const tld = parts.length > 1 ? parts[parts.length - 1] : "com";

  if (tld === "com" || tld === "net") {
    return {
      url: "https://rdap.verisign.com/" + tld + "/v1/domain/" + lower,
      registry: "Verisign RDAP"
    };
  }
  if (tld === "org") {
    return {
      url: "https://rdap.publicinterestregistry.org/rdap/domain/" + lower,
      registry: "Public Interest Registry (PIR) RDAP"
    };
  }
  if (tld === "io") {
    return {
      url: "https://rdap.identitydigital.services/rdap/domain/" + lower,
      registry: "Identity Digital (.IO) RDAP"
    };
  }
  if (tld === "dev" || tld === "app") {
    return {
      url: "https://pubapi.registry.google/rdap/domain/" + lower,
      registry: "Google Registry RDAP"
    };
  }

  // Fallback to rdap.org bootstrap redirector for any other TLD
  return {
    url: "https://rdap.org/domain/" + lower,
    registry: "RDAP.org Registry"
  };
}

/**
 * Check domain via official authoritative RDAP registry
 * Returns { available: boolean|null, method: string, registry: string, error?: string }
 */
async function checkRDAP(domain) {
  const { url, registry } = getRdapEndpoint(domain);
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "Accept": "application/rdap+json, application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      redirect: "follow"
    });

    if (res.status === 404) {
      return { available: true, method: registry + " (404 Not Found)", registry };
    }
    if (res.status === 200) {
      return { available: false, method: registry + " (Registered)", registry };
    }
    return { available: null, method: registry + " (Status " + res.status + ")", registry };
  } catch (err) {
    return { available: null, error: err.name === "TimeoutError" ? "Request timeout" : err.message, registry };
  }
}

/**
 * Check via Google DNS over HTTPS (DoH)
 * NXDOMAIN (Status 3) confirms domain does not exist in the DNS zone.
 */
async function checkGoogleDNS(domain) {
  try {
    const cleanDomain = encodeURIComponent(domain);
    const url = "https://dns.google/resolve?name=" + cleanDomain + "&type=A";
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "Accept": "application/dns-json" }
    });

    if (!res.ok) {
      return { hasDns: null, status: "HTTP_ERROR" };
    }

    const parsed = await res.json();
    if (parsed.Status === 3) {
      return { hasDns: false, status: "NXDOMAIN" };
    }
    if (parsed.Status === 0) {
      if (parsed.Answer && parsed.Answer.length > 0) {
        return { hasDns: true, status: "ACTIVE_DNS" };
      }
      // Also check NS records to verify if zone is delegated
      const nsRes = await fetch("https://dns.google/resolve?name=" + cleanDomain + "&type=NS", {
        signal: AbortSignal.timeout(4000),
        headers: { "Accept": "application/dns-json" }
      });
      if (nsRes.ok) {
        const nsData = await nsRes.json();
        if (nsData.Answer && nsData.Answer.length > 0) {
          return { hasDns: true, status: "ACTIVE_NS" };
        }
      }
      return { hasDns: true, status: "ZONE_EXISTS" };
    }

    return { hasDns: null, status: "UNKNOWN" };
  } catch (err) {
    // Fallback to Cloudflare DoH if Google DoH is unavailable or filtered
    try {
      const cleanDomain = encodeURIComponent(domain);
      const cfRes = await fetch("https://cloudflare-dns.com/dns-query?name=" + cleanDomain + "&type=A", {
        signal: AbortSignal.timeout(4000),
        headers: { "Accept": "application/dns-json" }
      });
      if (cfRes.ok) {
        const cfData = await cfRes.json();
        if (cfData.Status === 3) return { hasDns: false, status: "NXDOMAIN" };
        if (cfData.Status === 0 && cfData.Answer && cfData.Answer.length > 0) return { hasDns: true, status: "ACTIVE_DNS" };
      }
    } catch (_) {}
    return { hasDns: null, error: err.name === "TimeoutError" ? "DNS timeout" : err.message };
  }
}

/**
 * Combined consensus check
 * @param {string} rawDomain e.g. "northlane.com" or "northlane"
 * @returns {Promise<{ domain: string, available: boolean, status: string, confidence: string, buyUrl: string, details: object }>}
 */
async function checkDomainAvailability(rawDomain) {
  const domain = sanitizeDomain(rawDomain);
  const buyUrl = "https://www.namecheap.com/domains/registration/results/?domain=" + encodeURIComponent(domain);

  // 1. Check RDAP first (Official Registry ground truth)
  const rdap = await checkRDAP(domain);

  if (rdap.available === false) {
    return {
      domain,
      available: false,
      status: "TAKEN",
      confidence: "High (" + (rdap.registry || "Official Registry") + ")",
      buyUrl,
      details: { rdap }
    };
  }

  if (rdap.available === true) {
    // Cross check with DNS for double verification
    const dns = await checkGoogleDNS(domain);
    const isCleanDns = dns.hasDns === false;
    return {
      domain,
      available: true,
      status: "AVAILABLE",
      confidence: isCleanDns ? "Verified (Registry 404 + NXDOMAIN)" : "Verified (Registry 404)",
      buyUrl,
      details: { rdap, dns }
    };
  }

  // Fallback: If RDAP was rate limited, timed out, or had an error, use DNS
  const dnsFallback = await checkGoogleDNS(domain);
  if (dnsFallback.hasDns === true) {
    return {
      domain,
      available: false,
      status: "TAKEN",
      confidence: "Medium (Active DNS Records)",
      buyUrl,
      details: { rdap, dns: dnsFallback }
    };
  }

  if (dnsFallback.hasDns === false) {
    return {
      domain,
      available: true,
      status: "LIKELY_AVAILABLE",
      confidence: "Medium (DNS NXDOMAIN, Registry Inconclusive)",
      buyUrl,
      details: { rdap, dns: dnsFallback }
    };
  }

  return {
    domain,
    available: false,
    status: "UNKNOWN",
    confidence: "Inconclusive (Rate limited or network blip)",
    buyUrl,
    details: { rdap, dns: dnsFallback }
  };
}

/**
 * Batch check an array of domains with concurrency control
 * @param {Array<string|object>} domains
 * @param {number} [concurrency=4]
 * @param {Function} [onProgress]
 */
async function batchCheckDomains(domains, concurrency = 4, onProgress = null) {
  const results = [];
  const queue = [...domains];
  let checked = 0;
  const total = domains.length;

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      const domain = typeof item === "string" ? item : item.domain;
      const meta = typeof item === "object" ? item : {};

      try {
        const check = await checkDomainAvailability(domain);
        const merged = Object.assign({}, meta, check);
        results.push(merged);
        checked++;
        if (onProgress) onProgress(merged, checked, total);
      } catch (err) {
        const failed = Object.assign({}, meta, {
          domain: sanitizeDomain(domain),
          available: false,
          status: "ERROR",
          confidence: "Error during scan: " + err.message,
          buyUrl: "https://www.namecheap.com/domains/registration/results/?domain=" + encodeURIComponent(domain)
        });
        results.push(failed);
        checked++;
        if (onProgress) onProgress(failed, checked, total);
      }

      // Gentle 150ms throttle between calls to prevent rate limits
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), domains.length || 1);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

module.exports = {
  sanitizeDomain,
  checkRDAP,
  checkGoogleDNS,
  checkDomainAvailability,
  batchCheckDomains
};

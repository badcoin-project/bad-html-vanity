// ============================================================================
// BadCoin Vanity Address Generator — Application code
// 100% client-side. No network calls. No keys leave the browser.
// ============================================================================

(function () {
  'use strict';

  // ============================================================================
  // RIPEMD-160 implementation (per RFC 3174 / RIPEMD-160 spec)
  // Input: Uint8Array. Output: Uint8Array (20 bytes).
  // ============================================================================
  const RIPEMD = (function () {
    const r1 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
    const r2 = [5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
    const s1 = [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
    const s2 = [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];

    function rotl(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
    function f(j, x, y, z) {
      if (j < 16) return (x ^ y ^ z) >>> 0;
      if (j < 32) return ((x & y) | ((~x) & z)) >>> 0;
      if (j < 48) return ((x | (~y)) ^ z) >>> 0;
      if (j < 64) return ((x & z) | (y & (~z))) >>> 0;
      return (x ^ (y | (~z))) >>> 0;
    }
    function K(j) {
      if (j < 16) return 0x00000000;
      if (j < 32) return 0x5a827999;
      if (j < 48) return 0x6ed9eba1;
      if (j < 64) return 0x8f1bbcdc;
      return 0xa953fd4e;
    }
    function Kp(j) {
      if (j < 16) return 0x50a28be6;
      if (j < 32) return 0x5c4dd124;
      if (j < 48) return 0x6d703ef3;
      if (j < 64) return 0x7a6d76e9;
      return 0x00000000;
    }

    function hash(input) {
      const msgLen = input.length;
      const bitLen = msgLen * 8;
      const paddedLen = (((msgLen + 8) >>> 6) + 1) << 6;
      const padded = new Uint8Array(paddedLen);
      padded.set(input);
      padded[msgLen] = 0x80;
      const view = new DataView(padded.buffer);
      view.setUint32(paddedLen - 8, bitLen >>> 0, true);
      view.setUint32(paddedLen - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

      let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;

      for (let block = 0; block < paddedLen; block += 64) {
        const X = new Uint32Array(16);
        for (let i = 0; i < 16; i++) X[i] = view.getUint32(block + i * 4, true);

        let A = h0, B = h1, C = h2, D = h3, E = h4;
        let Ap = h0, Bp = h1, Cp = h2, Dp = h3, Ep = h4;

        for (let j = 0; j < 80; j++) {
          let T = ((A + f(j, B, C, D)) >>> 0) + X[r1[j]] + K(j);
          T = (rotl(T >>> 0, s1[j]) + E) >>> 0;
          A = E; E = D; D = rotl(C, 10); C = B; B = T;

          T = ((Ap + f(79 - j, Bp, Cp, Dp)) >>> 0) + X[r2[j]] + Kp(j);
          T = (rotl(T >>> 0, s2[j]) + Ep) >>> 0;
          Ap = Ep; Ep = Dp; Dp = rotl(Cp, 10); Cp = Bp; Bp = T;
        }

        const T = ((h1 + C) >>> 0) + Dp;
        h1 = (((h2 + D) >>> 0) + Ep) >>> 0;
        h2 = (((h3 + E) >>> 0) + Ap) >>> 0;
        h3 = (((h4 + A) >>> 0) + Bp) >>> 0;
        h4 = (((h0 + B) >>> 0) + Cp) >>> 0;
        h0 = T >>> 0;
      }

      const output = new Uint8Array(20);
      const outView = new DataView(output.buffer);
      outView.setUint32(0, h0, true);
      outView.setUint32(4, h1, true);
      outView.setUint32(8, h2, true);
      outView.setUint32(12, h3, true);
      outView.setUint32(16, h4, true);
      return output;
    }

    return hash;
  })();

  // ============================================================================
  // Base58 + Base58Check
  // ============================================================================
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const BASE58_LOWER = '123456789abcdefghjklmnpqrstuvwxyz';

  function base58encode(bytes) {
    let n = 0n;
    for (let i = 0; i < bytes.length; i++) n = n * 256n + BigInt(bytes[i]);
    let result = '';
    while (n > 0n) {
      result = BASE58[Number(n % 58n)] + result;
      n = n / 58n;
    }
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] !== 0) break;
      result = '1' + result;
    }
    return result;
  }

  function sha256bytes(bytes) {
    // js-sha256 ships a `sha256` global with array method
    const arr = sha256.array(bytes);
    return new Uint8Array(arr);
  }

  function base58check(bytes) {
    const sha1 = sha256bytes(bytes);
    const sha2 = sha256bytes(sha1);
    const out = new Uint8Array(bytes.length + 4);
    out.set(bytes);
    out.set(sha2.subarray(0, 4), bytes.length);
    return base58encode(out);
  }

  function bytesToHex(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
    return s;
  }

  // ============================================================================
  // BadCoin P2SH-wrapped P2WPKH address derivation
  // ============================================================================
  const BADCOIN_SCRIPT_ADDRESS = 0x19; // 25 — produces "B..." addresses
  const BADCOIN_WIF_VERSION = 0x50;    // 80 (decimal) — produces "C..." WIFs (BadCoin SECRET_KEY)

  const ec = new elliptic.ec('secp256k1');

  function generateOnce() {
    // Random 32-byte private key
    const priv = new Uint8Array(32);
    crypto.getRandomValues(priv);
    // Defensive: ensure not zero (probability ~2^-256 but cheap to check)
    let allZero = true;
    for (let i = 0; i < 32; i++) if (priv[i] !== 0) { allZero = false; break; }
    if (allZero) return generateOnce();

    const keypair = ec.keyFromPrivate(priv);
    const pubKeyArr = keypair.getPublic(true, 'array');
    const pubKey = new Uint8Array(pubKeyArr);

    // hash160(pubkey)
    const pubH160 = RIPEMD(sha256bytes(pubKey));

    // Redeem script: 0x00 0x14 <hash160>
    const redeem = new Uint8Array(22);
    redeem[0] = 0x00;
    redeem[1] = 0x14;
    redeem.set(pubH160, 2);

    // hash160(redeem)
    const redeemH160 = RIPEMD(sha256bytes(redeem));

    // Versioned payload + Base58Check
    const versioned = new Uint8Array(21);
    versioned[0] = BADCOIN_SCRIPT_ADDRESS;
    versioned.set(redeemH160, 1);
    const address = base58check(versioned);

    // WIF: 0x80 + priv + 0x01 (compressed)
    const wifBytes = new Uint8Array(34);
    wifBytes[0] = BADCOIN_WIF_VERSION;
    wifBytes.set(priv, 1);
    wifBytes[33] = 0x01;
    const wif = base58check(wifBytes);

    return {
      privHex: bytesToHex(priv),
      pubHex: bytesToHex(pubKey),
      address,
      wif
    };
  }

  // ============================================================================
  // Reachability + difficulty (BigInt-based, exact)
  // ============================================================================
  // BadCoin P2SH addresses: 25 bytes total (1 version + 20 hash + 4 checksum).
  // Integer V = bytes interpreted big-endian. Range = [25 * 2^192, 26 * 2^192).
  // Encoded in Base58 to 34 characters. Each character at position i constrains
  // V to a sub-range; a prefix is "reachable" if its V range overlaps the valid
  // V range. This is more accurate than counting characters because the version
  // byte constraint excludes some characters at certain positions (notably,
  // lowercase letters at position 2 are NEVER reachable for BadCoin P2SH).
  const N_DIGITS = 34n;
  const TWO_192 = 1n << 192n;
  const V_MIN_BIG = 25n * TWO_192;
  const V_MAX_BIG = 26n * TWO_192;
  const V_TOTAL = V_MAX_BIG - V_MIN_BIG;

  function rangeForPrefix(p) {
    let contrib = 0n;
    for (let i = 0; i < p.length; i++) {
      const idx = BASE58.indexOf(p[i]);
      if (idx < 0) return null;
      contrib += BigInt(idx) * (58n ** (N_DIGITS - 1n - BigInt(i)));
    }
    return {
      min: contrib,
      max: contrib + (58n ** (N_DIGITS - BigInt(p.length)))
    };
  }

  function overlapWithValid(prefixRange) {
    if (!prefixRange) return 0n;
    if (prefixRange.max <= V_MIN_BIG || prefixRange.min >= V_MAX_BIG) return 0n;
    const lo = prefixRange.min > V_MIN_BIG ? prefixRange.min : V_MIN_BIG;
    const hi = prefixRange.max < V_MAX_BIG ? prefixRange.max : V_MAX_BIG;
    return hi - lo;
  }

  function listReachableChars(prefixSoFar) {
    const reachable = [];
    for (let i = 0; i < BASE58.length; i++) {
      const test = prefixSoFar + BASE58[i];
      const r = rangeForPrefix(test);
      if (overlapWithValid(r) > 0n) reachable.push(BASE58[i]);
    }
    return reachable;
  }

  function caseVariants(prefix) {
    // First char must be 'B' (uppercase) for BadCoin P2SH; only branch later chars.
    let variants = ['B'];
    for (let i = 1; i < prefix.length; i++) {
      const c = prefix[i];
      const upper = c.toUpperCase();
      const lower = c.toLowerCase();
      const next = [];
      if (upper !== lower) {
        for (const v of variants) {
          next.push(v + upper);
          next.push(v + lower);
        }
      } else {
        for (const v of variants) next.push(v + c);
      }
      variants = next;
    }
    return variants;
  }

  function checkReachable(prefix, caseInsensitive) {
    if (!prefix || prefix.length === 0) return { ok: false, reason: 'Enter a prefix.' };

    const firstChar = prefix[0];
    const firstOk = caseInsensitive ? firstChar.toLowerCase() === 'b' : firstChar === 'B';
    if (!firstOk) {
      return { ok: false, reason: 'P2SH addresses always start with "B". Your prefix starts with "' + firstChar + '".' };
    }

    // Per-character Base58 validity (rejects 0/O/I/l)
    for (let i = 0; i < prefix.length; i++) {
      const c = prefix[i];
      const valid = caseInsensitive
        ? (BASE58.indexOf(c.toUpperCase()) >= 0 || BASE58.indexOf(c.toLowerCase()) >= 0)
        : BASE58.indexOf(c) >= 0;
      if (!valid) {
        return { ok: false, reason: 'Character "' + c + '" is not valid in Base58. Forbidden: 0, O, I, l.' };
      }
    }

    // Compute total overlap across case variants
    const variants = caseInsensitive ? caseVariants(prefix) : [prefix];
    let totalOverlap = 0n;
    for (const v of variants) {
      totalOverlap += overlapWithValid(rangeForPrefix(v));
    }

    if (totalOverlap === 0n) {
      // Find the position where reachability breaks; suggest valid chars there.
      let validUpTo = 'B';
      for (let i = 1; i < prefix.length; i++) {
        const candidate = validUpTo + prefix[i];
        if (overlapWithValid(rangeForPrefix(candidate)) === 0n) {
          const valid = listReachableChars(validUpTo);
          return {
            ok: false,
            reason: 'Character "' + prefix[i] + '" at position ' + (i + 1) +
              ' is not reachable for a BadCoin P2SH address. Valid characters at this position: ' +
              valid.join(' ')
          };
        }
        validUpTo = candidate;
      }
      // Fallback (should not be hit if loop above identified the position)
      return { ok: false, reason: 'This prefix is mathematically unreachable for a BadCoin P2SH address. Try a different combination.' };
    }

    // Difficulty = total valid V range / overlap size
    // Use Number for display; precision is fine for the prefix lengths users will try.
    const ratio = Number(V_TOTAL) / Number(totalOverlap);
    const diff = Math.max(1, Math.round(ratio));
    return { ok: true, difficulty: diff };
  }

  function formatTime(seconds) {
    if (!isFinite(seconds)) return '∞';
    if (seconds < 1) return '< 1 sec';
    if (seconds < 60) return Math.round(seconds) + ' sec';
    if (seconds < 3600) return (seconds / 60).toFixed(1) + ' min';
    if (seconds < 86400) return (seconds / 3600).toFixed(1) + ' hours';
    if (seconds < 86400 * 365) return (seconds / 86400).toFixed(1) + ' days';
    return (seconds / 86400 / 365).toFixed(1) + ' years';
  }

  function formatNumber(n) {
    if (n < 1000) return n.toString();
    if (n < 1e6) return (n / 1e3).toFixed(1) + 'K';
    if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
    if (n < 1e12) return (n / 1e9).toFixed(1) + 'B';
    return n.toExponential(1);
  }

  // ============================================================================
  // UI + search loop
  // ============================================================================
  const $ = (id) => document.getElementById(id);

  let running = false;
  let tries = 0;
  let startedAt = 0;
  let targetPrefix = '';
  let caseInsensitive = false;
  let expectedTries = 1;
  let results = [];

  function matches(address) {
    if (caseInsensitive) {
      return address.substring(0, targetPrefix.length).toLowerCase() === targetPrefix.toLowerCase();
    }
    return address.startsWith(targetPrefix);
  }

  function updateReachability() {
    const prefix = $('prefix').value.trim();
    const insensitive = $('caseInsensitive').checked;
    const r = checkReachable(prefix, insensitive);
    const el = $('reachability');
    if (!prefix) {
      el.textContent = '';
      el.className = '';
      $('start').disabled = true;
      return;
    }
    if (!r.ok) {
      el.textContent = '✗ ' + r.reason;
      el.className = 'bad';
      $('start').disabled = true;
    } else {
      el.textContent = '✓ Reachable. Expected ~' + formatNumber(r.difficulty) + ' tries.';
      el.className = 'good';
      $('start').disabled = false;
    }
  }

  function chunk() {
    if (!running) return;
    const BATCH = 50;
    for (let i = 0; i < BATCH; i++) {
      const r = generateOnce();
      tries++;
      if (matches(r.address)) {
        addResult(r);
        // continue searching for more matches; user can stop
      }
    }
    updateStats();
    // Use setTimeout(0) to yield to UI
    setTimeout(chunk, 0);
  }

  function updateStats() {
    const elapsed = (performance.now() - startedAt) / 1000;
    const rate = elapsed > 0 ? tries / elapsed : 0;
    const remaining = Math.max(0, expectedTries - tries);
    const eta = rate > 0 ? remaining / rate : Infinity;

    $('tries').textContent = formatNumber(tries);
    $('rate').textContent = formatNumber(Math.round(rate)) + ' /sec';
    $('eta').textContent = formatTime(eta);
    $('elapsed').textContent = formatTime(elapsed);
  }

  function addResult(r) {
    results.push(r);
    const list = $('results');
    if (list.querySelector('.empty')) list.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <div class="result-header">
        <strong>Match #${results.length}</strong>
        <span class="result-time">found at try ${formatNumber(tries)}</span>
      </div>
      <div class="result-field">
        <label>Address</label>
        <div class="result-value">${escapeHtml(r.address)}</div>
      </div>
      <div class="result-field">
        <label>Private Key (WIF) — KEEP SECRET</label>
        <div class="result-value secret">${escapeHtml(r.wif)}</div>
      </div>
      <div class="result-field">
        <label>Public Key (compressed hex)</label>
        <div class="result-value small">${escapeHtml(r.pubHex)}</div>
      </div>
      <div class="result-actions">
        <button class="btn btn-export" data-action="pdf" data-idx="${results.length - 1}">Save as PDF</button>
        <button class="btn btn-export" data-action="png" data-idx="${results.length - 1}">Save as PNG</button>
      </div>
    `;
    list.prepend(card);

    card.querySelectorAll('button[data-action]').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.idx, 10);
        const action = b.dataset.action;
        const rec = results[idx];
        if (action === 'pdf') exportPDF(rec);
        else if (action === 'png') exportPNG(rec);
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function start() {
    const prefix = $('prefix').value.trim();
    const insensitive = $('caseInsensitive').checked;
    const r = checkReachable(prefix, insensitive);
    if (!r.ok) return;

    targetPrefix = prefix;
    caseInsensitive = insensitive;
    expectedTries = r.difficulty;
    tries = 0;
    startedAt = performance.now();
    running = true;
    results = [];
    $('results').innerHTML = '<p class="empty">Searching... matches will appear here as they are found.</p>';

    $('start').disabled = true;
    $('stop').disabled = false;
    $('prefix').disabled = true;
    $('caseInsensitive').disabled = true;
    chunk();
  }

  function stop() {
    running = false;
    $('start').disabled = false;
    $('stop').disabled = true;
    $('prefix').disabled = false;
    $('caseInsensitive').disabled = false;
  }

  // ============================================================================
  // Exports
  // ============================================================================
  function qrDataUrl(text, cellSize, margin) {
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createDataURL(cellSize || 4, margin == null ? 4 : margin);
  }

  function exportPDF(rec) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BadCoin Paper Wallet', 105, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Generated by the BadCoin Vanity Address Generator', 105, 30, { align: 'center' });
    doc.setTextColor(0);

    // Address
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Public Address (share freely)', 20, 50);
    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    doc.text(rec.address, 20, 60);
    try {
      const addrQR = qrDataUrl(rec.address, 4, 4);
      doc.addImage(addrQR, 'GIF', 140, 45, 50, 50);
    } catch (e) { /* ignore */ }

    // Private key
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(178, 34, 34);
    doc.text('Private Key — WIF — KEEP SECRET', 20, 110);
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(rec.wif, 20, 120);
    try {
      const wifQR = qrDataUrl(rec.wif, 4, 4);
      doc.addImage(wifQR, 'GIF', 140, 105, 50, 50);
    } catch (e) { /* ignore */ }

    // Public key
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Public Key (compressed hex)', 20, 170);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    // 33 bytes = 66 hex chars; wrap
    const pub1 = rec.pubHex.substring(0, 33);
    const pub2 = rec.pubHex.substring(33);
    doc.text(pub1, 20, 178);
    doc.text(pub2, 20, 184);

    // Warnings
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = 210;
    const lines = [
      'Anyone with the private key can spend the coins.',
      'Store the WIF offline. Print this page or save to a secure location.',
      'Send a small test amount first; confirm it arrives before using the address for real funds.',
      'This file was generated 100% in your browser. No keys were transmitted anywhere.',
      'If you lose the private key, the coins are unrecoverable.'
    ];
    lines.forEach(l => { doc.text('• ' + l, 20, y); y += 6; });

    const date = new Date().toISOString().split('T')[0];
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Generated ' + date + ' · BadCoin Vanity Address Generator v1.0', 105, 285, { align: 'center' });

    doc.save('badcoin-' + rec.address.substring(0, 8) + '.pdf');
  }

  function exportPNG(rec) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#000';
    ctx.font = 'bold 36px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BadCoin Paper Wallet', 400, 60);

    ctx.font = '14px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('Generated by the BadCoin Vanity Address Generator', 400, 88);

    // Address section
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Public Address (share freely)', 40, 150);
    ctx.font = '18px ui-monospace, monospace';
    ctx.fillText(rec.address, 40, 180);

    // Address QR
    drawQR(ctx, rec.address, 560, 130, 180);

    // Private key section
    ctx.fillStyle = '#b22222';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Private Key — WIF — KEEP SECRET', 40, 380);
    ctx.fillStyle = '#000';
    ctx.font = '16px ui-monospace, monospace';
    ctx.fillText(rec.wif, 40, 410);

    // WIF QR
    drawQR(ctx, rec.wif, 560, 360, 180);

    // Public key
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Public Key (compressed hex)', 40, 610);
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(rec.pubHex.substring(0, 44), 40, 634);
    ctx.fillText(rec.pubHex.substring(44), 40, 652);

    // Warnings
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#333';
    let y = 730;
    const lines = [
      'Anyone with the private key can spend the coins.',
      'Store the WIF offline. Print this page or save to a secure location.',
      'Send a small test amount first; confirm it arrives before using the address for real funds.',
      'This file was generated 100% in your browser. No keys were transmitted anywhere.',
      'If you lose the private key, the coins are unrecoverable.'
    ];
    lines.forEach(l => { ctx.fillText('• ' + l, 40, y); y += 22; });

    // Footer
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generated ' + new Date().toISOString().split('T')[0] + ' · BadCoin Vanity Address Generator v1.0', 400, 1070);

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'badcoin-' + rec.address.substring(0, 8) + '.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }

  function drawQR(ctx, text, x, y, size) {
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const cellSize = size / moduleCount;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#000';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize + 0.5, cellSize + 0.5);
        }
      }
    }
  }

  // ============================================================================
  // Wire up DOM
  // ============================================================================
  function init() {
    $('prefix').addEventListener('input', updateReachability);
    $('caseInsensitive').addEventListener('change', updateReachability);
    $('start').addEventListener('click', start);
    $('stop').addEventListener('click', stop);
    updateReachability();
    updateStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

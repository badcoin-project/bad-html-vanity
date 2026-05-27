# BadCoin Vanity Address Generator

A single-file HTML tool that generates BadCoin addresses starting with characters you choose. Runs entirely in your browser. No keys ever leave your device.

## Open it

```
open BAD_Vanity_Generator.html
```

That is the whole installation. Double-click the file. Works in any modern browser (Chrome, Firefox, Safari, Edge). No build step, no dependencies, no server required.

For maximum security: download the file, disconnect from the internet, then open it. The page makes zero network calls at runtime.

## What it does

- Generates real BadCoin **P2SH-segwit addresses** (the kind that start with "B"). Matches the format produced by the BadCoin Core wallet and the BadCoin iOS wallet.
- Searches for a prefix you choose ("BANK", "BAD", "BERN", whatever fits in the Base58 alphabet).
- **Case-sensitive or case-insensitive matching** (checkbox). Insensitive is ~2x faster per letter.
- Shows honest difficulty estimate, live rate (keys/sec), elapsed time, and ETA.
- Rejects unreachable prefixes up front (anything starting with a non-"B" character, or containing 0, O, I, or l, which are excluded from Base58).
- Exports each match as a **PDF paper wallet** (address + public key + WIF, each with a QR code, BadCoin branding, security warnings) or a **PNG image** (same content).

## Technical details

- **secp256k1** via [`elliptic.js`](https://github.com/indutny/elliptic) (Bitcoin's signature curve). Pure JS, no WebCrypto needed.
- **SHA-256** via [`js-sha256`](https://github.com/emn178/js-sha256). Synchronous, fast in a loop.
- **RIPEMD-160** implemented inline (RFC reference implementation, ~100 lines).
- **Base58Check** implemented inline.
- **PDF** via [`jsPDF`](https://github.com/parallax/jsPDF).
- **QR codes** via [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator).
- All libraries inlined into a single 705 KB HTML file. No external script loads at runtime.
- **Content Security Policy** header restricts script sources to self + inline only.
- **Address derivation:** `priv → secp256k1 → pub → hash160 → [0x00, 0x14, hash160] → hash160 → [0x19] + hash160 → base58check`. The version byte `0x19` (25) produces "B..." addresses (BadCoin SCRIPT_ADDRESS).
- **WIF derivation:** `[0x50] + priv + [0x01] → base58check`. Version byte `0x50` (80) produces "C..." WIFs (BadCoin SECRET_KEY).

## Performance

On a typical 2024 laptop browser: ~2,500–3,500 keys/sec.

| Prefix length (after the "B") | Case-sensitive | Case-insensitive |
|---|---|---|
| 1 char (e.g. BA) | ~20 ms | ~10 ms |
| 2 chars (BAD) | ~1 sec | ~0.3 sec |
| 3 chars (BANK) | ~1 min | ~10 sec |
| 4 chars (BERN) | ~1 hour | ~5 min |
| 5 chars | ~2 days | ~3 hours |
| 6 chars | ~3 months | ~5 days |

The first character ("B") is always free because every BadCoin P2SH address starts with B.

## Security

This tool generates **private keys**. Treat that seriously.

- **The PDF/PNG export contains the secret WIF.** Anyone who sees it can spend any BAD sent to the corresponding address.
- **Store the exported file offline.** Print it. Put the paper in a safe. Or save to encrypted storage on a device that does not go online.
- **Test the address with a tiny amount before using it for real funds.** Send 1 BAD, confirm it arrives in your wallet when you import the WIF, then use the address for larger amounts.
- **Use a clean browser session** if possible. Browser extensions could in theory read DOM content. Best is to download the HTML, go offline, open it from disk.
- **Verify the file's integrity** if you got it from someone else. A tampered version could silently exfiltrate keys.
- **This page makes zero network calls** after initial load. You can verify by opening browser DevTools → Network panel and confirming no requests fire during a search.

If any of this matters to you and you cannot verify it yourself, do not use the tool.

## What's MVP (today) vs follow-up

**Today (v1.0):**
- Search with case-sensitive / insensitive toggle
- Honest difficulty + ETA + reachability check
- PDF + PNG export with QR codes
- BadCoin coin branding
- Single-file HTML (no external dependencies at runtime)
- Strict CSP

**Possible follow-up:**
- WebWorker for the search loop (currently runs on main thread with `setTimeout` yields; UI stays responsive but you can feel it on long searches)
- Support for additional address types (legacy P2PKH "C...", bech32 "bad1q...")
- Side-by-side ETA comparison (case-sensitive vs insensitive) at input time
- Custom QR colors / styling
- GitHub Pages publish for a sharable URL
- Multiple-position match (e.g. "address must contain BAD anywhere, not just at start")
- Better mobile responsive layout

## How to host on GitHub

Two complementary paths:

**1. GitHub Pages.** Push `BAD_Vanity_Generator.html` (renamed to `index.html` at the repo root, or kept as-is and linked directly) to `badcoin-project/bad-html-vanity`, enable Pages on the `main` branch, and the tool publishes at `https://badcoin-project.github.io/bad-html-vanity/`. Public URL anyone can share.

**2. Downloadable release.** Attach `BAD_Vanity_Generator.html` directly to a GitHub Release. Users download a single file and run it offline. More resilient against tampering or Pages outages.

Both can coexist. The download path is the more security-conscious one.

## Verifying the build

Quick sanity checks before trusting the tool:

1. Open DevTools → Network. Reload the page. Confirm zero requests fire (page is already loaded; no external resources fetch).
2. Enter prefix "BAD" and start a search. After a few seconds, an address starting with "BAD" should appear with a WIF starting with "C".
3. Take the generated WIF and import it into the BadCoin Core wallet or the BadCoin iOS wallet. The displayed address must match.
4. Send a tiny amount (1 BAD) to the address, then confirm it appears in the wallet's balance.

If any of those fail, the tool is broken — do not use it for real funds. Open an issue.

## License

MIT. The bundled libraries retain their original licenses (also MIT or BSD compatible).

## Provenance

Built for the BadCoin community by Tom Friend. Companion to the Vanity Address tab in the BadCoin Core wallet (`badcoin-project/badcoin`) and the iOS wallet (`badcoin-project/badcoin-mobile-wallet`).

Single-file HTML so you can save it, audit the source by `view-source:` or opening it in a text editor, and run it forever even if the GitHub repo disappears. The whole point is that the trust comes from the file itself, not from any remote server.

// =============================================================================
// SWGOH Roster Viewer — abilities-data.json generator (HTML-scrape edition)
// =============================================================================
// Run this in your browser's devtools Console while on https://swgoh.gg/
// (any page — uses same-origin fetches so the browser's Cloudflare clearance
// gets us through; standalone Node fails because Cloudflare fingerprints TLS).
//
// Why HTML-scrape: swgoh.gg's `/api/units/` returns ability *IDs* but no names
// or descriptions. Those only render server-side on `/characters/<slug>/` pages.
// We fetch each character page (162 KB ~), parse with DOMParser, pull the
// `.unit-ability__*` blocks, and emit one bundle file.
//
// FULL SCRAPE (default):
//   1. Open https://swgoh.gg/  (any page on that domain)
//   2. F12 → Console
//   3. Paste this entire file → Enter
//   4. Wait ~10-15 minutes (~400 ms per unit)
//   5. abilities-data.json downloads automatically
//   6. Drop it in the project root
//
// DELTA SCRAPE (new units only — much faster):
//   - The "Sync New Units" modal in the app generates a pre-filled version
//     of this script with SLUG_FILTER set to only the new unit slugs.
//   - Copy that script, paste it here, run it. Takes ~1-2 minutes.
//   - Results are POSTed directly to http://localhost:8765/save-abilities
//     (server must be running) AND downloaded as a fallback.
//
// Re-run whenever balance patches drop or new units arrive.
// =============================================================================

(async () => {
    // -------------------------------------------------------------------------
    // DELTA MODE — set to an array of slugs to scrape only specific units.
    // e.g. SLUG_FILTER = ['jar-jar-binks', 'chancellor-palpatine']
    // Leave as null to scrape all characters (full run).
    // -------------------------------------------------------------------------
    const SLUG_FILTER = null;

    // When running in delta mode and the server is running locally, POST the
    // result directly instead of (only) downloading.
    const SAVE_URL = 'http://localhost:8765/save-abilities';

    const THROTTLE_MS = 400;       // be polite — HTML pages are heavier than API JSON
    const FAIL_RETRY  = 1;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const isDelta = Array.isArray(SLUG_FILTER) && SLUG_FILTER.length > 0;
    console.log(`%c[swgoh-scrape] Starting ${isDelta ? `DELTA (${SLUG_FILTER.length} units)` : 'FULL'} scrape…`, 'color:#ffc107;font-weight:bold;');

    // 1. Get the canonical unit list.
    //    Full mode: fetch all characters from /api/characters/.
    //    Delta mode: build a minimal list from SLUG_FILTER (slug → fake entry).
    let characters;
    if (isDelta) {
        // We still need base_ids. Fetch the full list and filter to our slugs.
        try {
            const res = await fetch('/api/characters/');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const all = await res.json();
            const slugSet = new Set(SLUG_FILTER);
            const slugify = c => {
                const m = (c.url || '').match(/\/(units|characters)\/([^/]+)\//);
                return m ? m[2] : null;
            };
            characters = all.filter(c => slugSet.has(slugify(c)));
            // Any slugs not matched by the API — create stub entries so we still scrape them
            const foundSlugs = new Set(characters.map(c => slugify(c)));
            SLUG_FILTER.forEach(slug => {
                if (!foundSlugs.has(slug)) {
                    characters.push({ base_id: slug.toUpperCase().replace(/-/g, ''), url: `//swgoh.gg/characters/${slug}/`, name: slug });
                }
            });
            console.log(`[swgoh-scrape] Delta: matched ${characters.length}/${SLUG_FILTER.length} slugs in API`);
        } catch (e) {
            console.error('[swgoh-scrape] Failed to fetch /api/characters/:', e);
            return;
        }
    } else {
        try {
            const res = await fetch('/api/characters/');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            characters = await res.json();
            console.log(`[swgoh-scrape] Got ${characters.length} characters`);
        } catch (e) {
            console.error('[swgoh-scrape] Failed to fetch /api/characters/:', e);
            return;
        }
    }

    // 2. Material-icon → kind mapping
    const ICON_KIND = {
        'tex.skill_pentagon_gold.png':  'omega',
        'tex.skill_zeta.png':           'zeta',
        'tex.skill_hexagon_white.png':  'omicron',
    };

    const slugify = char => {
        if (char.url) {
            const m = char.url.match(/\/(units|characters)\/([^/]+)\//);
            if (m) return m[2];
        }
        return null;
    };

    function parseAbilityBlock(headerEl) {
        const panel = headerEl.closest('.panel') || headerEl.parentElement?.parentElement;
        const nameLink = headerEl.querySelector('.unit-ability__name a');
        const levelEl  = headerEl.querySelector('.unit-ability__ability-level');
        const aside    = headerEl.querySelector('.unit-ability__header-aside');
        const descEl   = panel ? panel.querySelector('.unit-ability__description') : null;

        const href = nameLink?.getAttribute('href') || '';
        const m = href.match(/\/units\/([^/]+)\/ability\/([^/]+)\/(\d+)/);
        const unit_base_id = m?.[1] || null;
        const ability_id   = m?.[2] || null;
        const tier_max     = m?.[3] ? parseInt(m[3]) : null;

        const prefixMatch = ability_id?.match(/^([a-z]+ability|leader[a-z]+|hardware[a-z]+|contract[a-z]+)/);
        let type = null;
        if (prefixMatch) {
            const p = prefixMatch[1];
            if (p.startsWith('basic'))    type = 'Basic';
            else if (p.startsWith('special'))  type = 'Special';
            else if (p.startsWith('ultimate')) type = 'Ultimate';
            else if (p.startsWith('leader'))   type = 'Leader';
            else if (p.startsWith('unique'))   type = 'Unique';
            else if (p.startsWith('hardware')) type = 'Hardware';
            else if (p.startsWith('contract')) type = 'Contract';
            else if (p.startsWith('granted'))  type = 'Granted';
        }

        const levelText = (levelEl?.textContent || '').replace(/\s+/g, ' ').trim();
        const cdMatch = levelText.match(/(\d+)\s*turn cooldown/i);
        const cooldown = cdMatch ? parseInt(cdMatch[1]) : null;

        let material = null;
        if (aside) {
            const img = aside.querySelector('img');
            const src = img?.getAttribute('src') || '';
            for (const [needle, kind] of Object.entries(ICON_KIND)) {
                if (src.includes(needle)) { material = kind; break; }
            }
        }

        const description = descEl ? descEl.textContent.trim().replace(/\s+/g, ' ') : null;

        return { unit_base_id, ability_id, tier_max, name: nameLink?.textContent.trim() || null, type, cooldown, material, description };
    }

    // 3. Iterate characters, scrape each page
    const units = {};
    const failures = [];
    let probedShape = false;

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const slug = slugify(char);
        const baseId = char.base_id;
        const label = `[${(i + 1).toString().padStart(3)}/${characters.length}] ${baseId}`;

        if (!slug) {
            console.warn(`${label} — no slug (url=${char.url}); skipping`);
            failures.push({ baseId, error: 'no slug' });
            continue;
        }

        let abilities = null;
        for (let attempt = 0; attempt <= FAIL_RETRY; attempt++) {
            try {
                const res = await fetch(`/characters/${slug}/`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const html = await res.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const headers = doc.querySelectorAll('.unit-ability__header');
                if (!headers.length) throw new Error('no ability headers in page');

                abilities = Array.from(headers).map(parseAbilityBlock);

                if (!probedShape) {
                    console.log('[swgoh-scrape] First-unit shape sample:', abilities[0]);
                    probedShape = true;
                }
                break;
            } catch (e) {
                if (attempt < FAIL_RETRY) {
                    await sleep(1500);
                } else {
                    console.warn(`${label} — failed: ${e.message}`);
                    failures.push({ baseId, slug, error: e.message });
                }
            }
        }

        if (abilities) {
            units[baseId] = { name: char.name, slug, abilities };
        }

        if ((i + 1) % 20 === 0 || i === characters.length - 1) {
            console.log(`${label} — progress ${Object.keys(units).length}/${i + 1} ok, ${failures.length} failed`);
        }

        await sleep(THROTTLE_MS);
    }

    // 4. Assemble the bundle
    const bundle = {
        _meta: {
            schema_version: 1,
            source: 'html-scrape',
            generated_at: new Date().toISOString(),
            unit_count: Object.keys(units).length,
            failure_count: failures.length,
            failure_list: failures,
        },
        units,
    };

    const json = JSON.stringify(bundle, null, 2);

    // 5a. In delta mode — POST to the local server to merge into abilities-data.json
    if (isDelta) {
        try {
            const saveRes = await fetch(SAVE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ units }),
            });
            const saveJson = await saveRes.json();
            if (saveJson.ok) {
                console.log(`%c[swgoh-scrape] ✓ Saved to server — ${saveJson.total} total units in abilities-data.json (${saveJson.added} merged).`,
                            'color:#28a745;font-weight:bold;');
            } else {
                console.warn('[swgoh-scrape] Server save failed:', saveJson.error, '— downloading as fallback');
                triggerDownload(json);
            }
        } catch (e) {
            console.warn('[swgoh-scrape] Could not POST to server (is it running?):', e.message, '— downloading as fallback');
            triggerDownload(json);
        }
    } else {
        // 5b. Full scrape — download as before
        triggerDownload(json);
    }

    function triggerDownload(content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = isDelta ? 'abilities-delta.json' : 'abilities-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    console.log(`%c[swgoh-scrape] Done. ${Object.keys(units).length}/${characters.length} units scraped, ${failures.length} failures.`,
                'color:#28a745;font-weight:bold;');
    if (failures.length) console.log('[swgoh-scrape] Failures:', failures);
    if (!isDelta) console.log('[swgoh-scrape] Drop abilities-data.json in the project root.');
})();

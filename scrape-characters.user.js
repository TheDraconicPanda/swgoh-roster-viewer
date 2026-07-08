// =============================================================================
// SWGOH Roster Viewer — characters-data.json updater
// =============================================================================
// Run this in your browser's devtools Console while on https://swgoh.gg/
// (any page on that domain — uses same-origin fetch to bypass Cloudflare).
//
// Steps:
//   1. Open https://swgoh.gg/ in a tab
//   2. F12 → Console
//   3. Paste this entire script → Enter
//   4. A characters-data.json file will be downloaded automatically
//   5. Replace the existing characters-data.json in the project folder
//   6. Commit and push to update GitHub Pages
//
// Run whenever new units are released to keep characters-data.json current.
// =============================================================================

(async () => {
    const SAVE_URL = 'http://localhost:8765/save-characters';

    console.log('%c[swgoh-chars] Fetching /api/characters/…', 'color:#ffc107;font-weight:bold;');

    let characters;
    try {
        const res = await fetch('/api/characters/');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        characters = await res.json();
        console.log(`[swgoh-chars] Got ${characters.length} characters`);
    } catch (e) {
        console.error('[swgoh-chars] Fetch failed:', e);
        return;
    }

    try {
        const res = await fetch(SAVE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(characters),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        console.log(`%c[swgoh-chars] ✓ Saved — ${json.total} total units in characters-data.json (${json.added} new/updated).`,
                    'color:#28a745;font-weight:bold;');
    } catch (e) {
        console.warn('[swgoh-chars] Could not POST to server:', e.message, '— downloading characters-data.json');
        const blob = new Blob([JSON.stringify(characters, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'characters-data.json';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        console.log('%c[swgoh-chars] ✓ Download started — replace characters-data.json in your project folder and commit.',
                    'color:#28a745;font-weight:bold;');
    }
})();

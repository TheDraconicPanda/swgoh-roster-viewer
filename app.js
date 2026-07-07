// Global state
let allCharacters = [];
let allShips = [];
let playerData = null;
let availableTags = [];
let gearMap = {};  // base_id -> gear definition (name, image, mark, required_level, ...)
let abilitiesMap = {};  // base_id -> { name, slug, abilities: [{ability_id, name, description, type, material, cooldown, tier_max}] }

// Keyword index — built from `ability_classes` on the characters-data bundle
// (the same field swgoh.gg uses for its ?ac= filter). Slug = canonical key
// (lowercased, spaces-to-underscores). Each entry has the original label and
// the full list of base_ids that have that keyword, with owned flag.
//   { 'gain_turn_meter': { label: 'Gain Turn Meter', units: [{base_id, name, owned}] } }
let keywordsIndex = {};
let journeyData = [];
let journeyOrder = [];   // persisted slug order for drag-to-reorder
let baseCharMap = {};    // base_id -> full character definition (all game units, including unowned)
// Pre-compiled regex for fast highlighting in descriptions. Built once from
// keywordsIndex labels, sorted longest-first so "Healing Immunity" wins over
// "Heal", with word boundaries so "Heal" doesn't match "Health".
let keywordRegex = null;
let keywordLabelToSlug = {};   // 'Gain Turn Meter' -> 'gain_turn_meter'
const RUN_TOGETHER_FIX_RE = /([a-z])([A-Z][A-Za-z][A-Za-z\-'\s]{0,40}?:\s+[A-Z\-+])/g;
const STATUS_NAME_RE = /(?:^|[.!?)]\s*)([A-Z][A-Za-z][A-Za-z\-'\s]{0,40}?):\s+(?=[A-Z\-+])/g;
const CDN      = 'https://game-assets.swgoh.gg/textures/';
const WIKI_SHIP = 'https://swgoh.wiki/images/thumb/';
const ICON_ZETA     = `<img src="icons/zeta.png"     alt="Zeta"     class="ability-icon-img">`;
const ICON_OMEGA    = `<img src="icons/omega.png"    alt="Omega"    class="ability-icon-img">`;
const ICON_OMICRON  = `<img src="icons/omicron.png"  alt="Omicron"  class="ability-icon-img">`;
const ICON_ULTIMATE = `<img src="icons/ultimate.png" alt="Ultimate" class="ability-icon-img">`;
const SHIP_IMAGE_MAP = {
    // Capital ships
    CAPITALLEVIATHAN:     CDN  + 'tex.charui_leviathan.png',
    CAPITALPROFUNDITY:    CDN  + 'tex.charui_profundity.png',
    CAPITALEXECUTOR:      CDN  + 'tex.charui_executor.png',
    CAPITALNEGOTIATOR:    CDN  + 'tex.charui_negotiator.png',
    CAPITALFINALIZER:     CDN  + 'tex.charui_finalizer.png',
    CAPITALRADDUS:        CDN  + 'tex.charui_raddus.png',
    CAPITALCHIMAERA:      CDN  + 'tex.charui_chimaera.png',
    CAPITALSTARDESTROYER: CDN  + 'tex.charui_stardestroyer.png',
    CAPITALMONCALAMARICRUISER: WIKI_SHIP + 'd/db/Unit-Ship-Home_One-portrait.png/107px-Unit-Ship-Home_One-portrait.png',
    CAPITALJEDICRUISER:   WIKI_SHIP + '1/1d/Unit-Ship-Endurance-portrait.png/107px-Unit-Ship-Endurance-portrait.png',
    // Millennium Falcons
    MILLENNIUMFALCON:     WIKI_SHIP + "2/29/Unit-Ship-Han%27s_Millennium_Falcon-portrait.png/107px-Unit-Ship-Han%27s_Millennium_Falcon-portrait.png",
    MILLENNIUMFALCONPRISTINE: WIKI_SHIP + "e/e1/Unit-Ship-Lando%27s_Millennium_Falcon-portrait.png/107px-Unit-Ship-Lando%27s_Millennium_Falcon-portrait.png",
    MILLENNIUMFALCONEP7:  WIKI_SHIP + "1/1d/Unit-Ship-Rey%27s_Millennium_Falcon-portrait.png/107px-Unit-Ship-Rey%27s_Millennium_Falcon-portrait.png",
    // CDN hits — base_id lowercased
    FIRSTORDERTIEECHELON: CDN  + 'tex.charui_firstordertieechelon.png',
    SITHINFILTRATOR:      CDN  + 'tex.charui_sithinfiltrator.png',
    HOUNDSTOOTH:          CDN  + 'tex.charui_houndstooth.png',
    XANADUBLOOD:          CDN  + 'tex.charui_xanadublood.png',
    TIEADVANCED:          CDN  + 'tex.charui_tieadvanced.png',
    RAZORCREST:           CDN  + 'tex.charui_razorcrest.png',
    VULTUREDROID:         CDN  + 'tex.charui_vulturedroid.png',
    BWINGREBEL:           CDN  + 'tex.charui_bwingrebel.png',
    TIEDAGGER:            CDN  + 'tex.charui_tiedagger.png',
    PHANTOM2:             CDN  + 'tex.charui_phantom2.png',
    TIEREAPER:            CDN  + 'tex.charui_tiereaper.png',
    HYENABOMBER:          CDN  + 'tex.charui_hyenabomber.png',
    TIEDEFENDER:          CDN  + 'tex.charui_tiedefender.png',
    FURYCLASSINTERCEPTOR: CDN  + 'tex.charui_furyclassinterceptor.png',
    SLAVE1:               CDN  + 'tex.charui_slave1.png',
    PUNISHINGONE:         CDN  + 'tex.charui_punishingone.png',
    SITHFIGHTER:          CDN  + 'tex.charui_sithfighter.png',
    SITHSUPREMACYCLASS:   CDN  + 'tex.charui_sithsupremacyclass.png',
    RAVENSCLAW:           CDN  + 'tex.charui_ravensclaw.png',
    MARAUDER:             CDN  + 'tex.charui_marauder.png',
    IG2000:               CDN  + 'tex.charui_ig2000.png',
    ROGUEONESHIP:         CDN  + 'tex.charui_rogueoneship.png',
    GHOST:                CDN  + 'tex.charui_ghost.png',
    EBONHAWK:             CDN  + 'tex.charui_ebonhawk.png',
    OUTRIDER:             CDN  + 'tex.charui_outrider.png',
    SCYTHE:               CDN  + 'tex.charui_scythe.png',
    // CDN hits — alternate texture names
    YWINGREBEL:           CDN  + 'tex.charui_ywing.png',
    YWINGCLONEWARS:       CDN  + 'tex.charui_ywing_btlb.png',
    TIEBOMBERIMPERIAL:    CDN  + 'tex.charui_tiebomber.png',
    TIEFIGHTERIMPERIAL:   CDN  + 'tex.charui_tiefighter.png',
    TIESILENCER:          CDN  + 'tex.charui_tie_silencer.png',
    GAUNTLETSTARFIGHTER:  CDN  + 'tex.charui_gauntlet.png',
    IMPERIALSHUTTLE:      CDN  + 'tex.charui_imperialshuttle.png',
    EMPERORSSHUTTLE:      CDN  + 'tex.charui_imperialshuttle.png',
    BLADEOFDORIN:         CDN  + 'tex.charui_plokoon.png',
    GEONOSIANSTARFIGHTER1: CDN + 'tex.charui_geonosian_sunfac.png',
    GEONOSIANSTARFIGHTER2: CDN + 'tex.charui_geonosian_soldier.png',
    GEONOSIANSTARFIGHTER3: CDN + 'tex.charui_geonosian_spy.png',
    UWINGSCARIF:          CDN  + 'tex.charui_uwing.png',
    ARC170REX:            CDN  + 'tex.charui_arc170.png',
    XWINGRED2:            CDN  + 'tex.charui_xwing_red2.png',
    XWINGRED3:            CDN  + 'tex.charui_xwing_red3.png',
    XWINGBLACKONE:        CDN  + 'tex.charui_xwing_blackone.png',
    XWINGRESISTANCE:      CDN  + 'tex.charui_xwing_resistance.png',
    // Wiki thumbnails — CDN texture name unknown
    TIEFIGHTERFIRSTORDER: WIKI_SHIP + '6/6f/Unit-Ship-First_Order_TIE_Fighter-portrait.png/107px-Unit-Ship-First_Order_TIE_Fighter-portrait.png',
    TIEFIGHTERFOSF:       WIKI_SHIP + '7/7c/Unit-Ship-First_Order_SF_TIE_Fighter-portrait.png/107px-Unit-Ship-First_Order_SF_TIE_Fighter-portrait.png',
    UMBARANSTARFIGHTER:   WIKI_SHIP + 'c/c8/Unit-Ship-Umbaran_Starfighter-portrait.png/107px-Unit-Ship-Umbaran_Starfighter-portrait.png',
    COMMANDSHUTTLE:       WIKI_SHIP + "2/2e/Unit-Ship-Kylo_Ren%27s_Command_Shuttle-portrait.png/107px-Unit-Ship-Kylo_Ren%27s_Command_Shuttle-portrait.png",
    JEDISTARFIGHTERANAKIN: WIKI_SHIP + "3/36/Unit-Ship-Anakin%27s_Eta-2_Starfighter-portrait.png/107px-Unit-Ship-Anakin%27s_Eta-2_Starfighter-portrait.png",
    JEDISTARFIGHTERCONSULAR: WIKI_SHIP + "0/07/Unit-Ship-Jedi_Consular%27s_Starfighter-portrait.png/107px-Unit-Ship-Jedi_Consular%27s_Starfighter-portrait.png",
    JEDISTARFIGHTERAHSOKATANO: WIKI_SHIP + '5/5a/Unit-Ship-Ahsoka_Tano%27s_Jedi_Starfighter-portrait.png/107px-Unit-Ship-Ahsoka_Tano%27s_Jedi_Starfighter-portrait.png',
    SITHBOMBER:           WIKI_SHIP + '5/56/Unit-Ship-B-28_Extinction-class_Bomber-portrait.png/107px-Unit-Ship-B-28_Extinction-class_Bomber-portrait.png',
    UWINGROGUEONE:        WIKI_SHIP + "f/ff/Unit-Ship-Cassian%27s_U-wing-portrait.png/107px-Unit-Ship-Cassian%27s_U-wing-portrait.png",
    ARC170CLONESERGEANT:  WIKI_SHIP + "e/ec/Unit-Ship-Clone_Sergeant%27s_ARC-170-portrait.png/107px-Unit-Ship-Clone_Sergeant%27s_ARC-170-portrait.png",
    BLADEOFDORIN:         WIKI_SHIP + "1/1a/Unit-Ship-Plo_Koon%27s_Jedi_Starfighter-portrait.png/107px-Unit-Ship-Plo_Koon%27s_Jedi_Starfighter-portrait.png",
};

// Status index — built from in-description callouts (the "Blight: ..." pattern
// extracted via splitDescriptionForCallouts). Each entry has the canonical
// status name + a list of every {unit, ability, definition} occurrence.
// Mode modifiers ("While in <X>:") are excluded — they live in the per-unit
// omicron callouts already. Classification:
//   'shared'        — name appears on 2+ abilities (across any units)
//   'unit_specific' — name appears on exactly 1 ability
//   { 'blight': { name: 'Blight', slug: 'blight', classification, occurrences: [{base_id, unit_name, ability_name, definition, image, owned}] } }
let statusIndex = {};
// required_at map — base_id → highest requirement label across all journey events.
// Priority: Relic (R#) > Gear (G#) > Stars (#★). Built from journeyData after load.
let requiredAtMap = {};   // base_id -> e.g. "R7", "G13", "7★"

// View mode for the Characters tab
let charViewMode = 'all';  // 'all' | 'factions'
let charSortMode = 'alpha-asc';  // 'alpha-asc' | 'alpha-desc' | 'gp-desc' | 'gp-asc'

// Teams / Fleet / Farms data
let farmsData = [];
let relicMaterials = [];  // loaded from relic-materials-data.json

// DOM elements
const fetchBtn = document.getElementById('fetchBtn');
const allyCodeInput = document.getElementById('allyCode');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const playerInfoDiv = document.getElementById('playerInfoLeft');
const filterSection = document.getElementById('filterSection');
const tabsDiv = document.getElementById('tabs');
const searchInput = document.getElementById('searchInput');
const rarityFilter = document.getElementById('rarityFilter');
const gearFilter = document.getElementById('gearFilter');
const relicFilter = document.getElementById('relicFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const unitModal = document.getElementById('unitModal');
const modalContent = document.getElementById('modalContent');

// Event listeners
fetchBtn.addEventListener('click', fetchRoster);
allyCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchRoster();
});

// Restore ally code and auto-fetch if we came from a cache clear
const savedAllyCode = localStorage.getItem('swgoh_saved_ally_code');
if (savedAllyCode) {
    allyCodeInput.value = savedAllyCode;
    fetchRoster();
} else {
    switchTab('manage');
}

// Show cache status on load
updateCacheStatus();

// Modal close handlers
document.getElementById('modalClose').addEventListener('click', closeModal);
unitModal.addEventListener('click', (e) => { if (e.target === unitModal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        switchTab(tabName);
    });
});

// Filter listeners
searchInput.addEventListener('input', applyFilters);
rarityFilter.addEventListener('change', applyFilters);
gearFilter.addEventListener('change', applyFilters);
relicFilter.addEventListener('change', applyFilters);
clearFiltersBtn.addEventListener('click', clearAllFilters);

// Tag filter dropdown toggle
const tagFilterBtn   = document.getElementById('tagFilterBtn');
const tagFilterPanel = document.getElementById('tagFilterPanel');
const tagFilterWrap  = document.getElementById('tagFilterWrap');
tagFilterBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = tagFilterPanel.style.display !== 'none';
    tagFilterPanel.style.display = open ? 'none' : 'block';
});
document.addEventListener('click', (e) => {
    if (tagFilterWrap && !tagFilterWrap.contains(e.target)) {
        tagFilterPanel.style.display = 'none';
    }
});

// Character view toggle: All / By Faction
document.querySelectorAll('.char-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        charViewMode = btn.dataset.view;
        document.querySelectorAll('.char-view-btn').forEach(b => b.classList.toggle('active', b === btn));
        applyFilters();
    });
});

// Character sort selector
document.getElementById('charSortSelect')?.addEventListener('change', e => {
    charSortMode = e.target.value;
    applyFilters();
});

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === tabName);
    });

    // Show/hide filters depending on tab.
    //   Characters: gear/relic/tag/rarity all visible.
    //   Ships:      rarity only.
    //   Keywords:   search box only.
    //   Status:     search box only.
    if (tabName === 'characters') {
        rarityFilter.style.display = 'block';
        gearFilter.style.display = 'block';
        relicFilter.style.display = 'block';
        if (tagFilterWrap) tagFilterWrap.style.display = 'block';
    } else if (tabName === 'ships') {
        rarityFilter.style.display = 'block';
        gearFilter.style.display = 'none';
        relicFilter.style.display = 'none';
        if (tagFilterWrap) tagFilterWrap.style.display = 'none';
    } else { // farms, keywords, statuses, journeyguide, manage
        rarityFilter.style.display = 'none';
        gearFilter.style.display = 'none';
        relicFilter.style.display = 'none';
        if (tagFilterWrap) tagFilterWrap.style.display = 'none';
    }

    // Apply filters when switching tabs
    applyFilters();
}

// Generic loader: localStorage cache (1 week) → API → expired cache → bundled local file.
// Used for /api/characters/ and /api/gear/ (array-shaped, live API) and the
// abilities bundle (object-shaped, no API — scraped locally).
// `apiUrl` is optional; pass null to skip the API step entirely.
async function loadCachedDataset({ cacheKey, apiUrl, localFile, label, emptyValue = [] }) {
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const cached = localStorage.getItem(cacheKey);
    const stamp = localStorage.getItem(`${cacheKey}_timestamp`);
    const fresh = cached && stamp && (Date.now() - parseInt(stamp)) < ONE_WEEK;
    const sizeOf = d => Array.isArray(d) ? d.length : (d && typeof d === 'object' ? Object.keys(d.units || d).length : 0);

    if (fresh) {
        console.log(`✓ ${label}: loading from cache`);
        return JSON.parse(cached);
    }

    if (apiUrl) {
        console.log(`✓ ${label}: fetching fresh from API`);
        try {
            const res = await fetch(apiUrl);
            if (res.ok) {
                const data = await res.json();
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                    localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
                } catch (e) {
                    console.warn(`Could not cache ${label}:`, e);
                }
                console.log(`✓ ${label}: loaded ${sizeOf(data)} entries from API`);
                return data;
            }
            console.warn(`${label}: API returned ${res.status}`);
        } catch (e) {
            console.warn(`${label}: API fetch failed`, e);
        }
    }

    if (cached) {
        console.log(`⚠ ${label}: using expired cache`);
        return JSON.parse(cached);
    }

    try {
        console.log(`${apiUrl ? '⚠ ' : '✓ '}${label}: loading bundled file ${localFile}`);
        const res = await fetch(localFile);
        if (res.ok) {
            const data = await res.json();
            // Only cache datasets that have an API source. Local-only bundled files
            // (apiUrl === null) change with code deploys and should always be read fresh.
            if (apiUrl) {
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                    localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
                } catch (e) { /* over-quota: just skip caching */ }
            }
            console.log(`✓ ${label}: loaded ${sizeOf(data)} entries from local file`);
            return data;
        }
    } catch (e) {
        console.error(`${label}: local file fallback failed`, e);
    }

    return emptyValue;
}

async function fetchRoster() {
    const allyCode = allyCodeInput.value.trim().replace(/-/g, '');

    if (!allyCode || allyCode.length < 9) {
        showError('Please enter a valid ally code');
        return;
    }

    localStorage.setItem('swgoh_saved_ally_code', allyCode);

    // Clear all cached data so every fetch starts fresh (preserve user preferences)
    const PRESERVE_KEYS = new Set(['swgoh_saved_ally_code']);
    Object.keys(localStorage)
        .filter(k => k.startsWith('swgoh_') && !PRESERVE_KEYS.has(k))
        .forEach(k => localStorage.removeItem(k));

    // Show loading
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    filterSection.style.display = 'none';

    try {
        // Fetch player data first
        const playerResponse = await fetch(`https://swgoh.gg/api/player/${allyCode}/`);

        if (!playerResponse.ok) {
            throw new Error(`Failed to fetch player data: ${playerResponse.status} ${playerResponse.statusText}`);
        }

        const data = await playerResponse.json();

        // Load base character data (for categories, alignment, role, image, etc.)
        // Same cache chain as gear: localStorage → API → expired cache → bundled file.
        const baseCharacters = await loadCachedDataset({
            cacheKey: 'swgoh_character_data_v2',
            apiUrl: 'https://swgoh.gg/api/characters/',
            localFile: 'characters-data.json',
            label: 'Character definitions',
        });

        // Create a lookup map for base character data (assign to global for journey guide access)
        baseCharMap = {};
        baseCharacters.forEach(char => {
            baseCharMap[char.base_id] = char;
        });

        // Always patch baseCharMap with the bundled file to fill gaps the API/cache may omit.
        // Uncommon units (Gamorrean Guard, ARC Trooper, 0-0-0, etc.) may not appear in the
        // swgoh.gg API response but are present in the bundled characters-data.json.
        // We never overwrite existing entries — API data wins if present.
        try {
            const res = await fetch('characters-data.json');
            if (res.ok) {
                const bundled = await res.json();
                bundled.forEach(char => {
                    if (!baseCharMap[char.base_id]) baseCharMap[char.base_id] = char;
                });
            }
        } catch (e) { /* bundled patch failed — portrait fallback will show ? */ }

        // Load gear definitions (icons, names) — same cache chain as characters
        try {
            const gearData = await loadCachedDataset({
                cacheKey: 'swgoh_gear_data',
                apiUrl: 'https://swgoh.gg/api/gear/',
                localFile: 'gear-data.json',
                label: 'Gear definitions',
            });
            gearMap = {};
            gearData.forEach(g => { gearMap[g.base_id] = g; });
            console.log(`✓ Built gear map with ${Object.keys(gearMap).length} entries`);
        } catch (e) {
            console.error('Failed to load gear definitions:', e);
            gearMap = {};
        }

        // Load abilities bundle — locally scraped (no live API), object-shaped {_meta, units}.
        // Cache + bundled-file fallback only. Re-run scrape-abilities.user.js to refresh.
        try {
            const abilitiesBundle = await loadCachedDataset({
                cacheKey: 'swgoh_abilities_data',
                apiUrl: null,                       // no live API — bundle-only
                localFile: 'abilities-data.json',
                label: 'Abilities',
                emptyValue: { _meta: {}, units: {} },
            });
            abilitiesMap = abilitiesBundle.units || {};
            console.log(`✓ Built abilities map with ${Object.keys(abilitiesMap).length} units`);
        } catch (e) {
            console.error('Failed to load abilities bundle:', e);
            abilitiesMap = {};
        }

        // Load journey guide data — static file, never changes.
        try {
            journeyData = await loadCachedDataset({
                cacheKey: 'swgoh_journey_data_v4',
                apiUrl: null,
                localFile: 'journey-data.json',
                label: 'Journey Guide',
                emptyValue: [],
            });
            console.log(`✓ Loaded ${journeyData.length} journey events`);
        } catch (e) {
            console.error('Failed to load journey data:', e);
            journeyData = [];
        }

        // Store data
        playerData = data.data;

        // Separate characters and ships, and merge with base data
        allCharacters = data.units
            .filter(u => u.data.combat_type === 1)
            .map(u => {
                // Merge definition data from base character data
                const baseChar = baseCharMap[u.data.base_id];
                if (baseChar) {
                    u.data.categories = baseChar.categories || [];
                    u.data.alignment = baseChar.alignment;
                    u.data.role = baseChar.role;
                    u.data.image = baseChar.image;
                    u.data.description = baseChar.description;
                    u.data.gear_levels = baseChar.gear_levels;
                    u.data.ability_classes = baseChar.ability_classes;
                    u.data.activate_shard_count = baseChar.activate_shard_count;
                    u.data.url = baseChar.url;
                } else {
                    u.data.categories = [];
                }
                return u;
            })
            .sort((a, b) => a.data.name.localeCompare(b.data.name));

        console.log(`✓ Processed ${allCharacters.length} characters`);

        // Count characters with categories
        const withCategories = allCharacters.filter(c => c.data.categories && c.data.categories.length > 0).length;
        console.log(`✓ ${withCategories} characters have categories`);
        if (withCategories === 0) {
            console.warn('⚠ No categories loaded - tag filter will be empty');
        }

        // Sanity check: are any of the player's characters missing from the abilities
        // bundle? Happens when new units release after the last scrape — those units
        // fall back to player-payload-only rendering (no descriptions). One-line
        // warning so the user knows to re-run scrape-abilities.user.js.
        if (Object.keys(abilitiesMap).length > 0) {
            const missing = allCharacters
                .filter(c => !abilitiesMap[c.data.base_id])
                .map(c => c.data.base_id);
            if (missing.length > 0) {
                console.warn(
                    `⚠ ${missing.length} of your units are missing from the abilities bundle ` +
                    `(${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}). ` +
                    `Re-run scrape-abilities.user.js on swgoh.gg to refresh.`
                );
            } else {
                console.log(`✓ All ${allCharacters.length} of your units have ability data in the bundle`);
            }
        }

        // Build the keyword index from the full bundled-character list (not just
        // owned). Same data swgoh.gg uses for its /characters/?ac=<slug> filter.
        // Owned flag tells the renderer which rows are clickable.
        buildKeywordsIndex(baseCharacters, allCharacters);

        // Build the status index by walking every ability description's callouts
        // (the "Blight: ..." pattern). Independent of keywords — different shape
        // (per-unit definitions) and source (description prose, not curated tags).
        buildStatusIndex(abilitiesMap, allCharacters, baseCharMap);

        // Build required_at lookup: highest journey requirement per base_id.
        buildRequiredAtMap(journeyData);

        // Load farms data from localStorage
        try {
            const stored = localStorage.getItem('swgoh_farms_data');
            farmsData = stored ? JSON.parse(stored) : await loadCachedDataset({ cacheKey: 'swgoh_farms_data', apiUrl: null, localFile: 'farms-data.json', label: 'Farms', emptyValue: [] });
        } catch (e) {
            console.error('Failed to load farms:', e);
        }

        // Load relic materials table (static reference data, never cached)
        try {
            const rmRes = await fetch('relic-materials-data.json');
            const rmJson = await rmRes.json();
            relicMaterials = rmJson.materials || [];
        } catch (e) {
            console.error('Failed to load relic materials:', e);
        }

        allShips = data.units
            .filter(u => u.data.combat_type === 2)
            .sort((a, b) => b.data.power - a.data.power);

        // Display player info
        displayPlayerInfo();

        // Populate tag filters
        populateTagFilters();

        // Display rosters
        displayCharacters(allCharacters);
        displayShips(allShips);
        displayKeywords(Object.entries(keywordsIndex).sort((a, b) => a[1].label.localeCompare(b[1].label)));
        displayStatuses(Object.entries(statusIndex));
        displayJourneyGuide(journeyData);
        displayFarms(farmsData);

        // Show UI elements
        loadingDiv.style.display = 'none';
        filterSection.style.display = 'block';
        if (window.innerWidth <= 480) {
            document.getElementById('filterCollapsible').removeAttribute('open');
        }
        switchTab('farms');

    } catch (error) {
        console.error('Error fetching roster:', error);
        showError(`Error: ${error.message}. Make sure the ally code is correct and the player profile is public.`);
        loadingDiv.style.display = 'none';
    }
}

function displayPlayerInfo() {
    document.getElementById('playerName').textContent = playerData.name;
    document.getElementById('playerGP').textContent = `⚡ ${playerData.galactic_power.toLocaleString()} GP`;
    document.getElementById('playerGuild').textContent = `🛡️ ${playerData.guild_name}`;
    document.getElementById('playerLeague').textContent = `🏆 ${playerData.league_name} Division ${playerData.division_number}`;
}

function displayCharacters(characters) {
    const characterList = document.getElementById('characterList');
    const characterStats = document.getElementById('characterStats');

    if (characters.length === 0) {
        characterList.innerHTML = '<p class="placeholder">No characters match your filters</p>';
        characterStats.innerHTML = '';
        return;
    }

    const ownedIds = new Set(allCharacters.map(c => c.data.base_id));
    const owned    = characters.filter(c => ownedIds.has(c.base_id || c.data?.base_id));
    const sevenStar = allCharacters.filter(c => c.data.rarity === 7).length;
    const g13       = allCharacters.filter(c => c.data.gear_level === 13).length;
    const reliced   = allCharacters.filter(c => (c.data.relic_tier || 0) > 2).length;

    characterStats.innerHTML = `
        <strong>Characters:</strong> ${owned.length} owned of ${characters.length} shown |
        ${sevenStar} at 7★ |
        ${g13} at G13 |
        ${reliced} Reliced
    `;

    if (charViewMode === 'factions') {
        characterList.classList.add('char-faction-mode');
        displayCharactersByFaction(characters, characterList);
    } else {
        characterList.classList.remove('char-faction-mode');
        characterList.innerHTML = characters.map(c => renderCharCard(c)).join('');
    }
}

// Categories that are role/meta labels, not real factions
const FACTION_EXCLUDE = new Set([
    'Leader', 'Galactic Legend', 'Fleet Commander',
    'Attacker', 'Tank', 'Support', 'Healer',
    'Order 66 Raid',
]);

function displayCharactersByFaction(characters, container) {
    const factionMap = {};
    characters.forEach(char => {
        const cats = char.data?.categories || char.categories || [];
        const factions = cats.filter(t => !FACTION_EXCLUDE.has(t));
        factions.forEach(faction => {
            if (!factionMap[faction]) factionMap[faction] = [];
            factionMap[faction].push(char);
        });
    });

    const sorted = Object.keys(factionMap).sort((a, b) => a.localeCompare(b));

    if (sorted.length === 0) {
        container.innerHTML = '<p class="placeholder">No faction data available — fetch roster first</p>';
        return;
    }

    container.innerHTML = sorted.map(faction => {
        const chars = factionMap[faction];
        const cards = chars.map(c => renderCharCard(c)).join('');
        return `
            <details class="char-faction-section">
                <summary class="char-faction-header">
                    <span class="char-faction-name">${escapeHtml(faction)}</span>
                    <span class="char-faction-count">${chars.length} unit${chars.length !== 1 ? 's' : ''}</span>
                </summary>
                <div class="char-faction-body char-card-grid">
                    ${cards}
                </div>
            </details>`;
    }).join('');
}

// renderCharCard accepts both owned-roster entries (with .data wrapper) and
// plain baseCharMap definitions. Unowned chars are greyed + locked.
function renderCharCard(char) {
    // Normalise: owned units have char.data; baseCharMap entries are flat
    const isOwned = !!(char.data);
    const d       = isOwned ? char.data : char;

    const relic = d.relic_tier || 0;
    const relicDisplay = relic > 2 ? relic - 2 : 0;

    const alignClass =
        d.alignment === 'Dark Side'  ? 'align-dark'  :
        d.alignment === 'Light Side' ? 'align-light' :
        'align-neutral';

    const portrait = d.image
        ? `<img class="char-card-portrait" src="${d.image}" alt="" loading="lazy">`
        : `<div class="char-card-portrait char-card-portrait-placeholder">${escapeHtml((d.name || '?')[0])}</div>`;

    // req-at: highest requirement + count if appears in multiple journeys
    const reqEntries = requiredAtMap[d.base_id];
    let reqBadge = '';
    if (reqEntries && reqEntries.length > 0) {
        const top = reqEntries[0];
        const count = reqEntries.length;
        const thumb = top.rewardImage
            ? `<img src="${escapeHtml(top.rewardImage)}" alt="" class="req-at-thumb" loading="lazy">`
            : '';
        const countBubble = count > 1 ? `<span class="req-at-count">×${count}</span>` : '';
        const slugsAttr = `data-req-base-id="${escapeHtml(d.base_id)}"`;
        reqBadge = `<button class="char-card-badge req-at" ${slugsAttr} title="${escapeHtml(top.rewardName)}${count > 1 ? ` +${count - 1} more` : ''}">${escapeHtml(top.label)}${thumb}${countBubble}</button>`;
    }

    // Faction/category tags as clickable filter buttons
    const cats = d.categories || [];
    const tagButtons = cats.slice(0, 5).map(t =>
        `<button class="char-tag-btn" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
    ).join('');

    const lockedOverlay = isOwned ? '' : `<div class="char-card-locked"><span class="char-card-lock-icon">🔒</span></div>`;

    return `
        <div class="char-card${isOwned ? '' : ' char-card-unowned'}" data-type="character" data-base-id="${escapeHtml(d.base_id)}">
            ${lockedOverlay}
            <div class="char-card-header ${alignClass}">
                ${portrait}
                <div class="char-card-name">${escapeHtml(d.name)}</div>
            </div>
            <div class="char-card-body">
                <div class="char-card-stats">
                    ${isOwned ? `<span class="char-card-badge stars">${d.rarity}★</span>` : ''}
                    ${isOwned ? `<span class="char-card-badge gear">G${d.gear_level}</span>` : ''}
                    ${isOwned ? `<span class="char-card-badge relic">R${relicDisplay}</span>` : ''}
                    ${reqBadge}
                </div>
                ${tagButtons ? `<div class="char-card-tags">${tagButtons}</div>` : ''}
            </div>
        </div>`;
}

function displayShips(ships) {
    const shipList = document.getElementById('shipList');
    const shipStats = document.getElementById('shipStats');

    if (ships.length === 0) {
        shipList.innerHTML = '<p class="placeholder">No ships match your filters</p>';
        return;
    }

    // Calculate stats
    const sevenStar = ships.filter(s => s.data.rarity === 7).length;

    shipStats.innerHTML = `
        <strong>Ships:</strong> ${ships.length} total |
        ${sevenStar} at 7★
    `;

    shipList.innerHTML = ships.map((ship, index) => {
        const imgSrc = SHIP_IMAGE_MAP[ship.data.base_id];
        const portrait = imgSrc
            ? `<img class="roster-portrait" src="${imgSrc}" alt="" loading="lazy">`
            : `<div class="roster-portrait roster-portrait-placeholder"></div>`;
        return `
            <div class="roster-item" data-type="ship" data-base-id="${ship.data.base_id}">
                ${portrait}
                <div class="roster-rank">#${index + 1}</div>
                <div class="roster-name">${ship.data.name}</div>
                <div class="roster-stat stars">${ship.data.rarity}★</div>
                <div class="roster-stat">L${ship.data.level}</div>
                <div class="roster-stat power">${ship.data.power.toLocaleString()}</div>
            </div>
        `;
    }).join('');
}

// Render the Keywords tab — each keyword as a collapsible <details> with
// summary "<label>  (N units)" and a body listing the units that have it.
// Owned units are clickable (open the abilities-tab modal); unowned are
// dimmed and inert. The header summary stays visible when collapsed so the
// user can scan the list without expanding.
function displayKeywords(entries) {
    const list = document.getElementById('keywordList');
    const stats = document.getElementById('keywordStats');

    if (!entries || entries.length === 0) {
        list.innerHTML = '<p class="placeholder">No keywords match your filter</p>';
        stats.innerHTML = '';
        return;
    }

    const totalKeywords = Object.keys(keywordsIndex).length;
    stats.innerHTML = `<strong>Keywords:</strong> ${entries.length} of ${totalKeywords} shown · click any keyword to see which units have it`;

    list.innerHTML = entries.map(([slug, entry]) => {
        const ownedCount = entry.units.filter(u => u.owned).length;
        const totalCount = entry.units.length;
        const ownedSuffix = ownedCount === totalCount
            ? `${totalCount} units`
            : `${ownedCount} owned · ${totalCount} total`;

        const rows = entry.units.map(u => {
            const portrait = u.image
                ? `<img class="kw-unit-portrait" src="${u.image}" alt="" loading="lazy">`
                : `<div class="kw-unit-portrait kw-unit-portrait-placeholder">?</div>`;
            const ownedClass = u.owned ? '' : ' kw-unit-unowned';
            const dataAttrs = u.owned ? `data-base-id="${escapeHtml(u.base_id)}"` : '';
            return `
                <div class="kw-unit${ownedClass}" ${dataAttrs} title="${u.owned ? 'Click to view abilities' : 'Not in your roster'}">
                    ${portrait}
                    <div class="kw-unit-name">${escapeHtml(u.name)}</div>
                </div>
            `;
        }).join('');

        return `
            <details class="kw-section" data-kw-slug="${escapeHtml(slug)}">
                <summary class="kw-section-head">
                    <span class="kw-section-label">${escapeHtml(entry.label)}</span>
                    <span class="kw-section-count">${ownedSuffix}</span>
                </summary>
                <div class="kw-section-body">${rows}</div>
            </details>
        `;
    }).join('');
}

// Render the Status tab. Two groups: cross-unit mechanics on top (statuses
// that propagate beyond their owner — Alert, Blight, etc.) and a collapsible
// Single-unit group below (Ashes of the Republic, Configurations, Ancestral
// Armor — statuses whose only references stay on the defining unit).
//
// Per status section:
//   header (status name + classification badge + counts)
//   ▾ "Defined by" — owner unit row(s); each expandable to show the canonical
//                     definition prose for the unit's relevant ability
//   ▾ "Used by"    — units that mention the status without defining it; ability
//                     name shown next to the unit but no body to expand
// Click "→" on any row → jump to that unit's modal on the Abilities tab.
function displayStatuses(entries) {
    const list = document.getElementById('statusList');
    const stats = document.getElementById('statusStats');

    const all = Object.values(statusIndex);
    const totalCross = all.filter(e => e.classification === 'cross-unit').length;
    const totalSingle = all.filter(e => e.classification === 'single-unit').length;

    // Split current (filtered) entries into the two groups, both alphabetical
    const cross = entries
        .filter(([_, e]) => e.classification === 'cross-unit')
        .sort((a, b) => a[1].name.localeCompare(b[1].name));
    const single = entries
        .filter(([_, e]) => e.classification === 'single-unit')
        .sort((a, b) => a[1].name.localeCompare(b[1].name));

    if (entries.length === 0) {
        list.innerHTML = '<p class="placeholder">No statuses match your filter</p>';
        stats.innerHTML = `<strong>Statuses:</strong> ${totalCross} cross-unit · ${totalSingle} single-unit`;
        return;
    }

    stats.innerHTML = `<strong>Statuses:</strong> ${entries.length} shown · ${totalCross} cross-unit · ${totalSingle} single-unit`;

    const crossHtml = cross.length > 0
        ? cross.map(([slug, entry]) => renderStatusSection(slug, entry)).join('')
        : '';

    // Single-unit statuses are collapsed in their own outer <details> block —
    // visible for review (per user direction: "we don't drop, we group"), but
    // not noisy by default. Always rendered open if cross-unit list is empty
    // (so search results aren't hidden behind a collapsed wrapper).
    const singleHtml = single.length > 0
        ? `
            <details class="status-group" ${cross.length === 0 ? 'open' : ''}>
                <summary class="status-group-head">
                    <span class="status-group-label">Single-unit statuses</span>
                    <span class="status-group-count">${single.length} ${single.length === 1 ? 'status' : 'statuses'}</span>
                </summary>
                <div class="status-group-body">
                    ${single.map(([slug, entry]) => renderStatusSection(slug, entry)).join('')}
                </div>
            </details>
        `
        : '';

    list.innerHTML = crossHtml + singleHtml;
}

// One status's section — header + Defined-by + Used-by.
function renderStatusSection(slug, entry) {
    const definerCount = entry.definers.length;
    const userCount = entry.users.length;
    const badgeText = entry.classification === 'cross-unit'
        ? `${userCount} ${userCount === 1 ? 'user' : 'users'}`
        : 'single-unit';
    const badgeClass = entry.classification === 'cross-unit'
        ? 'status-badge status-badge-cross'
        : 'status-badge status-badge-unit';

    const definersHtml = entry.definers.length === 0 ? '' : `
        <div class="status-section-subheader">Defined by</div>
        <div class="status-section-rows">
            ${entry.definers.map(d => renderStatusUnitRow(d, true)).join('')}
        </div>
    `;

    const usersHtml = entry.users.length === 0 ? '' : `
        <div class="status-section-subheader">Used by</div>
        <div class="status-section-rows">
            ${entry.users.map(u => renderStatusUnitRow(u, false)).join('')}
        </div>
    `;

    return `
        <details class="status-section" data-status-slug="${escapeHtml(slug)}">
            <summary class="status-section-head">
                <span class="status-section-name">${escapeHtml(entry.name)}</span>
                <span class="${badgeClass}">${badgeText}</span>
                <span class="status-section-count">${definerCount} ${definerCount === 1 ? 'owner' : 'owners'}</span>
            </summary>
            <div class="status-section-body">
                ${definersHtml}
                ${usersHtml}
            </div>
        </details>
    `;
}

// One unit row inside a status section. Definers expand to show the canonical
// definition prose for each of their relevant abilities; users are flat rows
// (no body to expand — they don't have the definition text). Both are clickable
// via the trailing "→" button to jump to the unit's modal.
function renderStatusUnitRow(unit, isDefiner) {
    const portrait = unit.image
        ? `<img class="status-unit-portrait" src="${unit.image}" alt="" loading="lazy">`
        : `<div class="status-unit-portrait status-unit-portrait-placeholder">?</div>`;
    const ownedClass = unit.owned ? '' : ' status-unit-unowned';
    const jumpBtn = unit.owned
        ? `<button class="status-unit-jump" data-base-id="${escapeHtml(unit.base_id)}" title="Open ${escapeHtml(unit.unit_name)}'s abilities">→</button>`
        : '';

    if (isDefiner) {
        // Definer row — expandable, shows each defining ability's prose
        const abilityBlocks = unit.abilities.map(a => `
            <div class="status-definition-block">
                <div class="status-definition-ability">${escapeHtml(a.ability_name)}</div>
                <p class="ability-description">${highlightKeywordsInDescription(escapeHtml(a.definition))}</p>
            </div>
        `).join('');
        return `
            <details class="status-unit${ownedClass}">
                <summary class="status-unit-head">
                    <span class="status-unit-portrait-wrap">${portrait}</span>
                    <span class="status-unit-name">${escapeHtml(unit.unit_name)}</span>
                    <span class="status-unit-ability">${unit.abilities.map(a => escapeHtml(a.ability_name)).join(', ')}</span>
                    ${jumpBtn}
                </summary>
                <div class="status-unit-body">${abilityBlocks}</div>
            </details>
        `;
    } else {
        // User row — flat, no expandable body (they don't have a definition)
        return `
            <div class="status-unit status-unit-flat${ownedClass}">
                <span class="status-unit-portrait-wrap">${portrait}</span>
                <span class="status-unit-name">${escapeHtml(unit.unit_name)}</span>
                <span class="status-unit-ability">${unit.abilities.map(a => escapeHtml(a.ability_name)).join(', ')}</span>
                ${jumpBtn}
            </div>
        `;
    }
}

// Active tag filters — a Set of selected tag names (multi-select checkbox panel)
let activeTagFilters = new Set();
// Journey requirement filter — when set, only show units required for that journey slug
let journeyReqFilterSlug = null;

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const rarityValue = rarityFilter.value;
    const gearValue = gearFilter.value;
    const relicValue = relicFilter.value;

    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

    if (activeTab === 'characters') {
        // Pool: all known characters (owned + unowned from baseCharMap)
        // Owned units carry a .data wrapper; baseCharMap entries are flat.
        const ownedIds = new Set(allCharacters.map(c => c.data.base_id));
        const allUnits = [
            ...allCharacters,
            ...Object.values(baseCharMap)
                .filter(u => !ownedIds.has(u.base_id) && u.combat_type !== 2)
                .map(u => u),  // flat entries, no .data wrapper
        ];

        const filtered = allUnits.filter(char => {
            const d = char.data || char;
            const name = (d.name || '').toLowerCase();
            const cats = d.categories || [];
            const rarity    = d.rarity    || 0;
            const gearLevel = d.gear_level || 0;
            const relicTier = d.relic_tier || 0;
            const relicDisp = relicTier > 2 ? relicTier - 2 : 0;

            if (!name.includes(searchTerm)) return false;
            if (rarityValue && rarity !== parseInt(rarityValue)) return false;
            if (gearValue  && gearLevel !== parseInt(gearValue))  return false;
            if (relicValue && relicDisp !== parseInt(relicValue))  return false;
            if (activeTagFilters.size > 0 && ![...activeTagFilters].every(t => cats.includes(t))) return false;
            if (journeyReqFilterSlug) {
                const ev = journeyData.find(e => e.slug === journeyReqFilterSlug);
                const reqIds = new Set((ev?.requirements || []).map(r => r.base_id));
                if (!reqIds.has(d.base_id)) return false;
            }
            return true;
        });

        // Sort: owned first, then by chosen sort mode
        filtered.sort((a, b) => {
            const aOwned = !!a.data;
            const bOwned = !!b.data;
            if (aOwned !== bOwned) return aOwned ? -1 : 1;
            const aName = a.data?.name || a.name || '';
            const bName = b.data?.name || b.name || '';
            const aGP   = a.data?.power || 0;
            const bGP   = b.data?.power || 0;
            switch (charSortMode) {
                case 'alpha-desc': return bName.localeCompare(aName);
                case 'gp-desc':    return bGP - aGP;
                case 'gp-asc':     return aGP - bGP;
                default:           return aName.localeCompare(bName); // alpha-asc
            }
        });

        displayCharacters(filtered);
    } else if (activeTab === 'ships') {
        const filteredShips = allShips.filter(ship => {
            const matchesSearch = ship.data.name.toLowerCase().includes(searchTerm);
            const matchesRarity = !rarityValue || ship.data.rarity === parseInt(rarityValue);
            return matchesSearch && matchesRarity;
        });
        displayShips(filteredShips);
    } else if (activeTab === 'keywords') {
        const filteredKeywords = Object.entries(keywordsIndex)
            .filter(([slug, entry]) => entry.label.toLowerCase().includes(searchTerm))
            .sort((a, b) => a[1].label.localeCompare(b[1].label));
        displayKeywords(filteredKeywords);
    } else if (activeTab === 'statuses') {
        const filteredStatuses = Object.entries(statusIndex)
            .filter(([slug, entry]) => entry.name.toLowerCase().includes(searchTerm));
        displayStatuses(filteredStatuses);
    } else if (activeTab === 'journeyguide') {
        const filtered = journeyData.filter(e =>
            e.name.toLowerCase().includes(searchTerm) ||
            e.reward_name.toLowerCase().includes(searchTerm)
        );
        displayJourneyGuide(filtered);
    }
}

function clearAllFilters() {
    searchInput.value = '';
    rarityFilter.value = '';
    gearFilter.value = '';
    relicFilter.value = '';
    activeTagFilters.clear();
    journeyReqFilterSlug = null;
    document.querySelectorAll('.tag-filter-cb').forEach(cb => { cb.checked = false; });
    updateTagFilterDisplay();
    updateJourneyReqBanner();
    applyFilters();
}

function populateTagFilters() {
    // Build from ALL known characters (owned + base map) so unowned tags appear too
    const tagSet = new Set();
    allCharacters.forEach(c => (c.data.categories || []).forEach(t => tagSet.add(t)));
    Object.values(baseCharMap).forEach(u => (u.categories || []).forEach(t => tagSet.add(t)));
    availableTags = Array.from(tagSet).sort();

    const panel = document.getElementById('tagFilterPanel');
    if (!panel) return;

    panel.innerHTML = availableTags.map(tag => `
        <label class="tag-filter-item">
            <input type="checkbox" class="tag-filter-cb" value="${escapeHtml(tag)}">
            <span>${escapeHtml(tag)}</span>
        </label>`).join('');

    panel.querySelectorAll('.tag-filter-cb').forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) activeTagFilters.add(cb.value);
            else activeTagFilters.delete(cb.value);
            updateTagFilterDisplay();
            applyFilters();
        });
    });
}

function updateTagFilterDisplay() {
    const btn = document.getElementById('tagFilterBtn');
    if (!btn) return;
    if (activeTagFilters.size === 0) {
        btn.textContent = 'Tags ▾';
        btn.classList.remove('tag-filter-btn-active');
    } else {
        btn.textContent = `Tags (${activeTagFilters.size}) ▾`;
        btn.classList.add('tag-filter-btn-active');
    }
}

function updateJourneyReqBanner() {
    let banner = document.getElementById('journeyReqBanner');
    if (!journeyReqFilterSlug) {
        if (banner) banner.remove();
        return;
    }
    const ev = journeyData.find(e => e.slug === journeyReqFilterSlug);
    if (!ev) { if (banner) banner.remove(); return; }

    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'journeyReqBanner';
        banner.className = 'journey-req-banner';
        // Insert before the char-card-grid
        const list = document.getElementById('characterList');
        list.parentNode.insertBefore(banner, list);
    }
    banner.innerHTML = `
        <span>Showing requirements for: <strong>${escapeHtml(ev.reward_name)}</strong></span>
        <button class="journey-req-banner-clear" id="journeyReqBannerClear">✕ Clear</button>`;
    document.getElementById('journeyReqBannerClear').addEventListener('click', () => {
        journeyReqFilterSlug = null;
        updateJourneyReqBanner();
        applyFilters();
    });
}

let activePopover = null;

function showReqAtPopover(anchor, entries) {
    closeReqAtPopover();

    const popover = document.createElement('div');
    popover.className = 'req-at-popover';
    popover.innerHTML = entries.map(e => `
        <button class="req-at-popover-row" data-slug="${escapeHtml(e.journeySlug)}">
            ${e.rewardImage ? `<img src="${escapeHtml(e.rewardImage)}" alt="" class="req-at-popover-thumb">` : ''}
            <span class="req-at-popover-name">${escapeHtml(e.rewardName)}</span>
            <span class="req-at-popover-label">${escapeHtml(e.label)}</span>
        </button>`).join('');

    document.body.appendChild(popover);
    activePopover = popover;

    // Position below the anchor
    const rect = anchor.getBoundingClientRect();
    popover.style.position = 'fixed';
    popover.style.left = `${Math.min(rect.left, window.innerWidth - popover.offsetWidth - 8)}px`;
    popover.style.top  = `${rect.bottom + 4}px`;
    // Re-check after paint in case offsetWidth was 0
    requestAnimationFrame(() => {
        popover.style.left = `${Math.min(rect.left, window.innerWidth - popover.offsetWidth - 8)}px`;
    });

    popover.querySelectorAll('.req-at-popover-row').forEach(row => {
        row.addEventListener('click', () => {
            journeyReqFilterSlug = row.dataset.slug;
            updateJourneyReqBanner();
            applyFilters();
            closeReqAtPopover();
        });
    });
}

function closeReqAtPopover() {
    if (activePopover) { activePopover.remove(); activePopover = null; }
}

// Close popover on outside click or Escape
document.addEventListener('click', e => {
    if (activePopover && !activePopover.contains(e.target)) closeReqAtPopover();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeReqAtPopover();
});

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Unit detail modal

document.getElementById('characterList').addEventListener('click', (e) => {
    // Tag button → add to filters and re-apply
    const tagBtn = e.target.closest('.char-tag-btn');
    if (tagBtn) {
        e.stopPropagation();
        const tag = tagBtn.dataset.tag;
        if (!activeTagFilters.has(tag)) {
            activeTagFilters.add(tag);
            // Sync the checkbox in the panel
            const cb = document.querySelector(`.tag-filter-cb[value="${CSS.escape(tag)}"]`);
            if (cb) cb.checked = true;
            updateTagFilterDisplay();
            applyFilters();
        }
        return;
    }

    // req-at badge → single journey: filter directly; multiple: show popover
    const reqBtn = e.target.closest('.char-card-badge.req-at[data-req-base-id]');
    if (reqBtn) {
        e.stopPropagation();
        const baseId  = reqBtn.dataset.reqBaseId;
        const entries = requiredAtMap[baseId] || [];
        if (entries.length === 1) {
            journeyReqFilterSlug = entries[0].journeySlug;
            updateJourneyReqBanner();
            applyFilters();
        } else {
            showReqAtPopover(reqBtn, entries);
        }
        return;
    }

    // Card click → open unit detail (owned only)
    const item = e.target.closest('.char-card[data-type="character"]:not(.char-card-unowned)');
    if (item) {
        const unit = allCharacters.find(c => c.data.base_id === item.dataset.baseId);
        if (unit) openUnitDetail(unit, 'character');
    }
});

document.getElementById('shipList').addEventListener('click', (e) => {
    const item = e.target.closest('.roster-item[data-type="ship"]');
    if (item) {
        const unit = allShips.find(s => s.data.base_id === item.dataset.baseId);
        if (unit) openUnitDetail(unit, 'ship');
    }
});

// Keyword tab — click an owned-unit row to open the unit modal directly on
// the Abilities tab. Unowned rows are inert (no data-base-id, so closest()
// matches nothing). Single delegated handler on the whole list.
document.getElementById('keywordList').addEventListener('click', (e) => {
    const row = e.target.closest('.kw-unit[data-base-id]');
    if (!row) return;
    const baseId = row.dataset.baseId;
    const unit = allCharacters.find(c => c.data.base_id === baseId);
    if (unit) openUnitDetail(unit, 'character', { focusTab: 'abilities' });
});

// Status tab — the "→" button on each unit row jumps to that unit's modal.
// The rest of the row (portrait + name) just expands the <details> to show
// the unit-specific definition. Stop propagation so the jump doesn't also
// toggle the details.
document.getElementById('statusList').addEventListener('click', (e) => {
    const jump = e.target.closest('.status-unit-jump[data-base-id]');
    if (!jump) return;
    e.preventDefault();
    e.stopPropagation();
    const baseId = jump.dataset.baseId;
    const unit = allCharacters.find(c => c.data.base_id === baseId);
    if (unit) openUnitDetail(unit, 'character', { focusTab: 'abilities' });
});

// Click on a highlighted keyword inside an ability description → jump to the
// Keywords tab and expand that keyword's section.
modalContent.addEventListener('click', (e) => {
    const span = e.target.closest('.kw[data-kw]');
    if (!span) return;
    const slug = span.dataset.kw;
    closeModal();
    switchTab('keywords');
    // Wait one frame for the tab pane to become visible, then open the matching <details>.
    requestAnimationFrame(() => {
        const section = document.querySelector(`.kw-section[data-kw-slug="${CSS.escape(slug)}"]`);
        if (section) {
            section.open = true;
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            section.classList.add('kw-section-flash');
            setTimeout(() => section.classList.remove('kw-section-flash'), 1500);
        }
    });
});

function openUnitDetail(unit, type, options = {}) {
    const d = unit.data;
    const relicDisplay = (d.relic_tier || 0) > 2 ? d.relic_tier - 2 : 0;

    // Alignment theme — red for Dark Side, blue for Light Side, neutral otherwise
    const alignmentClass =
        d.alignment === 'Dark Side' ? 'align-dark' :
        d.alignment === 'Light Side' ? 'align-light' :
        'align-neutral';

    // Header chips (the existing stats become the header)
    let chipsHtml = `
        <span class="modal-stat level">Lvl ${d.level}</span>
        <span class="modal-stat stars">${d.rarity}★</span>
    `;
    if (type === 'character') {
        chipsHtml += `
            <span class="modal-stat gear">G${d.gear_level}</span>
            <span class="modal-stat relic">R${relicDisplay}</span>
        `;
    }

    // Abilities tab — bundle-first, merged with player state. Solves Embo case
    // (level-1 units with empty player ability_data still render full list at tier 0).
    const abilitiesHtml = renderAbilities(d);

    // Gear tab — one collapsible <details> per tier, collapsed by default.
    // Each piece looks up gearMap to render icon + name; falls back to raw ID if unknown.
    const gearLevels = d.gear_levels || [];
    const gearHtml = gearLevels.length > 0
        ? gearLevels.map(g => `
            <details class="gear-tier">
                <summary>Gear Tier ${g.tier}</summary>
                <div class="gear-pieces">
                    ${(g.gear || []).map(pieceId => renderGearPiece(pieceId)).join('')}
                </div>
            </details>
        `).join('')
        : `<p class="modal-empty">No gear data available.</p>`;

    // Info tab — description, alignment, role, tags, ship link, shard count
    const tagsHtml = (d.categories && d.categories.length > 0)
        ? `<div class="modal-tags">${d.categories.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
        : `<span class="tag-none">No tags</span>`;

    const infoRows = [];
    if (d.description) infoRows.push(`<p class="modal-description">${escapeHtml(d.description)}</p>`);
    if (d.alignment)   infoRows.push(`<div class="modal-info-row"><strong>Alignment:</strong> ${escapeHtml(d.alignment)}</div>`);
    if (d.role)        infoRows.push(`<div class="modal-info-row"><strong>Role:</strong> ${escapeHtml(d.role)}</div>`);
    if (d.activate_shard_count) infoRows.push(`<div class="modal-info-row"><strong>Shards to unlock:</strong> ${d.activate_shard_count}</div>`);
    infoRows.push(`<div class="modal-section-label" style="margin-top:14px;">Tags</div>${tagsHtml}`);
    const infoHtml = infoRows.join('');

    // Tabs — only show Abilities/Gear for characters (ships have no gear)
    const showCharTabs = type === 'character';

    const imageHtml = (d.image || SHIP_IMAGE_MAP[d.base_id])
        ? `<img class="modal-portrait" src="${d.image || SHIP_IMAGE_MAP[d.base_id]}" alt="${escapeHtml(d.name)}">`
        : `<div class="modal-portrait modal-portrait-placeholder">?</div>`;

    modalContent.innerHTML = `
        <div class="modal-header ${alignmentClass}">
            ${imageHtml}
            <div class="modal-header-text">
                <div class="modal-title">${escapeHtml(d.name)}</div>
                <div class="modal-stats">${chipsHtml}</div>
            </div>
        </div>

        <div class="modal-tabs" role="tablist">
            <button class="modal-tab-btn active" data-modal-tab="info">Info</button>
            ${showCharTabs ? `<button class="modal-tab-btn" data-modal-tab="gear">Gear</button>` : ''}
            ${showCharTabs ? `<button class="modal-tab-btn" data-modal-tab="abilities">Abilities</button>` : ''}
        </div>

        <div class="modal-tab-content">
            <div class="modal-tab-pane active" data-modal-pane="info">${infoHtml}</div>
            ${showCharTabs ? `<div class="modal-tab-pane" data-modal-pane="gear">${gearHtml}</div>` : ''}
            ${showCharTabs ? `<div class="modal-tab-pane" data-modal-pane="abilities">${abilitiesHtml}</div>` : ''}
        </div>
    `;

    // Wire up tab switching
    modalContent.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.modalTab;
            modalContent.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
            modalContent.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.toggle('active', p.dataset.modalPane === target));
        });
    });

    // Apply alignment theme to the card itself (for background tint)
    const card = unitModal.querySelector('.modal-card');
    card.classList.remove('align-dark', 'align-light', 'align-neutral');
    card.classList.add(alignmentClass);

    // Optionally jump to a specific inner tab on open (e.g. from a Keywords-tab
    // click — user wants to see the abilities that contain that keyword).
    if (options.focusTab) {
        const target = options.focusTab;
        modalContent.querySelectorAll('.modal-tab-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.modalTab === target));
        modalContent.querySelectorAll('.modal-tab-pane').forEach(p =>
            p.classList.toggle('active', p.dataset.modalPane === target));
    }

    unitModal.style.display = 'flex';
}

// Tiny HTML escaper for user/data-driven strings inserted via innerHTML
function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Render one gear piece as an icon + name row. Falls back to the raw ID
// if the piece isn't in gearMap (e.g. data not loaded yet, or unknown finisher variant).
function renderGearPiece(pieceId) {
    const g = gearMap[pieceId];
    if (!g) {
        return `<div class="gear-piece gear-piece-unknown" title="Unknown piece"><span class="gear-piece-name">${escapeHtml(pieceId)}</span></div>`;
    }
    const tooltipParts = [];
    if (g.mark && g.mark.trim()) tooltipParts.push(g.mark.trim());
    if (g.required_level) tooltipParts.push(`Req lvl ${g.required_level}`);
    const tooltip = tooltipParts.join(' · ');
    const href = g.url ? `https:${g.url}` : '#';  // urls come back as "//swgoh.gg/..."
    const img = g.image
        ? `<img class="gear-piece-icon" src="${g.image}" alt="" loading="lazy">`
        : `<span class="gear-piece-icon gear-piece-icon-placeholder">?</span>`;
    return `
        <a class="gear-piece" href="${href}" target="_blank" rel="noopener" title="${escapeHtml(tooltip)}">
            ${img}
            <span class="gear-piece-name">${escapeHtml(g.name || pieceId)}</span>
        </a>
    `;
}

function closeModal() {
    unitModal.style.display = 'none';
}

// Render the Abilities tab. Source-of-truth = bundled abilitiesMap (332 units,
// 1750 abilities w/ descriptions, scraped from swgoh.gg/characters/<slug>/ via
// scrape-abilities.user.js). Player payload's `ability_data` is merged in to
// supply the *current* state — current tier and zeta/omicron-learned flags.
//
// Why bundle-first: solves the Embo case (level-1 units have empty ability_data
// in the player payload). Bundle gives us all base abilities; we render them at
// tier 0 with `learned=false` when the player hasn't trained them yet.
// Render order. Ultimate sits at the bottom — it's the climactic GL move,
// visually distinct (gold), and reads naturally as the finisher of the kit.
const ABILITY_TYPE_ORDER = ['Basic', 'Special', 'Leader', 'Unique', 'Hardware', 'Contract', 'Granted', 'Other', 'Ultimate'];

// Map either a player-payload id (`basicskill_DENGAR`) or a scraped ability_id
// (`basicability_dengar`, optionally with `_BASE` suffix) to a single canonical
// key like `basic_dengar`. Used to join the two datasets. Also handles the
// `ultimateability_*` (GL ultimates), `grantedability_*` (situational unlocks),
// `hiddenability_*` (filtered elsewhere) prefixes that don't follow the standard
// (skill|ability) two-part naming.
function normalizeAbilityId(id) {
    if (!id) return '';
    const stripped = String(id).replace(/_BASE$/i, '');
    // Standard pattern: <class>(skill|ability)_<rest>
    let m = stripped.match(/^([a-z]+)(?:skill|ability)_(.+)$/i);
    if (m) return `${m[1].toLowerCase()}_${m[2].toLowerCase()}`;
    return stripped.toLowerCase();
}

// Type from the canonical key prefix. Same prefixes whether sourced from bundle
// or player payload, since normalizeAbilityId() collapses them.
const ABILITY_TYPE_BY_PREFIX = {
    basic:    'Basic',
    special:  'Special',
    leader:   'Leader',
    unique:   'Unique',
    ultimate: 'Ultimate',     // Galactic Legend ultimate
    hardware: 'Hardware',     // ships
    contract: 'Contract',     // bounty hunters
    granted:  'Granted',      // situational/conditional unlocks (e.g. SLKR's Depths of Rage)
};
function abilityTypeFromKey(key) {
    const prefix = key.split('_')[0];
    return ABILITY_TYPE_BY_PREFIX[prefix] || 'Other';
}

function renderAbilities(unitData) {
    const baseId   = unitData.base_id;
    const playerAbilities = Array.isArray(unitData.ability_data) ? unitData.ability_data : [];
    const bundle   = abilitiesMap[baseId];
    const bundleAbilities = bundle ? (bundle.abilities || []) : [];

    // Filter out internal mechanic abilities — never user-facing.
    //   hiddenability_*           — engine state placeholders
    //   handlerability_*          — animation/state controllers, often named "Placeholder"/"EMPTY"
    //   generic_*                 — shared engine slots (RALLY, edge_of_madness, …)
    //   wattambor_tech\d_ability  — Wat Tambor's tech slots without their own UI
    const usableBundle = bundleAbilities.filter(a => {
        if (!a || !a.ability_id) return false;
        const id = a.ability_id;
        if (/^hidden(skill|ability)_/i.test(id)) return false;
        if (/^handlerability_/i.test(id))        return false;
        if (/^generic_/i.test(id))               return false;
        if (/^wattambor_tech\d_ability/i.test(id)) return false;
        return true;
    });

    // Merge: index player state by canonical key, then iterate bundle as the
    // canonical list. Each merged ability has bundle metadata (name, description,
    // type, material) + player state (current tier, learned flags).
    const playerByKey = {};
    playerAbilities.forEach(a => { playerByKey[normalizeAbilityId(a.id)] = a; });

    let merged = usableBundle.map(b => {
        const key = normalizeAbilityId(b.ability_id);
        const p = playerByKey[key] || null;
        const tierMax = b.tier_max ?? p?.tier_max ?? 8;
        // Auto-tier-1 rule: tier_max=1 abilities (GL ultimates, Great Mother's
        // grants, Bok-Atan's armor, etc.) are auto-granted at unit unlock — the
        // player payload doesn't list them in ability_data. So if we have no
        // player record AND the ability tops out at 1, treat it as already at
        // max. For anything else, default to 0 (untrained, light-red).
        const defaultTier = (!p && tierMax === 1) ? 1 : 0;
        // Omicron-able? Player payload's is_omicron is the source of truth
        // (it's TRUE when the ability has an omicron upgrade mode, regardless
        // of whether the player learned it). Bundle's `material` field is
        // unreliable here because it captures only the highest tier upgrade
        // and zeta-then-omicron abilities show as material=zeta in the bundle.
        // Material hierarchy: omega → zeta → omicron (omicron is the top tier).
        const isOmicronable = !!(p?.is_omicron) || b.material === 'omicron';
        return {
            key,
            ability_id: b.ability_id,
            name: b.name,
            description: b.description,
            type: b.type || abilityTypeFromKey(key),
            material: b.material,                       // 'omega' | 'zeta' | 'omicron' | null
            is_omicronable: isOmicronable,              // true if ability has an omicron mode
            tier_max: tierMax,
            tier: p?.ability_tier ?? defaultTier,
            has_zeta_learned:    p?.has_zeta_learned    ?? false,
            has_omicron_learned: p?.has_omicron_learned ?? false,
        };
    });

    // Fallback: if the bundle has no entry for this unit (newly-released since
    // the last scrape), render whatever the player payload has so we don't
    // disappear the tab entirely. No descriptions in this branch.
    if (merged.length === 0 && playerAbilities.length > 0) {
        merged = playerAbilities.map(p => {
            const key = normalizeAbilityId(p.id);
            const material = p.is_zeta ? 'zeta' : p.is_omicron ? 'omicron' : p.is_omega ? 'omega' : null;
            return {
                key,
                ability_id: p.id,
                name: p.name,
                description: null,
                type: abilityTypeFromKey(key),
                material,
                is_omicronable: !!p.is_omicron,
                tier_max: p.tier_max ?? 8,
                tier: p.ability_tier ?? 0,
                has_zeta_learned:    p.has_zeta_learned    ?? false,
                has_omicron_learned: p.has_omicron_learned ?? false,
            };
        });
    }

    if (merged.length === 0) {
        return `<p class="modal-empty">No ability data available for this unit.</p>`;
    }

    // Bucket by type and render in canonical order
    const groups = {};
    merged.forEach(ab => {
        (groups[ab.type] = groups[ab.type] || []).push(ab);
    });

    return ABILITY_TYPE_ORDER
        .filter(type => groups[type] && groups[type].length > 0)
        .map(type => `
            <div class="ability-group">
                <div class="modal-section-label">${escapeHtml(type)}</div>
                <div class="ability-cards">${groups[type].map(renderAbilityCard).join('')}</div>
            </div>
        `).join('');
}

// =============================================================================
// Required-at map — highest journey requirement per unit.
// =============================================================================

// Walk every journey event's requirements and record the "hardest" requirement
// each unit appears in. Priority: Relic (highest wins) > Gear > Stars.
// Ships (gear===null && relic===null) contribute stars only.
// Result stored globally in requiredAtMap as { label, rewardBaseId, rewardName, rewardImage }.
// requiredAtMap: base_id → array of journey entries sorted highest-first.
// Each entry: { label, pri, val, rewardBaseId, rewardName, rewardImage, journeySlug }
function buildRequiredAtMap(events) {
    const map = {};
    for (const ev of (events || [])) {
        for (const req of (ev.requirements || [])) {
            const id = req.base_id;
            if (!id) continue;
            const cur = req.relic !== null && req.relic !== undefined
                ? { pri: 2, val: req.relic, label: `R${req.relic}` }
                : req.gear !== null && req.gear !== undefined
                ? { pri: 1, val: req.gear,  label: `G${req.gear}`  }
                : { pri: 0, val: req.stars, label: `${req.stars}★` };
            const rewardBase = baseCharMap[ev.reward_base_id];
            if (!map[id]) map[id] = [];
            map[id].push({
                ...cur,
                rewardBaseId: ev.reward_base_id,
                rewardName:   ev.reward_name,
                rewardImage:  ev.reward_image || rewardBase?.image || SHIP_IMAGE_MAP[ev.reward_base_id] || null,
                journeySlug:  ev.slug,
            });
        }
    }
    // Sort each unit's entries highest-first
    requiredAtMap = {};
    for (const [id, entries] of Object.entries(map)) {
        requiredAtMap[id] = entries.sort((a, b) =>
            b.pri !== a.pri ? b.pri - a.pri : b.val - a.val
        );
    }
}

// =============================================================================
// Keyword index — slugs, regex, description highlighting.
// =============================================================================

// Slug = lowercased, spaces → underscores. Matches swgoh.gg's `?ac=` form so
// the same canonical key works as a stable HTML anchor + dataset value.
function slugifyKeyword(label) {
    return String(label || '').toLowerCase().trim().replace(/\s+/g, '_');
}

// RegExp escape (no Unicode-mode flag concern — labels are plain ASCII)
function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build keywordsIndex from the full bundled-character list. Owned-set is
// derived from the player roster (allCharacters) so we can flag clickable rows
// without mutating the data.
function buildKeywordsIndex(baseCharacters, ownedCharacters) {
    const ownedIds = new Set(ownedCharacters.map(c => c.data.base_id));
    const idx = {};

    baseCharacters.forEach(c => {
        (c.ability_classes || []).forEach(label => {
            const slug = slugifyKeyword(label);
            if (!slug) return;
            if (!idx[slug]) idx[slug] = { label, units: [] };
            idx[slug].units.push({
                base_id: c.base_id,
                name: c.name,
                image: c.image,
                owned: ownedIds.has(c.base_id),
            });
        });
    });

    // Sort each keyword's unit list: owned first (by name), then unowned (by name)
    Object.values(idx).forEach(entry => {
        entry.units.sort((a, b) => {
            if (a.owned !== b.owned) return a.owned ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    });

    keywordsIndex = idx;

    // Pre-compile the highlight regex from the union of canonical labels,
    // sorted longest-first so multi-word labels win over their shorter prefixes
    // ("Healing Immunity" beats "Healing" beats "Heal"). Word boundaries on
    // both sides prevent "Heal" matching inside "Health".
    const labels = Object.values(idx).map(e => e.label);
    keywordLabelToSlug = {};
    labels.forEach(l => { keywordLabelToSlug[l] = slugifyKeyword(l); });
    if (labels.length > 0) {
        const sorted = [...labels].sort((a, b) => b.length - a.length);
        const pattern = sorted.map(escapeRegex).join('|');
        // \b doesn't quite work for labels starting with `+` (e.g. "+Speed")
        // because + isn't a word char — use a non-word lookbehind instead.
        keywordRegex = new RegExp(`(?<![\\w+])(?:${pattern})(?![\\w])`, 'g');
    } else {
        keywordRegex = null;
    }

    console.log(`✓ Built keywords index: ${labels.length} keywords across ${baseCharacters.length} characters`);
}

// Names that look like callouts but aren't real status mechanics — they're
// structural noise in role-bucket buff lists, positional triggers, or game-mode
// context modifiers. Excluding these keeps the Status tab focused on actual
// game mechanics. See the in-app description rendering — these still appear
// inline in the per-unit ability text, just not aggregated globally.
//
// Roles: kit leaders often use `Attacker: ... Tank: ... Support or Healer: ...`
//   to grant role-conditional bonuses (Dash Rendar, Qi'ra, etc.).
// Ordinals: `First enemy or Empire ally:`, etc. — Inquisitor positional rules.
// Raid Bosses: a game-context modifier (similar shape to While-in-mode).
function isNonStatusCallout(name) {
    if (/^While in /i.test(name)) return true;             // mode modifiers (already excluded earlier)
    if (name === 'Attacker') return true;
    if (name === 'Tank') return true;
    if (name === 'Healer') return true;
    if (name === 'Support') return true;
    if (name === 'Support or Healer') return true;
    // Ordinal positional triggers: "First/Second/Third/Fourth/Fifth ... enemy|ally".
    // Requiring `enemy`/`ally` keeps real statuses like "Second Wind" safe.
    if (/^(First|Second|Third|Fourth|Fifth)\s.*\b(enemy|ally|allies|enemies)\b/i.test(name)) return true;
    if (name === 'Raid Bosses') return true;
    return false;
}

// Build statusIndex by walking every ability description in the bundle. Two
// passes — first captures DEFINITIONS via callouts (the inline "Status: ..."
// pattern from splitDescriptionForCallouts); second scans descriptions for
// MENTIONS of those names as plain text (a unit references the status without
// owning the canonical definition).
//
// Why both: in SWGOH a status mechanic is introduced by one unit (the canonical
// owner — its description carries the "Status: definition" callout) and may
// later be used by other units (their descriptions inflict/gain/react to it
// without redefining it). Examples:
//   - Alert: defined by Night Trooper, used by 5+ other units
//   - Blight: defined by Night Trooper, used by 10+ other units
//   - Ashes of the Republic: defined and used only by Lord Vader (single-unit)
//
// Mode modifiers ("While in <X>:") are excluded — they live in the per-unit
// omicron callouts already, and aggregating them adds no cross-unit value.
//
// Each entry:
//   { name, slug, classification: 'cross-unit' | 'single-unit',
//     definers: [{base_id, unit_name, image, owned, abilities: [{ability_name, definition}]}],
//     users:    [{base_id, unit_name, image, owned, abilities: [{ability_name}]}] }
function buildStatusIndex(bundleUnits, ownedCharacters, baseCharMap) {
    const ownedIds = new Set(ownedCharacters.map(c => c.data.base_id));

    // Pass 1: collect every callout — name + (unit, ability, definition)
    const calloutByName = {};   // status name -> array of {base_id, unit_name, ability_name, definition}
    for (const [base_id, u] of Object.entries(bundleUnits || {})) {
        for (const a of u.abilities || []) {
            const desc = a.description || '';
            if (!desc) continue;
            const { callouts } = splitDescriptionForCallouts(desc);
            for (const c of callouts) {
                if (isNonStatusCallout(c.name)) continue;
                if (!c.name) continue;
                (calloutByName[c.name] = calloutByName[c.name] || []).push({
                    base_id,
                    unit_name: u.name,
                    ability_name: a.name,
                    definition: c.definition,
                });
            }
        }
    }

    // Pass 2: build a regex of all known status names, sort longest-first to
    // win on overlapping matches ("Healing Immunity" before "Heal"). Word
    // boundaries on both sides so "Heal" never matches inside "Health".
    const allNames = Object.keys(calloutByName);
    if (allNames.length === 0) {
        statusIndex = {};
        return;
    }
    const sortedNames = [...allNames].sort((a, b) => b.length - a.length);
    const namesPattern = sortedNames.map(n => escapeRegex(n)).join('|');
    // Lookbehind/lookahead = non-word; matches words and `-` boundary chars.
    const mentionRe = new RegExp(`(?<![\\w])(?:${namesPattern})(?![\\w])`, 'g');

    // Find every (unit, ability) that mentions each status by name. Used to
    // populate the "users" list — units that reference a status without
    // owning its definition. NOTE: a unit's own callout body contributes a
    // mention back to itself, but we filter that out below by excluding
    // base_ids that already appear in `definers`.
    const mentionsByName = {};   // status name -> array of {base_id, unit_name, ability_name}
    for (const [base_id, u] of Object.entries(bundleUnits || {})) {
        for (const a of u.abilities || []) {
            const desc = a.description || '';
            if (!desc) continue;
            for (const m of desc.matchAll(mentionRe)) {
                const name = m[0];
                (mentionsByName[name] = mentionsByName[name] || []).push({
                    base_id,
                    unit_name: u.name,
                    ability_name: a.name,
                });
            }
        }
    }

    // Pass 3: assemble per-status entries. Dedup definers/users by base_id.
    const idx = {};
    for (const name of allNames) {
        const slug = slugifyKeyword(name);
        if (!slug) continue;

        // Group definer occurrences by base_id, collecting each unit's
        // ability+definition rows. One unit can define a status across multiple
        // of its abilities (Bo-Katan defines Ancestral Armor in 2 abilities;
        // Lord Vader defines Ashes of the Republic in 4) — keep them all under
        // the same definer entry so the unit appears once in the list.
        const definersByUnit = {};
        for (const occ of calloutByName[name]) {
            if (!definersByUnit[occ.base_id]) {
                definersByUnit[occ.base_id] = {
                    base_id: occ.base_id,
                    unit_name: occ.unit_name,
                    image: baseCharMap[occ.base_id]?.image || null,
                    owned: ownedIds.has(occ.base_id),
                    abilities: [],
                };
            }
            definersByUnit[occ.base_id].abilities.push({
                ability_name: occ.ability_name,
                definition: occ.definition,
            });
        }
        const definers = Object.values(definersByUnit);
        const definerIds = new Set(definers.map(d => d.base_id));

        // Users: every unit that mentions the name AND isn't a definer.
        // Same dedup-by-unit pattern.
        const usersByUnit = {};
        for (const occ of (mentionsByName[name] || [])) {
            if (definerIds.has(occ.base_id)) continue;     // skip the definers
            if (!usersByUnit[occ.base_id]) {
                usersByUnit[occ.base_id] = {
                    base_id: occ.base_id,
                    unit_name: occ.unit_name,
                    image: baseCharMap[occ.base_id]?.image || null,
                    owned: ownedIds.has(occ.base_id),
                    abilities: [],
                };
            }
            usersByUnit[occ.base_id].abilities.push({
                ability_name: occ.ability_name,
            });
        }
        const users = Object.values(usersByUnit);

        // Sort each list — owned first, then alphabetical
        const byOwnedThenName = (a, b) => {
            if (a.owned !== b.owned) return a.owned ? -1 : 1;
            return a.unit_name.localeCompare(b.unit_name);
        };
        definers.sort(byOwnedThenName);
        users.sort(byOwnedThenName);

        idx[slug] = {
            name,
            slug,
            classification: users.length > 0 ? 'cross-unit' : 'single-unit',
            definers,
            users,
        };
    }

    statusIndex = idx;
    const total = Object.keys(idx).length;
    const cross = Object.values(idx).filter(e => e.classification === 'cross-unit').length;
    console.log(`✓ Built status index: ${total} statuses (${cross} cross-unit, ${total - cross} single-unit)`);
}

// Wrap each canonical-keyword occurrence in a styled span. Input MUST already
// be HTML-escaped (we don't escape it again here). The replacement injects raw
// HTML for the span, which is safe because the matched text comes from a fixed
// allowlist of keyword labels we control.
function highlightKeywordsInDescription(escapedText) {
    if (!keywordRegex || !escapedText) return escapedText;
    return escapedText.replace(keywordRegex, match => {
        const slug = keywordLabelToSlug[match] || slugifyKeyword(match);
        return `<span class="kw" data-kw="${slug}">${match}</span>`;
    });
}

// Split a raw description into a main body + array of {name, definition} callouts.
// A callout is recognised as "<Capital phrase ≤ 40 chars>:" where the phrase is
// either at the very start of the text OR follows a sentence terminator. Once
// we've identified callout NAME positions, each callout's BODY runs until the
// next callout starts (or end of text).
//
// "Sentence terminator" includes `.`/`!`/`?` AND `)` — the latter because the
// scraped descriptions sometimes lack a period before parenthetical-ended
// sentences (e.g. "...for 2 turns)Reward:" on Bounty Hunter payouts).
//
// PRE-PROCESS step before splitting: the swgoh.gg HTML scrape sometimes runs
// list-items together without periods, producing patterns like
// "...all enemiesConfiguration - Crossguard:" (Cal Kestis, several Mandos).
// We detect this conservatively — only when a lowercase letter immediately
// precedes a Capital phrase that ends in `: ` — and insert a period to
// re-establish the boundary the splitter looks for. False-positive risk is
// low: the trailing `:` is required, so proper-noun mid-sentence joins
// (Cobb, BlasTech, etc.) are untouched.
//
// This handles the run-together case correctly:
//   "main prose. Status1: defn1 sentence two. Status2: defn2."
//   → main="main prose", callouts=[{Status1, "defn1 sentence two"}, {Status2, "defn2"}]
//
// Without this approach, a regex with `[^.]` body terminator splits on the
// first period and leaks subsequent sentences of the same callout back into
// main prose (or hides the next callout entirely).
//
// Returns: { main: string, callouts: [{name, definition}] }  — both raw text.

function preProcessDescription(rawText) {
    return String(rawText || '').replace(RUN_TOGETHER_FIX_RE, '$1. $2');
}

function splitDescriptionForCallouts(rawText) {
    const text = preProcessDescription(rawText);
    if (!text) return { main: '', callouts: [] };

    // Pass 1: locate every "Status:" name + the slice where its body begins.
    const positions = [];
    let m;
    STATUS_NAME_RE.lastIndex = 0;
    while ((m = STATUS_NAME_RE.exec(text)) !== null) {
        const name = m[1].trim();
        // The matched group includes a possible leading sentence terminator;
        // figure out where the actual `Name:` begins.
        const nameStart = m.index + m[0].indexOf(name);
        const bodyStart = m.index + m[0].length;     // sits AFTER the colon+space
        positions.push({ name, nameStart, bodyStart });
    }

    if (positions.length === 0) return { main: text.trim(), callouts: [] };

    // Pass 2: main = everything before the first callout name; each callout's
    // body runs from its bodyStart up to the next callout's nameStart (or end).
    const main = text.slice(0, positions[0].nameStart).trim();
    const callouts = positions.map((p, i) => {
        const next = positions[i + 1];
        const bodyEnd = next ? next.nameStart : text.length;
        let body = text.slice(p.bodyStart, bodyEnd).trim();
        // Strip a trailing period if present — looks cleaner on its own line.
        body = body.replace(/\.$/, '');
        return { name: p.name, definition: body };
    });

    return { main, callouts };
}

function renderDescriptionWithCallouts(rawText) {
    const { main, callouts } = splitDescriptionForCallouts(rawText);

    const mainHtml = main
        ? `<p class="ability-description">${highlightKeywordsInDescription(escapeHtml(main))}</p>`
        : '';

    // Per-callout omicron rule: only callouts whose name starts with "While in"
    // get omicron-styled. Verified against player data: 100% (173/173) of
    // "While in Grand Arenas/Territory Wars/Territory Battles/Raids" clauses
    // sit on is_omicron=true abilities. Other callouts in the same ability
    // (e.g. Cal Kestis's "Configuration - Crossguard") are unit-specific
    // status definitions that happen to share a parent omicron-able ability —
    // they are NOT the omicron content and should keep the default style.
    const calloutsHtml = callouts.map(c => {
        const isOmicronCallout = /^While in /i.test(c.name);
        const cls = isOmicronCallout ? 'ability-callout ability-callout-omicron' : 'ability-callout';
        return `
            <div class="${cls}">
                <span class="ability-callout-name">${escapeHtml(c.name)}:</span>
                <span class="ability-callout-def">${highlightKeywordsInDescription(escapeHtml(c.definition))}</span>
            </div>
        `;
    }).join('');

    return mainHtml + calloutsHtml || `<p class="ability-description ability-description-empty">Empty description.</p>`;
}

function renderAbilityCard(ab) {
    const tier    = ab.tier;
    const tierMax = ab.tier_max;
    const maxed   = tier >= tierMax;
    // Map (tier, tier_max) → 0..8 colour-ramp step. Lets one CSS ramp serve
    // 1-tier (granted abilities), 3-tier (Galactic Legends), 7/8/9-tier ramps
    // with the same red→yellow→green progression. tier 0 always = red, tier=max
    // always = green (and triggers the icon swap below).
    const rampStep = rampStepFor(tier, tierMax);

    // Material flags — what kind of ability this *is* (regardless of learned state)
    const isZeta     = ab.material === 'zeta';
    const isOmicron  = ab.material === 'omicron';
    const isOmega    = ab.material === 'omega';
    const isUltimate = ab.type === 'Ultimate';

    // At max tier, the numeric pill is replaced by the material icon.
    // Priority: ULTIMATE (always tier_max=1, no material slot) > ZETA > OMICRON > OMEGA.
    // (A zeta'd ability that also got an omicron mode added later renders zeta
    // in the pill, omicron adjacent.)
    let tierContent;
    if (maxed && isUltimate) {
        tierContent = `<span class="ability-tier-icon icon-ultimate" title="Galactic Legend Ultimate — unlocked">${ICON_ULTIMATE}</span>`;
    } else if (maxed && isZeta) {
        const learnedClass = ab.has_zeta_learned ? '' : ' icon-inactive';
        tierContent = `<span class="ability-tier-icon icon-zeta${learnedClass}" title="Zeta tier ${tierMax} — ${ab.has_zeta_learned ? 'unlocked' : 'not yet unlocked'}">${ICON_ZETA}</span>`;
    } else if (maxed && isOmicron) {
        const learnedClass = ab.has_omicron_learned ? '' : ' icon-inactive';
        tierContent = `<span class="ability-tier-icon icon-omicron${learnedClass}" title="Omicron tier ${tierMax} — ${ab.has_omicron_learned ? 'unlocked' : 'not yet unlocked'}">${ICON_OMICRON}</span>`;
    } else if (maxed && isOmega) {
        tierContent = `<span class="ability-tier-icon icon-omega" title="Omega — tier ${tierMax}">${ICON_OMEGA}</span>`;
    } else {
        tierContent = `<div class="ability-tier" data-ramp-step="${rampStep}">${tier}/${tierMax}</div>`;
    }

    // Omicron-adjacent icon: zeta+omicron on the same ability shows both
    let omicronAdjacent = '';
    if (maxed && isZeta && isOmicron) {
        const learnedClass = ab.has_omicron_learned ? '' : ' icon-inactive';
        omicronAdjacent = `<span class="ability-tier-icon icon-omicron icon-adjacent${learnedClass}" title="Omicron — ${ab.has_omicron_learned ? 'unlocked' : 'not yet unlocked'}">${ICON_OMICRON}</span>`;
    }

    // Description body. The prose may contain "Status: definition" clauses
    // (e.g. "Blight: -100% Health Steal; ..." or "While in Grand Arenas: ...").
    // We split those out and render each as a separate callout. Per-callout
    // styling: "While in <mode>:" callouts are omicron content (verified 100%
    // tied to omicron in player data); all other callouts use the default
    // status style.
    const descBody = ab.description
        ? renderDescriptionWithCallouts(ab.description)
        : `<p class="ability-description ability-description-empty">No description available.</p>`;

    // Cooldown chip (Specials only): "5 turn cooldown"
    // Not currently captured for player-payload-fallback abilities — that's fine.

    return `
        <details class="ability-card" data-ramp-step="${rampStep}" data-type="${escapeHtml(ab.type || '')}"${maxed ? ' data-maxed="1"' : ''}>
            <summary class="ability-card-row">
                <div class="ability-name">${escapeHtml(ab.name || ab.ability_id || 'Unknown')}</div>
                <div class="ability-tier-wrap">${tierContent}${omicronAdjacent}</div>
            </summary>
            <div class="ability-card-body">${descBody}</div>
        </details>
    `;
}

// Map an ability's (current tier, max tier) to a 0..8 colour-ramp step. Keeps
// "tier 0 = red" and "tier=max = green" stable across all ladder lengths so a
// Galactic Legend's 3-tier ability and an old kit's 8-tier ability both show
// the same colour at full-power.
//
// Discrete ramps for short ladders (1, 3 tiers); proportional rounding for the
// longer ones (7, 9). tier_max=8 is the identity case — existing visuals
// preserved untouched for the 1312 abilities (~75%) using that ladder.
function rampStepFor(tier, tierMax) {
    const t = Math.max(0, Math.min(tier ?? 0, tierMax ?? 0));
    if (!tierMax || tierMax <= 0) return 0;
    if (tierMax === 8) return t;                      // identity
    if (tierMax === 1) return t === 0 ? 0 : 8;        // untrained / maxed
    if (tierMax === 3) return [0, 2, 5, 8][t] ?? 8;   // red, orange, yellow, green
    // tier_max 7 or 9 (or any other oddball): proportional, round to nearest
    return Math.round((t / tierMax) * 8);
}

// Real SWGOH game-asset icons, bundled locally under icons/. Same files served
// by game-assets.swgoh.gg — saved here so we never depend on network or hotlink.

function updateCacheStatus() {
    const timestamp = localStorage.getItem('swgoh_character_data_v2_timestamp');
    if (timestamp) {
        const cacheDate = new Date(parseInt(timestamp));
        const now = new Date();
        const daysSince = Math.floor((now - cacheDate) / (1000 * 60 * 60 * 24));

        let statusText = `Character data cached ${cacheDate.toLocaleDateString()}`;
        if (daysSince === 0) {
            statusText += ' (today)';
        } else if (daysSince === 1) {
            statusText += ' (yesterday)';
        } else if (daysSince < 7) {
            statusText += ` (${daysSince} days ago)`;
        } else {
            statusText += ` (${Math.floor(daysSince / 7)} weeks ago - consider refreshing)`;
        }

        cacheStatus.textContent = statusText;
    } else {
        cacheStatus.textContent = 'No cached data - will fetch on first load';
    }
}

// =============================================================================
// Refresh-abilities popup
// -----------------------------------------------------------------------------
// Guides the user through running scrape-abilities.user.js on swgoh.gg, then
// accepts the downloaded abilities-data.json via drop-zone. Updates the in-memory
// abilitiesMap + localStorage cache live. The bundled file on disk doesn't get
// rewritten (browser can't write to disk from a static page) — but the user can
// manually replace abilities-data.json in the project root if they want it
// committed.
// =============================================================================

const refreshBtn      = document.getElementById('refreshAbilitiesBtn');
const refreshModal    = document.getElementById('refreshAbilitiesModal');
const refreshClose    = document.getElementById('refreshModalClose');
const refreshScriptEl = document.getElementById('refreshScriptText');
const refreshCopyBtn  = document.getElementById('refreshCopyBtn');
const refreshDropzone = document.getElementById('refreshDropzone');
const refreshFileIn   = document.getElementById('refreshFileInput');
const refreshStatus   = document.getElementById('refreshStatus');

let refreshScriptCache = null;  // lazy-loaded text of scrape-abilities.user.js

async function openRefreshModal() {
    // Load the scraper script text on first open. Single source of truth — same
    // file as the standalone scrape-abilities.user.js.
    if (refreshScriptCache === null) {
        try {
            const res = await fetch('scrape-abilities.user.js');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            refreshScriptCache = await res.text();
        } catch (e) {
            refreshScriptCache = `// Failed to load scrape-abilities.user.js: ${e.message}\n// Open the file from your project root instead.`;
        }
    }
    refreshScriptEl.value = refreshScriptCache;
    refreshStatus.textContent = '';
    refreshStatus.className = 'refresh-status';
    refreshModal.style.display = 'flex';
}

function closeRefreshModal() {
    refreshModal.style.display = 'none';
}

async function copyScript() {
    try {
        await navigator.clipboard.writeText(refreshScriptCache || '');
        refreshCopyBtn.textContent = '✓ Copied!';
        setTimeout(() => { refreshCopyBtn.textContent = '📋 Copy script'; }, 1800);
    } catch (e) {
        // Fallback: select the textarea so the user can copy manually
        refreshScriptEl.select();
        refreshCopyBtn.textContent = 'Select all → Ctrl+C';
    }
}

// Validate + ingest a freshly-scraped abilities-data.json (from drop or file pick)
async function ingestAbilitiesFile(file) {
    if (!file) return;
    refreshStatus.className = 'refresh-status';
    refreshStatus.textContent = `Reading ${file.name}…`;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Shape sanity check
        if (!data || typeof data !== 'object' || !data.units || typeof data.units !== 'object') {
            throw new Error('File doesn\'t look like an abilities bundle (missing `units` object).');
        }
        const unitCount = Object.keys(data.units).length;
        if (unitCount === 0) throw new Error('Bundle has zero units — scrape may have failed.');

        // Pick a sample unit and verify the inner shape too — catches malformed dumps
        const sampleUnit = Object.values(data.units)[0];
        if (!sampleUnit || !Array.isArray(sampleUnit.abilities)) {
            throw new Error('Unit entries are missing `abilities` arrays.');
        }

        // Write to cache + update the live map. Same keys loadCachedDataset uses,
        // so a page reload would still hit our fresh data via the fast path.
        try {
            localStorage.setItem('swgoh_abilities_data', text);
            localStorage.setItem('swgoh_abilities_data_timestamp', Date.now().toString());
        } catch (e) {
            console.warn('Could not cache abilities to localStorage:', e);
        }
        abilitiesMap = data.units;

        const ts = data._meta?.generated_at
            ? `(scraped ${new Date(data._meta.generated_at).toLocaleString()})`
            : '';
        refreshStatus.classList.add('refresh-status-ok');
        refreshStatus.innerHTML = `✓ Loaded ${unitCount} units ${ts}.<br>` +
            `Re-fetch your roster (or open any unit) to see the fresh descriptions.`;
        console.log(`✓ Refreshed abilitiesMap from drop — ${unitCount} units`);
    } catch (e) {
        refreshStatus.classList.add('refresh-status-err');
        refreshStatus.textContent = `✗ ${e.message}`;
    }
}

// =============================================================================
// Sync New Units
// -----------------------------------------------------------------------------
// swgoh.gg/api/characters/ is Cloudflare/CORS-blocked from both localhost and
// Node. The workaround: scrape-characters.user.js runs inside a swgoh.gg tab
// (same-origin), fetches the list, and POSTs to /save-characters on the local
// server. This modal provides the script + checks what changed after it runs.
// =============================================================================

const syncModal        = document.getElementById('syncUnitsModal');
const syncModalClose   = document.getElementById('syncUnitsModalClose');
const syncCharsScript  = document.getElementById('syncCharsScript');
const syncCharsCopyBtn = document.getElementById('syncCharsCopyBtn');
const syncFetchBtn     = document.getElementById('syncFetchBtn');
const syncFetchStatus  = document.getElementById('syncFetchStatus');
const syncStep2        = document.getElementById('syncStep2');
const syncNewUnitsList = document.getElementById('syncNewUnitsList');
const syncStep3        = document.getElementById('syncStep3');
const syncAbilitiesScript  = document.getElementById('syncAbilitiesScript');
const syncAbilitiesCopyBtn = document.getElementById('syncAbilitiesCopyBtn');

let syncBaselineIds = new Set();  // base_ids in characters-data.json when modal opened

async function openSyncModal() {
    syncFetchStatus.textContent = '';
    syncFetchStatus.className = 'refresh-status';
    syncStep2.style.display = 'none';
    syncStep3.style.display = 'none';
    syncBaselineIds = new Set();

    // Snapshot current local file so "Check" can diff after the script runs
    try {
        const res = await fetch('characters-data.json');
        if (res.ok) {
            const data = await res.json();
            data.forEach(c => syncBaselineIds.add(c.base_id));
        }
    } catch (e) { /* baseline stays empty — all will show as new */ }

    // Load the character sync script text
    if (syncCharsScript) {
        try {
            const res = await fetch('scrape-characters.user.js');
            syncCharsScript.value = res.ok ? await res.text() : '// Failed to load scrape-characters.user.js';
        } catch (e) {
            syncCharsScript.value = `// Error: ${e.message}`;
        }
    }

    syncModal.style.display = 'flex';
}

function closeSyncModal() {
    syncModal.style.display = 'none';
}

syncCharsCopyBtn?.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(syncCharsScript?.value || '');
        syncCharsCopyBtn.textContent = '✓ Copied!';
        setTimeout(() => { syncCharsCopyBtn.textContent = '📋 Copy script'; }, 1800);
    } catch (e) {
        syncCharsScript?.select();
        syncCharsCopyBtn.textContent = 'Select all → Ctrl+C';
    }
});

// "Check" reads the current characters-data.json and diffs against the baseline
// snapshot taken when the modal opened — shows what the script saved.
syncFetchBtn?.addEventListener('click', async () => {
    syncFetchStatus.className = 'refresh-status';
    syncFetchStatus.textContent = 'Reading characters-data.json…';
    syncFetchBtn.disabled = true;

    try {
        const res = await fetch(`characters-data.json?_=${Date.now()}`);
        if (!res.ok) throw new Error('Could not load characters-data.json');
        const currentData = await res.json();

        const newUnits = currentData.filter(c => !syncBaselineIds.has(c.base_id));

        if (newUnits.length === 0) {
            syncFetchStatus.className = 'refresh-status';
            syncFetchStatus.textContent = `No new units found — run the script above first, then click Check again.`;
            syncStep2.style.display = 'none';
        } else {
            syncFetchStatus.className = 'refresh-status refresh-status-ok';
            syncFetchStatus.textContent = `✓ ${newUnits.length} new unit(s) added to local file.`;

            syncNewUnitsList.innerHTML = newUnits.map(c => `
                <div class="sync-unit-item">
                    <img src="${c.image || ''}" alt="" class="sync-unit-portrait" onerror="this.style.display='none'">
                    <span class="sync-unit-name">${c.name}</span>
                    <span class="sync-unit-id">${c.base_id}</span>
                </div>
            `).join('');
            syncStep2.style.display = 'block';

            // Update baseline so re-clicking Check doesn't re-list the same units
            newUnits.forEach(c => syncBaselineIds.add(c.base_id));

            // Patch live baseCharMap
            newUnits.forEach(c => { baseCharMap[c.base_id] = c; });

            // Build delta abilities script
            const slugs = newUnits.map(c => {
                const m = (c.url || '').match(/\/(units|characters)\/([^/]+)\//);
                return m ? m[2] : null;
            }).filter(Boolean);
            await buildDeltaAbilitiesScript(slugs);
            syncStep3.style.display = 'block';
        }
    } catch (e) {
        syncFetchStatus.className = 'refresh-status refresh-status-err';
        syncFetchStatus.textContent = `✗ ${e.message}`;
    } finally {
        syncFetchBtn.disabled = false;
    }
});

async function buildDeltaAbilitiesScript(slugs) {
    try {
        const res = await fetch('scrape-abilities.user.js');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const template = await res.text();
        syncAbilitiesScript.value = template.replace(
            /const SLUG_FILTER = null;/,
            `const SLUG_FILTER = ${JSON.stringify(slugs)};`
        );
    } catch (e) {
        syncAbilitiesScript.value = `// Failed to load scrape-abilities.user.js: ${e.message}`;
    }
}

syncAbilitiesCopyBtn?.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(syncAbilitiesScript?.value || '');
        syncAbilitiesCopyBtn.textContent = '✓ Copied!';
        setTimeout(() => { syncAbilitiesCopyBtn.textContent = '📋 Copy script'; }, 1800);
    } catch (e) {
        syncAbilitiesScript?.select();
        syncAbilitiesCopyBtn.textContent = 'Select all → Ctrl+C';
    }
});

document.getElementById('syncNewUnitsBtn')?.addEventListener('click', openSyncModal);
syncModalClose?.addEventListener('click', closeSyncModal);
syncModal?.addEventListener('click', e => { if (e.target === syncModal) closeSyncModal(); });

// =============================================================================
// Journey Guide
// =============================================================================


// Lookup a unit in the player's roster by base_id. Returns null if not owned.
function journeyLookupUnit(baseId) {
    return allCharacters.find(c => c.data.base_id === baseId) ||
           allShips.find(s => s.data.base_id === baseId) ||
           null;
}

// Per-stat readiness: true if the player's value meets the requirement.
function journeyStatMet(unit, req) {
    if (!unit) return { stars: false, level: false, gear: false, relic: false };
    const d = unit.data;
    const relicDisplay = (d.relic_tier || 0) > 2 ? d.relic_tier - 2 : 0;
    return {
        stars: d.rarity >= req.stars,
        level: d.level >= 85,
        gear:  req.gear  === null ? true : d.gear_level >= req.gear,
        relic: req.relic === null ? true : relicDisplay >= req.relic,
    };
}

// Map a 0..N score to a ramp step 0..8.
function journeyRampStep(score, total) {
    if (total === 0) return 8;
    return Math.round((score / total) * 8);
}

// Color class for a gear pip at a given index (1-based).
function gearPipClass(index) {
    if (index <= 4) return 'lit-red';
    if (index <= 8) return 'lit-yellow';
    return 'lit-green';
}

function levelFillColor(level) {
    if (level >= 85) return '#40c057';
    if (level >= 50) return '#fab005';
    return '#fa5252';
}

// Render the stat cell (label + pip bar) for a single requirement stat.
function renderJourneyStatCell(label, current, required, mode) {
    if (mode === 'level') {
        const pct = Math.min(100, Math.round((current / 85) * 100));
        const color = levelFillColor(current);
        return `
            <div class="journey-stat-cell">
                <span class="journey-stat-label">${label}: ${current}</span>
                <div class="journey-level-bar">
                    <div class="journey-level-fill" style="width:${pct}%;background:${color};"></div>
                </div>
            </div>`;
    }
    if (mode === 'stars') {
        const pips = Array.from({ length: 7 }, (_, i) =>
            `<div class="journey-pip${i < current ? ' lit-green' : ''}"></div>`
        ).join('');
        return `
            <div class="journey-stat-cell">
                <span class="journey-stat-label">${label}: ${current}★</span>
                <div class="journey-pips">${pips}</div>
            </div>`;
    }
    if (mode === 'gear') {
        const pips = Array.from({ length: 13 }, (_, i) => {
            const lit = i < current;
            const cls = lit ? gearPipClass(i + 1) : '';
            return `<div class="journey-pip${cls ? ' ' + cls : ''}"></div>`;
        }).join('');
        return `
            <div class="journey-stat-cell">
                <span class="journey-stat-label">${label}: G${current}</span>
                <div class="journey-pips">${pips}</div>
            </div>`;
    }
    if (mode === 'relic') {
        const count = required || 0;
        // count=0 means no relic required — show X/0 with no pips
        const pips = count > 0
            ? Array.from({ length: count }, (_, i) =>
                `<div class="journey-pip${i < current ? ' lit-green' : ''}"></div>`
              ).join('')
            : `<div class="journey-pip-none"></div>`;
        return `
            <div class="journey-stat-cell">
                <span class="journey-stat-label">${label}: ${current}/${count}</span>
                <div class="journey-pips">${pips}</div>
            </div>`;
    }
    return '';
}

// Render one requirement row.
function renderJourneyReqRow(req) {
    const unit = journeyLookupUnit(req.base_id);
    const d = unit ? unit.data : null;
    const baseDef = baseCharMap[req.base_id];
    const relicDisplay = d ? ((d.relic_tier || 0) > 2 ? d.relic_tier - 2 : 0) : 0;

    // Row ramp: Stars + Relic (when required). Gear and Level excluded from scoring.
    const isShipReq = req.gear === null && req.relic === null;
    const starsScore = d ? Math.min(d.rarity, req.stars) : 0;
    const relicScore = (req.relic !== null && d) ? Math.min(relicDisplay, req.relic) : 0;
    const starsPoss  = req.stars;
    const relicPoss  = req.relic ?? 0;
    const totalScored   = starsScore + relicScore;
    const totalPossible = starsPoss  + relicPoss;
    const rampStep = unit ? journeyRampStep(totalScored, totalPossible) : 0;

    const imgSrc = d?.image || baseDef?.image || SHIP_IMAGE_MAP[req.base_id] || null;
    const portrait = imgSrc
        ? `<img class="journey-req-portrait" src="${imgSrc}" alt="" loading="lazy">`
        : `<div class="journey-req-portrait journey-req-portrait-placeholder">?</div>`;

    // Fixed column order: Level, Stars, Gear, Relic
    // Ships (gear===null && relic===null): only show Stars
    // Gear: always shown for non-ship reqs, never scored — display current/required
    // Relic: always shown for non-ship reqs — X/req when gated, X/0 when not required
    const levelCell = renderJourneyStatCell('Level', d?.level ?? 1, 85, 'level');
    const starsCell = renderJourneyStatCell('Stars', d?.rarity ?? 0, req.stars, 'stars');
    const gearCell  = isShipReq ? '' : renderJourneyStatCell('Gear',  d?.gear_level ?? 0, req.gear ?? 13, 'gear');
    const relicCell = isShipReq ? '' : renderJourneyStatCell('Relic', relicDisplay, req.relic ?? 0, 'relic');

    const rowClass = unit ? '' : ' journey-req-unowned';
    const stepAttr = unit ? ` data-ramp-step="${rampStep}"` : '';
    const baseIdAttr = unit ? ` data-base-id="${escapeHtml(req.base_id)}"` : '';

    return `
        <div class="journey-req-row${rowClass}"${stepAttr}${baseIdAttr}>
            ${portrait}
            <div class="journey-req-name">${escapeHtml(req.name)}</div>
            <div class="journey-req-stats">
                ${levelCell}
                ${starsCell}
                ${gearCell}
                ${relicCell}
            </div>
        </div>`;
}

// Render faction-req row — shows faction image + "Any N Faction" label,
// progress derived from the reward unit's own stars/level.
function renderJourneyFactionRow(factionReq) {
    const reqLabel = factionReq.relic !== null
        ? `R${factionReq.relic}`
        : factionReq.gear !== null ? `G${factionReq.gear}` : `${factionReq.stars}★`;

    const portrait = factionReq.faction_image
        ? `<img class="journey-req-portrait" src="${factionReq.faction_image}" alt="${escapeHtml(factionReq.faction)}" loading="lazy">`
        : `<div class="journey-req-portrait journey-req-portrait-placeholder">★</div>`;

    return `
        <div class="journey-req-row journey-req-faction" data-ramp-step="4">
            ${portrait}
            <div class="journey-req-name">Any ${factionReq.count} ${escapeHtml(factionReq.faction)}</div>
            <div class="journey-req-stats">
                <div class="journey-stat-cell">
                    <span class="journey-stat-label">Req: ${reqLabel}, ${factionReq.stars}★</span>
                    <span class="journey-faction-note">Progress based on reward unit ownership</span>
                </div>
            </div>
        </div>`;
}

// Compute overall card readiness (0.0–1.0).
//
// Scoring: Stars + Relic (when required) + Gear (when required, no relic).
// Level is excluded — every owned unit is L85 so it adds no signal.
// Ships (gear===null && relic===null): stars only.
// Faction events: proxy via reward unit ownership (stars only, 7★ = 100%).
// Unowned units score 0.
function journeyCardReadiness(event) {
    if (event.faction_req) {
        const reward = journeyLookupUnit(event.reward_base_id);
        if (!reward) return 0;
        const d = reward.data;
        return Math.floor((Math.min(d.rarity, 7) / 7) * 100) / 100;
    }
    if (event.missing) return 0;
    const reqs = event.requirements || [];
    if (reqs.length === 0) return 1;

    let scored = 0, possible = 0;

    for (const req of reqs) {
        const unit = journeyLookupUnit(req.base_id);
        const d = unit ? unit.data : null;
        const relicDisplay = d ? ((d.relic_tier || 0) > 2 ? d.relic_tier - 2 : 0) : 0;
        const isShipReq = req.gear === null && req.relic === null;

        // Stars (always scored)
        possible += req.stars;
        scored   += d ? Math.min(d.rarity, req.stars) : 0;

        // Relic (when required)
        if (req.relic !== null) {
            possible += req.relic;
            scored   += d ? Math.min(relicDisplay, req.relic) : 0;
        }
    }

    return possible > 0 ? Math.floor((scored / possible) * 100) / 100 : 1;
}

function journeyReadinessClass(readiness) {
    if (readiness >= 1)   return 'journey-done';
    if (readiness >= 0.5) return 'journey-progress';
    if (readiness > 0)    return 'journey-started';
    return 'journey-locked';
}

const JOURNEY_TYPE_LABELS = {
    'Galactic Legend': 'GL',
    'Legendary': 'Legendary',
    "Hero's Journey": "Hero's Journey",
    'Ship': 'Ship',
    'Colosseum': 'Colosseum',
    'Unavailable': 'Unavailable',
};

function renderJourneyCard(event) {
    const readiness = journeyCardReadiness(event);
    const statusClass = journeyReadinessClass(readiness);
    const typeLabel = JOURNEY_TYPE_LABELS[event.type] || event.type;

    // Reward unit — prefer owned roster entry for live data, fall back to base definition
    const rewardUnit = allCharacters.find(c => c.data.base_id === event.reward_base_id)
                    || allShips.find(s => s.data.base_id === event.reward_base_id);
    const rewardBase = baseCharMap[event.reward_base_id];
    const rewardImg  = event.reward_image || rewardUnit?.data?.image || rewardBase?.image || SHIP_IMAGE_MAP[event.reward_base_id] || null;

    // Ships carry no alignment in the API — use a hardcoded map for known capital ships
    const SHIP_ALIGNMENT = {
        CAPITALCHIMAERA:           'Dark Side',
        CAPITALLEVIATHAN:          'Dark Side',
        CAPITALEXECUTOR:           'Dark Side',
        CAPITALSTARDESTROYER:      'Dark Side',
        CAPITALFINALIZER:          'Dark Side',
        CAPITALMONCALAMARICRUISER: 'Light Side',
        CAPITALPROFUNDITY:         'Light Side',
        CAPITALNEGOTIATOR:         'Light Side',
        CAPITALRADDUS:             'Light Side',
        CAPITALJEDICRUISER:        'Light Side',
        MILLENNIUMFALCON:          'Light Side',
        MILLENNIUMFALCONPRISTINE:  'Light Side',
        MILLENNIUMFALCONEP7:       'Light Side',
    };
    const alignment = rewardUnit?.data?.alignment || rewardBase?.alignment || SHIP_ALIGNMENT[event.reward_base_id] || null;

    const alignClass =
        alignment === 'Dark Side'  ? 'align-dark'  :
        alignment === 'Light Side' ? 'align-light' :
        'align-neutral';

    const rewardPortrait = rewardImg
        ? `<img class="journey-card-portrait" src="${rewardImg}" alt="${escapeHtml(event.reward_name)}" loading="lazy">`
        : `<div class="journey-card-portrait journey-card-portrait-placeholder">${escapeHtml(event.reward_name[0] || '?')}</div>`;

    // Progress bar: floor percentage, color on a red→green ramp
    const progressPct   = Math.floor(readiness * 100);
    const progressColor =
        progressPct >= 100 ? '#40c057' :
        progressPct >= 75  ? '#94d82d' :
        progressPct >= 50  ? '#fab005' :
        progressPct >= 25  ? '#fd7e14' :
        '#fa5252';

    const reqRows = event.missing
        ? `<div class="journey-missing-label">Requirements not yet available</div>`
        : event.type === 'Unavailable'
            ? `<div class="journey-missing-label">🔒 This event is not yet available in the game</div>`
            : event.faction_req
                ? renderJourneyFactionRow(event.faction_req)
                : (event.requirements || []).map(renderJourneyReqRow).join('');

    const isComplete = readiness >= 1;
    const isUnavailable = event.type === 'Unavailable';

    return `
        <details class="journey-card ${statusClass}${isUnavailable ? ' journey-unavailable' : ''}" data-slug="${escapeHtml(event.slug)}" ${isComplete ? '' : 'open'}>
            <summary class="journey-card-header ${alignClass}">
                <button class="journey-card-edit-btn" data-edit-slug="${escapeHtml(event.slug)}" title="Edit event">✏</button>
                ${isUnavailable ? '<span class="journey-lock-icon">🔒</span>' : ''}
                ${rewardPortrait}
                <div class="journey-card-header-text">
                    <div class="journey-card-name">${escapeHtml(event.reward_name)}</div>
                    <div class="journey-card-event">${escapeHtml(event.name)}</div>
                    <div class="journey-progress-bar-wrap">
                        <div class="journey-progress-bar" style="width:${progressPct}%;background:${progressColor};"></div>
                    </div>
                    <div class="journey-progress-label">${progressPct}%</div>
                </div>
                <span class="journey-type-badge">${escapeHtml(typeLabel)}</span>
            </summary>
            <div class="journey-reqs">${reqRows}</div>
        </details>`;
}

function displayJourneyGuide(events) {
    const list = document.getElementById('journeyList');
    const stats = document.getElementById('journeyStats');

    if (!events || events.length === 0) {
        list.innerHTML = '<p class="placeholder">No journey events found</p>';
        stats.innerHTML = '';
        return;
    }

    const ordered = [...events];

    const done     = ordered.filter(e => journeyCardReadiness(e) >= 1).length;
    const progress = ordered.filter(e => { const r = journeyCardReadiness(e); return r > 0 && r < 1; }).length;
    const locked   = ordered.filter(e => journeyCardReadiness(e) === 0).length;
    stats.innerHTML = `<strong>Journey Guide:</strong> ${events.length} events &nbsp;·&nbsp; <span style="color:#2b8a3e">✓ ${done} done</span> &nbsp;·&nbsp; <span style="color:#e67700">${progress} in progress</span> &nbsp;·&nbsp; <span style="color:#c92a2a">${locked} locked</span>`;

    const SECTION_ORDER = ['Colosseum', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5', 'Galactic Legend'];
    const SECTION_LABELS = {
        'Colosseum':       'Colosseum',
        'Tier 1':          'Tier 1',
        'Tier 2':          'Tier 2',
        'Tier 3':          'Tier 3',
        'Tier 4':          'Tier 4',
        'Tier 5':          'Tier 5',
        'Galactic Legend': 'Galactic Legends',
    };
    const SECTION_HEADER_OVERRIDE = {
        'Colosseum': '#b8860b',
    };

    const groups = {};
    SECTION_ORDER.forEach(t => { groups[t] = []; });
    ordered.forEach(e => {
        const bucket = (e.type === 'Colosseum') ? 'Colosseum' : (groups[e.tier] ? e.tier : 'Tier 1');
        groups[bucket].push(e);
    });

    list.innerHTML = SECTION_ORDER.map(type => {
        const sectionEvents = groups[type];
        if (!sectionEvents || sectionEvents.length === 0) return '';

        // Section readiness = average of all event readiness values
        const total = sectionEvents.reduce((sum, e) => sum + journeyCardReadiness(e), 0);
        const avg   = total / sectionEvents.length;
        const allDone = avg >= 1;

        const sectionPct = Math.floor(avg * 100);
        const headerColor = SECTION_HEADER_OVERRIDE[type] || (
            sectionPct >= 100 ? '#2b8a3e' :
            sectionPct >= 75  ? '#5c940d' :
            sectionPct >= 50  ? '#e67700' :
            sectionPct >= 25  ? '#d9480f' :
            '#c92a2a');

        const cards = sectionEvents.map(renderJourneyCard).join('');

        return `
            <details class="journey-section" ${allDone ? '' : 'open'}>
                <summary class="journey-section-header" style="background:${headerColor};">
                    <span class="journey-section-title">${escapeHtml(SECTION_LABELS[type])}</span>
                    <span class="journey-section-meta">${sectionEvents.length} events · ${sectionPct}% ready</span>
                </summary>
                <div class="journey-section-body">
                    <div class="journey-list" data-section="${escapeHtml(type)}">
                        ${cards}
                    </div>
                </div>
            </details>`;
    }).join('');
}

if (refreshBtn) {
    refreshBtn.addEventListener('click', openRefreshModal);
    refreshClose.addEventListener('click', closeRefreshModal);
    refreshModal.addEventListener('click', e => { if (e.target === refreshModal) closeRefreshModal(); });
    refreshCopyBtn.addEventListener('click', copyScript);

    refreshFileIn.addEventListener('change', e => ingestAbilitiesFile(e.target.files?.[0]));

    // Drag-and-drop on the dropzone
    refreshDropzone.addEventListener('dragover', e => {
        e.preventDefault();
        refreshDropzone.classList.add('refresh-dropzone-active');
    });
    refreshDropzone.addEventListener('dragleave', () => {
        refreshDropzone.classList.remove('refresh-dropzone-active');
    });
    refreshDropzone.addEventListener('drop', e => {
        e.preventDefault();
        refreshDropzone.classList.remove('refresh-dropzone-active');
        const file = e.dataTransfer.files?.[0];
        ingestAbilitiesFile(file);
    });
}

const clearCacheBtn = document.getElementById('clearCacheBtn');
if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
        const PRESERVE_KEYS = new Set(['swgoh_saved_ally_code']);
        Object.keys(localStorage)
            .filter(k => k.startsWith('swgoh_') && !PRESERVE_KEYS.has(k))
            .forEach(k => localStorage.removeItem(k));
        location.reload();
    });
}

// ── Journey event editor ─────────────────────────────────────────────────────

const journeyEditorModal = document.getElementById('journeyEditorModal');
const journeyAddBtn      = document.getElementById('journeyAddBtn');
const jeEventName        = document.getElementById('jeEventName');
const jeRewardSearch     = document.getElementById('jeRewardSearch');
const jeRewardDropdown   = document.getElementById('jeRewardDropdown');
const jeRewardBaseId     = document.getElementById('jeRewardBaseId');
const jeRewardPreview    = document.getElementById('jeRewardPreview');
const jeType             = document.getElementById('jeType');
const jeSection          = document.getElementById('jeSection');
const jePosition         = document.getElementById('jePosition');
const jeReqList          = document.getElementById('jeReqList');
const jeReqSearch        = document.getElementById('jeReqSearch');
const jeReqDropdown      = document.getElementById('jeReqDropdown');
const jeSave             = document.getElementById('jeSave');
const jeCancel           = document.getElementById('jeCancel');
const jeDelete           = document.getElementById('jeDelete');
const jeStatus           = document.getElementById('jeStatus');

let jeEditingSlug = null;   // null = add mode, string = edit mode
let jeRequirements = [];    // working copy of req rows

function jeAllUnits() {
    const chars = allCharacters.map(c => ({ name: c.data.name, base_id: c.data.base_id, image: c.data.image }));
    const ships = allShips.map(s => ({ name: s.data.name, base_id: s.data.base_id, image: SHIP_IMAGE_MAP[s.data.base_id] || null }));
    const base  = Object.values(baseCharMap).map(u => ({ name: u.name, base_id: u.base_id, image: u.image || null }));
    const seen  = new Set();
    return [...chars, ...ships, ...base].filter(u => {
        if (!u.base_id || seen.has(u.base_id)) return false;
        seen.add(u.base_id);
        return true;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function jeFilterUnits(query) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return jeAllUnits().filter(u => u.name && u.name.toLowerCase().includes(q)).slice(0, 20);
}

function jeRenderDropdown(dropdown, results, onSelect) {
    if (!results.length) { dropdown.classList.remove('open'); return; }
    dropdown.innerHTML = results.map(u => `
        <div class="je-unit-option" data-base-id="${escapeHtml(u.base_id)}" data-name="${escapeHtml(u.name || '')}">
            ${u.image ? `<img src="${u.image}" loading="lazy" onerror="this.style.display='none'">` : ''}
            <span>${escapeHtml(u.name || u.base_id)}</span>
        </div>`).join('');
    dropdown.classList.add('open');
    dropdown.querySelectorAll('.je-unit-option').forEach(el => {
        el.addEventListener('mousedown', e => {
            e.preventDefault();
            onSelect(el.dataset.baseId, el.dataset.name);
            dropdown.classList.remove('open');
        });
    });
}

function jeSetReward(base_id, name) {
    jeRewardBaseId.value = base_id;
    jeRewardSearch.value = name;
    const unit = jeAllUnits().find(u => u.base_id === base_id);
    const img  = (unit && unit.image) ? `<img src="${unit.image}" loading="lazy">` : '';
    jeRewardPreview.innerHTML = img ? `${img}<span>${escapeHtml(name)}</span>` : `<span>${escapeHtml(name)}</span>`;
}

jeRewardSearch.addEventListener('input', () => {
    jeRenderDropdown(jeRewardDropdown, jeFilterUnits(jeRewardSearch.value), (id, name) => jeSetReward(id, name));
});
jeRewardSearch.addEventListener('blur', () => setTimeout(() => jeRewardDropdown.classList.remove('open'), 150));

function jeRenderReqRows() {
    const last = jeRequirements.length - 1;
    jeReqList.innerHTML = jeRequirements.map((req, i) => {
        const unit   = jeAllUnits().find(u => u.base_id === req.base_id);
        const img    = (unit && unit.image) ? `<img src="${unit.image}" loading="lazy" onerror="this.style.display='none'">` : '<div style="width:24px"></div>';
        const isShip = unit ? (unit.combat_type === 2) : false;
        return `
        <div class="je-req-row" data-idx="${i}">
            ${img}
            <span>${escapeHtml(req.name || req.base_id)}</span>
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                <span class="je-req-label">Stars</span>
                <input type="number" class="je-req-stars" min="1" max="7" value="${req.stars}" data-idx="${i}">
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                <span class="je-req-label">Gear</span>
                <input type="number" class="je-req-gear" min="1" max="13" value="${req.gear ?? ''}" placeholder="—" data-idx="${i}" ${isShip ? 'disabled' : ''}>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                <span class="je-req-label">Relic</span>
                <input type="number" class="je-req-relic" min="1" max="9" value="${req.relic ?? ''}" placeholder="—" data-idx="${i}" ${isShip ? 'disabled' : ''}>
            </div>
            <div class="je-req-move">
                <button class="je-req-up" data-idx="${i}" title="Move up" ${i === 0 ? 'disabled' : ''}>▲</button>
                <button class="je-req-dn" data-idx="${i}" title="Move down" ${i === last ? 'disabled' : ''}>▼</button>
            </div>
            <button class="je-req-remove" data-idx="${i}" title="Remove">✕</button>
        </div>`;
    }).join('');

    jeReqList.querySelectorAll('.je-req-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            jeRequirements.splice(Number(btn.dataset.idx), 1);
            jeRenderReqRows();
        });
    });
    jeReqList.querySelectorAll('.je-req-up').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = Number(btn.dataset.idx);
            if (i === 0) return;
            [jeRequirements[i - 1], jeRequirements[i]] = [jeRequirements[i], jeRequirements[i - 1]];
            jeRenderReqRows();
        });
    });
    jeReqList.querySelectorAll('.je-req-dn').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = Number(btn.dataset.idx);
            if (i >= jeRequirements.length - 1) return;
            [jeRequirements[i], jeRequirements[i + 1]] = [jeRequirements[i + 1], jeRequirements[i]];
            jeRenderReqRows();
        });
    });
    jeReqList.querySelectorAll('.je-req-stars').forEach(inp => {
        inp.addEventListener('change', () => { jeRequirements[Number(inp.dataset.idx)].stars = Number(inp.value) || null; });
    });
    jeReqList.querySelectorAll('.je-req-gear').forEach(inp => {
        inp.addEventListener('change', () => { jeRequirements[Number(inp.dataset.idx)].gear = inp.value !== '' ? Number(inp.value) : null; });
    });
    jeReqList.querySelectorAll('.je-req-relic').forEach(inp => {
        inp.addEventListener('change', () => { jeRequirements[Number(inp.dataset.idx)].relic = inp.value !== '' ? Number(inp.value) : null; });
    });
}

jeReqSearch.addEventListener('input', () => {
    jeRenderDropdown(jeReqDropdown, jeFilterUnits(jeReqSearch.value), (id, name) => {
        jeRequirements.push({ name, base_id: id, stars: 7, gear: 13, relic: 0 });
        jeRenderReqRows();
        jeReqSearch.value = '';
        jeReqDropdown.classList.remove('open');
    });
});
jeReqSearch.addEventListener('blur', () => setTimeout(() => jeReqDropdown.classList.remove('open'), 150));

function jeOpen(existingEvent) {
    jeStatus.textContent = '';
    jeStatus.className = 'je-status';
    document.getElementById('journeyEditorTitle').textContent = existingEvent ? 'Edit Event' : 'Add Event';
    jeDelete.style.display = existingEvent ? 'inline-flex' : 'none';

    if (existingEvent) {
        jeEditingSlug = existingEvent.slug;
        jeEventName.value = existingEvent.name || '';
        jeSetReward(existingEvent.reward_base_id || '', existingEvent.reward_name || '');
        jeType.value    = existingEvent.type || 'Legendary';
        jeSection.value = existingEvent.tier || 'Tier 4';
        jeRequirements  = (existingEvent.requirements || []).map(r => ({ ...r }));
    } else {
        jeEditingSlug = null;
        jeEventName.value = '';
        jeRewardSearch.value = '';
        jeRewardBaseId.value = '';
        jeRewardPreview.innerHTML = '';
        jeType.value    = 'Legendary';
        jeSection.value = 'Tier 4';
        jeRequirements  = [];
    }

    // Rebuild position dropdown for chosen section.
    // On edit: pre-select current position (the event immediately before this one).
    if (existingEvent) {
        const section = existingEvent.tier;
        const sectionEvents = (journeyData || []).filter(e => {
            const bucket = (e.type === 'Colosseum') ? 'Colosseum' : e.tier;
            return bucket === section;
        });
        const idx = sectionEvents.findIndex(e => e.slug === existingEvent.slug);
        const prevSlug = idx === 0 ? 'first' : (sectionEvents[idx - 1]?.slug || null);
        jeUpdatePositionOptions(section, prevSlug);
    } else {
        jeUpdatePositionOptions('Tier 4');
    }
    jeSection.addEventListener('change', () => jeUpdatePositionOptions(jeSection.value));

    jeRenderReqRows();
    journeyEditorModal.style.display = 'flex';
}

function jeUpdatePositionOptions(section, selectAfterSlug) {
    const events = (journeyData || []).filter(e => {
        const bucket = (e.type === 'Colosseum') ? 'Colosseum' : e.tier;
        return bucket === section && e.slug !== jeEditingSlug;
    });
    const opts = [
        `<option value="first"${selectAfterSlug === 'first' ? ' selected' : ''}>First in section</option>`,
        ...events.map(e => `<option value="after:${escapeHtml(e.slug)}"${selectAfterSlug === e.slug ? ' selected' : ''}>After: ${escapeHtml(e.reward_name || e.name)}</option>`),
        `<option value="last"${!selectAfterSlug ? ' selected' : ''}>Last in section</option>`,
    ];
    jePosition.innerHTML = opts.join('');
}

function jeClose() {
    journeyEditorModal.style.display = 'none';
    jeSection.removeEventListener('change', () => {});
}

async function jeSaveEvent() {
    const name       = jeEventName.value.trim();
    const rewardName = jeRewardSearch.value.trim();
    const rewardId   = jeRewardBaseId.value.trim();
    const type       = jeType.value;
    const section    = jeSection.value;
    const position   = jePosition.value;

    if (!name)       { jeStatus.textContent = 'Event name is required.'; jeStatus.className = 'je-status err'; return; }
    if (!rewardName) { jeStatus.textContent = 'Reward unit is required.'; jeStatus.className = 'je-status err'; return; }

    const slug = jeEditingSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    const newEvent = {
        slug,
        name,
        tier: section,
        type,
        reward_name: rewardName,
        reward_base_id: rewardId,
        requirements: jeRequirements,
    };

    let data = [...(journeyData || [])];

    // Remove existing entry first (applies to both add and edit)
    if (jeEditingSlug) {
        data = data.filter(e => e.slug !== jeEditingSlug);
    }

    // Insert at chosen position
    if (position === 'first') {
        const firstIdx = data.findIndex(e => (e.type === 'Colosseum' ? 'Colosseum' : e.tier) === section);
        if (firstIdx >= 0) data.splice(firstIdx, 0, newEvent);
        else data.push(newEvent);
    } else if (position.startsWith('after:')) {
        const afterSlug = position.slice(6);
        const afterIdx  = data.findIndex(e => e.slug === afterSlug);
        if (afterIdx >= 0) data.splice(afterIdx + 1, 0, newEvent);
        else data.push(newEvent);
    } else {
        // last in section
        let lastIdx = -1;
        data.forEach((e, i) => {
            if ((e.type === 'Colosseum' ? 'Colosseum' : e.tier) === section) lastIdx = i;
        });
        if (lastIdx >= 0) data.splice(lastIdx + 1, 0, newEvent);
        else data.push(newEvent);
    }

    jeStatus.textContent = 'Saving…';
    jeStatus.className = 'je-status';
    try {
        saveJourneyData(data);
        journeyData = data;
        jeStatus.textContent = 'Saved!';
        jeStatus.className = 'je-status ok';
        buildRequiredAtMap(journeyData);
        displayJourneyGuide(journeyData);
        setTimeout(jeClose, 800);
    } catch (e) {
        jeStatus.textContent = 'Error: ' + e.message;
        jeStatus.className = 'je-status err';
    }
}

async function jeDeleteEvent() {
    if (!jeEditingSlug) return;
    if (!confirm(`Delete "${jeEventName.value.trim()}"? This cannot be undone.`)) return;

    const data = (journeyData || []).filter(e => e.slug !== jeEditingSlug);
    jeStatus.textContent = 'Deleting…';
    try {
        saveJourneyData(data);
        journeyData = data;
        displayJourneyGuide(journeyData);
        jeClose();
    } catch (e) {
        jeStatus.textContent = 'Error: ' + e.message;
        jeStatus.className = 'je-status err';
    }
}

if (journeyAddBtn) journeyAddBtn.addEventListener('click', () => jeOpen(null));
if (jeCancel)           jeCancel.addEventListener('click', jeClose);
if (jeSave)             jeSave.addEventListener('click', jeSaveEvent);
if (jeDelete)           jeDelete.addEventListener('click', jeDeleteEvent);
journeyEditorModal?.addEventListener('click', e => { if (e.target === journeyEditorModal) jeClose(); });

// Edit button clicks on rendered cards (delegated)
document.addEventListener('click', e => {
    const editBtn = e.target.closest('.journey-card-edit-btn');
    if (!editBtn) return;
    e.preventDefault();
    e.stopPropagation();
    const slug  = editBtn.dataset.editSlug;
    const event = (journeyData || []).find(ev => ev.slug === slug);
    if (event) jeOpen(event);
});

// Requirement row clicks — open unit detail modal for owned units
document.addEventListener('click', e => {
    const row = e.target.closest('.journey-req-row');
    if (!row) return;
    // Ignore clicks on the edit button that may bubble up through the card
    if (e.target.closest('.journey-card-edit-btn')) return;
    const baseId = row.dataset.baseId;
    if (!baseId) return;
    const unit = allCharacters.find(c => c.data.base_id === baseId);
    if (unit) openUnitDetail(unit, 'character');
});

// ===================================================
// SHARED UNIT HELPERS (used by farm editor)
// ===================================================

function teAllChars() {
    const owned = allCharacters.map(c => ({ name: c.data.name, base_id: c.data.base_id, image: c.data.image }));
    const base  = Object.values(baseCharMap)
        .filter(u => u.combat_type !== 2)
        .map(u => ({ name: u.name, base_id: u.base_id, image: u.image || null }));
    const seen = new Set();
    return [...owned, ...base].filter(u => {
        if (!u.base_id || seen.has(u.base_id)) return false;
        seen.add(u.base_id);
        return true;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function lookupCurrentStats(base_id) {
    const owned = allCharacters.find(c => c.data.base_id === base_id);
    if (!owned) return null;
    const d = owned.data;
    const relicRaw = d.relic_tier || 0;
    return {
        stars: d.rarity || 0,
        gear: d.gear_level || 0,
        relic: relicRaw > 2 ? relicRaw - 2 : 0,
        alignment: d.alignment || 'Neutral',
    };
}

// Star positions along the square perimeter of a 60×60 frame.
// Stars start at bottom-center and climb up both sides.
const STAR_ARC_SQUARE = [
    [30, 60],  // 1 — bottom center
    [48, 60],  // 2 — bottom right
    [12, 60],  // 3 — bottom left
    [60, 46],  // 4 — right lower
    [ 0, 46],  // 5 — left lower
    [60, 22],  // 6 — right upper
    [ 0, 22],  // 7 — left upper
];

function buildStarArcSquare(count) {
    if (!count) return '';
    return STAR_ARC_SQUARE.slice(0, count).map(([x, y]) =>
        `<span class="tup-star tup-star-filled tup-star-sq" style="left:${x}px;top:${y}px;">★</span>`
    ).join('');
}

// ===================================================
// FARMS TAB
// ===================================================

// Kyrotech needed per unit that hasn't reached G13
// 173Salvage = Mk9 Battle Computer Prototype Salvage (for G12 → G13 path)
// 172Salvage = Mk7 Kyrotech Shock Prod Prototype Salvage
// Approximation: ~250 Mk9 + ~250 Mk7 salvage per unit for G12→G13 (rough average)
const KYRO_MK9_PER_UNIT = 250;  // Mk 9 Kyrotech Battle Computer Prototype Salvage needed per G12→G13
const KYRO_MK7_PER_UNIT = 250;  // Mk 7 Kyrotech Shock Prod Prototype Salvage needed per G12→G13

function computeFarmSummary(farm) {
    let totalRelicLevels = 0;
    let kyroMk9 = 0;
    let kyroMk7 = 0;
    let anyMissing = false;
    const materialTotals = {};  // material id → total quantity needed

    for (const u of (farm.units || [])) {
        const cur = lookupCurrentStats(u.base_id);
        const curRelic  = cur ? cur.relic  : 0;
        const curGear   = cur ? cur.gear   : 0;
        const curStars  = cur ? cur.stars  : 0;
        const tgtRelic  = u.target_relic  ?? 7;
        const tgtGear   = u.target_gear   ?? 13;

        if (curRelic < tgtRelic || curGear < tgtGear || curStars < (u.target_stars ?? 7)) anyMissing = true;

        if (curRelic < tgtRelic) {
            totalRelicLevels += tgtRelic - curRelic;

            // Sum materials for each relic level still needed (curRelic+1 … tgtRelic)
            for (let lvl = curRelic + 1; lvl <= tgtRelic; lvl++) {
                for (const mat of relicMaterials) {
                    const qty = mat.byRelic[String(lvl)];
                    if (qty) materialTotals[mat.id] = (materialTotals[mat.id] || 0) + qty;
                }
            }
        }

        if (curGear < 13) {
            kyroMk9 += KYRO_MK9_PER_UNIT;
            kyroMk7 += KYRO_MK7_PER_UNIT;
        }
    }

    return { totalRelicLevels, kyroMk9, kyroMk7, anyMissing, materialTotals };
}

function gearBorderClass(gear) {
    if (gear >= 13) return 'tup-gear-13';
    if (gear === 12) return 'tup-gear-12';
    if (gear >= 7)  return 'tup-gear-7';
    return 'tup-gear-low';
}

function renderFarmCard(farm, index) {
    const unitSlots = (farm.units || []).map((u, i) => {
        const cur = lookupCurrentStats(u.base_id);
        const base = baseCharMap[u.base_id];
        const img = u.image || base?.image || null;

        const tgtGear  = u.target_gear  ?? 13;
        const tgtRelic = u.target_relic ?? 7;
        const tgtStars = u.target_stars ?? 7;
        const curStars = cur ? cur.stars : 0;
        const curGear  = cur ? cur.gear  : 0;
        const curRelic = cur ? cur.relic : 0;
        const align    = cur ? cur.alignment : 'Neutral';

        const gearMet  = curGear  >= tgtGear;
        const relicMet = curRelic >= tgtRelic;

        const borderClass = gearBorderClass(curGear);
        const alignClass  = align === 'Dark Side' ? 'tup-align-dark' : align === 'Light Side' ? 'tup-align-light' : 'tup-align-neutral';
        const frameClass  = `tup-frame ${borderClass} ${curGear === 13 ? alignClass : ''}`;

        const imgEl = img
            ? `<img class="tup-img" src="${escapeHtml(img)}" alt="" data-base-id="${escapeHtml(u.base_id)}" loading="lazy">`
            : `<div class="tup-img tup-img-placeholder">${escapeHtml((u.name || '?')[0])}</div>`;

        const starHtml  = buildStarArcSquare(curStars);

        return `
            <div class="farm-unit-slot" data-base-id="${escapeHtml(u.base_id)}">
                <span class="farm-unit-table-name">${escapeHtml(u.name || u.base_id)}</span>
                <div class="farm-unit-portrait-wrap">
                    <div class="${frameClass}">${imgEl}${starHtml}</div>
                    ${tgtRelic > 0 ? `<span class="stat-xy relic${relicMet ? ' met' : ''}">R${curRelic}/${tgtRelic}</span>` : ''}
                </div>
            </div>`;
    }).join('');

    const { totalRelicLevels, anyMissing, materialTotals } = computeFarmSummary(farm);

    let summaryHtml = '';
    if (anyMissing && totalRelicLevels > 0) {
        const matRows = relicMaterials
            .filter(m => materialTotals[m.id])
            .map(m => `
                <tr class="farm-mat-row">
                    <td class="farm-mat-icon"><img src="${escapeHtml(m.image)}" alt="" loading="lazy"></td>
                    <td class="farm-mat-name">${escapeHtml(m.name)}</td>
                    <td class="farm-mat-qty">${materialTotals[m.id]}</td>
                </tr>`).join('');

        summaryHtml = `
            <details class="farm-summary farm-mat-details">
                <summary class="farm-summary-header">−${totalRelicLevels}R</summary>
                <div class="farm-mat-popover">
                    <table class="farm-mat-table">
                        <tbody>${matRows}</tbody>
                    </table>
                </div>
            </details>`;
    } else if (anyMissing) {
        summaryHtml = `<span class="farm-summary farm-summary-gear">Gear incomplete</span>`;
    }

    return `
        <div class="farm-card" data-farm-id="${escapeHtml(farm.id)}" draggable="true">
            <div class="farm-card-header">
                <span class="farm-card-priority">#${index + 1}</span>
                <span class="farm-card-name">${escapeHtml(farm.name)}</span>
                ${summaryHtml}
                <div class="farm-card-actions">
                    <button class="farm-card-edit-btn" data-edit-farm-id="${escapeHtml(farm.id)}" title="Edit farm">✏</button>
                </div>
            </div>
            <div class="farm-unit-strip">${unitSlots}</div>
        </div>`;
}

function saveFarms(data) {
    localStorage.setItem('swgoh_farms_data', JSON.stringify(data));
}

function saveJourneyData(data) {
    localStorage.setItem('swgoh_journey_data_v4', JSON.stringify(data));
}

function displayFarms(farms) {
    const list = document.getElementById('farmsList');
    const stats = document.getElementById('farmsStats');
    if (!list) return;
    if (!farms || farms.length === 0) {
        list.innerHTML = '<p class="placeholder">No farms yet — click + to add one</p>';
        if (stats) stats.innerHTML = '';
        return;
    }
    if (stats) stats.innerHTML = `<strong>Active Farms:</strong> ${farms.length}`;
    list.innerHTML = farms.map((f, i) => renderFarmCard(f, i)).join('');
    enableDragReorder(list, '.farm-card', 'data-farm-id', farmsData, 'id', saveFarms, () => displayFarms(farmsData));
}

// ===================================================
// DRAG-TO-REORDER (generic)
// ===================================================

function enableDragReorder(container, cardSelector, idAttr, dataArr, idKey, onSave, onRedraw) {
    let draggedId = null;
    container.querySelectorAll(cardSelector).forEach(card => {
        card.addEventListener('dragstart', e => {
            draggedId = card.getAttribute(idAttr);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => card.classList.add('farm-card-dragging'), 0);
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('farm-card-dragging');
            container.querySelectorAll(cardSelector).forEach(c => c.classList.remove('farm-card-drag-over'));
        });
        card.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const targetId = card.getAttribute(idAttr);
            if (targetId !== draggedId) {
                container.querySelectorAll(cardSelector).forEach(c => c.classList.remove('farm-card-drag-over'));
                card.classList.add('farm-card-drag-over');
            }
        });
        card.addEventListener('drop', e => {
            e.preventDefault();
            const targetId = card.getAttribute(idAttr);
            if (targetId === draggedId) return;
            const fromIdx = dataArr.findIndex(x => x[idKey] === draggedId);
            const toIdx   = dataArr.findIndex(x => x[idKey] === targetId);
            if (fromIdx === -1 || toIdx === -1) return;
            const [item] = dataArr.splice(fromIdx, 1);
            dataArr.splice(toIdx, 0, item);
            onSave(dataArr);
            onRedraw();
        });
    });
}

// Farm unit click → open unit detail modal
document.addEventListener('click', e => {
    const row = e.target.closest('.farm-unit-slot');
    if (!row) return;
    if (e.target.closest('.farm-card-edit-btn')) return;
    const baseId = row.dataset.baseId;
    if (!baseId) return;
    const unit = allCharacters.find(c => c.data.base_id === baseId);
    if (unit) openUnitDetail(unit, 'character');
});

// Team unit portrait click → open unit detail modal
document.addEventListener('click', e => {
    const portrait = e.target.closest('.team-unit-portrait[data-base-id], .tup-img[data-base-id]');
    if (!portrait) return;
    const baseId = portrait.dataset.baseId;
    if (!baseId) return;
    const unit = allCharacters.find(c => c.data.base_id === baseId);
    if (unit) openUnitDetail(unit, 'character');
});

// Farm card edit button
document.addEventListener('click', e => {
    const btn = e.target.closest('.farm-card-edit-btn');
    if (!btn) return;
    const id = btn.dataset.editFarmId;
    const farm = farmsData.find(f => f.id === id);
    if (farm) feOpen(farm);
});

// ===================================================
// FARM EDITOR MODAL
// ===================================================

const farmEditorModal = document.getElementById('farmEditorModal');
const feFarmName      = document.getElementById('feFarmName');
const feUnitList      = document.getElementById('feUnitList');
const feUnitSearch    = document.getElementById('feUnitSearch');
const feUnitDropdown  = document.getElementById('feUnitDropdown');
const feSaveBtn       = document.getElementById('feSave');
const feDeleteBtn     = document.getElementById('feDelete');
const feCancelBtn     = document.getElementById('feCancel');
const feStatusEl      = document.getElementById('feStatus');

let feEditingId = null;
let feUnits = [];  // { base_id, name, image, target_stars, target_gear, target_relic }
let feActiveTags = new Set();
let feActiveJourneys = new Set();  // selected journey slugs (OR logic)

function feGetCategories(base_id) {
    const owned = allCharacters.find(c => c.data.base_id === base_id);
    if (owned) return owned.data.categories || [];
    return baseCharMap[base_id]?.categories || [];
}

function feRenderTagPanel() {
    const grid = document.getElementById('feTagGrid');
    const countEl = document.getElementById('feTagActiveCount');
    if (!grid) return;

    // Collect all tags from the full character pool (excluding ships)
    const tagSet = new Set();
    teAllChars().forEach(u => {
        feGetCategories(u.base_id).forEach(t => tagSet.add(t));
    });
    const tags = Array.from(tagSet).sort();

    grid.innerHTML = tags.map(tag => {
        const active = feActiveTags.has(tag);
        return `<button class="fe-tag-chip${active ? ' active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
    }).join('');

    grid.querySelectorAll('.fe-tag-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            if (feActiveTags.has(tag)) feActiveTags.delete(tag);
            else feActiveTags.add(tag);
            feRenderTagPanel();
            // Re-run search with updated tag filter
            const results = feFilterUnits(feUnitSearch.value);
            jeRenderDropdown(feUnitDropdown, results, feHandleUnitSelect);
            if (results.length > 0) feUnitDropdown.classList.add('open');
            else feUnitDropdown.classList.remove('open');
        });
    });

    if (feActiveTags.size > 0) {
        countEl.textContent = feActiveTags.size;
        countEl.style.display = 'inline-flex';
    } else {
        countEl.style.display = 'none';
    }
}

function feRenderJourneyPanel() {
    const grid = document.getElementById('feJourneyGrid');
    const countEl = document.getElementById('feJourneyActiveCount');
    if (!grid) return;

    // Only journeys with individual unit requirements
    const journeys = (journeyData || []).filter(j => j.requirements && j.requirements.length > 0);

    grid.innerHTML = journeys.map(j => {
        const active = feActiveJourneys.has(j.slug);
        const img = j.reward_image || baseCharMap[j.reward_base_id]?.image || SHIP_IMAGE_MAP[j.reward_base_id] || '';
        const portrait = img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy">` : '';
        return `<button class="fe-journey-chip${active ? ' active' : ''}" data-slug="${escapeHtml(j.slug)}" title="${escapeHtml(j.name)}">
            ${portrait}<span>${escapeHtml(j.reward_name)}</span>
        </button>`;
    }).join('');

    grid.querySelectorAll('.fe-journey-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const slug = btn.dataset.slug;
            if (feActiveJourneys.has(slug)) feActiveJourneys.delete(slug);
            else feActiveJourneys.add(slug);
            feRenderJourneyPanel();
            const results = feFilterUnits(feUnitSearch.value);
            jeRenderDropdown(feUnitDropdown, results, feHandleUnitSelect);
            if (results.length > 0) feUnitDropdown.classList.add('open');
            else feUnitDropdown.classList.remove('open');
        });
    });

    if (feActiveJourneys.size > 0) {
        countEl.textContent = feActiveJourneys.size;
        countEl.style.display = 'inline-flex';
    } else {
        countEl.style.display = 'none';
    }
}

function feFilterUnits(query) {
    const q = (query || '').toLowerCase().trim();
    const selectedIds = new Set(feUnits.map(u => u.base_id));
    const all = teAllChars().filter(u => !selectedIds.has(u.base_id));
    // Filter by active tags (AND logic — unit must have ALL selected tags)
    const tagFiltered = feActiveTags.size === 0 ? all : all.filter(u => {
        const cats = feGetCategories(u.base_id);
        return [...feActiveTags].every(t => cats.includes(t));
    });
    // Filter by journey (OR logic — unit must appear in at least one selected journey)
    const journeyFiltered = feActiveJourneys.size === 0 ? tagFiltered : tagFiltered.filter(u => {
        const entries = requiredAtMap[u.base_id] || [];
        return entries.some(e => feActiveJourneys.has(e.journeySlug));
    });
    const anyFilter = feActiveTags.size > 0 || feActiveJourneys.size > 0;
    // Then filter by name query
    if (!q || q.length < 1) {
        return anyFilter ? journeyFiltered.slice(0, 30) : [];
    }
    return journeyFiltered.filter(u => u.name && u.name.toLowerCase().includes(q)).slice(0, 20);
}

function feHandleUnitSelect(base_id, name) {
    const base = baseCharMap[base_id];
    const ownedUnit = allCharacters.find(c => c.data.base_id === base_id);
    const image = ownedUnit?.data.image || base?.image || null;
    if (feUnits.length < 5 && !feUnits.find(u => u.base_id === base_id)) {
        const reqEntries = requiredAtMap[base_id] || [];
        const topRelic = reqEntries.find(e => e.pri === 2);
        const topGear  = reqEntries.find(e => e.pri === 1);
        const topStars = reqEntries.find(e => e.pri === 0);
        const defaultRelic = topRelic ? topRelic.val : 0;
        const defaultGear  = topGear  ? topGear.val  : (reqEntries.length ? 13 : 13);
        const defaultStars = topStars ? topStars.val : 7;
        feUnits.push({ base_id, name, image, target_stars: defaultStars, target_gear: defaultGear, target_relic: defaultRelic });
        feRenderUnitRows();
    }
    feUnitSearch.value = '';
    feUnitDropdown.classList.remove('open');
}

function feOpen(existingFarm) {
    feEditingId = existingFarm ? existingFarm.id : null;
    feFarmName.value = existingFarm ? existingFarm.name : '';
    feUnits = existingFarm ? existingFarm.units.map(u => ({ ...u })) : [];
    feActiveTags.clear();
    feActiveJourneys.clear();
    feStatusEl.textContent = '';
    feStatusEl.className = 'je-status';
    feDeleteBtn.style.display = existingFarm ? 'flex' : 'none';
    document.getElementById('farmEditorTitle').textContent = existingFarm ? 'Edit Farm' : 'Add Farm';
    feRenderUnitRows();
    feRenderTagPanel();
    feRenderJourneyPanel();
    farmEditorModal.style.display = 'flex';
}

function feClose() {
    farmEditorModal.style.display = 'none';
    feEditingId = null;
    feUnits = [];
    feActiveTags.clear();
    feActiveJourneys.clear();
    feUnitSearch.value = '';
    feUnitDropdown.classList.remove('open');
}

function feRenderUnitRows() {
    feUnitList.innerHTML = feUnits.map((u, i) => `
        <div class="fe-unit-row">
            ${u.image ? `<img src="${escapeHtml(u.image)}" alt="" loading="lazy">` : '<div style="width:26px;height:26px;background:#333;border-radius:4px;"></div>'}
            ${i === 0 ? '<span class="fe-unit-leader-tag">L</span>' : '<span></span>'}
            <span class="fe-unit-name">${escapeHtml(u.name || u.base_id)}</span>
            <label class="je-req-label">★</label>
            <input type="number" min="1" max="7" value="${u.target_stars ?? 7}" data-fe-idx="${i}" data-fe-field="target_stars">
            <label class="je-req-label">G</label>
            <input type="number" min="1" max="13" value="${u.target_gear ?? 13}" data-fe-idx="${i}" data-fe-field="target_gear">
            <label class="je-req-label">R</label>
            <input type="number" min="0" max="9" value="${u.target_relic ?? 7}" data-fe-idx="${i}" data-fe-field="target_relic">
            <button class="fe-unit-remove" data-fe-idx="${i}">✕</button>
        </div>`).join('');

    feUnitList.querySelectorAll('input[type="number"]').forEach(inp => {
        inp.addEventListener('change', () => {
            const idx = parseInt(inp.dataset.feIdx);
            const field = inp.dataset.feField;
            feUnits[idx][field] = parseInt(inp.value) || 0;
        });
    });
    feUnitList.querySelectorAll('.fe-unit-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            feUnits.splice(parseInt(btn.dataset.feIdx), 1);
            feRenderUnitRows();
            // Refresh dropdown so removed unit reappears in results
            const results = feFilterUnits(feUnitSearch.value);
            jeRenderDropdown(feUnitDropdown, results, feHandleUnitSelect);
            if (results.length > 0) feUnitDropdown.classList.add('open');
            else feUnitDropdown.classList.remove('open');
        });
    });
    document.getElementById('feAddUnitWrap').style.display = feUnits.length >= 5 ? 'none' : 'block';
}

feUnitSearch?.addEventListener('input', () => {
    const results = feFilterUnits(feUnitSearch.value);
    jeRenderDropdown(feUnitDropdown, results, feHandleUnitSelect);
    if (results.length > 0) feUnitDropdown.classList.add('open');
    else feUnitDropdown.classList.remove('open');
});

async function feSaveFarm() {
    const name = feFarmName.value.trim();
    if (!name) { feStatusEl.textContent = 'Farm name is required.'; feStatusEl.className = 'je-status err'; return; }
    if (feUnits.length === 0) { feStatusEl.textContent = 'Add at least one unit.'; feStatusEl.className = 'je-status err'; return; }

    const id = feEditingId || slugify(name) || ('farm_' + Date.now());
    const newFarm = { id, name, units: feUnits };
    let data = farmsData.filter(f => f.id !== feEditingId);
    if (feEditingId) {
        const idx = farmsData.findIndex(f => f.id === feEditingId);
        data.splice(Math.max(idx, 0), 0, newFarm);
    } else {
        data.push(newFarm);
    }

    feStatusEl.textContent = 'Saving…';
    feStatusEl.className = 'je-status';
    try {
        saveFarms(data);
        farmsData = data;
        displayFarms(farmsData);
        feStatusEl.textContent = 'Saved!';
        feStatusEl.className = 'je-status ok';
        setTimeout(feClose, 800);
    } catch (err) {
        feStatusEl.textContent = 'Error: ' + err.message;
        feStatusEl.className = 'je-status err';
    }
}

async function feDeleteFarm() {
    if (!feEditingId) return;
    if (!confirm(`Delete "${feFarmName.value.trim()}"?`)) return;
    const data = farmsData.filter(f => f.id !== feEditingId);
    try {
        saveFarms(data);
        farmsData = data;
        displayFarms(farmsData);
        feClose();
    } catch (err) {
        feStatusEl.textContent = 'Error: ' + err.message;
        feStatusEl.className = 'je-status err';
    }
}

feSaveBtn?.addEventListener('click', feSaveFarm);
feDeleteBtn?.addEventListener('click', feDeleteFarm);
feCancelBtn?.addEventListener('click', feClose);
farmEditorModal?.addEventListener('click', e => { if (e.target === farmEditorModal) feClose(); });
document.getElementById('farmsAddBtn')?.addEventListener('click', () => feOpen(null));


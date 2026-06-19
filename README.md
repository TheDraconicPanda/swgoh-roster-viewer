# SWGOH Roster Viewer

A web application to view and filter Star Wars: Galaxy of Heroes player rosters.

## Features

- **Fetch Player Data**: Enter any ally code to fetch roster data from SWGOH.gg API
- **Dual Tabs**: Separate views for Characters and Ships
- **Advanced Filtering**:
  - Search by name
  - Filter by star rarity (1-7 stars)
  - Filter by gear level (characters only)
  - Filter by relic level (0-9)
  - Filter by faction/tags (Jedi, Sith, Empire, etc.)
- **Character Tags**: View all factions and roles for each character
- **Statistics**: View summaries for 7-star units, G13 characters, and reliced characters
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. Open `index.html` in your web browser
2. Enter an ally code (default: 881241752)
3. Click "Fetch Roster" button
4. Browse characters and ships using the tabs
5. Use filters to narrow down results
6. Click on tag dropdown to filter by faction (Jedi, Sith, Empire, etc.)

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `app.js` - JavaScript functionality and API integration
- `characters-data.json` - Local character data with categories/tags (425KB)
- `update-data.sh` - Script to refresh character data

## Character Categories/Tags

Character tags are automatically fetched and cached in your browser:
- **First load**: Fetches categories from swgoh.gg API and caches them
- **Subsequent loads**: Uses cached data (instant loading)
- **Auto-refresh**: Cache expires after 1 week and refreshes automatically
- **Manual refresh**: Click the "🔄 Refresh Data" button to update immediately

The cache includes:
- Faction tags (Jedi, Sith, Empire, Rebel, First Order, etc.)
- Role tags (Attacker, Support, Tank, Healer)
- Special tags (Galactic Legend, Leader, Fleet Commander)

### Fallback System

The app uses a smart fallback system:
1. Try browser cache (fast, 1-week lifetime)
2. If cache expired, fetch from swgoh.gg API and update cache
3. If API fails (CORS/network), use expired cache as fallback
4. If all fails, use local `characters-data.json` file

This ensures the app works even with network issues!

## API

This app uses the public SWGOH.gg API:
- Player data: `https://swgoh.gg/api/player/{allyCode}/`
- Character data: Stored locally in `characters-data.json`
- No authentication required
- Player profiles must be public to fetch data

## Development

No build process or dependencies required. Simply:
1. Open `index.html` in a modern web browser
2. Make sure `characters-data.json` is in the same directory

## Future Enhancements

- Add sorting options
- Character/ship detail views
- Export filtered lists
- Mod information display
- Comparison between multiple players
- Zeta and Omicron tracking

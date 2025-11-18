# Christmas Tree Map

Live map for tracking Christmas tree availability at the Tim Hortons Festival of Lights in Gibsons, BC. The site renders a floor plan overlay and marks every tree, updating each tree's status from a Google Sheets purchase log.

## Features
- Visual map overlay drawn on an HTML5 canvas using a georeferenced image (`tim-hortons-map.jpeg`).
- Inventory of tree locations defined in `items.js` with shape, color, and position metadata.
- Fetches current purchase data from a Google Apps Script endpoint that fronts the shared Google Sheet, marking sold trees in real time.
- Optional edit mode logic (currently disabled in the UI) for repositioning items during map calibration.
- Bundled with Parcel for zero-config local development and GitHub Pages deployment.

## Getting Started

### Prerequisites
- Node.js 20 (matches the GitHub Actions deployment environment).
- npm 9+ (bundled with Node 20).

### Installation
```sh
npm install
```

### Local Development
Start a hot-reloading dev server:
```sh
npm start
```
The project uses Parcel to serve `index.html`. Open the printed local URL in your browser to preview the map. Purchasing data loads asynchronously; you can watch the developer console for fetch activity.

### Production Build
Generate an optimized bundle in `dist/`:
```sh
npm run build
```
The build output is what the GitHub Pages workflow publishes.

## Data Flow
1. Tree metadata lives in `items.js`. Each key represents a numbered tree with canvas coordinates, marker shape (`circle` or `square`), display color, and `purchased` flag.
2. When the app loads, it downloads purchase IDs from `https://script.google.com/.../exec`, an Apps Script endpoint connected to the event's Google Sheet.
3. Any tree IDs returned from the sheet are flagged as purchased and receive an "X" overlay on the map via `index.js` drawing routines.

To onboard a new spreadsheet, update the Apps Script URL in `index.js`. Ensure the script returns an array of tree IDs that match the keys defined in `items.js`.

### Google Apps Script Code
Deploy this as a Web App with "Anyone, even anonymous" access to allow public read access.

```js
function doGet() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Call Sheet");
  let data = sheet.getRange(4, 14, 500)
    .getValues()
    .flat()
    .filter(x => !!x);
  // Logger.log(JSON.stringify(data));
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
```

## Deployment
GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys the site to GitHub Pages when you push to the `prod` branch or manually trigger the workflow. The pipeline runs `npm ci`, builds the Parcel bundle, then uploads `dist/` as the published artifact.

To release a new version:
1. Commit and push changes to `prod`.
2. Wait for the "Deploy to GitHub Pages" workflow to succeed.
3. Verify the live site via the environment URL linked in the workflow run.

## Customization Tips
- Adjust map positioning constants (`WORLD_POSITION`, `WORLD_SCALE`) in `index.js` if you replace the background image or need to realign coordinates.
- Uncomment the `#toggle-edit` button markup in `index.html` to enable the built-in drag-and-drop edit mode for fine-tuning tree positions. This mode updates positions in memory; copy the new coordinates back into `items.js` to persist them.
- `ITEM_SIZE`, colors, and stroke styles in `index.js` can be tweaked to change the visual language for available versus sold trees.

### 1. Project Background and Objectives

- **Background**: In multilingual documentation, cross-border e-commerce, and international business communication, there is a frequent need to quickly look up country names in Chinese and English and their short codes (e.g. ISO 3166-1 Alpha-2/Alpha-3). Repeatedly opening websites to search is inefficient and error-prone.
- **Objectives**: Build a Chrome extension “Country Name and Code Lookup” that supports one-click lookup, copy, and verification of country English name, Chinese name, and codes inside the browser, improving efficiency and accuracy.

### 2. Product Overview

- **Product form**: Chrome extension (Manifest V3).
- **Main features**:
  - Open a popup from the extension icon to look up country English name, Chinese name, and codes.
  - Support fuzzy search by Chinese, English, or code.
  - One-click copy of country English name, Chinese name, or code.
  - Right-click menu / shortcut on selected text to query directly.
- **Target users**:
  - Foreign trade and cross-border e-commerce staff.
  - Translators, copywriters, product managers who often work with country information.
  - Anyone who needs standardized country names and codes.

### 3. Use Cases

1. **Checking standard English country name while writing an email**  
   User is editing an email → wants to confirm the English for “捷克共和国” → clicks the extension icon → types “捷克” → sees “Czech Republic / Czechia” and codes → copies the English name.

2. **Filling destination country code in an e-commerce backend**  
   User needs the two-letter code (e.g. US, CN, DE) → opens the extension → types Chinese “德国” → sees “Germany / 德国 / DE / DEU” → copies “DE”.

3. **Seeing an English country name on a page and wanting Chinese and code**  
   User selects “Netherlands” on a page → right-click “Query” → popup opens → sees “荷兰 / Netherlands / NL / NLD”.

4. **Quickly checking country names in Excel/forms**  
   User edits an online table in the browser → unsure if the English is standard → copies the name → searches in the extension → verifies standard name and code.

### 4. Functional Requirements

#### 4.1 Query and Search

- **F1 – Query entry (popup)**  
  - Click the extension icon in the Chrome toolbar to open the popup (`popup.html`).  
  - Search input at the top of the popup.
- **F2 – Search behavior**  
  - Fuzzy search by any of:
    - Chinese name (e.g. “美国”, “阿联酋”).
    - English name (e.g. “United States”, “UAE”).
    - Codes: Alpha-2 (e.g. “US”, “CN”, “DE”), Alpha-3 (e.g. “USA”, “CHN”, “DEU”).
  - Results update in real time as the user types.
- **F3 – Result display**  
  - Each result row shows:
    - Chinese name (e.g. “美国”).
    - English name (e.g. “United States of America”).
    - Alpha-2 (e.g. “US”).
    - Alpha-3 (e.g. “USA”).
    - (Optional) Numeric code (e.g. “840”).
  - Multiple matches (e.g. different “Congo” entries) shown as a list.

#### 4.2 One-Click Copy

- **F4 – Copy**  
  - For each result, provide separate copy actions for:
    - English name, Chinese name, Alpha-2, Alpha-3.
  - After copy, show a short in-popup message (toast), e.g. “Copied xxx”.

#### 4.3 Context Menu and Selected-Text Query

- **F5 – Context menu**  
  - After installation, add a menu item for selected text, e.g. “Query ‘xxx’”.
  - When the user selects text (Chinese/English name or code) and chooses this item:
    - Open the extension popup and run the query with the selected text; or show results in a small window (design choice).
- **F6 – Shortcut (optional)**  
  - Use Chrome’s extension shortcut, e.g. `Alt + Shift + C` to open the popup.
  - Optionally: with text selected, shortcut runs the query with that text.

#### 4.4 Data Source and Data Management

- **F7 – Country data**  
  - Use a standard country list (e.g. based on ISO 3166-1).
  - Data as local JSON with fields such as:
    - `englishName`, `chineseName`, `alpha2`, `alpha3`, `numeric` (optional), `aliases` (optional).
- **F8 – Local storage**  
  - All country data stored locally in the extension; no external API required; works offline.  
  - Data can be updated by updating the JSON when the extension is updated.

#### 4.5 Personalization and Settings (Optional)

- **F9 – Settings**  
  - Allow: default copy field, whether to show numeric code column, enable/disable context menu and shortcut.
- **F10 – Recent / Favorites (optional)**  
  - Show recently queried countries (e.g. last 10) when the input is empty.  
  - Allow marking countries as “frequently used” and show them at the top.

### 5. Non-Functional Requirements

#### 5.1 Performance and UX

- **N1 – Fast response**: Local search; response should feel instant (< 100 ms).
- **N2 – Lightweight**: Extension size kept small; avoid large unrelated libraries.
- **N3 – Usability**: Simple, clear layout; support Chinese and English; search box focused by default when the popup opens.

#### 5.2 Compatibility

- **N4 – Browser**: Support current stable Chrome; implement with Manifest V3.
- **N5 – Resolution and dark mode (optional)**: Adapt popup to common resolutions; light theme first, dark theme later if needed.

#### 5.3 Security and Privacy

- **N6 – Minimal permissions**: Only request what is needed (e.g. `contextMenus`, `activeTab`, `storage`). Do not access browsing history, cookies, or other sensitive data.
- **N7 – Offline**: No server or network dependency for country lookup.

### 6. UI / Interaction (Summary)

#### 6.1 Popup layout

- **Top**: Search input with placeholder such as “Enter country name or code to search”.
- **Middle**: Table with columns: Chinese name | English name | Alpha-2 | Alpha-3 | Actions (copy buttons).
- **Bottom (optional)**: Recent or favorite countries.

#### 6.2 Interaction details

- Search runs as the user types; Enter key also triggers search.
- Tooltips on copy buttons (e.g. “Copy English name”).
- Short toast (1–2 s) after a successful copy.

### 7. Technical Implementation (Summary)

- **Stack**: Native HTML/CSS/JavaScript or a simple framework (e.g. React) for the popup, as appropriate.
- **Main files**:
  - `manifest.json`: Extension config (name, version, permissions, icons, popup, etc.).
  - `popup.html` + `popup.js`: Popup UI and logic.
  - `background.js` / service worker: Context menu, shortcut handling.
  - `countries.json`: Country data.
  - `options.html` + `options.js` (optional): Settings page.

### 8. Acceptance Criteria

- **Functionality**: Popup opens from the icon; search by Chinese, English, and codes works and shows correct results; one-click copy works and content is correct; context menu works on selected text and shows the right result.
- **Data**: Country list, names, and codes match the chosen source (e.g. ISO 3166-1 and internal translation rules).
- **Stability**: No obvious errors or crashes in normal use; behavior unchanged when the network is unavailable (for country lookup).

### 9. Installation and Usage

#### 9.1 Development install (load unpacked)

1. Install the latest stable Chrome.
2. Place the project in a directory, e.g. `/home/dev/Downloads/ccq`.
3. Open `chrome://extensions/`.
4. Turn on “Developer mode”.
5. Click “Load unpacked”.
6. Select the project root (the folder containing `manifest.json`).
7. The extension “国家英文/中文名称及简称查询” (Country name and code lookup) should appear in the toolbar.

#### 9.2 Basic usage (popup)

1. Click the extension icon in the toolbar.
2. Popup shows: search box at the top (focused), result table below with columns: Chinese name | English name | Alpha-2 | Alpha-3 | Numeric code | Actions.
3. Type any keyword for fuzzy search (Chinese name, English name, or code such as US, DE, USA, DEU, 840).
4. Use the copy buttons per row: Copy Chinese, Copy English, Copy A2, Copy A3. A short “Copied xxx” message appears after copy.

#### 9.3 Context menu

1. Select text on any page (e.g. “Netherlands”, “德国”, “US”, “USA”).
2. Right-click and choose the menu item “Query ‘xxx’”.
3. The popup opens and shows the matching country (or IP result if the selection looks like an IP/domain).
4. Use the copy buttons as in popup usage.

#### 9.4 Shortcut

1. Default shortcut: `Alt + Shift + C` to open the popup.
2. To change: open `chrome://extensions/shortcuts`, find the extension and the “open_country_search” command, set the desired key combination.

#### 9.5 FAQ

- **Icon not visible?**  
  It may be under the extensions puzzle icon; pin the extension to the toolbar.
- **Context menu missing?**  
  Ensure the extension is enabled; try disabling and re-enabling, or reload the extension.
- **Copy not working?**  
  Some OS or browser policies restrict clipboard access; check privacy/security settings or try on another page.
- **Country list incomplete or wrong?**  
  Update `countries.json` and reload the extension to apply changes.

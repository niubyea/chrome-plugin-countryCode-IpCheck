# Country Code & IP Check

Chrome extension: look up country names (Chinese/English) and codes (Alpha-2/Alpha-3), and query IP/domain geolocation.

## Features

- **Country search**: Fuzzy search in the popup by Chinese name, English name, or code; 2–3 letters match as code. Table shows Chinese name, English name, region, Alpha-2, Alpha-3, numeric code; one-click copy (ZH / EN / A2 / A3).
- **IP lookup**: Dedicated tab; enter IP or domain (leave empty for current IP). Shows country, region, city, ISP, timezone, etc. (via [ip-api.com](http://ip-api.com)).
- **Context menu**: Right-click selected text → “Query ‘%s’”. Automatically treated as IP/domain or country keyword; opens popup on the right tab; runs IP query automatically when applicable.
- **Shortcut**: `Alt+Shift+C` to open the popup.

## Install

1. Clone or download this repo.
2. Chrome → Extensions → Developer mode → Load unpacked → select the project root (folder containing `manifest.json`).

## Usage

- Click the extension icon: use the **Country** tab to search, and the **IP** tab to query IP/domain.
- On any page, select text, right-click → “Query ‘%s’” to search (country or IP).

## Tech

- Manifest V3
- Country data: local `data/countries.json`
- IP: requested in background from ip-api.com; popup only sends messages and renders
- i18n: `_locales/zh_CN`, `_locales/en`

## Docs

- [Requirements (English)](docs/Country-Code-IP-Check-Requirements-EN.md)
- [需求文档（中文）](docs/国家英文中文名称及简称查询Chrome插件需求文档.md)

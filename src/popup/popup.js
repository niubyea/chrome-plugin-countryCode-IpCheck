/** @type {{ searchInput: HTMLInputElement|null; resultsBody: HTMLElement|null; noResultEl: HTMLElement|null; toastEl: HTMLElement|null; headerTitleEl: HTMLElement|null; footerHintEl: HTMLElement|null; tabCountriesEl: HTMLElement|null; tabIpEl: HTMLElement|null; panelCountriesEl: HTMLElement|null; panelIpEl: HTMLElement|null; ipBarEl: HTMLElement|null; ipInputEl: HTMLInputElement|null; ipQueryBtnEl: HTMLElement|null; ipResultEl: HTMLElement|null; ipEmptyEl: HTMLElement|null; }} */
const el = {
  searchInput: null,
  resultsBody: null,
  noResultEl: null,
  toastEl: null,
  headerTitleEl: null,
  footerHintEl: null,
  tabCountriesEl: null,
  tabIpEl: null,
  panelCountriesEl: null,
  panelIpEl: null,
  ipBarEl: null,
  ipInputEl: null,
  ipQueryBtnEl: null,
  ipResultEl: null,
  ipEmptyEl: null
};

/** @type {Array<{
 *  englishName: string;
 *  chineseName: string;
 *  alpha2: string;
 *  alpha3: string;
 *  numeric?: string;
 *  aliases?: string[];
 * }>} */
let countries = [];
var ipPanelBuilt = false;

function t(key, fallback) {
  try {
    if (chrome.i18n && typeof chrome.i18n.getMessage === "function") {
      const v = chrome.i18n.getMessage(key);
      if (v) return v;
    }
  } catch (e) {
    // ignore
  }
  return fallback;
}

async function loadCountries() {
  try {
    const res = await fetch(chrome.runtime.getURL("data/countries.json"));
    countries = await res.json();
  } catch (e) {
    console.error("加载国家数据失败", e);
    countries = [];
  }
}

function normalize(str) {
  return (str || "").toString().trim();
}

function isAsciiLetters(str) {
  return /^[A-Za-z]+$/.test(str);
}

function getIpApiLang() {
  var ui = "en";
  try {
    if (chrome.i18n && typeof chrome.i18n.getUILanguage === "function") {
      ui = chrome.i18n.getUILanguage() || "en";
    }
  } catch (e) {}
  var lower = (ui || "").toLowerCase();
  if (lower.indexOf("zh") === 0) return "zh-CN";
  if (lower.indexOf("ja") === 0) return "ja";
  if (lower.indexOf("de") === 0) return "de";
  if (lower.indexOf("es") === 0) return "es";
  if (lower.indexOf("fr") === 0) return "fr";
  if (lower.indexOf("ru") === 0) return "ru";
  if (lower.indexOf("pt-br") === 0) return "pt-BR";
  return "en";
}

function ensureIpPanel() {
  if (ipPanelBuilt) return;
  ipPanelBuilt = true;
  if (!el.panelIpEl) return;
  var ipBar = document.createElement("div");
  ipBar.id = "ipBar";
  ipBar.className = "ip-bar";
  var ipInput = document.createElement("input");
  ipInput.id = "ipInput";
  ipInput.className = "search-input";
  ipInput.type = "text";
  ipInput.placeholder = t("ipPlaceholder", "输入 IP 或域名（留空查询当前 IP）");
  var ipBtn = document.createElement("button");
  ipBtn.id = "ipQueryBtn";
  ipBtn.className = "ip-btn";
  ipBtn.type = "button";
  ipBtn.textContent = t("ipQueryBtn", "查询");
  ipBar.appendChild(ipInput);
  ipBar.appendChild(ipBtn);
  var ipEmpty = document.createElement("div");
  ipEmpty.id = "ipEmpty";
  ipEmpty.className = "no-result";
  ipEmpty.hidden = true;
  ipEmpty.textContent = t("ipEmpty", "请输入 IP 或域名开始查询");
  var ipResult = document.createElement("div");
  ipResult.id = "ipResult";
  ipResult.className = "ip-result";
  ipResult.hidden = true;
  el.panelIpEl.appendChild(ipBar);
  el.panelIpEl.appendChild(ipEmpty);
  el.panelIpEl.appendChild(ipResult);
  el.ipBarEl = ipBar;
  el.ipInputEl = ipInput;
  el.ipQueryBtnEl = ipBtn;
  el.ipResultEl = ipResult;
  el.ipEmptyEl = ipEmpty;
  ipBtn.addEventListener("click", lookupIp);
  ipInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") lookupIp();
  });
}

function setActiveTab(tab) {
  var isCountries = tab === "countries";
  if (!isCountries) ensureIpPanel();
  if (el.tabCountriesEl) {
    el.tabCountriesEl.classList.toggle("tab-active", isCountries);
    el.tabCountriesEl.setAttribute("aria-selected", isCountries ? "true" : "false");
  }
  if (el.tabIpEl) {
    el.tabIpEl.classList.toggle("tab-active", !isCountries);
    el.tabIpEl.setAttribute("aria-selected", !isCountries ? "true" : "false");
  }
  if (el.panelCountriesEl) el.panelCountriesEl.hidden = !isCountries;
  if (el.panelIpEl) el.panelIpEl.hidden = isCountries;
  if (el.searchInput) el.searchInput.hidden = !isCountries;
  if (!isCountries && el.ipInputEl) {
    try { el.ipInputEl.focus(); } catch (_) {}
  }
  if (isCountries && el.searchInput) {
    try { setTimeout(function () { el.searchInput && el.searchInput.focus(); }, 0); } catch (_) {}
  }
}

function setIpResultLoading() {
  if (!el.ipResultEl) return;
  el.ipResultEl.hidden = false;
  el.ipResultEl.textContent = t("ipLoading", "查询中...");
}

function setIpResultError(msg) {
  if (!el.ipResultEl) return;
  el.ipResultEl.hidden = false;
  el.ipResultEl.textContent = msg;
}

function escapeHtml(str) {
  return (str || "").toString().replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

function renderIpResult(data) {
  if (!el.ipResultEl) return;
  el.ipResultEl.hidden = false;
  if (!data || data.status !== "success") {
    var msg = (data && data.message) ? String(data.message) : "";
    setIpResultError(t("ipQueryFailed", "查询失败") + (msg ? "：" + msg : ""));
    return;
  }
  var rows = [
    [t("ipFieldQuery", "IP"), data.query],
    [t("ipFieldCountry", "国家"), data.country],
    [t("ipFieldCountryCode", "国家代码"), data.countryCode],
    [t("ipFieldRegion", "地区/州"), data.regionName],
    [t("ipFieldCity", "城市"), data.city],
    [t("ipFieldIsp", "ISP"), data.isp],
    [t("ipFieldTimezone", "时区"), data.timezone],
    [t("ipFieldLatLon", "经纬度"), (data.lat != null && data.lon != null) ? data.lat + ", " + data.lon : ""]
  ].filter(function (pair) {
    var v = pair[1];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
  el.ipResultEl.innerHTML = "<div class=\"ip-kv\">" + rows.map(function (pair) {
    return "<div class=\"ip-k\">" + escapeHtml(pair[0]) + "</div><div class=\"ip-v\">" + escapeHtml(pair[1]) + "</div>";
  }).join("") + "</div>";
}

function lookupIp() {
  var q = normalize((el.ipInputEl && el.ipInputEl.value) || "");
  if (el.ipEmptyEl) {
    el.ipEmptyEl.textContent = t("ipEmpty", "请输入 IP 或域名开始查询");
    el.ipEmptyEl.hidden = !!q;
  }
  setIpResultLoading();
  var lang = getIpApiLang();
  chrome.runtime.sendMessage({ type: "lookupIp", query: q, lang: lang }, function (data) {
    try {
      if (!document.body || !el.ipResultEl || !document.body.contains(el.ipResultEl)) return;
      if (chrome.runtime.lastError) {
        setIpResultError(t("ipNetworkError", "网络错误，请稍后重试"));
        return;
      }
      if (data) {
        renderIpResult(data);
      } else {
        setIpResultError(t("ipNetworkError", "网络错误，请稍后重试"));
      }
    } catch (e) {
      if (document.body && el.ipResultEl && document.body.contains(el.ipResultEl)) {
        setIpResultError(t("ipNetworkError", "网络错误，请稍后重试"));
      }
    }
  });
}

function scoreCountry(country, query) {
  const q = normalize(query);
  if (!q) return -1;

  const qLower = q.toLowerCase();
  const qUpper = q.toUpperCase();
  const qIsLetters = isAsciiLetters(q);

  const zh = (country.chineseName || "").trim();
  const en = (country.englishName || "").trim();
  const a2 = (country.alpha2 || "").toUpperCase();
  const a3 = (country.alpha3 || "").toUpperCase();
  const num = (country.numeric || "").trim();
  const aliases = Array.isArray(country.aliases) ? country.aliases : [];

  // 精准匹配优先
  if (zh && zh === q) return 1000;
  if (en && en.toLowerCase() === qLower) return 950;
  if (qIsLetters && q.length === 2 && a2 === qUpper) return 900;
  if (qIsLetters && q.length === 3 && a3 === qUpper) return 880;
  if (/^\d{1,3}$/.test(q) && num === q.padStart(3, "0")) return 860;

  // 次级：前缀/包含（名称允许模糊；代码默认不做 contains，避免 US 匹配 AUS/RUS 等噪音）
  if (zh && zh.startsWith(q)) return 520;
  if (en && en.toLowerCase().startsWith(qLower)) return 500;
  if (zh && zh.includes(q)) return 320;
  if (en && en.toLowerCase().includes(qLower)) return 300;

  // 别名：仅作为兜底匹配
  for (const alias of aliases) {
    const a = (alias || "").trim();
    if (!a) continue;
    if (a.toLowerCase() === qLower) return 260;
    if (a.toLowerCase().startsWith(qLower)) return 220;
    if (a.toLowerCase().includes(qLower)) return 200;
  }

  // 允许数字码包含（例如输入 84 也能找到 084），但权重较低
  if (/^\d+$/.test(q) && num && num.includes(q)) return 180;

  return -1;
}

function showToast(message) {
  if (!el.toastEl) return;
  el.toastEl.textContent = message;
  el.toastEl.hidden = false;
  setTimeout(() => {
    el.toastEl.hidden = true;
  }, 1500);
}

async function handleCopy(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    const tpl = t("toastCopied", "已复制__LABEL__：__VALUE__");
    const msg = tpl
      .replace("__LABEL__", label || "")
      .replace("__VALUE__", text || "");
    showToast(msg);
  } catch (e) {
    console.error("复制失败", e);
    showToast(t("toastCopyFailed", "复制失败，请重试"));
  }
}

function renderResults(list) {
  if (!el.resultsBody) return;
  el.resultsBody.innerHTML = "";

  if (!list.length) {
    if (el.noResultEl) el.noResultEl.hidden = false;
    return;
  }

  if (el.noResultEl) el.noResultEl.hidden = true;

  const fragment = document.createDocumentFragment();
  list.forEach((item) => {
    const tr = document.createElement("tr");

    const tdZh = document.createElement("td");
    tdZh.className = "name-zh";
    tdZh.textContent = item.chineseName || "";

    const tdEn = document.createElement("td");
    tdEn.className = "name-en";
    tdEn.textContent = item.englishName || "";

    const tdRegion = document.createElement("td");
    tdRegion.textContent = item.regionZh || item.region || "";

    const tdA2 = document.createElement("td");
    tdA2.textContent = item.alpha2 || "";

    const tdA3 = document.createElement("td");
    tdA3.textContent = item.alpha3 || "";

    const tdNumeric = document.createElement("td");
    tdNumeric.textContent = item.numeric || "";

    const tdActions = document.createElement("td");
    tdActions.className = "actions";

    const btnCopyZh = document.createElement("button");
    btnCopyZh.className = "btn-copy";
  btnCopyZh.textContent = "中";
  btnCopyZh.title = t("labelChineseName", "复制中文名");
    btnCopyZh.dataset.type = "zh";
    btnCopyZh.dataset.value = item.chineseName || "";

    const btnCopyEn = document.createElement("button");
    btnCopyEn.className = "btn-copy";
  btnCopyEn.textContent = "EN";
  btnCopyEn.title = t("labelEnglishName", "复制英文名");
    btnCopyEn.dataset.type = "en";
    btnCopyEn.dataset.value = item.englishName || "";

    const btnCopyA2 = document.createElement("button");
    btnCopyA2.className = "btn-copy";
  btnCopyA2.textContent = "A2";
  btnCopyA2.title = t("labelAlpha2", "复制 Alpha-2 代码");
    btnCopyA2.dataset.type = "alpha2";
    btnCopyA2.dataset.value = item.alpha2 || "";

    const btnCopyA3 = document.createElement("button");
    btnCopyA3.className = "btn-copy";
  btnCopyA3.textContent = "A3";
  btnCopyA3.title = t("labelAlpha3", "复制 Alpha-3 代码");
    btnCopyA3.dataset.type = "alpha3";
    btnCopyA3.dataset.value = item.alpha3 || "";

    tdActions.appendChild(btnCopyZh);
    tdActions.appendChild(btnCopyEn);
    tdActions.appendChild(btnCopyA2);
    tdActions.appendChild(btnCopyA3);

    tr.appendChild(tdZh);
    tr.appendChild(tdEn);
    tr.appendChild(tdRegion);
    tr.appendChild(tdA2);
    tr.appendChild(tdA3);
    tr.appendChild(tdNumeric);
    tr.appendChild(tdActions);

    fragment.appendChild(tr);
  });

  el.resultsBody.appendChild(fragment);
}

function doSearch() {
  const query = normalize((el.searchInput && el.searchInput.value) || "");
  if (!query) {
    if (el.noResultEl) el.noResultEl.textContent = t("noQuery", "请输入关键词开始查询");
    renderResults([]);
    return;
  }

  // 仅输入 2-3 个英文字母时，视为国家代码精确查询（忽略大小写）
  if (isAsciiLetters(query) && (query.length === 2 || query.length === 3)) {
    const qUpper = query.toUpperCase();
    const exact = countries.filter((c) =>
      query.length === 2
        ? (c.alpha2 || "").toUpperCase() === qUpper
        : (c.alpha3 || "").toUpperCase() === qUpper
    );
    if (el.noResultEl) el.noResultEl.textContent = t("noResult", "暂无匹配结果");
    renderResults(exact);
    return;
  }

  const scored = countries
    .map((c) => ({ c, s: scoreCountry(c, query) }))
    .filter(({ s }) => s >= 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      const aEn = (a.c.englishName || "").toString();
      const bEn = (b.c.englishName || "").toString();
      return aEn.localeCompare(bEn);
    })
    .map(({ c }) => c);

  if (el.noResultEl) el.noResultEl.textContent = t("noResult", "暂无匹配结果");
  renderResults(scored);
}

function bindEvents() {
  if (el.searchInput) {
    el.searchInput.addEventListener("input", () => doSearch());
    el.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSearch();
    });
  }
  if (el.resultsBody) {
    el.resultsBody.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("btn-copy")) return;

      const value = target.dataset.value || "";
      const type = target.dataset.type || "";
      if (!value) {
        showToast(t("toastNothingToCopy", "无可复制内容"));
        return;
      }

      let label = "";
      switch (type) {
        case "zh":
          label = t("labelChineseName", "中文名");
          break;
        case "en":
          label = t("labelEnglishName", "英文名");
          break;
        case "alpha2":
          label = t("labelAlpha2", "Alpha-2 代码");
          break;
        case "alpha3":
          label = t("labelAlpha3", "Alpha-3 代码");
          break;
        default:
          label = "内容";
      }
      handleCopy(value, label);
    });
  }
  if (el.tabCountriesEl) {
    el.tabCountriesEl.addEventListener("click", function () { setActiveTab("countries"); });
  }
  if (el.tabIpEl) {
    el.tabIpEl.addEventListener("click", function () { setActiveTab("ip"); });
  }
  if (el.ipQueryBtnEl) {
    el.ipQueryBtnEl.addEventListener("click", lookupIp);
  }
  if (el.ipInputEl) {
    el.ipInputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") lookupIp();
    });
  }
}

async function initQueryFromStorage() {
  if (!chrome.storage || !chrome.storage.local) return;
  try {
    var data = await chrome.storage.local.get(["initialQuery", "initialIpQuery"]);
    if (data.initialIpQuery) {
      chrome.storage.local.remove("initialIpQuery");
      ensureIpPanel();
      if (el.ipInputEl) el.ipInputEl.value = data.initialIpQuery;
      setActiveTab("ip");
      return;
    }
    if (data.initialQuery && el.searchInput) {
      el.searchInput.value = data.initialQuery;
      await chrome.storage.local.remove("initialQuery");
      doSearch();
      el.searchInput.select();
    } else {
      doSearch();
      if (el.searchInput) setTimeout(function () { el.searchInput && el.searchInput.focus(); }, 0);
    }
  } catch (e) {
    console.error("读取初始查询失败", e);
    doSearch();
  }
}

function applyI18nStaticTexts() {
  try {
    document.title = t("popupTitle", document.title);
  } catch (_) {}
  if (el.headerTitleEl) {
    try { el.headerTitleEl.textContent = t("headerTitle", "国家查询"); } catch (_) {}
  }
  if (el.searchInput) {
    try { el.searchInput.placeholder = t("searchPlaceholder", ""); } catch (_) {}
  }
  if (el.ipInputEl) {
    try { el.ipInputEl.placeholder = t("ipPlaceholder", ""); } catch (_) {}
  }
  if (el.footerHintEl) {
    try { el.footerHintEl.textContent = t("footerHint", ""); } catch (_) {}
  }
  try {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key, node.textContent || "");
    }
  } catch (_) {}
}

function buildUI() {
  var root = document.getElementById("root");
  if (!root) return;
  var c = document.createElement("div");
  c.className = "container";
  var header = document.createElement("header");
  header.className = "header";
  var h1 = document.createElement("h1");
  h1.id = "headerTitle";
  h1.className = "title";
  h1.textContent = "国家查询";
  var tabs = document.createElement("div");
  tabs.className = "tabs";
  tabs.setAttribute("role", "tablist");
  var btnCountry = document.createElement("button");
  btnCountry.id = "tabCountries";
  btnCountry.className = "tab tab-active";
  btnCountry.type = "button";
  btnCountry.setAttribute("role", "tab");
  btnCountry.setAttribute("aria-selected", "true");
  btnCountry.setAttribute("data-i18n", "tabCountries");
  btnCountry.textContent = "国家";
  var btnIp = document.createElement("button");
  btnIp.id = "tabIp";
  btnIp.className = "tab";
  btnIp.type = "button";
  btnIp.setAttribute("role", "tab");
  btnIp.setAttribute("aria-selected", "false");
  btnIp.setAttribute("data-i18n", "tabIp");
  btnIp.textContent = "IP";
  tabs.appendChild(btnCountry);
  tabs.appendChild(btnIp);
  var searchInput = document.createElement("input");
  searchInput.id = "searchInput";
  searchInput.className = "search-input";
  searchInput.type = "text";
  searchInput.placeholder = "输入国家中文/英文/代码进行搜索";
  header.appendChild(h1);
  header.appendChild(tabs);
  header.appendChild(searchInput);
  var main = document.createElement("main");
  main.className = "main";
  var panelCountries = document.createElement("section");
  panelCountries.id = "panelCountries";
  panelCountries.className = "panel";
  panelCountries.setAttribute("role", "tabpanel");
  var table = document.createElement("table");
  table.className = "results-table";
  var thead = document.createElement("thead");
  var tr = document.createElement("tr");
  var thKeys = ["thChineseName", "thEnglishName", "thRegion", "thAlpha2", "thAlpha3", "thNumeric", "thActions"];
  var thTexts = ["中文名", "英文名", "洲/地区", "Alpha-2", "Alpha-3", "数字码", "操作"];
  for (var i = 0; i < thKeys.length; i++) {
    var th = document.createElement("th");
    th.setAttribute("data-i18n", thKeys[i]);
    th.textContent = thTexts[i];
    tr.appendChild(th);
  }
  thead.appendChild(tr);
  table.appendChild(thead);
  var tbody = document.createElement("tbody");
  tbody.id = "resultsBody";
  table.appendChild(tbody);
  var noResult = document.createElement("div");
  noResult.id = "noResult";
  noResult.className = "no-result";
  noResult.hidden = true;
  noResult.textContent = "请输入关键词开始查询";
  panelCountries.appendChild(table);
  panelCountries.appendChild(noResult);
  var panelIp = document.createElement("section");
  panelIp.id = "panelIp";
  panelIp.className = "panel";
  panelIp.hidden = true;
  panelIp.setAttribute("role", "tabpanel");
  main.appendChild(panelCountries);
  main.appendChild(panelIp);
  var footer = document.createElement("footer");
  footer.className = "footer";
  var hint = document.createElement("span");
  hint.id = "footerHint";
  hint.className = "hint";
  hint.textContent = "提示：支持按国家中文、英文或代码模糊搜索";
  footer.appendChild(hint);
  c.appendChild(header);
  c.appendChild(main);
  c.appendChild(footer);
  root.appendChild(c);
}

function initElements() {
  var doc = document;
  if (!doc.body) return;
  el.searchInput = doc.getElementById("searchInput");
  el.resultsBody = doc.getElementById("resultsBody");
  el.noResultEl = doc.getElementById("noResult");
  el.toastEl = doc.getElementById("toast");
  el.headerTitleEl = doc.getElementById("headerTitle");
  el.footerHintEl = doc.getElementById("footerHint");
  el.tabCountriesEl = doc.getElementById("tabCountries");
  el.tabIpEl = doc.getElementById("tabIp");
  el.panelCountriesEl = doc.getElementById("panelCountries");
  el.panelIpEl = doc.getElementById("panelIp");
  el.ipBarEl = doc.getElementById("ipBar");
  el.ipInputEl = doc.getElementById("ipInput");
  el.ipQueryBtnEl = doc.getElementById("ipQueryBtn");
  el.ipResultEl = doc.getElementById("ipResult");
  el.ipEmptyEl = doc.getElementById("ipEmpty");
}

function runInit() {
  try {
    buildUI();
    initElements();
    if (!el.resultsBody) return;
    applyI18nStaticTexts();
    bindEvents();
    setActiveTab("countries");
  } catch (err) {
    console.error("Popup init error", err);
    var root = document.getElementById("root");
    if (root) root.textContent = "Init error: " + (err.message || err);
    return;
  }
  function doAfterLoad() {
    try {
      initQueryFromStorage();
    } catch (err) {
      console.error("initQueryFromStorage error", err);
    }
  }
  function scheduleLoad() {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(function () { loadCountries().then(doAfterLoad).catch(function (err) {
        console.error("loadCountries error", err);
        if (el.noResultEl) { el.noResultEl.textContent = "加载失败"; el.noResultEl.hidden = false; }
      }); }, { timeout: 300 });
    } else {
      setTimeout(function () {
        loadCountries().then(doAfterLoad).catch(function (err) {
          console.error("loadCountries error", err);
          if (el.noResultEl) { el.noResultEl.textContent = "加载失败"; el.noResultEl.hidden = false; }
        });
      }, 150);
    }
  }
  scheduleLoad();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () { setTimeout(runInit, 80); });
} else {
  setTimeout(runInit, 80);
}


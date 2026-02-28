function isIpLike(str) {
  var s = (str || "").trim();
  if (!s || s.length > 253) return false;
  if (/\s/.test(s)) return false;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)) return true;
  if (s.indexOf(":") !== -1) return true;
  if (s.indexOf(".") !== -1 && s.length >= 4) return true;
  return false;
}

chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: "queryBySelection",
      title: chrome.i18n.getMessage("contextMenuQuery") || '查询 "%s"',
      contexts: ["selection"]
    });
  } catch (e) {
    console.error("创建右键菜单失败", e);
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  var text = (info.selectionText || "").trim();
  if (!text) return;
  if (info.menuItemId !== "queryBySelection") return;

  var useIp = isIpLike(text);
  var payload = useIp ? { initialIpQuery: text } : { initialQuery: text };
  chrome.storage.local.set(payload, function () {
    if (chrome.runtime.lastError) console.error("写入失败", chrome.runtime.lastError);
    chrome.action && chrome.action.openPopup && chrome.action.openPopup().catch(function () {});
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open_country_search") {
    if (chrome.action && chrome.action.openPopup) {
      chrome.action.openPopup().catch((e) => {
        console.error("快捷键打开弹窗失败", e);
      });
    }
  }
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg && msg.type === "lookupIp") {
    var q = (msg.query || "").trim();
    var lang = msg.lang || "en";
    var fields = "status,message,query,country,countryCode,regionName,city,isp,timezone,lat,lon";
    var base = "http://ip-api.com/json/";
    var url = base + (q ? encodeURIComponent(q) : "") + "?fields=" + encodeURIComponent(fields) + "&lang=" + encodeURIComponent(lang);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(sendResponse)
      .catch(function (e) {
        sendResponse({ status: "fail", message: e.message || "network error" });
      });
    return true;
  }
});


const iconSet = {
settings: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.568l-.147.883a7.52 7.52 0 0 0-1.498.62l-.755-.475a1.875 1.875 0 0 0-2.369.284l-.524.524a1.875 1.875 0 0 0-.283 2.369l.474.755c-.261.47-.468.97-.62 1.498l-.883.147a1.875 1.875 0 0 0-1.568 1.85v.741c0 .916.663 1.698 1.568 1.85l.883.147c.152.527.359 1.027.62 1.497l-.474.756a1.875 1.875 0 0 0 .283 2.369l.524.524c.649.649 1.659.77 2.369.283l.755-.474c.47.261.97.468 1.498.62l.147.883a1.875 1.875 0 0 0 1.85 1.568h.741a1.875 1.875 0 0 0 1.85-1.568l.147-.883a7.517 7.517 0 0 0 1.497-.62l.756.474c.71.487 1.72.366 2.369-.283l.524-.524a1.875 1.875 0 0 0 .283-2.369l-.474-.756c.261-.47.468-.97.62-1.497l.883-.147a1.875 1.875 0 0 0 1.568-1.85v-.741a1.875 1.875 0 0 0-1.568-1.85l-.883-.147a7.523 7.523 0 0 0-.62-1.498l.474-.755a1.875 1.875 0 0 0-.283-2.369l-.524-.524a1.875 1.875 0 0 0-2.369-.284l-.756.475a7.518 7.518 0 0 0-1.497-.62l-.147-.883a1.875 1.875 0 0 0-1.85-1.568h-.741Zm.37 13.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clip-rule="evenodd"/></svg>`,
brush: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182l-6.375 6.375a4.5 4.5 0 0 1-1.591 1.024l-2.555.852a.75.75 0 0 1-.949-.949l.852-2.555a4.5 4.5 0 0 1 1.024-1.591l6.412-6.338ZM7.097 16.785l-.077.077a4.5 4.5 0 0 0 6.364 6.364l.077-.077.83-2.487a1.875 1.875 0 0 0-.417-1.918l-1.91-1.91a1.875 1.875 0 0 0-1.918-.417l-2.487.83Z"/></svg>`,
globe: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.25-8.147V8.25H7.102a13.341 13.341 0 0 1 3.398-4.397Zm0 6.147H6.255a14.64 14.64 0 0 0 0 4h4.245V10Zm0 6H7.102a13.341 13.341 0 0 0 3.398 4.397V16Zm1.5 4.397A13.341 13.341 0 0 0 15.398 16H12v4.397Zm0-6.397h4.245a14.64 14.64 0 0 0 0-4H12v4Zm0-5.75h3.398A13.341 13.341 0 0 0 12 3.853V8.25Z" clip-rule="evenodd"/></svg>`,
apps: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.25 3.75A1.5 1.5 0 0 0 3.75 5.25v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-3ZM5.25 14.25a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-3ZM14.25 5.25a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3ZM15.75 14.25a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-3Z"/></svg>`,
account: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM3.75 20.25a8.25 8.25 0 1 1 16.5 0 .75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75Z"/></svg>`,
chain: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M15.75 3a3.75 3.75 0 0 1 2.652 6.402l-1.72 1.72a.75.75 0 1 1-1.06-1.06l1.719-1.72a2.25 2.25 0 1 0-3.182-3.182l-1.72 1.72a.75.75 0 0 1-1.06-1.06l1.72-1.72A3.738 3.738 0 0 1 15.75 3Zm-3.22 5.03a.75.75 0 0 1 0 1.06l-3.44 3.44a.75.75 0 0 1-1.06-1.06l3.44-3.44a.75.75 0 0 1 1.06 0Zm-5.872 4.848a.75.75 0 0 1 1.06 0l1.72 1.72a2.25 2.25 0 0 1-3.182 3.182l-1.72-1.72a3.75 3.75 0 0 1 5.304-5.304l1.72 1.72a.75.75 0 0 1-1.06 1.06l-1.72-1.72a2.25 2.25 0 0 0-3.182 3.182l1.72 1.72a2.25 2.25 0 0 0 3.182-3.182l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>`,
trash: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8.25 4.5a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 .75.75V6h3a.75.75 0 0 1 0 1.5h-.29l-.83 11.614A2.25 2.25 0 0 1 15.386 21h-6.772a2.25 2.25 0 0 1-2.244-1.886L5.54 7.5H5.25a.75.75 0 0 1 0-1.5h3V4.5Zm1.5 1.5h4.5V5.25h-4.5V6Zm-.75 4.5a.75.75 0 0 1 1.5 0v6a.75.75 0 1 1-1.5 0v-6Zm4.5-.75a.75.75 0 0 0-1.5 0v6a.75.75 0 1 0 1.5 0v-6Z" clip-rule="evenodd"/></svg>`,
wifi: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.062 0 8.25 8.25 0 0 0-11.667 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.204 3.182a6 6 0 0 1 8.486 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0 3.75 3.75 0 0 0-5.304 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>`,
};

const SETTINGS_DIR = "/apps/system/settings.tapp";
const WISP_PATH = `${SETTINGS_DIR}/wisp-servers.json`;
const RECENT_PATH = `${SETTINGS_DIR}/recent.json`;
const MAX_RECENT_ITEMS = 4;
const CAT_ORDER = ["general", "appearance", "internet", "apps", "account"];

const fsApi = window.tb?.fs;
const parser = window.tb?.system?.TSLParser;

const homeScreen = document.getElementById("homeScreen");
const detailScreen = document.getElementById("detailScreen");
const recentlyVisitedEl = document.getElementById("recentlyVisited");
const categoryGridEl = document.getElementById("categoryGrid");
const detailTitleEl = document.getElementById("detailTitle");
const detailSidebarEl = document.getElementById("detailSidebar");
const detailContentEl = document.getElementById("detailContent");

let categoryModels = [];
let recentItems = [];
let currentCategory = null;
let currentViewId = "";
let currentSearchTerm = "";
let navHistory = [];
let navFuture = [];

function getTitlebarEl(id) {
return window.parent?.document?.getElementById(id) || null;
}

function styleNavButton(button, enabled) {
if (!button) return;
button.style.background = enabled ? "#4b8f4b" : "#ffffff14";
button.style.color = enabled ? "#ffffff" : "#ffffff70";
button.style.cursor = enabled ? "pointer" : "default";
}

function updateTitlebarNavState() {
const backBtn = getTitlebarEl("settings-nav-back");
const forwardBtn = getTitlebarEl("settings-nav-forward");
styleNavButton(backBtn, navHistory.length > 1);
styleNavButton(forwardBtn, navFuture.length > 0);
}

function currentRoute() {
if (homeScreen && !homeScreen.classList.contains("hidden")) {
return { screen: "home" };
}
if (currentSearchTerm) {
return {
screen: "search",
searchTerm: currentSearchTerm,
};
}
return {
screen: "detail",
categoryId: currentCategory?.id || "",
viewId: currentViewId || "",
};
}

function sameRoute(a, b) {
if (!a || !b) return false;
return (
a.screen === b.screen
&& (a.categoryId || "") === (b.categoryId || "")
&& (a.viewId || "") === (b.viewId || "")
&& (a.searchTerm || "") === (b.searchTerm || "")
);
}

function pushRoute(route) {
const last = navHistory[navHistory.length - 1];
if (!sameRoute(last, route)) {
navHistory.push(route);
}
navFuture = [];
updateTitlebarNavState();
}

async function navigateToRoute(route, opts = { push: true, reverse: false }) {
if (!route) return;
if (route.screen === "home") {
currentSearchTerm = "";
openHomeScreen();
updateDetailTitle();
} else if (route.screen === "search") {
await openSearchResults(route.searchTerm || "", !!opts.reverse, !!opts.push);
} else if (route.screen === "detail" && route.categoryId) {
await openCategoryDetail(route.categoryId, route.viewId || undefined, !!opts.reverse, !!opts.push);
}
if (opts.push) {
pushRoute(currentRoute());
}
}

function bindTitlebarNav() {
const backBtn = getTitlebarEl("settings-nav-back");
const forwardBtn = getTitlebarEl("settings-nav-forward");
const searchInput = getTitlebarEl("settings-nav-search");

if (backBtn && !backBtn.dataset.boundSettingsNav) {
backBtn.dataset.boundSettingsNav = "true";
backBtn.addEventListener("click", async () => {
if (navHistory.length <= 1) return;
const current = navHistory.pop();
if (current) navFuture.unshift(current);
const previous = navHistory[navHistory.length - 1];
if (!previous) return;
await navigateToRoute(previous, { push: false, reverse: true });
updateTitlebarNavState();
});
}

if (forwardBtn && !forwardBtn.dataset.boundSettingsNav) {
forwardBtn.dataset.boundSettingsNav = "true";
forwardBtn.addEventListener("click", async () => {
if (!navFuture.length) return;
const next = navFuture.shift();
if (!next) return;
await navigateToRoute(next, { push: false, reverse: false });
navHistory.push(next);
updateTitlebarNavState();
});
}

if (searchInput && !searchInput.dataset.boundSettingsNav) {
searchInput.dataset.boundSettingsNav = "true";
searchInput.addEventListener("keydown", async ev => {
if (ev.key !== "Enter") return;
const term = String(searchInput.value || "").trim();
if (!term) {
await navigateToRoute({ screen: "home" }, { push: true, reverse: true });
return;
}
await navigateToRoute({ screen: "search", searchTerm: term }, { push: true, reverse: false });
});
}

updateTitlebarNavState();
}

function readFileFs(path, encoding = "utf8") {
return new Promise((resolve, reject) => {
if (!fsApi || typeof fsApi.readFile !== "function") {
reject(new Error("tb.fs.readFile unavailable"));
return;
}
fsApi.readFile(path, encoding, (err, data) => {
if (err) {
reject(err);
return;
}
resolve(data);
});
});
}

function writeFileFs(path, value, encoding = "utf8") {
return new Promise((resolve, reject) => {
if (!fsApi || typeof fsApi.writeFile !== "function") {
reject(new Error("tb.fs.writeFile unavailable"));
return;
}
fsApi.writeFile(path, value, encoding, err => {
if (err) {
reject(err);
return;
}
resolve();
});
});
}

async function readDirFs(path) {
if (fsApi && typeof fsApi.readDir === "function") {
return new Promise((resolve, reject) => {
fsApi.readDir(path, (err, files) => {
if (err) return reject(err);
resolve(files || []);
});
});
}
if (fsApi && typeof fsApi.readdir === "function") {
return new Promise((resolve, reject) => {
fsApi.readdir(path, (err, files) => {
if (err) return reject(err);
resolve(files || []);
});
});
}
if (fsApi?.promises?.readdir) {
return fsApi.promises.readdir(path);
}
throw new Error("tb.fs.readDir/readdir unavailable");
}

function mapIcon(iconValue) {
const icon = String(iconValue || "").toLowerCase();
if (icon.includes("palette") || icon.includes("paint") || icon.includes("brush")) return "brush";
if (icon.includes("internet") || icon.includes("network") || icon.includes("public") || icon.includes("globe")) return "globe";
if (icon.includes("account") || icon.includes("person") || icon.includes("user")) return "account";
if (icon.includes("app")) return "apps";
return "settings";
}

function orderCategory(a, b) {
const aTitle = String(a?.title || "").toLowerCase();
const bTitle = String(b?.title || "").toLowerCase();
const ai = CAT_ORDER.findIndex(v => aTitle.includes(v));
const bi = CAT_ORDER.findIndex(v => bTitle.includes(v));
const av = ai === -1 ? 999 : ai;
const bv = bi === -1 ? 999 : bi;
if (av !== bv) return av - bv;
return aTitle.localeCompare(bTitle);
}

function normalizeCategoryFromDoc(doc, sourcePath) {
const rec = Array.isArray(doc?.ui?.recommendedOptions) ? doc.ui.recommendedOptions : [];
const views = Array.isArray(doc?.ui?.views) ? doc.ui.views : [];
const quickLinks = rec.slice(0, 3).map((opt, index) => ({
id: opt.id || `${doc?.manifest?.id || sourcePath}-opt-${index}`,
label: opt.text || opt.id || `Option ${index + 1}`,
view: opt.view || "",
action: opt.action || "",
}));
return {
id: doc?.manifest?.id || sourcePath,
title: doc?.manifest?.title || sourcePath.split("/").pop()?.replace(/\.tsl$/i, "") || "Settings",
icon: mapIcon(doc?.manifest?.icon),
path: sourcePath,
document: doc,
views,
quickLinks,
};
}

function openDetailScreen(reverse = false) {
if (!homeScreen || !detailScreen) return;
homeScreen.classList.remove("entering");
homeScreen.classList.add("leaving");
detailScreen.classList.remove("hidden", "leaving", "reverse");
detailScreen.classList.add("entering");
if (reverse) detailScreen.classList.add("reverse");
window.setTimeout(() => {
homeScreen.classList.add("hidden");
homeScreen.classList.remove("leaving");
detailScreen.classList.remove("entering");
}, 230);
}

function openHomeScreen() {
if (!homeScreen || !detailScreen) return;
detailScreen.classList.add("leaving", "reverse");
homeScreen.classList.remove("hidden", "leaving");
homeScreen.classList.add("entering");
window.setTimeout(() => {
detailScreen.classList.add("hidden");
detailScreen.classList.remove("leaving", "reverse", "entering");
homeScreen.classList.remove("entering");
}, 230);
}

async function ensureRecentFile() {
try {
const raw = await readFileFs(RECENT_PATH, "utf8");
const parsed = JSON.parse(String(raw || "[]"));
recentItems = Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ITEMS) : [];
} catch {
recentItems = [];
await writeFileFs(RECENT_PATH, JSON.stringify([], null, 2), "utf8");
}
}

async function saveRecentFile() {
await writeFileFs(RECENT_PATH, JSON.stringify(recentItems.slice(0, MAX_RECENT_ITEMS), null, 2), "utf8");
}

async function pushRecent(item) {
const key = `${item.categoryId}|${item.optionId}`;
recentItems = [item, ...recentItems.filter(it => `${it.categoryId}|${it.optionId}` !== key)].slice(0, MAX_RECENT_ITEMS);
await saveRecentFile();
buildRecentlyVisited();
}

function buildRecentlyVisited() {
if (!recentlyVisitedEl) return;
const fallback = categoryModels.slice(0, MAX_RECENT_ITEMS).map(cat => ({
label: cat.title,
icon: cat.icon,
categoryId: cat.id,
optionId: "",
viewId: "",
}));
const source = recentItems.length ? recentItems : fallback;
recentlyVisitedEl.innerHTML = source
.map(
item => `
<button type="button" class="recent-chip" data-category-id="${item.categoryId || ""}" data-option-id="${item.optionId || ""}" data-view-id="${item.viewId || ""}" aria-label="${item.label}">
<span class="icon-spot">${iconSet[item.icon] || iconSet.settings}</span>
<span>${item.label}</span>
</button>
`,
)
.join("");

recentlyVisitedEl.querySelectorAll(".recent-chip").forEach(btn => {
btn.addEventListener("click", () => {
const categoryId = btn.getAttribute("data-category-id") || "";
const viewId = btn.getAttribute("data-view-id") || "";
if (!categoryId) return;
navigateToRoute({ screen: "detail", categoryId, viewId: viewId || undefined }, { push: true, reverse: true });
});
});
}

function buildCategoryGrid() {
if (!categoryGridEl) return;
categoryGridEl.innerHTML = categoryModels
.map(
cat => `
<article class="settings-card" data-category-open="${cat.id}">
<header class="settings-card-header">
<span class="icon-spot">${iconSet[cat.icon] || iconSet.settings}</span>
<h3 class="settings-card-title">${cat.title}</h3>
</header>
<div class="flex flex-col">
${cat.quickLinks
.map(
link => `
<button type="button" class="quick-link" data-category-id="${cat.id}" data-option-id="${link.id}" data-view-id="${link.view || ""}" aria-label="${link.label}">
<span class="link-icon">${iconSet.chain}</span>
<span>${link.label}</span>
</button>
`,
)
.join("")}
</div>
</article>
`,
)
.join("");

categoryGridEl.querySelectorAll("[data-category-open]").forEach(el => {
el.addEventListener("click", ev => {
if (ev.target instanceof HTMLElement && ev.target.closest(".quick-link")) return;
const categoryId = el.getAttribute("data-category-open") || "";
if (!categoryId) return;
navigateToRoute({ screen: "detail", categoryId }, { push: true, reverse: false });
});
});

categoryGridEl.querySelectorAll(".quick-link").forEach(btn => {
btn.addEventListener("click", async ev => {
ev.stopPropagation();
const categoryId = btn.getAttribute("data-category-id") || "";
const optionId = btn.getAttribute("data-option-id") || "";
const viewId = btn.getAttribute("data-view-id") || "";
if (!categoryId) return;

await navigateToRoute({ screen: "detail", categoryId, viewId: viewId || undefined }, { push: true, reverse: false });

const category = categoryModels.find(cat => cat.id === categoryId);
const option = category?.quickLinks.find(it => it.id === optionId);
if (!category || !option) return;
await pushRecent({ categoryId, optionId, viewId: option.view || "", label: option.label, icon: category.icon });
});
});
}

function getCategoryById(categoryId) {
return categoryModels.find(cat => cat.id === categoryId) || null;
}

function selectViewInSidebar(viewId) {
if (!detailSidebarEl) return;
detailSidebarEl.querySelectorAll(".detail-nav-btn").forEach(btn => {
const on = btn.getAttribute("data-view-id") === viewId;
btn.classList.toggle("active", on);
});
}

function parseCategoryContext(category) {
const title = String(category.title || "").toLowerCase();
if (title.includes("internet")) return "internet";
if (title.includes("account")) return "account";
if (title.includes("appearance")) return "appearance";
if (title.includes("general")) return "general";
if (title.includes("apps")) return "apps";
return "generic";
}

function updateDetailTitle() {
if (!detailTitleEl) return;
if (currentSearchTerm) {
detailTitleEl.textContent = `Searching for: ${currentSearchTerm}`;
return;
}
detailTitleEl.textContent = currentCategory?.title || "Settings";
}

function scoreTextMatch(textValue, searchTerm) {
const text = String(textValue || "").toLowerCase();
const term = String(searchTerm || "").toLowerCase();
if (!text || !term) return 0;
if (text === term) return 120;
if (text.startsWith(term)) return 90;
if (text.includes(term)) return 65;
return 0;
}

function findBestMatches(searchTerm) {
const term = String(searchTerm || "").trim().toLowerCase();
if (!term) return [];

const hits = [];
for (const category of categoryModels) {
for (const quick of category.quickLinks) {
const quickScore = scoreTextMatch(quick.label, term);
const viewScore = scoreTextMatch(quick.view, term);
const catScore = scoreTextMatch(category.title, term);
const score = quickScore + Math.floor(viewScore / 3) + Math.floor(catScore / 3);
if (!score) continue;
hits.push({
score,
kind: "Recommended",
label: quick.label || quick.id || "Setting",
categoryId: category.id,
categoryTitle: category.title,
viewId: quick.view || category.views[0]?.id || "",
icon: category.icon,
});
}

for (const view of category.views) {
const viewTitle = view.title || view.id || "";
const viewScore = scoreTextMatch(viewTitle, term);
let sectionBoost = 0;
for (const section of view.sections || []) {
sectionBoost = Math.max(sectionBoost, Math.floor(scoreTextMatch(section.title, term) / 2));
for (const control of section.controls || []) {
sectionBoost = Math.max(sectionBoost, Math.floor(scoreTextMatch(control.label, term) / 2));
}
}
const catScore = Math.floor(scoreTextMatch(category.title, term) / 3);
const score = viewScore + sectionBoost + catScore;
if (!score) continue;
hits.push({
score,
kind: "View",
label: viewTitle,
categoryId: category.id,
categoryTitle: category.title,
viewId: view.id || category.views[0]?.id || "",
icon: category.icon,
});
}
}

return hits
.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
.filter((hit, index, arr) => arr.findIndex(other => other.categoryId === hit.categoryId && other.viewId === hit.viewId && other.label === hit.label) === index)
.slice(0, 12);
}

async function openSearchResults(searchTerm, reverse = false, shouldPushHistory = true) {
const normalized = String(searchTerm || "").trim();
if (!normalized) {
currentSearchTerm = "";
return;
}
currentCategory = null;
currentViewId = "";
currentSearchTerm = normalized;
updateDetailTitle();

const matches = findBestMatches(normalized);
if (detailSidebarEl) {
detailSidebarEl.innerHTML = `
<div class="search-side-panel">
<div class="search-side-label">Best Matches</div>
<div class="search-side-count">${matches.length} result${matches.length === 1 ? "" : "s"}</div>
</div>
`;
}

if (detailContentEl) {
if (!matches.length) {
detailContentEl.innerHTML = `<p class="detail-control-value">No settings matched "${normalized}".</p>`;
} else {
detailContentEl.innerHTML = matches
.map(match => `
<button type="button" class="search-result-card" data-open-category="${match.categoryId}" data-open-view="${match.viewId}">
<span class="search-result-icon">${iconSet[match.icon] || iconSet.settings}</span>
<span class="search-result-body">
<span class="search-result-title">${match.label}</span>
<span class="search-result-meta">${match.kind} in ${match.categoryTitle}</span>
</span>
</button>
`)
.join("");

detailContentEl.querySelectorAll("[data-open-category]").forEach(btn => {
btn.addEventListener("click", async () => {
const categoryId = btn.getAttribute("data-open-category") || "";
const viewId = btn.getAttribute("data-open-view") || "";
if (!categoryId) return;
await navigateToRoute({ screen: "detail", categoryId, viewId }, { push: true, reverse: false });
});
});
}
}

openDetailScreen(reverse);
if (shouldPushHistory) pushRoute(currentRoute());
}

async function loadWispServers() {
try {
const raw = await readFileFs(WISP_PATH, "utf8");
const data = JSON.parse(String(raw || "[]"));
return Array.isArray(data) ? data : [];
} catch {
return [];
}
}

async function saveWispServers(list) {
await writeFileFs(WISP_PATH, JSON.stringify(list, null, 2), "utf8");
}

function renderGenericView(view) {
const sections = Array.isArray(view?.sections) ? view.sections : [];
if (!sections.length) return `<p class="detail-control-value">No controls for this view yet.</p>`;
return sections
.map(section => {
const controls = Array.isArray(section.controls) ? section.controls : [];
const controlHtml = controls
.map(control => {
const ctype = String(control.type || "").toLowerCase();
if (ctype === "button") return `<button type="button" class="detail-action">${control.label || "Run Action"}</button>`;
if (ctype === "text") return `<div><div class="detail-control-text">${control.label || "Text"}</div><div class="detail-control-value">${control.bind || "No binding"}</div></div>`;
if (ctype === "toggle" || ctype === "select" || ctype === "slider" || ctype === "list") return `<div><div class="detail-control-text">${control.label || control.type}</div><div class="detail-control-value">${control.bind || "No binding"}</div></div>`;
return `<div><div class="detail-control-text">${control.label || control.type}</div></div>`;
})
.join("");
return `<section><h3 class="detail-section-title">${section.title || "Section"}</h3><div class="flex flex-col gap-3">${controlHtml}</div></section>`;
})
.join("");
}

function serverStatusFromLatency(latency) {
if (latency === null || typeof latency === "undefined") return { online: false, label: "999ms" };
if (latency > 800) return { online: false, label: `${latency}ms` };
return { online: true, label: `${latency}ms` };
}

async function measureWsLatency(url) {
return new Promise(resolve => {
try {
const ws = new WebSocket(url);
const started = Date.now();
const finish = val => {
try { ws.close(); } catch { /* ignore */ }
resolve(val);
};
const timer = window.setTimeout(() => finish(null), 1800);
ws.addEventListener("open", () => {
window.clearTimeout(timer);
finish(Date.now() - started);
});
ws.addEventListener("error", () => {
window.clearTimeout(timer);
finish(null);
});
} catch {
resolve(null);
}
});
}

async function renderInternetWispView() {
const list = await loadWispServers();
const rows = await Promise.all(
list.map(async item => {
const latency = await measureWsLatency(item.id);
const state = serverStatusFromLatency(latency);
const name = item.name || "Server Name";
const address = item.id || "wss://example.com/wisp";
return `
<div class="server-card-wrap">
<div class="server-card ${state.online ? "is-online" : "is-offline"}">
<span class="server-icon">${iconSet.wifi}</span>
<div>
<div class="server-main-title">${name}</div>
<div class="server-latency">${state.label}</div>
<div class="server-subtext">${address}</div>
</div>
</div>
<button type="button" class="server-delete" data-del-wisp="${name}">${iconSet.trash}</button>
</div>
`;
}),
);
return `${rows.join("")}<button type="button" class="detail-action" data-add-wisp="true"><span class="link-icon">${iconSet.settings}</span><span>Add Wisp Server</span></button>`;
}

async function renderDetailContent(category, viewId) {
if (!detailContentEl) return;
const view = category.views.find(v => v.id === viewId) || category.views[0];
if (!view) {
detailContentEl.innerHTML = `<p class="detail-control-value">No view available.</p>`;
return;
}
const context = parseCategoryContext(category);
if (context === "internet" && String(view.id || "") === "wisp") {
detailContentEl.innerHTML = await renderInternetWispView();
wireWispActions(category, view);
return;
}
detailContentEl.innerHTML = renderGenericView(view);
}

function wireWispActions(category, view) {
if (!detailContentEl) return;
detailContentEl.querySelectorAll("[data-del-wisp]").forEach(btn => {
btn.addEventListener("click", async () => {
const target = btn.getAttribute("data-del-wisp") || "";
if (!target) return;
const list = await loadWispServers();
const next = list.filter(item => item.name !== target);
await saveWispServers(next);
await renderDetailContent(category, view.id || "");
});
});

const addBtn = detailContentEl.querySelector("[data-add-wisp='true']");
if (addBtn) {
addBtn.addEventListener("click", async () => {
if (!window.tb?.dialog?.Message) return;
const name = await new Promise(resolve => window.tb.dialog.Message({ title: "Enter Wisp server name", onOk: value => resolve(value) }));
if (!name) return;
const addr = await new Promise(resolve => window.tb.dialog.Message({ title: "Enter Wisp socket URL", onOk: value => resolve(value) }));
if (!addr) return;
const list = await loadWispServers();
list.push({ id: String(addr), name: String(name) });
await saveWispServers(list);
await renderDetailContent(category, view.id || "");
});
}
}

function renderDetailSidebar(category, activeViewId) {
if (!detailSidebarEl) return;
detailSidebarEl.innerHTML = category.views
.map(
view => `
<button type="button" class="detail-nav-btn ${view.id === activeViewId ? "active" : ""}" data-view-id="${view.id}">${view.title || view.id}</button>
`,
)
.join("");

detailSidebarEl.querySelectorAll(".detail-nav-btn").forEach(btn => {
btn.addEventListener("click", async () => {
const viewId = btn.getAttribute("data-view-id") || "";
if (!viewId || !currentCategory) return;
currentViewId = viewId;
selectViewInSidebar(viewId);
await renderDetailContent(currentCategory, viewId);
pushRoute(currentRoute());
});
});
}

async function openCategoryDetail(categoryId, preferredViewId, reverse = false, shouldPushHistory = true) {
const category = getCategoryById(categoryId);
if (!category) return;
const selectedView = category.views.find(v => v.id === preferredViewId) ? preferredViewId : category.views[0]?.id || "";
if (!selectedView) return;
currentCategory = category;
currentViewId = selectedView;
currentSearchTerm = "";
updateDetailTitle();
renderDetailSidebar(category, selectedView);
await renderDetailContent(category, selectedView);
openDetailScreen(reverse);
if (shouldPushHistory) pushRoute(currentRoute());
await pushRecent({ categoryId: category.id, optionId: "", viewId: selectedView, label: category.title, icon: category.icon });
}

async function loadTslCategories() {
if (!parser || typeof parser.parseTSL !== "function") throw new Error("window.tb.system.TSLParser unavailable");
const entries = await readDirFs(SETTINGS_DIR);
const tslFiles = entries.filter(name => typeof name === "string" && name.toLowerCase().endsWith(".tsl") && name.toLowerCase() !== "recent.json").sort();
const docs = await Promise.all(
tslFiles.map(async file => {
const fullPath = `${SETTINGS_DIR}/${file}`;
const doc = await parser.parseTSL(fullPath);
return normalizeCategoryFromDoc(doc, fullPath);
}),
);
categoryModels = docs.filter(cat => cat.quickLinks.length > 0 && cat.views.length > 0).sort(orderCategory);
}

async function init() {
try {
await loadTslCategories();
await ensureRecentFile();
buildRecentlyVisited();
buildCategoryGrid();
pushRoute({ screen: "home" });
bindTitlebarNav();
window.setTimeout(bindTitlebarNav, 250);
window.setTimeout(bindTitlebarNav, 1000);
} catch (err) {
console.error("Failed to initialize settings UI", err);
}
}

void init();

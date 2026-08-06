import * as id3 from "https://unpkg.com/id3js@latest/lib/id3.js";
import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs";

if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
	pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs";
}

const tbApi = () => window.parent && window.parent.tb;
const tbFs = () => tbApi().fs.promises;

const EXTENSIONS_PATH = "/apps/system/files.tapp/extensions.json";
const FOLDER_MAP = {
	video: ["videos"],
	image: ["pictures", "images"],
	audio: ["music"],
};

const SECTION_ORDER = ["home", "videos", "photos", "audio", "storage", "tbdrive"];

const ICONS = {
	home: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z"/><path d="M12 5.432 20.159 13.591c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.43Z"/></svg>`,
	video: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z"/></svg>`,
	photo: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 6A2.25 2.25 0 0 1 3.75 3.75h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5a.75.75 0 0 0 .75-.75v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"/></svg>`,
	audio: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.6-.743a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.6-.742a1.5 1.5 0 0 0 1.088-1.442V9.017 5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .684.122Z"/></svg>`,
	drive: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.507 4.048A3 3 0 0 1 7.785 3h8.43a3 3 0 0 1 2.278 1.048l1.722 2.008A4.533 4.533 0 0 0 19.5 6h-15c-.243 0-.482.02-.715.056l1.722-2.008Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 10.5a3 3 0 0 1 3-3h15a3 3 0 1 1 0 6h-15a3 3 0 0 1-3-3Zm15 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM4.5 15a3 3 0 1 0 0 6h15a3 3 0 1 0 0-6h-15Z"/></svg>`,
	cloudMono: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96Z"/></svg>`,
	file: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z"/><path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z"/></svg>`,
	search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" stroke-linecap="round"/></svg>`,
};
ICONS.image = ICONS.photo;

function cloudIconSvg(gradId) {
	return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<linearGradient id="${gradId}" x1="0" y1="4" x2="24" y2="20" gradientUnits="userSpaceOnUse">
				<stop offset="0" stop-color="#4facfe" />
				<stop offset="0.55" stop-color="#7b6cf6" />
				<stop offset="1" stop-color="#f76e9c" />
			</linearGradient>
		</defs>
		<path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96Z" fill="url(#${gradId})" />
	</svg>`;
}

const SECTIONS = [
	{ id: "home", label: "Home", icon: ICONS.home },
	{ id: "videos", label: "Videos", icon: ICONS.video },
	{ id: "photos", label: "Photos", icon: ICONS.photo },
	{ id: "audio", label: "Audio", icon: ICONS.audio },
	{ id: "storage", label: "Storage Media", icon: ICONS.drive },
	{ id: "tbdrive", label: "TB Drive", icon: ICONS.cloudMono },
];

let currentSection = "home";
let currentUsername = "guest";
let cachedExtensions = null;
let viewerItem = null;
let activeGridItems = [];
let tileSeq = 0;
let renderToken = 0;
let externalOpenHandled = false;

function nextRenderToken() {
	return ++renderToken;
}

const blobUrlCache = new Map();
const audioArtCache = new Map();

function escHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
const escAttr = escHtml;

function sectionIndex(id) {
	return SECTION_ORDER.indexOf(id);
}

function formatBytes(bytes) {
	const value = Number(bytes) || 0;
	if (value < 1024) return `${value} B`;
	if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
	if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
	if (value < 1024 * 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
	return `${(value / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
}

function formatDuration(seconds) {
	if (!Number.isFinite(seconds)) return "";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function timeGreeting() {
	const h = new Date().getHours();
	if (h < 5) return "Night";
	if (h < 12) return "Morning";
	if (h < 17) return "Afternoon";
	if (h < 21) return "Evening";
	return "Night";
}

function toRenderableSrc(value) {
	const text = String(value || "").trim();
	if (!text) return "";
	if (text.startsWith("data:") || text.startsWith("blob:") || text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/fs/")) return text;
	if (text.startsWith("/assets/")) return text;
	if (text.startsWith("/")) return `/fs${text}`;
	return text;
}

function extOf(name) {
	const parts = String(name || "").split(".");
	return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function baseName(pathOrUrl) {
	return String(pathOrUrl || "")
		.split("/")
		.pop();
}

async function getUsername() {
	try {
		const u = await tbApi().user.username();
		if (u) return u;
	} catch {}
	try {
		const s = sessionStorage.getItem("currAcc");
		if (s) return s;
	} catch {}
	return "guest";
}

async function loadExtensions() {
	try {
		const raw = await tbFs().readFile(EXTENSIONS_PATH, "utf8");
		return JSON.parse(String(raw || "{}"));
	} catch {
		return {};
	}
}

function extCategory(ext, exts) {
	const e = String(ext || "").toLowerCase();
	const table = exts || cachedExtensions || {};
	if (table.image?.includes(e)) return "image";
	if (table.animated?.includes(e)) return "animated";
	if (table.video?.includes(e)) return "video";
	if (table.audio?.includes(e)) return "audio";
	if (table.pdf?.includes(e)) return "pdf";
	return null;
}

function guessSectionForCategory(category) {
	if (category === "video") return "videos";
	if (category === "image" || category === "animated") return "photos";
	if (category === "audio") return "audio";
	return null;
}

async function safeStat(path) {
	try {
		return await tbFs().stat(path);
	} catch {
		return null;
	}
}

async function safeReaddir(path) {
	try {
		const entries = await tbFs().readdir(path);
		return Array.isArray(entries) ? entries : [];
	} catch {
		return [];
	}
}

async function listMediaFiles(kind) {
	const user = currentUsername;
	const candidates = (FOLDER_MAP[kind] || []).map(f => `/home/${user}/${f}`);
	let folder = null;
	let names = [];
	for (const dir of candidates) {
		const entries = await safeReaddir(dir);
		if (entries.length || (await safeStat(dir))) {
			folder = dir;
			names = entries;
			break;
		}
	}
	if (!folder) folder = candidates[0] || `/home/${user}`;
	const items = [];
	for (const name of names) {
		const full = `${folder}/${name}`.replace(/\/{2,}/g, "/");
		const stat = await safeStat(full);
		if (!stat || (typeof stat.isDirectory === "function" && stat.isDirectory())) continue;
		const ext = extOf(name);
		const category = extCategory(ext);
		if (kind === "video" && category !== "video") continue;
		if (kind === "audio" && category !== "audio") continue;
		if (kind === "image" && category !== "image" && category !== "animated") continue;
		items.push({
			name,
			path: full,
			ext,
			kind,
			mtime: stat.mtime ? new Date(stat.mtime).getTime() : 0,
			size: Number(stat.size) || 0,
		});
	}
	items.sort((a, b) => b.mtime - a.mtime);
	return { folder, items };
}

async function getFileBlobUrl(path, mime) {
	if (blobUrlCache.has(path)) return blobUrlCache.get(path);
	try {
		const data = await tbFs().readFile(path);
		const blob = new Blob([data], { type: mime });
		const url = URL.createObjectURL(blob);
		blobUrlCache.set(path, url);
		return url;
	} catch (err) {
		console.warn("Media Viewer: failed to read file", path, err);
		return null;
	}
}

async function getImageThumb(path, ext) {
	const mime = `image/${ext === "jpg" ? "jpeg" : ext || "png"}`;
	const url = await getFileBlobUrl(path, mime);
	return url ? { dataUrl: url } : null;
}

async function getVideoThumb(path, ext) {
	const url = await getFileBlobUrl(path, `video/${ext || "mp4"}`);
	if (!url) return null;
	return new Promise(resolve => {
		const videoEl = document.createElement("video");
		videoEl.muted = true;
		videoEl.playsInline = true;
		videoEl.preload = "auto";
		let settled = false;
		const finish = value => {
			if (settled) return;
			settled = true;
			resolve(value);
		};
		videoEl.addEventListener("loadeddata", () => {
			try {
				videoEl.currentTime = Math.min(1, Math.max(0.05, (videoEl.duration || 2) * 0.15));
			} catch {
				finish(null);
			}
		});
		videoEl.addEventListener("seeked", () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = videoEl.videoWidth || 160;
				canvas.height = videoEl.videoHeight || 90;
				const ctx = canvas.getContext("2d");
				ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
				finish({ dataUrl: canvas.toDataURL("image/jpeg", 0.72), duration: videoEl.duration });
			} catch {
				finish(null);
			}
		});
		videoEl.addEventListener("error", () => finish(null));
		videoEl.src = url;
		setTimeout(() => finish(null), 5000);
	});
}

async function getAudioArt(path, ext) {
	if (audioArtCache.has(path)) return audioArtCache.get(path);
	const url = await getFileBlobUrl(path, `audio/${ext || "mp3"}`);
	if (!url) return null;
	try {
		const response = await fetch(url);
		const blob = await response.blob();
		const tags = await id3.fromFile(new File([blob], `audio.${ext || "mp3"}`, { type: blob.type }));
		let result = { title: tags?.title, artist: tags?.artist, dataUrl: null };
		if (tags?.images?.length) {
			const imageData = tags.images[0];
			let data = imageData.data;
			let uint8;
			if (data instanceof ArrayBuffer) uint8 = new Uint8Array(data);
			else if (ArrayBuffer.isView(data)) uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
			else if (Array.isArray(data)) uint8 = new Uint8Array(data);
			else if (typeof data === "string") {
				const b64 = data.replace(/^data:\w+\/[a-zA-Z+]+;base64,/, "");
				const raw = atob(b64);
				uint8 = new Uint8Array(raw.length);
				for (let i = 0; i < raw.length; ++i) uint8[i] = raw.charCodeAt(i);
			} else if (tbApi()?.buffer?.from) {
				const buf = tbApi().buffer.from(data);
				uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
			}
			if (uint8) {
				const mime = imageData.format || imageData.mime || "image/jpeg";
				const signatures = [{ sig: [0xff, 0xd8, 0xff] }, { sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, { sig: [0x47, 0x49, 0x46, 0x38] }];
				let startIndex = 0;
				for (const s of signatures) {
					for (let i = 0; i <= uint8.length - s.sig.length; i++) {
						let ok = true;
						for (let j = 0; j < s.sig.length; j++) {
							if (uint8[i + j] !== s.sig[j]) {
								ok = false;
								break;
							}
						}
						if (ok) {
							startIndex = i;
							break;
						}
					}
					if (startIndex) break;
				}
				if (startIndex > 0) uint8 = uint8.subarray(startIndex);
				const artBlob = new Blob([uint8], { type: mime });
				result.dataUrl = URL.createObjectURL(artBlob);
			}
		}
		audioArtCache.set(path, result);
		return result;
	} catch (err) {
		console.warn("Media Viewer: failed to read ID3 art", err);
		return null;
	}
}

function buildTile(item, variant) {
	const tileId = ++tileSeq;
	item.tileId = tileId;
	const cls = variant === "featured" ? "mv-featured-tile" : "mv-media-tile";
	const dateLabel = item.mtime ? new Date(item.mtime).toLocaleDateString() : "";
	const iconSvg = ICONS[item.kind] || ICONS.file;
	return `
		<div class="${cls} is-fallback" data-tile-id="${tileId}" data-name="${escAttr(item.name)}" title="${escAttr(item.name)}">
			<span class="mv-tile-icon">${iconSvg}</span>
			<div class="mv-tile-caption">${escHtml(item.name)}</div>
			${dateLabel ? `<div class="mv-tile-meta">${escHtml(dateLabel)}</div>` : ""}
		</div>
	`;
}

function buildTrackRow(item) {
	const tileId = ++tileSeq;
	item.tileId = tileId;
	const dateLabel = item.mtime ? new Date(item.mtime).toLocaleDateString() : "";
	return `
		<div class="mv-track-row" data-tile-id="${tileId}" data-name="${escAttr(item.name)}">
			<div class="mv-track-art">${ICONS.audio}</div>
			<div class="mv-track-title">${escHtml(item.name)}</div>
			<div class="mv-track-meta">${escHtml(dateLabel)}</div>
		</div>
	`;
}

function wireTileClicks(container, items) {
	if (!container || container.dataset.mvWired) return;
	container.dataset.mvWired = "true";
	container.addEventListener("click", ev => {
		const tile = ev.target instanceof HTMLElement ? ev.target.closest("[data-tile-id]") : null;
		if (!tile) return;
		const id = Number(tile.getAttribute("data-tile-id"));
		const item = items.find(it => it.tileId === id);
		if (item) openViewer(item);
	});
}

async function loadThumbsFor(items, defaultKind, concurrency = 4) {
	const queue = items.slice();
	const workers = new Array(Math.min(concurrency, Math.max(1, queue.length))).fill(null).map(() => worker());
	await Promise.all(workers);
	async function worker() {
		let item = queue.shift();
		while (item) {
			await applyThumb(item, item.kind || defaultKind);
			item = queue.shift();
		}
	}
}

async function applyThumb(item, kind) {
	let result = null;
	try {
		if (kind === "video") result = await getVideoThumb(item.path, item.ext);
		else if (kind === "image") result = await getImageThumb(item.path, item.ext);
		else if (kind === "audio") result = await getAudioArt(item.path, item.ext);
	} catch {
		result = null;
	}
	const tileEls = document.querySelectorAll(`[data-tile-id="${item.tileId}"]`);
	tileEls.forEach(tileEl => {
		if (kind === "audio") {
			const artEl = tileEl.querySelector(".mv-track-art") || tileEl;
			if (result?.dataUrl) {
				artEl.style.backgroundImage = `url(${result.dataUrl})`;
				artEl.innerHTML = "";
			}
			return;
		}
		if (result?.dataUrl) {
			tileEl.style.backgroundImage = `url(${result.dataUrl})`;
			tileEl.classList.remove("is-fallback");
			const iconEl = tileEl.querySelector(".mv-tile-icon");
			if (iconEl) iconEl.remove();
			if (kind === "video" && result.duration) {
				const metaEl = tileEl.querySelector(".mv-tile-meta");
				if (metaEl && !metaEl.dataset.hasDuration) {
					metaEl.dataset.hasDuration = "true";
					metaEl.textContent = metaEl.textContent ? `${formatDuration(result.duration)} \u00b7 ${metaEl.textContent}` : formatDuration(result.duration);
				}
			}
		} else {
			tileEl.classList.add("is-fallback");
		}
	});
}

function setContent(html, token) {
	if (typeof token === "number" && token !== renderToken) return false;
	const el = document.getElementById("mvContent");
	if (!el) return false;
	el.innerHTML = html;
	el.scrollTop = 0;
	return true;
}

function emptyStateHtml(kind, folder) {
	const labels = { video: "videos", image: "photos", audio: "audio tracks" };
	return `
		<div class="mv-empty-state">
			<span class="mv-empty-state-icon">${ICONS[kind] || ICONS.file}</span>
			<div>No ${labels[kind] || "files"} found yet.</div>
			<div style="font-weight:600;color:rgba(255,255,255,0.4);font-size:0.78rem;">${escHtml(folder || "")}</div>
		</div>
	`;
}

async function buildAccountChip() {
	const user = currentUsername;
	let info = {};
	try {
		info = JSON.parse(await tbFs().readFile(`/home/${user}/user.json`, "utf8"));
	} catch {
		info = {};
	}
	const perm = String(info.perm || "user");
	const roleLabel = perm.charAt(0).toUpperCase() + perm.slice(1);
	const pfp = toRenderableSrc(info.pfp);
	const avatarInner = pfp ? `<img src="${escAttr(pfp)}" alt="" />` : `<span>${escHtml((user || "?").slice(0, 1).toUpperCase())}</span>`;
	return `
		<div class="mv-account-chip">
			<div class="mv-account-avatar">${avatarInner}</div>
			<div class="mv-account-meta">
				<span class="mv-account-name">${escHtml((user || "").toUpperCase())}</span>
				<span class="mv-account-role">${escHtml(roleLabel)}</span>
			</div>
		</div>
	`;
}

async function renderHomePage() {
	const token = nextRenderToken();
	const [videosRes, photosRes, audioRes] = await Promise.all([listMediaFiles("video"), listMediaFiles("image"), listMediaFiles("audio")]);
	const accountHtml = await buildAccountChip();

	const featured = [...videosRes.items, ...photosRes.items, ...audioRes.items].sort((a, b) => b.mtime - a.mtime).slice(0, 4);

	const homeVideos = videosRes.items.slice(0, 5);
	const homePhotos = photosRes.items.slice(0, 5);

	const applied = setContent(
		`
		<div class="mv-home-header">
			<h1 class="mv-greeting">Good ${escHtml(timeGreeting())}, ${escHtml((currentUsername || "").toUpperCase())}</h1>
			${accountHtml}
		</div>
		${
			featured.length
				? `<div class="mv-section-title"><span>Featured Memories</span></div>
			<div class="mv-featured-strip" id="mvFeaturedStrip">${featured.map(it => buildTile(it, "featured")).join("")}</div>`
				: ""
		}
		<div class="mv-section-title"><span>Videos</span><span class="mv-section-link" data-goto="videos">View all</span></div>
		${homeVideos.length ? `<div class="mv-media-grid" id="mvHomeVideos">${homeVideos.map(it => buildTile(it, "grid")).join("")}</div>` : emptyStateHtml("video", videosRes.folder)}
		<div class="mv-section-title"><span>Photos</span><span class="mv-section-link" data-goto="photos">View all</span></div>
		${homePhotos.length ? `<div class="mv-media-grid" id="mvHomePhotos">${homePhotos.map(it => buildTile(it, "grid")).join("")}</div>` : emptyStateHtml("image", photosRes.folder)}
	`,
		token,
	);
	if (!applied) return;

	document.querySelectorAll("[data-goto]").forEach(el => {
		el.addEventListener("click", () => switchSection(el.getAttribute("data-goto")));
	});

	if (featured.length) {
		const strip = document.getElementById("mvFeaturedStrip");
		wireTileClicks(strip, featured);
		loadThumbsFor(featured, "image");
	}
	if (homeVideos.length) {
		const grid = document.getElementById("mvHomeVideos");
		wireTileClicks(grid, homeVideos);
		loadThumbsFor(homeVideos, "video");
	}
	if (homePhotos.length) {
		const grid = document.getElementById("mvHomePhotos");
		wireTileClicks(grid, homePhotos);
		loadThumbsFor(homePhotos, "image");
	}
}

async function renderGridPage(kind, title) {
	const token = nextRenderToken();
	const { items, folder } = await listMediaFiles(kind);
	activeGridItems = items;
	const applied = setContent(
		`
		<h1 class="mv-greeting" style="margin-bottom:1.1rem;">${escHtml(title)}</h1>
		${items.length ? `<div class="mv-media-grid" id="mvGrid">${items.map(it => buildTile(it, "grid")).join("")}</div>` : emptyStateHtml(kind, folder)}
	`,
		token,
	);
	if (!applied) return;
	if (items.length) {
		const grid = document.getElementById("mvGrid");
		wireTileClicks(grid, items);
		loadThumbsFor(items, kind);
	}
}

async function renderAudioPage() {
	const token = nextRenderToken();
	const { items, folder } = await listMediaFiles("audio");
	activeGridItems = items;
	const applied = setContent(
		`
		<h1 class="mv-greeting" style="margin-bottom:1.1rem;">Audio</h1>
		${items.length ? `<div class="mv-track-list" id="mvTracks">${items.map(it => buildTrackRow(it)).join("")}</div>` : emptyStateHtml("audio", folder)}
	`,
		token,
	);
	if (!applied) return;
	if (items.length) {
		const list = document.getElementById("mvTracks");
		wireTileClicks(list, items);
		loadThumbsFor(items, "audio");
	}
}

async function measureTreeSize(path, cache, stack = new Set()) {
	const normalized = String(path || "/").replace(/\/+$/g, "") || "/";
	if (cache.has(normalized)) return cache.get(normalized);
	if (stack.has(normalized)) return 0;
	stack.add(normalized);
	const stat = await safeStat(normalized);
	if (!stat) {
		cache.set(normalized, 0);
		stack.delete(normalized);
		return 0;
	}
	if (typeof stat.isSymbolicLink === "function" && stat.isSymbolicLink()) {
		cache.set(normalized, 0);
		stack.delete(normalized);
		return 0;
	}
	if (typeof stat.isFile === "function" && stat.isFile()) {
		const size = Number(stat.size) || 0;
		cache.set(normalized, size);
		stack.delete(normalized);
		return size;
	}
	if (typeof stat.isDirectory !== "function" || !stat.isDirectory()) {
		const size = Number(stat.size) || 0;
		cache.set(normalized, size);
		stack.delete(normalized);
		return size;
	}
	const entries = await safeReaddir(normalized);
	const sizes = await Promise.all(entries.map(entry => measureTreeSize(`${normalized === "/" ? "" : normalized}/${entry}`, cache, stack)));
	const total = sizes.reduce((sum, size) => sum + size, 0);
	cache.set(normalized, total);
	stack.delete(normalized);
	return total;
}

function storageColor(index) {
	const palette = ["#5cc8ff", "#7bd88f", "#f4c55a", "#9c8cff", "#67d3c2"];
	return palette[index % palette.length];
}

async function buildStorageModel() {
	const user = currentUsername;
	const cache = new Map();
	const targets = [
		{ key: "videos", label: "Videos", dirs: FOLDER_MAP.video.map(f => `/home/${user}/${f}`) },
		{ key: "photos", label: "Photos", dirs: FOLDER_MAP.image.map(f => `/home/${user}/${f}`) },
		{ key: "audio", label: "Audio", dirs: FOLDER_MAP.audio.map(f => `/home/${user}/${f}`) },
	];
	const categories = [];
	for (const target of targets) {
		let size = 0;
		for (const dir of target.dirs) size += await measureTreeSize(dir, cache);
		categories.push({ key: target.key, label: target.label, size });
	}
	const homeTotal = await measureTreeSize(`/home/${user}`, cache);
	const mediaTotal = categories.reduce((sum, c) => sum + c.size, 0);
	const otherSize = Math.max(0, homeTotal - mediaTotal);
	if (otherSize > 0) categories.push({ key: "other", label: "Other Files", size: otherSize });

	let estimate = null;
	try {
		estimate = "storage" in navigator ? await navigator.storage.estimate() : null;
	} catch {
		estimate = null;
	}
	const quota = Number(estimate?.quota) || 0;
	const used = Math.max(homeTotal, Number(estimate?.usage) || 0);
	const free = quota > used ? quota - used : 0;

	const drives = [];
	try {
		const entries = tbApi()?.vfs?.servers?.entries ? Array.from(tbApi().vfs.servers.entries()) : [];
		for (const [name, server] of entries) {
			drives.push({ name, url: server?.url || `/mnt/${name}/`, connected: !!server?.connected });
		}
	} catch {}

	return { used, quota, free, categories, drives };
}

function loadingCardHtml(text) {
	return `<section class="storage-dashboard"><article class="storage-main-card storage-loading-card"><div class="storage-loading-shimmer"></div><div class="storage-loading-text">${escHtml(text)}</div></article></section>`;
}

function storageMarkup(model) {
	const totalLabel = model.quota && model.quota > model.used ? formatBytes(model.quota) : formatBytes(model.used);
	const usageLabel = model.quota ? `${formatBytes(model.used)} used of ${formatBytes(model.quota)}` : `${formatBytes(model.used)} used`;
	const freeLabel = model.quota ? `${formatBytes(model.free)} free` : "Browser quota unavailable";
	const barTotal = model.quota && model.quota > model.used ? model.quota : model.categories.reduce((sum, c) => sum + c.size, 0) || 1;
	const usedSegments = model.categories.map((c, i) => `<span class="storage-segment" style="width:${(c.size / barTotal) * 100}%;background:${storageColor(i)}" title="${escAttr(c.label)}: ${formatBytes(c.size)}"></span>`).join("");
	const freeSegment = model.quota && model.free > 0 ? `<span class="storage-segment storage-free" style="width:${(model.free / model.quota) * 100}%"></span>` : "";
	const categoryRows = model.categories
		.map((c, i) => {
			const percent = model.used ? ((c.size / model.used) * 100).toFixed(1) : "0.0";
			return `<div class="storage-category-row"><span class="storage-category-key"><span class="storage-dot" style="background:${storageColor(i)}"></span>${escHtml(c.label)}</span><span class="storage-category-value">${formatBytes(c.size)} (${percent}%)</span></div>`;
		})
		.join("");
	const mountedRows = model.drives.length
		? model.drives
				.map(
					d => `
			<article class="storage-mini-card">
				<div class="storage-mini-title-row">
					<div>
						<div class="storage-mini-title">${escHtml(d.name)}</div>
						<div class="storage-mini-subtitle">${d.connected ? "Mounted VFS drive" : "Not mounted"}</div>
					</div>
					<span class="storage-mini-pill ${d.connected ? "is-mounted" : "is-offline"}">${d.connected ? "Mounted" : "Offline"}</span>
				</div>
				<div class="storage-mini-url">${escHtml(d.url)}</div>
				<button type="button" class="storage-open-btn" data-browse-drive="${escAttr(d.name)}" ${d.connected ? "" : "disabled"}>Browse Media</button>
			</article>
		`,
				)
				.join("")
		: `<p class="detail-control-value">No mounted VFS drives detected.</p>`;

	return `
		<h1 class="mv-greeting" style="margin-bottom:1.1rem;">Storage Media</h1>
		<section class="storage-dashboard">
			<article class="storage-main-card">
				<div class="storage-main-header">
					<div>
						<div class="storage-main-title">Media Storage</div>
						<div class="storage-main-capacity">${totalLabel}</div>
					</div>
					<button type="button" class="storage-open-btn" data-browse-local="true">Browse Local Files</button>
				</div>
				<div class="storage-main-usage">${usageLabel}</div>
				<div class="storage-bar" role="img" aria-label="Storage usage breakdown">${usedSegments}${freeSegment}</div>
				<div class="storage-main-foot">${freeLabel}</div>
				<div class="storage-category-list">${categoryRows}</div>
			</article>
			<div class="storage-mini-grid">${mountedRows}</div>
		</section>
	`;
}

function wireStorageActions() {
	document.querySelectorAll("[data-browse-local]").forEach(btn => {
		btn.addEventListener("click", () => openFileBrowserAndView({ local: true }));
	});
	document.querySelectorAll("[data-browse-drive]").forEach(btn => {
		btn.addEventListener("click", () => openFileBrowserAndView({ local: false }));
	});
}

function openFileBrowserAndView(opts) {
	if (!tbApi()?.dialog?.FileBrowser) return;
	tbApi().dialog.FileBrowser({
		title: "Select a media file to view",
		local: !!opts.local,
		onOk: async file => {
			await handleExternalOpen(file);
		},
	});
}

async function renderStoragePage() {
	const token = nextRenderToken();
	if (!setContent(loadingCardHtml("Loading storage..."), token)) return;
	let model;
	try {
		model = await buildStorageModel();
	} catch (err) {
		console.error(err);
		setContent(`<p class="detail-control-value">Failed to load storage information.</p>`, token);
		return;
	}
	if (!setContent(storageMarkup(model), token)) return;
	wireStorageActions();
}

async function renderTbDrivePage() {
	const token = nextRenderToken();
	let signedIn = false;
	try {
		signedIn = !!(await tbApi()?.tauth?.isTACC?.());
	} catch {
		signedIn = false;
	}
	const badge = signedIn ? `<span class="mv-tbdrive-badge">Terbium Cloud Free Tier &middot; 0 MB of 0 MB</span>` : "";
	const action = signedIn ? "" : `<button type="button" class="mv-tbdrive-action" id="mvTbSignIn">Sign in with Terbium Cloud</button>`;
	const applied = setContent(
		`
		<div class="mv-tbdrive-hero">
			<span class="mv-tbdrive-cloud">${cloudIconSvg("mvTbHeroGrad")}</span>
			<h1 class="mv-tbdrive-title">Terbium Drive</h1>
			${badge}
			<p class="mv-tbdrive-sub">Terbium Cloud features coming soon. Soon you'll be able to sync your photos, videos and music across every Terbium device.</p>
			${action}
		</div>
	`,
		token,
	);
	if (!applied) return;
	const signInBtn = document.getElementById("mvTbSignIn");
	signInBtn?.addEventListener("click", async () => {
		try {
			await tbApi().tauth.signIn();
		} catch {}
		await renderCloudWidget();
		if (currentSection === "tbdrive") await renderTbDrivePage();
	});
}

async function resolveDavMediaUrl(item, mimePrefix) {
	try {
		const user = currentUsername;
		const davInstances = JSON.parse(await tbFs().readFile(`/apps/user/${user}/files/davs.json`, "utf8"));
		const davUrl = `${item.url.split("/dav/")[0]}/dav/`;
		const dav = davInstances.find(d => d.url.toLowerCase().includes(davUrl));
		if (!dav) throw new Error("No matching dav instance found");
		const client = tbApi().vfs.servers.get(dav.name);
		let filePath;
		if (item.url.startsWith("http")) {
			const match = item.url.match(/^https?:\/\/[^/]+\/dav\/([^/]+\/)?(.+)$/);
			filePath = match ? `/${match[2]}` : item.url;
		} else {
			filePath = item.url.replace(davUrl, "/");
		}
		const response = await client.getFileContents(filePath);
		const blob = new Blob([response], { type: `${mimePrefix}/${item.ext}` });
		return URL.createObjectURL(blob);
	} catch (err) {
		tbApi()?.dialog?.Alert?.({ title: "Failed to read dav file", message: String(err) });
		return null;
	}
}

async function resolveMediaUrl(item, mimePrefix) {
	if (item.url && !item.path) return item.url;
	if (!item.path) return null;
	return await getFileBlobUrl(item.path, `${mimePrefix}/${item.ext}`);
}

async function resolveDavMediaBytes(item) {
	try {
		const user = currentUsername;
		const davInstances = JSON.parse(await tbFs().readFile(`/apps/user/${user}/files/davs.json`, "utf8"));
		const davUrl = `${item.url.split("/dav/")[0]}/dav/`;
		const dav = davInstances.find(d => d.url.toLowerCase().includes(davUrl));
		if (!dav) throw new Error("No matching dav instance found");
		const client = tbApi().vfs.servers.get(dav.name);
		let filePath;
		if (item.url.startsWith("http")) {
			const match = item.url.match(/^https?:\/\/[^/]+\/dav\/([^/]+\/)?(.+)$/);
			filePath = match ? `/${match[2]}` : item.url;
		} else {
			filePath = item.url.replace(davUrl, "/");
		}
		const response = await client.getFileContents(filePath);
		return response instanceof Uint8Array ? response : new Uint8Array(response);
	} catch (err) {
		tbApi()?.dialog?.Alert?.({ title: "Failed to read dav file", message: String(err) });
		return null;
	}
}

async function resolveMediaBytes(item) {
	if (item.path) {
		try {
			const data = await tbFs().readFile(item.path);
			return data instanceof Uint8Array ? data : new Uint8Array(data);
		} catch (err) {
			console.warn("Media Viewer: failed to read file bytes", item.path, err);
			return null;
		}
	}
	if (item.url) {
		try {
			const response = await fetch(item.url);
			return new Uint8Array(await response.arrayBuffer());
		} catch (err) {
			console.warn("Media Viewer: failed to fetch bytes", item.url, err);
			return null;
		}
	}
	return null;
}

function viewerShellHtml(name) {
	return `<div class="mv-viewer-page"><h1 class="mv-viewer-title">${escHtml(name)}</h1><div class="mv-viewer-stage" id="mvStage"></div></div>`;
}

async function mountImageViewer(stage, item) {
	stage.innerHTML = `<canvas class="mv-canvas-el"></canvas>`;
	const canvas = stage.querySelector("canvas");
	const ctx = canvas.getContext("2d");
	let isDragging = false;
	let isMouseDown = false;
	let startCoords = { x: 0, y: 0 };
	let offset = { x: 0, y: 0 };
	let scale = 0.5;
	const imgObj = new Image();

	const url = item.dav ? await resolveDavMediaUrl(item, "image") : await resolveMediaUrl(item, "image");
	if (!url) {
		stage.innerHTML = `<div class="mv-empty-state">Could not load image.</div>`;
		return;
	}
	imgObj.src = url;
	imgObj.onload = () => {
		initializeCanvas();
	};
	function initializeCanvas() {
		canvas.width = stage.clientWidth;
		canvas.height = stage.clientHeight;
		drawImageWithOffsetAndScale();
	}
	function drawImageWithOffsetAndScale() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const newWidth = imgObj.width * scale;
		const newHeight = imgObj.height * scale;
		const x = offset.x + (canvas.width - newWidth) / 2;
		const y = offset.y + (canvas.height - newHeight) / 2;
		ctx.drawImage(imgObj, x, y, newWidth, newHeight);
	}
	window.addEventListener("resize", initializeCanvas);
	canvas.addEventListener("mousedown", e => {
		isDragging = true;
		isMouseDown = true;
		startCoords = { x: e.clientX, y: e.clientY };
	});
	window.addEventListener("mouseup", () => {
		isDragging = false;
		isMouseDown = false;
	});
	canvas.addEventListener("mousemove", e => {
		if (!isDragging) return;
		offset.x += e.clientX - startCoords.x;
		offset.y += e.clientY - startCoords.y;
		startCoords = { x: e.clientX, y: e.clientY };
		drawImageWithOffsetAndScale();
	});
	canvas.addEventListener("touchstart", e => {
		isDragging = true;
		isMouseDown = true;
		startCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	});
	window.addEventListener("touchend", () => {
		isDragging = false;
		isMouseDown = false;
	});
	canvas.addEventListener("touchmove", e => {
		if (!isDragging) return;
		offset.x += e.touches[0].clientX - startCoords.x;
		offset.y += e.touches[0].clientY - startCoords.y;
		startCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		drawImageWithOffsetAndScale();
	});
	canvas.addEventListener("mouseleave", () => {
		isDragging = false;
	});
	canvas.addEventListener("mouseenter", () => {
		if (isMouseDown) isDragging = true;
	});
	canvas.addEventListener("wheel", e => {
		const zoomSpeed = 0.1;
		e.preventDefault();
		scale *= e.deltaY < 0 ? 1 + zoomSpeed : 1 / (1 + zoomSpeed);
		drawImageWithOffsetAndScale();
	});
}

async function mountAnimatedViewer(stage, item) {
	const url = item.dav ? await resolveDavMediaUrl(item, "image") : await resolveMediaUrl(item, "image");
	if (!url) {
		stage.innerHTML = `<div class="mv-empty-state">Could not load image.</div>`;
		return;
	}
	stage.innerHTML = `<img class="mv-image-el" draggable="false" />`;
	const imgObj = stage.querySelector("img");
	imgObj.src = url;
	let scale = 1;
	stage.addEventListener("wheel", e => {
		const zoomSpeed = 0.1;
		e.preventDefault();
		scale *= e.deltaY < 0 ? 1 + zoomSpeed : 1 / (1 + zoomSpeed);
		imgObj.style.transform = `scale(${scale})`;
	});
}

async function mountVideoViewer(stage, item) {
	stage.innerHTML = `
		<div class="mv-custom-video-player">
			<div class="mv-title-overlay"></div>
			<video></video>
			<div class="mv-media-controls">
				<button type="button" class="mv-play-pause-btn">&#10074;&#10074;</button>
				<input type="range" class="mv-seek-bar" value="0" step="0.1" />
				<span class="mv-time-display">0:00 / 0:00</span>
				<input type="range" class="mv-volume-bar" min="0" max="100" value="100" />
				<button type="button" class="mv-fullscreen-btn">&#9974;</button>
			</div>
		</div>
	`;
	const container = stage.querySelector(".mv-custom-video-player");
	const videoEl = container.querySelector("video");
	const playBtn = container.querySelector(".mv-play-pause-btn");
	const seekBar = container.querySelector(".mv-seek-bar");
	const timeDisplay = container.querySelector(".mv-time-display");
	const volumeBar = container.querySelector(".mv-volume-bar");
	const fsBtn = container.querySelector(".mv-fullscreen-btn");
	const titleOverlay = container.querySelector(".mv-title-overlay");
	titleOverlay.textContent = item.name || "Video";

	const url = item.dav ? await resolveDavMediaUrl(item, "video") : await resolveMediaUrl(item, "video");
	if (!url) {
		stage.innerHTML = `<div class="mv-empty-state">Could not load video.</div>`;
		return;
	}
	videoEl.src = url;

	function togglePlay() {
		if (videoEl.paused) {
			videoEl.play().catch(() => {});
		} else {
			videoEl.pause();
		}
	}
	videoEl.addEventListener("click", togglePlay);
	playBtn.addEventListener("click", togglePlay);
	videoEl.addEventListener("play", () => {
		playBtn.innerHTML = "&#10074;&#10074;";
	});
	videoEl.addEventListener("pause", () => {
		playBtn.innerHTML = "&#9654;";
	});
	videoEl.addEventListener("timeupdate", () => {
		seekBar.value = (videoEl.currentTime / videoEl.duration) * 100 || 0;
		timeDisplay.textContent = `${formatDuration(videoEl.currentTime)} / ${formatDuration(videoEl.duration)}`;
	});
	seekBar.addEventListener("input", () => {
		videoEl.currentTime = (seekBar.value / 100) * (videoEl.duration || 0);
	});
	volumeBar.addEventListener("input", () => {
		videoEl.volume = volumeBar.value / 100;
	});
	fsBtn.addEventListener("click", () => {
		if (container.requestFullscreen) container.requestFullscreen();
	});

	videoEl.addEventListener(
		"loadedmetadata",
		async () => {
			try {
				const already = await tbApi()?.mediaplayer?.isExisting?.();
				if (!already && tbApi()?.mediaplayer?.video) {
					tbApi().mediaplayer.video({
						creator: currentUsername,
						video_name: item.name || "Video",
						time: Math.trunc(videoEl.currentTime || 0),
						endtime: Math.trunc(videoEl.duration || 0),
						background: "",
						onPausePlay: togglePlay,
						onSeek: t => {
							videoEl.currentTime = t;
						},
					});
				}
			} catch {}
		},
		{ once: true },
	);

	videoEl.play().catch(() => {});
}

async function mountAudioViewer(stage, item) {
	stage.innerHTML = `
		<div class="mv-custom-audio-player">
			<div class="mv-title-overlay"></div>
			<div class="mv-audio-visual">${ICONS.audio}</div>
			<audio></audio>
			<div class="mv-media-controls">
				<button type="button" class="mv-play-pause-btn">&#10074;&#10074;</button>
				<input type="range" class="mv-seek-bar" value="0" step="0.1" />
				<span class="mv-time-display">0:00 / 0:00</span>
				<input type="range" class="mv-volume-bar" min="0" max="100" value="100" />
			</div>
		</div>
	`;
	const container = stage.querySelector(".mv-custom-audio-player");
	const audioEl = container.querySelector("audio");
	const visual = container.querySelector(".mv-audio-visual");
	const playBtn = container.querySelector(".mv-play-pause-btn");
	const seekBar = container.querySelector(".mv-seek-bar");
	const timeDisplay = container.querySelector(".mv-time-display");
	const volumeBar = container.querySelector(".mv-volume-bar");
	const titleOverlay = container.querySelector(".mv-title-overlay");

	const url = item.dav ? await resolveDavMediaUrl(item, "audio") : await resolveMediaUrl(item, "audio");
	if (!url) {
		stage.innerHTML = `<div class="mv-empty-state">Could not load audio file.</div>`;
		return;
	}
	audioEl.src = url;

	function togglePlay() {
		if (audioEl.paused) {
			audioEl.play().catch(() => {});
		} else {
			audioEl.pause();
		}
	}
	visual.addEventListener("click", togglePlay);
	playBtn.addEventListener("click", togglePlay);
	audioEl.addEventListener("play", () => {
		playBtn.innerHTML = "&#10074;&#10074;";
	});
	audioEl.addEventListener("pause", () => {
		playBtn.innerHTML = "&#9654;";
	});
	audioEl.addEventListener("timeupdate", () => {
		seekBar.value = (audioEl.currentTime / audioEl.duration) * 100 || 0;
		timeDisplay.textContent = `${formatDuration(audioEl.currentTime)} / ${formatDuration(audioEl.duration)}`;
	});
	seekBar.addEventListener("input", () => {
		audioEl.currentTime = (seekBar.value / 100) * (audioEl.duration || 0);
	});
	volumeBar.addEventListener("input", () => {
		audioEl.volume = volumeBar.value / 100;
	});

	let art = null;
	if (item.path) {
		try {
			art = await getAudioArt(item.path, item.ext);
		} catch {
			art = null;
		}
	}
	if (art?.dataUrl) {
		visual.style.backgroundImage = `url(${art.dataUrl})`;
		visual.style.backgroundSize = "cover";
		visual.style.backgroundPosition = "center";
		visual.innerHTML = "";
	}
	const trackTitle = art?.title || item.name || "Unknown Title";
	const artist = art?.artist || "Unknown Artist";
	titleOverlay.textContent = `${trackTitle} - ${artist}`;

	audioEl.addEventListener(
		"loadedmetadata",
		async () => {
			try {
				const already = await tbApi()?.mediaplayer?.isExisting?.();
				if (!already && tbApi()?.mediaplayer?.music) {
					tbApi().mediaplayer.music({
						track_name: trackTitle,
						artist,
						endtime: Math.trunc(audioEl.duration || 0),
						background: art?.dataUrl || "",
						onPausePlay: togglePlay,
						onSeek: t => {
							audioEl.currentTime = t;
						},
					});
				}
			} catch {}
		},
		{ once: true },
	);

	audioEl.play().catch(() => {});
}

async function mountPdfViewer(stage, item) {
	const bytes = item.dav ? await resolveDavMediaBytes(item) : await resolveMediaBytes(item);
	if (!bytes) {
		stage.innerHTML = `<div class="mv-empty-state">Could not load PDF.</div>`;
		return;
	}
	stage.innerHTML = `<div class="mv-pdf-container"></div>`;
	const pdfContainer = stage.querySelector(".mv-pdf-container");
	let pdf;
	try {
		pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
	} catch (err) {
		console.error("Media Viewer: PDF.js failed to load document", err);
		stage.innerHTML = `<div class="mv-empty-state">Failed to render PDF.</div>`;
		return;
	}
	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
		const page = await pdf.getPage(pageNum);
		const viewport = page.getViewport({ scale: 1.4 });
		const canvas = document.createElement("canvas");
		canvas.width = viewport.width;
		canvas.height = viewport.height;
		const context = canvas.getContext("2d");
		await page.render({ canvasContext: context, viewport }).promise;
		pdfContainer.appendChild(canvas);
	}
	const controls = document.createElement("div");
	controls.className = "mv-pdf-controls";
	controls.innerHTML = `
		<div class="mv-pdf-controls-inner">
			<button type="button" class="mv-pdf-prev" title="Previous page">&#9664;</button>
			<button type="button" class="mv-pdf-next" title="Next page">&#9654;</button>
			<span class="mv-pdf-indicator">1 / ${pdf.numPages}</span>
			<input type="number" min="1" max="${pdf.numPages}" class="mv-pdf-page-input" value="1" style="width:56px" />
			<button type="button" class="mv-pdf-go">Go</button>
		</div>
	`;
	stage.appendChild(controls);
	const canvases = pdfContainer.querySelectorAll("canvas");
	let currentPage = 1;
	const prevBtn = controls.querySelector(".mv-pdf-prev");
	const nextBtn = controls.querySelector(".mv-pdf-next");
	const indicator = controls.querySelector(".mv-pdf-indicator");
	const pageInput = controls.querySelector(".mv-pdf-page-input");
	const goBtn = controls.querySelector(".mv-pdf-go");
	function updateControls() {
		indicator.textContent = `${currentPage} / ${canvases.length}`;
		pageInput.value = currentPage;
		prevBtn.disabled = currentPage <= 1;
		nextBtn.disabled = currentPage >= canvases.length;
	}
	function showPage(page) {
		page = Math.max(1, Math.min(page, canvases.length));
		const target = canvases[page - 1];
		if (!target) return;
		pdfContainer.scrollTo({ top: target.offsetTop - 10, behavior: "smooth" });
		currentPage = page;
		updateControls();
	}
	prevBtn.addEventListener("click", () => showPage(currentPage - 1));
	nextBtn.addEventListener("click", () => showPage(currentPage + 1));
	goBtn.addEventListener("click", () => showPage(Number.parseInt(pageInput.value, 10)));
	pageInput.addEventListener("keydown", e => {
		if (e.key === "Enter") showPage(Number.parseInt(pageInput.value, 10));
	});
	pdfContainer.addEventListener("scroll", () => {
		const containerRect = pdfContainer.getBoundingClientRect();
		const containerCenter = containerRect.top + containerRect.height / 2;
		let closestIndex = 0;
		let closestDist = Number.POSITIVE_INFINITY;
		canvases.forEach((c, idx) => {
			const r = c.getBoundingClientRect();
			const dist = Math.abs(r.top + r.height / 2 - containerCenter);
			if (dist < closestDist) {
				closestDist = dist;
				closestIndex = idx;
			}
		});
		if (currentPage !== closestIndex + 1) {
			currentPage = closestIndex + 1;
			updateControls();
		}
	});
	updateControls();
}

async function openViewer(item) {
	const token = nextRenderToken();
	viewerItem = item;
	const category = extCategory(item.ext);
	document.getElementById("mvContent")?.classList.remove("reverse");
	const applied = setContent(viewerShellHtml(item.name || baseName(item.path || item.url)), token);
	if (!applied) return;
	const stage = document.getElementById("mvStage");
	if (!stage) return;
	try {
		if (category === "animated") await mountAnimatedViewer(stage, item);
		else if (category === "image") await mountImageViewer(stage, item);
		else if (category === "video") await mountVideoViewer(stage, item);
		else if (category === "audio") await mountAudioViewer(stage, item);
		else if (category === "pdf") await mountPdfViewer(stage, item);
		else stage.innerHTML = `<div class="mv-empty-state">Unsupported file type${item.ext ? `: .${escHtml(item.ext)}` : ""}</div>`;
	} catch (err) {
		console.error("Media Viewer: failed to open file", err);
		stage.innerHTML = `<div class="mv-empty-state">Failed to open this file.</div>`;
	}
}

async function handleExternalOpen(pathOrUrl) {
	externalOpenHandled = true;
	if (!cachedExtensions) cachedExtensions = await loadExtensions();
	const text = String(pathOrUrl || "");
	const ext = extOf(text);
	const name = baseName(text);
	const category = extCategory(ext);
	const item = text.includes("http") ? { name, ext, url: text, dav: true } : { name, ext, path: text };
	const section = guessSectionForCategory(category);
	if (section) {
		currentSection = section;
		highlightSection(section);
	}
	await openViewer(item);
}

async function handleExternalOpenBlob(url, ext, name) {
	externalOpenHandled = true;
	if (!cachedExtensions) cachedExtensions = await loadExtensions();
	const category = extCategory(ext);
	const section = guessSectionForCategory(category);
	if (section) {
		currentSection = section;
		highlightSection(section);
	}
	await openViewer({ name, ext, url });
}

async function renderCloudWidget() {
	const el = document.getElementById("mvCloudWidget");
	if (!el) return;
	let signedIn = false;
	try {
		signedIn = !!(await tbApi()?.tauth?.isTACC?.());
	} catch {
		signedIn = false;
	}
	if (signedIn) {
		el.innerHTML = `
			<div class="mv-cloud-widget-head">
				<span class="mv-cloud-icon">${cloudIconSvg("mvCloudGradA")}</span>
				<div class="mv-cloud-heading">
					<span class="mv-cloud-title">Terbium Cloud Free Tier</span>
					<span class="mv-cloud-sub">0 MB of 0 MB used</span>
				</div>
			</div>
			<div class="mv-cloud-usage-bar"><div class="mv-cloud-usage-fill" style="width:0%"></div></div>
		`;
		return;
	}
	el.innerHTML = `
		<div class="mv-cloud-widget-head">
			<span class="mv-cloud-icon">${cloudIconSvg("mvCloudGradB")}</span>
			<div class="mv-cloud-heading">
				<span class="mv-cloud-title">Terbium Cloud</span>
				<span class="mv-cloud-sub">Not signed in</span>
			</div>
		</div>
		<button type="button" class="mv-cloud-signin-btn" id="mvCloudSignIn">Sign in with Terbium Cloud</button>
	`;
	document.getElementById("mvCloudSignIn")?.addEventListener("click", async () => {
		try {
			await tbApi().tauth.signIn();
		} catch {}
		await renderCloudWidget();
		if (currentSection === "tbdrive") await renderTbDrivePage();
	});
}

function highlightSection(id) {
	document.querySelectorAll(".mv-nav-btn").forEach(btn => {
		btn.classList.toggle("active", btn.getAttribute("data-section") === id);
	});
}

function renderSidebarNav() {
	const nav = document.getElementById("mvNav");
	nav.innerHTML = SECTIONS.map(
		s => `
		<button type="button" class="mv-nav-btn${s.id === currentSection ? " active" : ""}" data-section="${s.id}">
			<span class="mv-nav-icon">${s.icon}</span><span>${escHtml(s.label)}</span>
		</button>
	`,
	).join("");
	nav.querySelectorAll(".mv-nav-btn").forEach(btn => {
		btn.addEventListener("click", () => {
			const id = btn.getAttribute("data-section");
			if (id) switchSection(id);
		});
	});
}

async function switchSection(id) {
	if (!SECTIONS.some(s => s.id === id)) return;
	const reverse = sectionIndex(id) < sectionIndex(currentSection);
	currentSection = id;
	viewerItem = null;
	highlightSection(id);
	clearSearchInput();
	const contentEl = document.getElementById("mvContent");
	contentEl.classList.toggle("reverse", reverse);
	if (id === "home") await renderHomePage();
	else if (id === "videos") await renderGridPage("video", "Videos");
	else if (id === "photos") await renderGridPage("image", "Photos");
	else if (id === "audio") await renderAudioPage();
	else if (id === "storage") await renderStoragePage();
	else if (id === "tbdrive") await renderTbDrivePage();
}

function getTitlebarEl(id) {
	return window.parent?.document?.getElementById(id) || null;
}

function clearSearchInput() {
	const input = getTitlebarEl("mv-search-input");
	if (input) input.value = "";
}

function filterCurrentView(term) {
	const normalized = String(term || "")
		.trim()
		.toLowerCase();
	const contentEl = document.getElementById("mvContent");
	if (!contentEl) return;
	const tiles = contentEl.querySelectorAll("[data-name]");
	let anyVisible = false;
	tiles.forEach(tile => {
		const name = (tile.getAttribute("data-name") || "").toLowerCase();
		const matches = !normalized || name.includes(normalized);
		tile.style.display = matches ? "" : "none";
		if (matches) anyVisible = true;
	});
	if (!tiles.length) return;
	let hint = contentEl.querySelector(".mv-search-hint");
	if (normalized) {
		if (!hint) {
			hint = document.createElement("div");
			hint.className = "mv-search-hint";
			const grid = contentEl.querySelector(".mv-media-grid, .mv-track-list, .mv-featured-strip");
			if (grid?.parentElement) grid.parentElement.insertBefore(hint, grid);
		}
		hint.textContent = anyVisible ? `Showing results for "${term}"` : `No matches for "${term}"`;
	} else if (hint) {
		hint.remove();
	}
}

function bindTitlebarSearch() {
	const input = getTitlebarEl("mv-search-input");
	if (!input || input.dataset.mvBound) return;
	input.dataset.mvBound = "true";
	input.addEventListener("input", () => filterCurrentView(input.value));
	input.addEventListener("keydown", ev => {
		if (ev.key === "Escape") {
			input.value = "";
			filterCurrentView("");
		}
	});
}

window.__mvOpenExternal = handleExternalOpen;
window.__mvOpenBlobFile = handleExternalOpenBlob;

async function init() {
	if (!tbApi()) {
		setTimeout(init, 60);
		return;
	}
	currentUsername = await getUsername();
	cachedExtensions = await loadExtensions();
	renderSidebarNav();
	await renderCloudWidget();
	bindTitlebarSearch();
	setTimeout(bindTitlebarSearch, 250);
	setTimeout(bindTitlebarSearch, 1000);
	parent.postMessage(JSON.stringify({ type: "ready" }), "*");
	await new Promise(resolve => setTimeout(resolve, 120));
	if (!externalOpenHandled) {
		await switchSection("home");
	}
}

window.addEventListener("load", () => {
	init();
});

window.addEventListener("message", async e => {
	let data;
	try {
		data = JSON.parse(e.data);
	} catch {
		data = e.data;
	}
	if (data && data.type === "process" && data.path) {
		await handleExternalOpen(data.path);
	}
});

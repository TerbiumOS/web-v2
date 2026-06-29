import { tb } from "./state.js";
import { getExt } from "./utils.js";

const SYSTEM_FOLDER_ICONS = {
	desktop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clip-rule="evenodd"/></svg>`,
	documents: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd"/><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z"/></svg>`,
	images: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clip-rule="evenodd"/></svg>`,
	videos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zm1.5 0v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5A.375.375 0 003 5.625z" clip-rule="evenodd"/></svg>`,
	music: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" clip-rule="evenodd"/></svg>`,
	trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951z" clip-rule="evenodd"/></svg>`,
	home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"/><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z"/></svg>`,
	filesystem: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.08 5.227A3 3 0 016.979 3H17.02a3 3 0 012.9 2.227l2.113 7.926A5.228 5.228 0 0018.75 12H5.25a5.228 5.228 0 00-3.284 1.153L4.08 5.227z"/><path fill-rule="evenodd" d="M5.25 13.5a3.75 3.75 0 100 7.5h13.5a3.75 3.75 0 100-7.5H5.25z" clip-rule="evenodd"/></svg>`,
	folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z"/></svg>`,
	file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" clip-rule="evenodd"/></svg>`,
	drive: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5.507 4.048A3 3 0 017.785 3h8.43a3 3 0 012.278 1.048l1.722 2.008A4.533 4.533 0 0019.5 6h-15c-.243 0-.482.02-.715.056l1.722-2.008z"/><path fill-rule="evenodd" d="M1.5 10.5a3 3 0 013-3h15a3 3 0 110 6h-15a3 3 0 01-3-3zm15 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM4.5 15a3 3 0 100 6h15a3 3 0 100-6h-15z" clip-rule="evenodd"/></svg>`,
};

let fileIconsCache = null;
const iconAssetCache = new Map();

async function loadFileIcons() {
	if (fileIconsCache) return fileIconsCache;
	try {
		const raw = await tb.fs.promises.readFile("/system/etc/terbium/file-icons.json", "utf8");
		fileIconsCache = JSON.parse(raw);
		return fileIconsCache;
	} catch (e) {
		console.error("file-icons.json (fs):", e);
	}
	try {
		const res = await fetch("/fs/system/etc/terbium/file-icons.json");
		fileIconsCache = await res.json();
		return fileIconsCache;
	} catch (e) {
		console.error("file-icons.json (fetch):", e);
	}
	return { "ext-to-name": {}, "name-to-path": {} };
}

async function readIconFile(target) {
	if (iconAssetCache.has(target)) return iconAssetCache.get(target);
	try {
		const data = await tb.fs.promises.readFile(target, "utf8");
		iconAssetCache.set(target, data);
		return data;
	} catch (e1) {
		try {
			const res = await fetch(`/fs${target.startsWith("/") ? "" : "/"}${target}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.text();
			iconAssetCache.set(target, data);
			return data;
		} catch (e2) {
			console.error(`icon read failed: ${target}`, e1, e2);
			return null;
		}
	}
}

export function systemIcon(key) {
	return SYSTEM_FOLDER_ICONS[key] || SYSTEM_FOLDER_ICONS.folder;
}

export async function fileIcon(name) {
	const data = await loadFileIcons();
	const ext = getExt(name);
	const iconName = data["ext-to-name"]?.[ext];
	const iconPath = iconName ? data["name-to-path"]?.[iconName] : null;
	const unknownPath = data["name-to-path"]?.Unknown;
	const target = iconPath || unknownPath;
	if (!target) return SYSTEM_FOLDER_ICONS.file;
	const content = await readIconFile(target);
	return content || SYSTEM_FOLDER_ICONS.file;
}

export async function folderIcon(path, name) {
	const low = String(name || "").toLowerCase();
	if (low.endsWith(".tapp")) return await tappIcon(path);
	if (low.endsWith(".app")) return await anuraAppIcon(path);
	switch (low) {
		case "desktop":
		case "documents":
		case "images":
		case "videos":
		case "music":
		case "trash":
			return SYSTEM_FOLDER_ICONS[low];
	}
	return SYSTEM_FOLDER_ICONS.folder;
}

async function tappIcon(path) {
	try {
		const fs = tb.vfs.whatFS(path);
		if (await fs.promises.exists(`${path}/.tbconfig`)) {
			const appData = JSON.parse(await fs.promises.readFile(`${path}/.tbconfig`, "utf8"));
			const iconPath = appData.icon?.includes("http") ? appData.icon : `${path}/${appData.icon}`;
			return await readIconAsset(fs, iconPath, appData.title);
		}
		if (await fs.promises.exists(`${path}/index.json`)) {
			const appData = JSON.parse(await fs.promises.readFile(`${path}/index.json`, "utf8"));
			const iconPath = appData.config?.icon?.includes("http") ? appData.config.icon : appData.config.icon.replace("/fs/", "/");
			return await readIconAsset(fs, iconPath, appData.config?.title);
		}
		return await fs.promises.readFile(`${path}/icon.svg`, "utf8");
	} catch {
		return SYSTEM_FOLDER_ICONS.file;
	}
}

async function anuraAppIcon(path) {
	try {
		const fs = tb.vfs.whatFS(path);
		if (await fs.promises.exists(`${path}/manifest.json`)) {
			const appData = JSON.parse(await fs.promises.readFile(`${path}/manifest.json`, "utf8"));
			const iconPath = appData.icon?.includes("http") ? appData.icon : `${path}/${appData.icon}`;
			return await readIconAsset(fs, iconPath, appData.title);
		}
	} catch {}
	return SYSTEM_FOLDER_ICONS.file;
}

async function readIconAsset(fs, iconPath, title) {
	if (!iconPath) return SYSTEM_FOLDER_ICONS.file;
	if (iconPath.startsWith("http")) return `<img src="${iconPath}" alt="${title || ""}"/>`;
	const low = iconPath.toLowerCase();
	if (low.endsWith(".svg")) {
		try {
			return await fs.promises.readFile(iconPath, "utf8");
		} catch {
			return SYSTEM_FOLDER_ICONS.file;
		}
	}
	try {
		const bin = await fs.promises.readFile(iconPath);
		const b64 = tb.buffer.from(bin).toString("base64");
		let mime = "image/png";
		if (low.endsWith(".jpg") || low.endsWith(".jpeg")) mime = "image/jpeg";
		else if (low.endsWith(".webp")) mime = "image/webp";
		return `<img src="data:${mime};base64,${b64}" alt="${title || ""}"/>`;
	} catch {
		return SYSTEM_FOLDER_ICONS.file;
	}
}

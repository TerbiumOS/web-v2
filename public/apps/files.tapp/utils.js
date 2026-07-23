import { tb, user } from "./state.js";

export function basename(p) {
	if (!p) return "";
	const parts = p.split("/").filter(Boolean);
	return parts[parts.length - 1] || "/";
}

export function dirname(p) {
	if (!p || p === "/") return "/";
	const trimmed = p.replace(/\/+$/g, "");
	const i = trimmed.lastIndexOf("/");
	if (i <= 0) return "/";
	return trimmed.slice(0, i);
}

export function joinPath(a, b) {
	if (!a) return b;
	if (!b) return a;
	return `${a.replace(/\/+$/g, "")}/${b.replace(/^\/+/g, "")}`;
}

export function getExt(name) {
	const parts = String(name || "").split(".");
	if (parts.length < 2) return "";
	if (parts.length > 2) {
		const two = parts.slice(-2).join(".").toLowerCase();
		if (two === "tapp.zip" || two === "app.zip" || two === "lib.zip") return two;
	}
	return parts.pop().toLowerCase();
}

export function formatSize(bytes) {
	if (bytes == null) return "";
	const n = Number(bytes) || 0;
	if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
	if (n >= 1024) return `${(n / 1024).toFixed(2)} KB`;
	return `${n} B`;
}

export function formatDate(d) {
	if (!d) return "";
	const dt = d instanceof Date ? d : new Date(d);
	if (Number.isNaN(dt.getTime())) return "";
	const pad = n => String(n).padStart(2, "0");
	return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export async function exists(path) {
	try {
		return await tb.fs.promises.exists(path);
	} catch {
		return false;
	}
}

export async function statAsync(path) {
	return new Promise((resolve, reject) => {
		tb.fs.stat(path, (err, stats) => {
			if (err) reject(err);
			else resolve(stats);
		});
	});
}

export async function readdirAsync(path) {
	return new Promise((resolve, reject) => {
		tb.fs.readdir(path, (err, files) => {
			if (err) reject(err);
			else resolve(files);
		});
	});
}

export async function readJSON(path) {
	try {
		return JSON.parse(await tb.fs.promises.readFile(path, "utf8"));
	} catch (e) {
		console.error(`readJSON ${path}:`, e);
		return null;
	}
}

export async function writeJSON(path, data) {
	await tb.fs.promises.writeFile(path, JSON.stringify(data, null, 2));
}

export async function loadConfig() {
	return (await readJSON(`/apps/user/${user}/files/config.json`)) || {};
}

export async function saveConfig(config) {
	await writeJSON(`/apps/user/${user}/files/config.json`, config);
}

export async function uniquePath(dirPath, baseName) {
	let candidate = joinPath(dirPath, baseName);
	if (!(await exists(candidate))) return candidate;
	const dot = baseName.lastIndexOf(".");
	const stem = dot > 0 ? baseName.slice(0, dot) : baseName;
	const ext = dot > 0 ? baseName.slice(dot) : "";
	let n = 2;
	while (true) {
		candidate = joinPath(dirPath, `${stem} (${n})${ext}`);
		if (!(await exists(candidate))) return candidate;
		n++;
	}
}

export function isInTrash(path) {
	return path === "/system/trash" || path?.startsWith("/system/trash/");
}

export function isWebDav(path) {
	return typeof path === "string" && path.includes("http");
}

export function debounce(fn, delay) {
	let t;
	return (...args) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...args), delay);
	};
}

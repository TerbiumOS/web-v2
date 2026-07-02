import { tb } from "./state.js";

async function ensureServer(mountName) {
	const server = tb.vfs.servers?.get(mountName);
	if (!server) throw new Error(`DAV server "${mountName}" not configured`);
	if (!server.connected || !server.connection) {
		try {
			await tb.vfs.mount(mountName);
		} catch (e) {
			console.error(`mount(${mountName}):`, e);
		}
	}
	const ok = tb.vfs.setServer(mountName);
	if (!ok) {
		const latest = tb.vfs.servers?.get(mountName);
		if (!latest?.connected || !latest?.connection) {
			throw new Error(`DAV server "${mountName}" is not connected`);
		}
	}
}

export async function getDavClient(path) {
	if (path.startsWith("/mnt/")) {
		const mountName = path.split("/").filter(Boolean)[1];
		await ensureServer(mountName);
	}
	if (!tb.vfs.currentServer?.connection?.client) {
		throw new Error("No active DAV server");
	}
	const client = tb.vfs.currentServer.connection.client;
	let filePath;
	if (path.startsWith("http")) {
		const match = path.match(/^https?:\/\/[^/]+\/dav\/([^/]+\/)?(.+)$/);
		filePath = match ? `/${match[2]}` : path;
	} else if (path.startsWith("/mnt/")) {
		const parts = path.split("/").filter(Boolean);
		filePath = parts.length > 2 ? `/${parts.slice(2).join("/")}` : "/";
	} else {
		filePath = path.replace(tb.vfs.currentServer.url || "", "/");
	}
	filePath = filePath.replace(/\/+/g, "/");
	let mntPath;
	if (path.startsWith("/mnt/")) {
		mntPath = path;
	} else {
		mntPath = tb.fs.normalizePath(`/mnt/${tb.vfs.currentServer.name}/${filePath}`);
	}
	return { client, filePath, mntPath };
}

export function isDavMount(path) {
	return typeof path === "string" && (path.startsWith("/mnt/") || path.includes("http"));
}

export function parseDavMount(path) {
	if (!path.startsWith("/mnt/")) return null;
	const parts = path.split("/").filter(Boolean);
	const name = parts[1];
	const rel = `/${parts.slice(2).join("/")}`;
	return { name, rel: rel === "/" ? "/" : rel };
}

export async function davExists(path) {
	const { client, filePath } = await getDavClient(path);
	try {
		return await client.exists(filePath);
	} catch {
		return false;
	}
}

export async function davUniquePath(dirPath, baseName) {
	const { client, filePath } = await getDavClient(dirPath);
	const dot = baseName.lastIndexOf(".");
	const stem = dot > 0 ? baseName.slice(0, dot) : baseName;
	const ext = dot > 0 ? baseName.slice(dot) : "";
	let candidate = baseName;
	let n = 2;
	while (await client.exists(`${filePath}/${candidate}`.replace(/\/+/g, "/"))) {
		candidate = `${stem} (${n})${ext}`;
		n++;
	}
	return `${dirPath.replace(/\/+$/g, "")}/${candidate}`;
}

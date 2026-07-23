import paths from "../installer.json";
import { dirExists, fileExists, unzip } from "../sys/types";

async function ensureDirForPath(path: string) {
	const dir = path.slice(0, path.lastIndexOf("/"));
	if (dir && !(await dirExists(dir))) {
		// @ts-expect-error recursive option is supported in runtime fs
		await window.tb.fs.promises.mkdir(dir, { recursive: true });
	}
}

async function copyOne(p: string, opts: { force?: boolean } = {}): Promise<boolean> {
	if (p.includes("browser.tapp")) return false;
	if (p.toLowerCase().includes(".tapp.zip")) {
		const extractedDir = `/apps/system/${p.slice(0, -4)}`;
		if (!opts.force && (await dirExists(extractedDir))) return false;
		try {
			const res = await fetch(`/apps/${p}`);
			if (!res.ok) {
				console.error(`Failed to fetch /apps/${p}: ${res.status} ${res.statusText}`);
				return false;
			}
			const data = await res.arrayBuffer();
			await ensureDirForPath(`/apps/system/${p}`);
			await window.tb.fs.promises.writeFile(`/apps/system/${p}`, window.tb.buffer.from(data));
			await unzip(`/apps/system/${p}`, extractedDir);
			await window.tb.fs.promises.unlink(`/apps/system/${p}`).catch(() => {});
			return true;
		} catch (e) {
			console.error(`copyOne(${p}):`, e);
			return false;
		}
	}
	if (p.endsWith("/")) {
		const target = `/apps/system/${p}`;
		if (await dirExists(target)) return false;
		try {
			// @ts-expect-error recursive option is supported in runtime fs
			await window.tb.fs.promises.mkdir(target, { recursive: true });
			return true;
		} catch (e) {
			console.error(`mkdir ${target}:`, e);
			return false;
		}
	}
	const target = `/apps/system/${p}`;
	if (!opts.force && (await fileExists(target))) return false;
	try {
		const res = await fetch(`/apps/${p}`);
		if (!res.ok) {
			console.error(`Failed to fetch /apps/${p}: ${res.status} ${res.statusText}`);
			return false;
		}
		const data = await res.text();
		await ensureDirForPath(target);
		await window.tb.fs.promises.writeFile(target, data);
		return true;
	} catch (e) {
		console.error(`copyOne(${p}):`, e);
		return false;
	}
}

export async function copyfs() {
	for (const item of paths) {
		const p = item.toString();
		if (p.includes("browser.tapp")) continue;
		window.dispatchEvent(new CustomEvent("oobe-setupstage", { detail: `Copying ${p} to File System...` }));
		await copyOne(p, { force: true });
	}
	return "Success";
}

export async function repairfs(): Promise<{ added: number; checked: number }> {
	let added = 0;
	let checked = 0;
	for (const item of paths) {
		const p = item.toString();
		if (p.includes("browser.tapp")) continue;
		checked++;
		const wrote = await copyOne(p, { force: false });
		if (wrote) added++;
	}
	if (added > 0) console.info(`[repairfs] restored ${added} missing file(s) out of ${checked} checked`);
	return { added, checked };
}

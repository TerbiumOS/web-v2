import { tb } from "./state.js";
import { basename, dirname, exists, joinPath, readdirAsync, statAsync, uniquePath } from "./utils.js";
import { getDavClient, isDavMount } from "./vdav.js";

async function davListDir(path) {
	const { client, filePath } = await getDavClient(path);
	try {
		const contents = await client.getDirectoryContents(filePath);
		return contents.map(c => ({ name: c.basename, type: c.type === "directory" ? "folder" : "file" }));
	} catch (e) {
		console.error("dav list:", e);
		return [];
	}
}

export async function isDirectory(path) {
	if (isDavMount(path)) {
		try {
			const { client, filePath } = await getDavClient(path);
			const stat = await client.stat(filePath);
			return stat.type === "directory";
		} catch {
			return false;
		}
	}
	try {
		const s = await statAsync(path);
		return s.isDirectory();
	} catch {
		return false;
	}
}

export async function mkdirp(path) {
	if (isDavMount(path)) {
		const { client, filePath } = await getDavClient(path);
		try {
			if (await client.exists(filePath)) return;
			await client.createDirectory(filePath, { recursive: true });
		} catch (e) {
			if (!(await client.exists(filePath))) throw e;
		}
		return;
	}
	try {
		if (await exists(path)) return;
		await tb.fs.promises.mkdir(path, { recursive: true });
	} catch (e) {
		if (!(await exists(path))) throw e;
	}
}

async function readFileAny(path) {
	if (isDavMount(path)) {
		const { client, filePath } = await getDavClient(path);
		return await client.getFileContents(filePath);
	}
	return await tb.fs.promises.readFile(path);
}

async function writeFileAny(path, data) {
	if (isDavMount(path)) {
		const { client, filePath } = await getDavClient(path);
		await client.putFileContents(filePath, data);
		return;
	}
	await tb.fs.promises.writeFile(path, data);
}

export async function copyFile(src, dest) {
	const data = await readFileAny(src);
	await writeFileAny(dest, data);
}

export async function copyRecursive(src, dest) {
	if (isDavMount(src) && isDavMount(dest)) {
		const { client: srcClient, filePath: srcPath } = await getDavClient(src);
		const { client: dstClient, filePath: dstPath } = await getDavClient(dest);
		if (srcClient === dstClient) {
			try {
				await srcClient.copyFile(srcPath, dstPath);
				return;
			} catch (e) {
				console.error("dav copyFile fallback:", e);
			}
		}
		void dstPath;
	}
	if (isDavMount(src)) {
		const dir = await isDirectory(src);
		if (dir) {
			await mkdirp(dest);
			const entries = await davListDir(src);
			for (const entry of entries) {
				await copyRecursive(joinPath(src, entry.name), joinPath(dest, entry.name));
			}
		} else {
			await copyFile(src, dest);
		}
		return;
	}
	if (isDavMount(dest)) {
		const s = await statAsync(src);
		if (s.isDirectory()) {
			await mkdirp(dest);
			const entries = await readdirAsync(src);
			for (const entry of entries) {
				await copyRecursive(joinPath(src, entry), joinPath(dest, entry));
			}
		} else {
			await copyFile(src, dest);
		}
		return;
	}
	const s = await statAsync(src);
	if (s.isDirectory()) {
		await mkdirp(dest);
		const entries = await readdirAsync(src);
		for (const entry of entries) {
			await copyRecursive(joinPath(src, entry), joinPath(dest, entry));
		}
	} else {
		await copyFile(src, dest);
	}
}

export async function moveRecursive(src, dest) {
	if (isDavMount(src) && isDavMount(dest)) {
		const { client: srcClient, filePath: srcPath } = await getDavClient(src);
		const { client: dstClient, filePath: dstPath } = await getDavClient(dest);
		if (srcClient === dstClient) {
			try {
				await srcClient.moveFile(srcPath, dstPath);
				return;
			} catch (e) {
				console.error("dav moveFile fallback:", e);
			}
		}
		void dstPath;
	}
	if (!isDavMount(src) && !isDavMount(dest)) {
		try {
			await tb.fs.promises.rename(src, dest);
			return;
		} catch {}
	}
	await copyRecursive(src, dest);
	await removeRecursive(src);
}

export async function removeRecursive(path) {
	if (isDavMount(path)) {
		const { client, filePath } = await getDavClient(path);
		try {
			await client.deleteFile(filePath);
		} catch (e) {
			console.error("dav delete:", e);
		}
		return;
	}
	const s = await statAsync(path);
	if (s.isDirectory()) {
		try {
			await tb.sh.promises.rm(path, { recursive: true });
			return;
		} catch {}
		const entries = await readdirAsync(path);
		for (const entry of entries) {
			await removeRecursive(joinPath(path, entry));
		}
		await tb.fs.promises.rmdir(path);
	} else {
		await tb.fs.promises.unlink(path);
	}
}

export async function moveToTrash(path) {
	const name = basename(path);
	const trashTarget = await uniquePath("/system/trash", name);
	await moveRecursive(path, trashTarget);
	return trashTarget;
}

export async function getFolderStats(path) {
	let size = 0;
	let files = 0;
	let folders = 0;
	async function walk(p) {
		if (isDavMount(p)) {
			try {
				const { client, filePath } = await getDavClient(p);
				const st = await client.stat(filePath);
				if (st.type === "directory") {
					folders++;
					const entries = await davListDir(p);
					for (const entry of entries) await walk(joinPath(p, entry.name));
				} else {
					files++;
					size += st.size || 0;
				}
			} catch {}
			return;
		}
		let s;
		try {
			s = await statAsync(p);
		} catch {
			return;
		}
		if (s.isDirectory()) {
			folders++;
			let entries = [];
			try {
				entries = await readdirAsync(p);
			} catch {}
			for (const entry of entries) await walk(joinPath(p, entry));
		} else {
			files++;
			size += s.size || 0;
		}
	}
	await walk(path);
	return { size, files, folders: Math.max(0, folders - 1) };
}

async function existsAny(path) {
	if (isDavMount(path)) {
		try {
			const { client, filePath } = await getDavClient(path);
			return await client.exists(filePath);
		} catch {
			return false;
		}
	}
	return await exists(path);
}

async function uniquePathAny(dirPath, baseName) {
	if (!isDavMount(dirPath)) return await uniquePath(dirPath, baseName);
	const dot = baseName.lastIndexOf(".");
	const stem = dot > 0 ? baseName.slice(0, dot) : baseName;
	const ext = dot > 0 ? baseName.slice(dot) : "";
	let candidate = joinPath(dirPath, baseName);
	let n = 2;
	while (await existsAny(candidate)) {
		candidate = joinPath(dirPath, `${stem} (${n})${ext}`);
		n++;
	}
	return candidate;
}

export async function pasteFromClipboard(clipboard, destDir) {
	if (!clipboard?.items?.length) return;
	for (const item of clipboard.items) {
		const name = basename(item.path);
		let target = joinPath(destDir, name);
		if (await existsAny(target)) {
			target = await uniquePathAny(destDir, name);
		}
		if (clipboard.op === "cut") {
			await moveRecursive(item.path, target);
		} else {
			await copyRecursive(item.path, target);
		}
	}
}

export async function duplicateItem(path) {
	const parent = dirname(path);
	const name = basename(path);
	const dot = name.lastIndexOf(".");
	const stem = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot) : "";
	const target = await uniquePathAny(parent, `${stem} (copy)${ext}`);
	await copyRecursive(path, target);
	return target;
}

export async function zipPath(srcPath, zipDest) {
	const fflate = tb.fflate;
	const zip = {};
	async function add(p, rel) {
		if (isDavMount(p)) {
			if (await isDirectory(p)) {
				const entries = await davListDir(p);
				for (const entry of entries) {
					await add(joinPath(p, entry.name), rel ? `${rel}/${entry.name}` : entry.name);
				}
			} else {
				const data = await readFileAny(p);
				zip[rel] = new Uint8Array(data);
			}
			return;
		}
		const s = await statAsync(p);
		if (s.isDirectory()) {
			const entries = await readdirAsync(p);
			for (const entry of entries) {
				await add(joinPath(p, entry), rel ? `${rel}/${entry}` : entry);
			}
		} else {
			const data = await tb.fs.promises.readFile(p);
			zip[rel] = new Uint8Array(data);
		}
	}
	await add(srcPath, basename(srcPath));
	const zipped = fflate.zipSync(zip);
	await writeFileAny(zipDest, tb.buffer.from(zipped));
	return zipDest;
}

export async function zipMultiplePaths(srcPaths, zipDest) {
	const fflate = tb.fflate;
	const zip = {};
	async function add(p, rel) {
		if (isDavMount(p)) {
			if (await isDirectory(p)) {
				const entries = await davListDir(p);
				for (const entry of entries) {
					await add(joinPath(p, entry.name), rel ? `${rel}/${entry.name}` : entry.name);
				}
			} else {
				const data = await readFileAny(p);
				zip[rel] = new Uint8Array(data);
			}
			return;
		}
		const s = await statAsync(p);
		if (s.isDirectory()) {
			const entries = await readdirAsync(p);
			for (const entry of entries) {
				await add(joinPath(p, entry), rel ? `${rel}/${entry}` : entry);
			}
		} else {
			const data = await tb.fs.promises.readFile(p);
			zip[rel] = new Uint8Array(data);
		}
	}
	for (const srcPath of srcPaths) {
		await add(srcPath, basename(srcPath));
	}
	const zipped = fflate.zipSync(zip);
	await writeFileAny(zipDest, tb.buffer.from(zipped));
	return zipDest;
}

export async function extractZip(zipPath, targetDir) {
	const fflate = tb.fflate;
	let buf;
	if (isDavMount(zipPath)) {
		const data = await readFileAny(zipPath);
		buf = data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer;
	} else {
		const response = await fetch(`/fs/${zipPath}`);
		buf = await response.arrayBuffer();
	}
	await mkdirp(targetDir);
	const files = fflate.unzipSync(new Uint8Array(buf));
	for (const [rel, content] of Object.entries(files)) {
		const full = joinPath(targetDir, rel);
		if (rel.endsWith("/")) {
			await mkdirp(full);
			continue;
		}
		await mkdirp(dirname(full));
		await writeFileAny(full, tb.buffer.from(content));
	}
}

export async function emptyTrash() {
	let entries = [];
	try {
		entries = await readdirAsync("/system/trash");
	} catch {
		return;
	}
	for (const entry of entries) {
		await removeRecursive(joinPath("/system/trash", entry));
	}
}

export async function createFile(dir, name) {
	if (isDavMount(dir)) {
		let target = joinPath(dir, name);
		let renamed = false;
		if (await existsAny(target)) {
			target = await uniquePathAny(dir, name);
			renamed = true;
		}
		const { client, filePath } = await getDavClient(target);
		await client.putFileContents(filePath, "");
		return { path: target, renamed };
	}
	const path = joinPath(dir, name);
	if (await exists(path)) {
		return { path: await uniquePath(dir, name), renamed: true };
	}
	await tb.sh.touch(path, "");
	return { path, renamed: false };
}

export async function createFolder(dir, name) {
	if (isDavMount(dir)) {
		const target = await uniquePathAny(dir, name);
		const { client, filePath } = await getDavClient(target);
		await client.createDirectory(filePath);
		return target;
	}
	const path = await uniquePath(dir, name);
	await tb.fs.promises.mkdir(path);
	return path;
}

export async function renameItem(path, newName) {
	const parent = dirname(path);
	const target = joinPath(parent, newName);
	if (isDavMount(path)) {
		const { client, filePath } = await getDavClient(path);
		const { filePath: destPath } = await getDavClient(target);
		await client.moveFile(filePath, destPath);
		return target;
	}
	await tb.fs.promises.rename(path, target);
	return target;
}

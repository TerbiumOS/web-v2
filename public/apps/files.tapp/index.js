import { copyRecursive, createFile, createFolder, duplicateItem, emptyTrash as emptyTrashOp, extractZip, getFolderStats, moveRecursive, moveToTrash, pasteFromClipboard, removeRecursive, renameItem, zipPath } from "./fs-ops.js";
import { openFile as openFileExternal, showOpenWithDialog } from "./open-with.js";
import { clearSelection, emit, on, setClipboard, state, tb, user } from "./state.js";
import { showContextMenu } from "./ui/context-menu.js";
import { initExplorer } from "./ui/explorer.js";
import { initSidebar } from "./ui/sidebar.js";
import { renderStorageDevices } from "./ui/storage-devices.js";
import { initTopbar, pushHistory } from "./ui/topbar.js";
import { basename, dirname, isInTrash, joinPath, loadConfig, readdirAsync, saveConfig, statAsync, uniquePath } from "./utils.js";
import { getDavClient, isDavMount } from "./vdav.js";

async function persistSetting(key, value) {
	try {
		const cfg = (await loadConfig()) || {};
		cfg[key] = value;
		await saveConfig(cfg);
	} catch (e) {
		console.error(`persist ${key}:`, e);
	}
}

function lsEditDialog(lsPath) {
	const key = lsPath.startsWith("local storage/") ? lsPath.slice("local storage/".length) : lsPath;
	const current = localStorage.getItem(key) ?? "";
	tb.dialog.Message({
		title: `Change the value for ${key}`,
		defaultValue: current,
		onOk: async newVal => {
			if (newVal != null && newVal !== current) {
				localStorage.setItem(key, newVal);
				openPath(state.currentPath, { skipHistory: true });
			}
		},
	});
}

async function pinToQuickAccess(path) {
	try {
		const cfg = (await loadConfig()) || {};
		if (!cfg["quick-access"] || typeof cfg["quick-access"] !== "object") cfg["quick-access"] = {};
		const label = basename(path) || path;
		cfg["quick-access"][label] = path;
		await saveConfig(cfg);
		window.dispatchEvent(new Event("updcfg"));
	} catch (e) {
		console.error("pin:", e);
	}
}

async function unpinFromQuickAccess(path) {
	try {
		const cfg = (await loadConfig()) || {};
		if (!cfg["quick-access"]) return;
		for (const [label, p] of Object.entries(cfg["quick-access"])) {
			if (p === path) delete cfg["quick-access"][label];
		}
		await saveConfig(cfg);
		window.dispatchEvent(new Event("updcfg"));
	} catch (e) {
		console.error("unpin:", e);
	}
}

async function isPinnedToQuickAccess(path) {
	try {
		const cfg = (await loadConfig()) || {};
		const qa = cfg["quick-access"] || {};
		return Object.values(qa).includes(path);
	} catch {
		return false;
	}
}

const HOME = `/home/${user}`;
const TRASH = "/system/trash";

let expEl;

const SYSTEM_HOME_FOLDERS = new Set(["desktop", "documents", "images", "videos", "music", "trash"]);

function isSystemHomeFolder(parentPath, name) {
	if (parentPath !== HOME) return false;
	return SYSTEM_HOME_FOLDERS.has(String(name).toLowerCase());
}

async function loadDirItems(path) {
	let entries = [];
	try {
		entries = await readdirAsync(path);
	} catch (e) {
		console.error("readdir", path, e);
		return [];
	}
	const items = [];
	for (const name of entries) {
		if (!state.showHidden && name.startsWith(".")) continue;
		const full = joinPath(path, name);
		let s;
		try {
			s = await statAsync(full);
		} catch {
			continue;
		}
		const isFolder = s.isDirectory();
		items.push({
			name,
			path: full,
			type: isFolder ? "folder" : "file",
			size: s.size,
			modified: s.mtime,
			created: s.ctime,
			systemFolder: isFolder && isSystemHomeFolder(path, name),
		});
	}
	return items;
}

function loadLocalStorageItems() {
	const items = [];
	for (const key of Object.keys(localStorage)) {
		const val = localStorage.getItem(key) || "";
		items.push({
			name: key,
			path: `local storage/${key}`,
			type: "file",
			size: val.length * 2,
			modified: null,
			created: null,
		});
	}
	return items;
}

async function loadDavItems(path) {
	try {
		const parts = path.split("/").filter(Boolean);
		const mountName = parts[1];
		tb.vfs.setServer(mountName);
		const davConfig = tb.vfs.currentServer;
		let relPath = `/${parts.slice(2).join("/")}`;
		if (relPath === "/") relPath = "/";
		const client = davConfig.connection.client;
		const contents = await client.getDirectoryContents(relPath);
		const items = [];
		const relNoSlash = relPath.replace(/^\/+/g, "").replace(/\/+$/g, "");
		for (const item of contents) {
			const name = item.basename;
			if (!name) continue;
			// Skip self-reference: some servers include the current directory in the listing
			if (item.type === "directory") {
				const filenameNorm = String(item.filename || "")
					.replace(/^\/+/g, "")
					.replace(/\/+$/g, "");
				if (filenameNorm === relNoSlash) continue;
			}
			const full = `/mnt/${davConfig.name}${relPath === "/" ? "" : relPath}/${name}`.replace(/\/+/g, "/");
			items.push({
				name,
				path: full,
				type: item.type === "directory" ? "folder" : "file",
				size: item.size || 0,
				modified: item.lastmod || null,
				created: null,
			});
		}
		return items;
	} catch (e) {
		console.error("webdav load:", e);
		return [];
	}
}

async function openPath(rawPath, opts = {}) {
	let path = rawPath;
	if (!path) return;

	if (path === "cmd") {
		try {
			const currentPath = state.currentPath || HOME;
			const message = JSON.stringify({ type: "open-path", path: currentPath });
			tb.window.create({
				title: "Terminal",
				icon: "/fs/apps/system/terminal.tapp/icon.svg",
				src: "/fs/apps/system/terminal.tapp/index.html",
				size: { width: 438, height: 326 },
				single: true,
				message,
			});
		} catch (e) {
			console.error(e);
		}
		return;
	}

	if (path === "storage devices") {
		state.currentPath = path;
		state.items = [];
		clearSelection();
		if (expEl) expEl.setAttribute("path", path);
		if (!opts.skipHistory) pushHistory(path);
		emit("path:change", path);
		await renderStorageDevices(expEl, openPath);
		return;
	}

	// Trim trailing slash on normal & dav paths (but keep root and local storage as-is)
	if (path !== "/" && path !== "//" && !path.startsWith("local storage") && path.endsWith("/")) {
		path = path.replace(/\/+$/g, "") || "/";
	}

	// .app sideload prompt for Anura apps (unless override)
	if (!opts.override && /\.app$/i.test(path) && !path.startsWith("local storage") && !path.startsWith("/mnt/")) {
		try {
			const s = await statAsync(path);
			if (s.isDirectory()) {
				tb.dialog.Select({
					title: "Sideload App",
					message: `Do you want to sideload the anura app found at ${path}?`,
					options: [
						{ text: "Yes", value: "yes" },
						{ text: "View Source", value: "source" },
						{ text: "No", value: "no" },
					],
					onOk: async val => {
						if (val === "yes") {
							try {
								const anura = window.parent.anura;
								const appPath = `/fs${path}`.replace("//", "/");
								await anura.registerExternalApp(appPath);
							} catch (e) {
								tb.dialog.Alert({
									title: "Unexpected Error",
									message: `Failed to sideload ${path}: ${e}`,
								});
							}
							openPath(HOME);
						} else if (val === "source") {
							openPath(path, { override: true });
						} else {
							openPath(HOME);
						}
					},
				});
				return;
			}
		} catch {}
	}

	let items;
	if (path === "local storage" || path.startsWith("local storage/")) {
		items = loadLocalStorageItems();
	} else if (path.startsWith("/mnt/")) {
		items = await loadDavItems(path);
	} else if (path === "//" || path === "/") {
		items = await loadDirItems("/");
	} else {
		// existence guard for regular paths
		try {
			const ex = await tb.fs.promises.exists(path);
			if (!ex) {
				console.error("Path does not exist:", path);
				return;
			}
		} catch {}
		items = await loadDirItems(path);
	}

	state.currentPath = path;
	state.items = items;
	clearSelection();

	if (expEl) expEl.setAttribute("path", path);

	const etBtn = window.parent.document.querySelector(`[control-id="files-et"]`);
	if (etBtn) {
		if (isInTrash(path) || path === TRASH) etBtn.classList.remove("hidden");
		else etBtn.classList.add("hidden");
	}

	if (!opts.skipHistory) pushHistory(path);
	emit("path:change", path);
	emit("items:set", items);
}

async function itemContextMenu(targetEl) {
	const paths = [...state.selection];
	const single = paths.length === 1;
	const inTrash = isInTrash(state.currentPath);
	const type = targetEl?.dataset.type;
	const sysFolder = targetEl?.dataset?.systemFolder === "true";

	// Local-storage entries get their own context menu (no file ops apply)
	if (single && type === "file" && paths[0].startsWith("local storage/")) {
		const key = paths[0].slice("local storage/".length);
		const lsOptions = [];
		lsOptions.push({
			text: "Edit value",
			click: () => {
				const current = localStorage.getItem(key) ?? "";
				tb.dialog.Message({
					title: `Change the value for ${key}`,
					defaultValue: current,
					onOk: async newVal => {
						if (newVal != null && newVal !== current) {
							localStorage.setItem(key, newVal);
							openPath(state.currentPath, { skipHistory: true });
						}
					},
				});
			},
		});
		lsOptions.push({
			text: "Rename key",
			click: () => {
				tb.dialog.Message({
					title: `Rename key ${key}`,
					defaultValue: key,
					onOk: async newKey => {
						if (newKey && newKey !== key) {
							const val = localStorage.getItem(key) ?? "";
							localStorage.removeItem(key);
							localStorage.setItem(newKey, val);
							openPath(state.currentPath, { skipHistory: true });
						}
					},
				});
			},
		});
		lsOptions.push({ separator: true });
		lsOptions.push({
			text: "Copy value to clipboard",
			click: async () => {
				try {
					await navigator.clipboard.writeText(localStorage.getItem(key) ?? "");
				} catch (e) {
					console.error(e);
				}
			},
		});
		lsOptions.push({ separator: true });
		lsOptions.push({
			text: "Delete key",
			shortcut: "Delete",
			click: () => {
				localStorage.removeItem(key);
				openPath(state.currentPath, { skipHistory: true });
			},
		});
		return lsOptions;
	}

	const options = [];
	if (!inTrash) {
		if (single && type === "file") {
			options.push({
				text: "Open",
				click: () => openFileExternal(paths[0], { name: basename(paths[0]), onAfterExtract: () => openPath(state.currentPath, { skipHistory: true }) }),
			});
			options.push({
				text: "Open with…",
				click: () => showOpenWithDialog(paths[0]),
			});
			options.push({
				text: "Download to Computer",
				click: () => downloadToComputer(paths[0]),
			});
			options.push({ separator: true });
		}
		if (single && type === "folder") {
			options.push({
				text: "Open",
				click: () => openPath(paths[0]),
			});
			options.push({
				text: "Upload from Computer",
				click: () => uploadFromComputer(paths[0]),
			});
			const pinned = await isPinnedToQuickAccess(paths[0]);
			if (pinned) {
				options.push({
					text: "Unpin from Quick Access",
					click: () => unpinFromQuickAccess(paths[0]),
				});
			} else {
				options.push({
					text: "Pin to Quick Access",
					click: () => pinToQuickAccess(paths[0]),
				});
			}
			options.push({ separator: true });
		}
		options.push({ text: "Cut", shortcut: "Ctrl+X", click: () => doCut() });
		options.push({ text: "Copy", shortcut: "Ctrl+C", click: () => doCopy() });
		options.push({
			text: "Duplicate",
			click: async () => {
				for (const p of paths) await duplicateItem(p);
				openPath(state.currentPath, { skipHistory: true });
			},
		});
		options.push({
			text: "Copy to…",
			click: () => copyOrMoveTo("copy"),
		});
		options.push({
			text: "Move to…",
			click: () => copyOrMoveTo("move"),
		});
		options.push({ separator: true });
		if (single && !sysFolder) {
			options.push({
				text: "Rename",
				shortcut: "F2",
				click: () => doRename(paths[0]),
			});
		}
		options.push({
			text: "Move to Trash",
			shortcut: "Delete",
			click: () => doDelete(false),
			disabled: sysFolder,
		});
		options.push({
			text: "Delete permanently",
			shortcut: "Shift+Delete",
			click: () => doDelete(true),
		});
		options.push({ separator: true });
		options.push({
			text: "Compress to ZIP",
			click: async () => {
				for (const p of paths) {
					const dest = await uniquePath(dirname(p), `${basename(p)}.zip`);
					await zipPath(p, dest);
				}
				openPath(state.currentPath, { skipHistory: true });
			},
		});
		if (single && /\.zip$/i.test(basename(paths[0]))) {
			options.push({
				text: "Extract here",
				click: async () => {
					const target = paths[0].replace(/\.zip$/i, "");
					await extractZip(paths[0], target);
					openPath(state.currentPath, { skipHistory: true });
				},
			});
		}
		options.push({ separator: true });
		if (single) {
			options.push({
				text: "Properties",
				click: () => showProperties(paths[0]),
			});
		}
	} else {
		options.push({
			text: "Restore",
			click: async () => {
				for (const p of paths) {
					const target = await uniquePath(HOME, basename(p));
					await moveRecursive(p, target);
				}
				openPath(state.currentPath, { skipHistory: true });
			},
		});
		options.push({
			text: "Delete permanently",
			click: () => doDelete(true),
		});
	}
	return options;
}

async function downloadToComputer(path) {
	try {
		const name = basename(path);
		const lk = document.createElement("a");
		lk.download = name;
		if (isDavMount(path)) {
			const { client, filePath } = await getDavClient(path);
			const data = await client.getFileContents(filePath);
			let mime = "application/octet-stream";
			try {
				const st = await client.stat(filePath);
				if (st?.mime) mime = st.mime;
			} catch {}
			const blob = new Blob([data], { type: mime });
			const url = URL.createObjectURL(blob);
			lk.href = url;
			lk.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			return;
		}
		const response = await fetch(`${window.location.origin}/fs/${path}`);
		const raw = await response.blob();
		const ext = (name.split(".").pop() || "").toLowerCase();
		const mimeMap = {
			txt: "text/plain",
			html: "text/html",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			webp: "image/webp",
			svg: "image/svg+xml",
			mp4: "video/mp4",
			webm: "video/webm",
			mp3: "audio/mpeg",
			wav: "audio/wav",
			pdf: "application/pdf",
			json: "application/json",
			zip: "application/zip",
		};
		const mime = mimeMap[ext] || "application/octet-stream";
		const blob = new Blob([raw], { type: mime });
		const url = URL.createObjectURL(blob);
		lk.href = url;
		lk.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	} catch (e) {
		console.error("downloadToComputer:", e);
	}
}

async function uploadFromComputer(destDir) {
	const input = document.createElement("input");
	input.type = "file";
	input.multiple = true;
	input.onchange = async e => {
		for (const file of e.target.files) {
			const content = await file.arrayBuffer();
			if (isDavMount(destDir)) {
				const target = joinPath(destDir, file.name);
				const { client, filePath } = await getDavClient(target);
				let finalPath = filePath;
				if (await client.exists(filePath)) {
					let n = 2;
					const dot = file.name.lastIndexOf(".");
					const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
					const ext = dot > 0 ? file.name.slice(dot) : "";
					let candidate;
					do {
						candidate = joinPath(destDir, `${stem} (${n})${ext}`);
						n++;
					} while (await client.exists((await getDavClient(candidate)).filePath));
					finalPath = (await getDavClient(candidate)).filePath;
				}
				await client.putFileContents(finalPath, tb.buffer.from(content));
			} else {
				const target = await uniquePath(destDir, file.name);
				await tb.fs.promises.writeFile(target, tb.buffer.from(content), "arraybuffer");
			}
		}
		openPath(state.currentPath, { skipHistory: true });
	};
	input.click();
}

function backgroundContextMenu() {
	const inTrash = isInTrash(state.currentPath);
	const options = [];
	if (!inTrash) {
		options.push({
			text: "New File",
			click: async () => {
				await tb.dialog.Message({
					title: "Enter a name for the new file",
					defaultValue: "",
					onOk: async name => {
						if (!name) return;
						try {
							await createFile(state.currentPath, name);
							openPath(state.currentPath, { skipHistory: true });
						} catch (e) {
							console.error("createFile:", e);
							tb.dialog.Alert({ title: "Failed to create file", message: String(e?.message || e) });
						}
					},
				});
			},
		});
		options.push({
			text: "New Folder",
			click: async () => {
				await tb.dialog.Message({
					title: "Enter a name for the new folder",
					defaultValue: "",
					onOk: async name => {
						if (!name) return;
						try {
							await createFolder(state.currentPath, name);
							openPath(state.currentPath, { skipHistory: true });
						} catch (e) {
							console.error("createFolder:", e);
							tb.dialog.Alert({ title: "Failed to create folder", message: String(e?.message || e) });
						}
					},
				});
			},
		});
		options.push({
			text: "Upload from Computer",
			click: () => uploadFromComputer(state.currentPath),
		});
		options.push({ separator: true });
		options.push({
			text: "Paste",
			shortcut: "Ctrl+V",
			disabled: !state.clipboard,
			click: () => doPaste(),
		});
		options.push({ separator: true });
		options.push({
			text: "Reload",
			shortcut: "F5",
			click: () => openPath(state.currentPath, { skipHistory: true }),
		});
		options.push({
			text: state.showHidden ? "Hide hidden files" : "Show hidden files",
			click: async () => {
				state.showHidden = !state.showHidden;
				await persistSetting("show-hidden-files", state.showHidden);
				openPath(state.currentPath, { skipHistory: true });
			},
		});
		options.push({ separator: true });
		options.push({
			text: "Properties",
			click: () => showProperties(state.currentPath),
		});
	} else {
		options.push({
			text: "Empty Trash",
			click: async () => {
				await emptyTrashOp();
				openPath(state.currentPath, { skipHistory: true });
			},
		});
	}
	return options;
}

async function contextMenu(e, ctx) {
	const options = ctx.type === "background" ? backgroundContextMenu() : await itemContextMenu(ctx.target);
	showContextMenu(e, options);
}

function doCut() {
	const paths = [...state.selection];
	if (!paths.length) return;
	setClipboard({ op: "cut", items: paths.map(p => ({ path: p })) });
}

function doCopy() {
	const paths = [...state.selection];
	if (!paths.length) return;
	setClipboard({ op: "copy", items: paths.map(p => ({ path: p })) });
}

async function doPaste(destDir) {
	if (!state.clipboard) return;
	await pasteFromClipboard(state.clipboard, destDir || state.currentPath);
	if (state.clipboard.op === "cut") setClipboard(null);
	openPath(state.currentPath, { skipHistory: true });
}

async function doDelete(permanent) {
	const paths = [...state.selection];
	if (!paths.length) return;
	const inTrash = isInTrash(state.currentPath) || permanent;
	if (inTrash) {
		await tb.dialog.Permissions({
			title: "Delete permanently?",
			message: `Permanently delete ${paths.length} item(s)? This cannot be undone.`,
			onOk: async () => {
				for (const p of paths) await removeRecursive(p);
				openPath(state.currentPath, { skipHistory: true });
			},
		});
	} else {
		for (const p of paths) await moveToTrash(p);
		openPath(state.currentPath, { skipHistory: true });
	}
}

async function doRename(path) {
	await tb.dialog.Message({
		title: "Enter a new name",
		defaultValue: basename(path),
		onOk: async name => {
			if (!name || name === basename(path)) return;
			await renameItem(path, name);
			openPath(state.currentPath, { skipHistory: true });
		},
	});
}

function copyOrMoveTo(op) {
	const paths = [...state.selection];
	if (!paths.length) return;
	tb.dialog.DirectoryBrowser({
		title: op === "copy" ? "Copy to…" : "Move to…",
		onOk: async dest => {
			if (!dest) return;
			for (const p of paths) {
				const target = await uniquePath(dest, basename(p));
				if (op === "copy") await copyRecursive(p, target);
				else await moveRecursive(p, target);
			}
			openPath(state.currentPath, { skipHistory: true });
		},
	});
}

async function showProperties(path) {
	let details;
	try {
		const s = await statAsync(path);
		if (s.isDirectory()) {
			const stats = await getFolderStats(path);
			details = {
				name: basename(path),
				type: "folder",
				size: stats.size,
				files: stats.files,
				folders: stats.folders,
				created: s.ctime,
				modified: s.mtime,
				accessed: s.atime,
				mime: "inode/directory",
			};
		} else {
			details = {
				name: basename(path),
				type: "file",
				size: s.size,
				created: s.ctime,
				modified: s.mtime,
				accessed: s.atime,
				mime: s.type || "",
			};
		}
	} catch (e) {
		console.error(e);
		return;
	}
	tb.window.create({
		title: `Properties — ${basename(path)}`,
		icon: "/fs/apps/system/files.tapp/icon.svg",
		src: "/fs/apps/system/files.tapp/properties/index.html",
		size: { width: 380, height: 460 },
		controls: ["close"],
		message: JSON.stringify({ details, path }),
	});
}

async function handleInternalDrop({ paths, destDir, copy }) {
	if (!paths?.length || !destDir) return;
	for (const p of paths) {
		if (p === destDir || destDir.startsWith(`${p}/`)) continue;
		const target = await uniquePath(destDir, basename(p));
		if (copy) await copyRecursive(p, target);
		else await moveRecursive(p, target);
	}
	openPath(state.currentPath, { skipHistory: true });
}

async function handleExternalDrop({ files, destDir }) {
	if (!files?.length || !destDir) return;
	for (const file of files) {
		const content = await file.arrayBuffer();
		const target = await uniquePath(destDir, file.name);
		await tb.fs.promises.writeFile(target, tb.buffer.from(content), "arraybuffer");
	}
	openPath(state.currentPath, { skipHistory: true });
}

function openSelectedFile() {
	const paths = [...state.selection];
	if (paths.length !== 1) return;
	const item = state.items.find(i => i.path === paths[0]);
	if (!item) return;
	if (item.type === "folder") openPath(item.path);
	else openFileExternal(item.path, { name: item.name, onAfterExtract: () => openPath(state.currentPath, { skipHistory: true }) });
}

window.addEventListener("load", async () => {
	expEl = document.querySelector(".exp");

	try {
		const cfg = (await loadConfig()) || {};
		if (typeof cfg["show-hidden-files"] === "boolean") state.showHidden = cfg["show-hidden-files"];
		if (typeof cfg["view-mode"] === "string") state.viewMode = cfg["view-mode"];
		if (cfg.sort && typeof cfg.sort === "object") {
			if (typeof cfg.sort.key === "string") state.sortKey = cfg.sort.key;
			if (typeof cfg.sort.asc === "boolean") state.sortAsc = cfg.sort.asc;
		}
	} catch (e) {
		console.error("load view settings:", e);
	}

	await initSidebar(openPath);
	initTopbar(openPath);
	initExplorer({ openPath, openFile: (p, name) => openFileExternal(p, { name, onAfterExtract: () => openPath(state.currentPath, { skipHistory: true }) }), contextMenu });

	on("crumb:click", path => openPath(path));
	on("action:delete", () => doDelete(false));
	on("action:copy", doCopy);
	on("action:cut", doCut);
	on("action:paste", () => doPaste());
	on("action:rename", () => {
		const paths = [...state.selection];
		if (paths.length !== 1) return;
		const item = state.items.find(i => i.path === paths[0]);
		if (item?.systemFolder) return;
		doRename(paths[0]);
	});
	on("action:reload", () => openPath(state.currentPath, { skipHistory: true }));
	on("action:open", openSelectedFile);
	on("action:ls-edit", lsPath => lsEditDialog(lsPath));
	on("drop:internal", handleInternalDrop);
	on("drop:external", handleExternalDrop);
	on("view:change", mode => persistSetting("view-mode", mode));
	on("sort:change", sort => persistSetting("sort", sort));

	let initial = sessionStorage.getItem("ldir");
	if (initial) sessionStorage.removeItem("ldir");
	else initial = HOME;
	await openPath(initial);
});

window.addEventListener("message", e => {
	if (e.data?.type === "open-path" && e.data.path) openPath(e.data.path);
});

window.openPath = openPath;
window.emptyTrash = async () => {
	await emptyTrashOp();
	openPath(state.currentPath, { skipHistory: true });
};

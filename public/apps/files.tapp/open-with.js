import { extractZip } from "./fs-ops.js";
import { tb } from "./state.js";
import { getExt, readJSON } from "./utils.js";

let extensionsCache = null;
let handlersCache = null;

export async function loadExtensions() {
	if (extensionsCache) return extensionsCache;
	extensionsCache = (await readJSON("/apps/system/files.tapp/extensions.json")) || {};
	return extensionsCache;
}

export async function loadFileHandlers() {
	const settings = (await readJSON("/system/etc/terbium/settings.json")) || {};
	handlersCache = settings.fileAssociatedApps || {};
	return handlersCache;
}

function normalizeHandlerAppName(value) {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[\s._-]+/g, "");
}

function isBuiltInOpenWithApp(appName) {
	const n = normalizeHandlerAppName(appName);
	return n === "texteditor" || n === "texteditortapp" || n === "mediaviewer" || n === "mediaviewertapp" || n === "browser" || n === "browsertapp" || n === "webview";
}

export function buildOpenWithHandlerOptions(handlers) {
	const entries = Object.entries(handlers || {});
	const seen = new Set();
	const options = [];
	for (const [type, app] of entries) {
		const handlerType = String(type || "")
			.trim()
			.toLowerCase();
		const appName = String(app || "").trim();
		if (!handlerType || !appName) continue;
		if (isBuiltInOpenWithApp(appName)) continue;
		const key = normalizeHandlerAppName(appName);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		options.push({ text: appName, value: handlerType });
	}
	return options;
}

export function categoryForExt(ext, extensions) {
	if (extensions.image?.includes(ext)) return "image";
	if (extensions.video?.includes(ext)) return "video";
	if (extensions.audio?.includes(ext)) return "audio";
	if (extensions.pdf?.includes(ext)) return "pdf";
	if (extensions.text?.includes(ext)) return "text";
	return null;
}

export async function openFile(path, opts = {}) {
	const name = opts.name || path.split("/").pop();
	const ext = getExt(name);
	const extensions = await loadExtensions();
	const handlers = await loadFileHandlers();

	if (handlers[ext]) {
		tb.file.handler.openFile(path, ext);
		return;
	}

	if (ext === "tapp.zip") {
		await installTappZip(path);
		return;
	}

	if (extensions.extractables?.includes(ext) || ext === "app.zip" || ext === "lib.zip") {
		const target = path.replace(/\.zip$/i, "");
		await extractZip(path, target);
		opts.onAfterExtract?.();
		return;
	}

	const cat = categoryForExt(ext, extensions);
	if (cat) {
		tb.file.handler.openFile(path, cat);
		return;
	}

	await showOpenWithDialog(path, extensions, handlers);
}

export async function showOpenWithDialog(path, extensions, handlers) {
	const exts = extensions || (await loadExtensions());
	const hndlrs = handlers || (await loadFileHandlers());
	const hands = buildOpenWithHandlerOptions(hndlrs);
	const name = path.split("/").pop();
	await tb.dialog.Select({
		title: `Select an application to open: ${name}`,
		options: [{ text: "Text Editor", value: "text" }, { text: "Media Viewer", value: "media" }, { text: "Webview", value: "webview" }, ...hands, { text: "Other", value: "other" }],
		onOk: async val => {
			switch (val) {
				case "text":
					tb.file.handler.openFile(path, "text");
					break;
				case "media": {
					const ext = getExt(name);
					const cat = categoryForExt(ext, exts) || "image";
					tb.file.handler.openFile(path, cat);
					break;
				}
				case "webview":
					tb.file.handler.openFile(path, "webpage");
					break;
				case "other":
					tb.dialog.DirectoryBrowser({
						title: "Select an application",
						filter: ".tapp",
						onOk: async appPath => {
							try {
								const app = JSON.parse(await tb.fs.promises.readFile(`${appPath}/.tbconfig`, "utf8"));
								tb.window.create({ ...app.wmArgs, message: { type: "process", path } });
							} catch (e) {
								console.error(e);
							}
						},
					});
					break;
				default:
					if (hands.length === 0) tb.file.handler.openFile(path, "text");
					else tb.file.handler.openFile(path, String(val || "").toLowerCase());
					break;
			}
		},
	});
}

async function installTappZip(path) {
	try {
		await tb.dialog.Permissions({
			title: "Install application",
			message: `Would you like to install the application: ${path}?`,
			onOk: async () => {
				const user = sessionStorage.getItem("currAcc");
				const appName = path
					.replace(`/home/${user}/`, "")
					.replace(/\//g, ".")
					.replace(/\.zip$/, "");

				await tb.notification.Installing(
					{
						message: `Installing ${appName}...`,
						application: "Files",
						iconSrc: "/fs/apps/system/files.tapp/icon.svg",
					},
					async () => {
						const targetDir = `/apps/user/${user}/${appName}`;
						await extractZip(path, targetDir);
						const appConf = await tb.fs.promises.readFile(`${targetDir}/.tbconfig`, "utf8");
						const appData = JSON.parse(appConf);
						await tb.launcher.addApp({
							name: appData.title,
							icon: appData.icon?.includes("http") ? appData.icon : `/fs/${targetDir}/${appData.icon}`,
							title: appData.wmArgs.title,
							src: `/fs/${targetDir}/${appData.wmArgs.src}`,
							size: appData.wmArgs.size,
							single: appData.wmArgs.single,
							resizable: appData.wmArgs.resizable,
							controls: appData.wmArgs.controls,
							message: appData.wmArgs.message,
							snapable: appData.wmArgs.snapable,
							user,
						});
						try {
							const apps = JSON.parse(await tb.fs.promises.readFile("/apps/installed.json", "utf8"));
							apps.push({ name: appName, user, config: `/apps/user/${user}/${appName}/.tbconfig` });
							await tb.fs.promises.writeFile("/apps/installed.json", JSON.stringify(apps));
						} catch {
							await tb.fs.promises.writeFile("/apps/installed.json", JSON.stringify([{ name: appName, user, config: `/apps/user/${user}/${appName}/.tbconfig` }]));
						}
					},
					{ message: `${appName} installed successfully!` },
					{ message: `Failed to install ${appName}` },
				);
			},
		});
	} catch (e) {
		tb.dialog.Alert({ title: "Unexpected Error", message: `Failed to install: ${e}` });
	}
}

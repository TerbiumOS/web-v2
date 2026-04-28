import { useEffect, useState, useRef } from "react";
import { dirExists, fileExists, unzip, UserSettings } from "./sys/types";
import { DEFAULT_BOOT_ENTRIES, upgradeLegacyBootEntries } from "./sys/bootentries";
import { hash } from "./hash.json";
import paths from "./installer.json";

export default function Updater() {
	const [progress, setProgress] = useState(0);
	const statusref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const main = async () => {
			const canonicalSystemInstalledApps = [
				{ name: "About", config: "/apps/system/about.tapp/index.json", user: "System" },
				{ name: "App Store", config: "/apps/system/app store.tapp/index.json", user: "System" },
				{ name: "Browser", config: "/apps/system/browser.tapp/index.json", user: "System" },
				{ name: "Calculator", config: "/apps/system/calculator.tapp/index.json", user: "System" },
				{ name: "Feedback", config: "/apps/system/feedback.tapp/index.json", user: "System" },
				{ name: "Files", config: "/apps/system/files.tapp/index.json", user: "System" },
				{ name: "Media Viewer", config: "/apps/system/media viewer.tapp/index.json", user: "System" },
				{ name: "Settings", config: "/apps/system/settings.tapp/index.json", user: "System" },
				{ name: "Task Manager", config: "/apps/system/task manager.tapp/index.json", user: "System" },
				{ name: "Terminal", config: "/apps/system/terminal.tapp/index.json", user: "System" },
				{ name: "Text Editor", config: "/apps/system/text editor.tapp/index.json", user: "System" },
				{ name: "Anura File Manager", config: "/system/etc/anura/configs/Anura File Manager.json", user: "System" },
			];
			const normalize = (value: string) =>
				String(value || "")
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "");

			const toBytes = (input: any): Uint8Array => {
				if (input instanceof Uint8Array) return input;
				if (typeof input === "string") return window.tb.buffer.from(input, "utf8");
				return window.tb.buffer.from(input);
			};
			const bytesEqual = (a: Uint8Array, b: Uint8Array) => {
				if (a.byteLength !== b.byteLength) return false;
				for (let i = 0; i < a.byteLength; i++) {
					if (a[i] !== b[i]) return false;
				}
				return true;
			};
			const ensureDirForPath = async (path: string) => {
				const dir = path.slice(0, path.lastIndexOf("/"));
				if (dir && !(await dirExists(dir))) {
					// @ts-expect-error recursive option is supported in runtime fs
					await window.tb.fs.promises.mkdir(dir, { recursive: true });
				}
			};
			const writeFileIfChanged = async (path: string, content: Uint8Array) => {
				if (await fileExists(path)) {
					const currentRaw = await window.tb.fs.promises.readFile(path);
					if (bytesEqual(toBytes(currentRaw), content)) {
						return false;
					}
				}
				await ensureDirForPath(path);
				const output = new Uint8Array(content.byteLength);
				output.set(content);
				await window.tb.fs.promises.writeFile(path, output.buffer);
				return true;
			};
			const syncDirectoryDiff = async (sourceDir: string, targetDir: string): Promise<{ updated: number; removed: number; skipped: number }> => {
				if (!(await dirExists(targetDir))) {
					// @ts-expect-error recursive option is supported in runtime fs
					await window.tb.fs.promises.mkdir(targetDir, { recursive: true });
				}
				let updated = 0;
				let removed = 0;
				let skipped = 0;
				const sourceEntries = await window.tb.fs.promises.readdir(sourceDir);
				const sourceNames = new Set<string>();
				for (const entry of sourceEntries) {
					sourceNames.add(entry);
					const sourcePath = `${sourceDir}/${entry}`;
					const targetPath = `${targetDir}/${entry}`;
					const sourceStat = await window.tb.fs.promises.stat(sourcePath);
					if (!sourceStat) continue;
					if (sourceStat.isDirectory()) {
						if (await fileExists(targetPath)) {
							await window.tb.fs.promises.unlink(targetPath);
						}
						const child = await syncDirectoryDiff(sourcePath, targetPath);
						updated += child.updated;
						removed += child.removed;
						skipped += child.skipped;
						continue;
					}
					if (await dirExists(targetPath)) {
						await window.tb.sh.promises.rm(targetPath, { recursive: true });
						removed += 1;
					}
					const sourceRaw = await window.tb.fs.promises.readFile(sourcePath);
					const changed = await writeFileIfChanged(targetPath, toBytes(sourceRaw));
					if (changed) {
						updated += 1;
					} else {
						skipped += 1;
					}
				}
				const targetEntries = await window.tb.fs.promises.readdir(targetDir);
				for (const entry of targetEntries) {
					if (sourceNames.has(entry)) continue;
					const targetPath = `${targetDir}/${entry}`;
					await window.tb.sh.promises.rm(targetPath, { recursive: true });
					removed += 1;
				}
				return { updated, removed, skipped };
			};
			const migrateInstalledSystemEntries = async () => {
				if (!(await fileExists("/apps/installed.json"))) return;
				let installed: Array<any> = [];
				try {
					installed = JSON.parse(await window.tb.fs.promises.readFile("/apps/installed.json", "utf8"));
					if (!Array.isArray(installed)) installed = [];
				} catch {
					installed = [];
				}
				const canonicalConfigSet = new Set(canonicalSystemInstalledApps.map(entry => String(entry.config || "").toLowerCase()));
				const canonicalNameSet = new Set(canonicalSystemInstalledApps.map(entry => normalize(entry.name)));

				const preservedEntries = installed.filter(entry => {
					const config = String(entry?.config || "").toLowerCase();
					const name = normalize(entry?.name || "");
					const matchesCanonicalConfig = canonicalConfigSet.has(config);
					const matchesCanonicalName = canonicalNameSet.has(name);
					return !(matchesCanonicalConfig || matchesCanonicalName);
				});

				const merged = [...canonicalSystemInstalledApps, ...preservedEntries];
				const deduped: Array<any> = [];
				const seen = new Set<string>();
				for (const entry of merged) {
					const key = `${normalize(entry?.name || "")}|${String(entry?.config || "").toLowerCase()}`;
					if (!key || seen.has(key)) continue;
					seen.add(key);
					deduped.push(entry);
				}
				const before = JSON.stringify(installed);
				const after = JSON.stringify(deduped);
				if (before !== after) {
					await window.tb.fs.promises.writeFile("/apps/installed.json", JSON.stringify(deduped, null, 2), "utf8");
					console.log("Migrated installed.json system entries and preserved custom entries");
				}
			};
			const migrateBootEntries = async () => {
				if (!(await fileExists("/bootentries.json"))) return;
				let entries: any[] = [];
				try {
					const raw = await window.tb.fs.promises.readFile("/bootentries.json", "utf8");
					entries = JSON.parse(raw);
					if (!Array.isArray(entries)) entries = DEFAULT_BOOT_ENTRIES;
				} catch {
					entries = DEFAULT_BOOT_ENTRIES;
				}
				const { entries: normalizedEntries, changed } = upgradeLegacyBootEntries(entries);
				if (changed) {
					await window.tb.fs.promises.writeFile("/bootentries.json", JSON.stringify(normalizedEntries, null, 2), "utf8");
					console.log("Migrated bootentries.json to latest format.");
				}
			};
			const mergeFileIcons = async () => {
				const response = await fetch("/apps/files.tapp/icons.json");
				if (!response.ok) {
					console.warn("Failed to fetch host icons.json for merge");
					return;
				}
				const hostData = await response.json();
				const hostExtToName = hostData?.["ext-to-name"] ?? {};
				const hostNameToSvg = hostData?.["name-to-path"] ?? {};
				if (!(await dirExists("/system/etc/terbium/file-icons"))) {
					// @ts-expect-error recursive option is supported in runtime fs
					await window.tb.fs.promises.mkdir("/system/etc/terbium/file-icons", { recursive: true });
				}
				let localData: any = { "ext-to-name": {}, "name-to-path": {} };
				if (await fileExists("/system/etc/terbium/file-icons.json")) {
					try {
						localData = JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/file-icons.json", "utf8"));
					} catch {
						localData = { "ext-to-name": {}, "name-to-path": {} };
					}
				}
				const localExtToName = localData?.["ext-to-name"] ?? {};
				const localNameToPath = localData?.["name-to-path"] ?? {};
				const mergedExtToName = { ...hostExtToName, ...localExtToName };
				const mergedNameToPath: Record<string, string> = {};
				for (const [name, svg] of Object.entries(hostNameToSvg)) {
					const iconPath = `/system/etc/terbium/file-icons/${name}.svg`;
					mergedNameToPath[name] = iconPath;
					await writeFileIfChanged(iconPath, toBytes(String(svg)));
				}
				for (const [name, iconPath] of Object.entries(localNameToPath)) {
					if (!(name in mergedNameToPath)) {
						mergedNameToPath[name] = String(iconPath);
					}
				}
				const mergedData = {
					"ext-to-name": mergedExtToName,
					"name-to-path": mergedNameToPath,
				};
				const previousJson = JSON.stringify(localData);
				const nextJson = JSON.stringify(mergedData);
				if (previousJson !== nextJson) {
					await window.tb.fs.promises.writeFile("/system/etc/terbium/file-icons.json", JSON.stringify(mergedData, null, 2), "utf8");
				}
			};
			window.onbeforeunload = e => {
				e.preventDefault();
				e.returnValue = "Terbium is still updating";
			};
			let sysapps = ["about.tapp", "app store.tapp", "browser.tapp", "calculator.tapp", "feedback.tapp", "files.tapp", "media viewer.tapp", "settings.tapp", "task manager.tapp", "terminal.tapp", "text editor.tapp"];
			if (await dirExists("/system/tmp/terb-upd/")) {
				await window.tb.sh.promises.rm(`/system/tmp/terb-upd/`, { recursive: true });
			}
			statusref.current!.innerText = "Installing latest version of TB...";
			await window.tb.fs.promises.mkdir("/system/tmp/terb-upd/");
			setProgress(20);
			statusref.current!.innerText = "Preparing update state";
			if (await fileExists("/apps/system/settings.tapp/wisp-servers.json")) {
				await window.tb.fs.promises.writeFile("/system/tmp/terb-upd/wisp-servers.json", await window.tb.fs.promises.readFile("/apps/system/settings.tapp/wisp-servers.json"));
			} else {
				const stockDat = [
					{ id: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`, name: "Backend" },
					{ id: "wss://wisp.terbiumon.top/wisp/", name: "TB Wisp Instance" },
				];
				await window.tb.fs.promises.writeFile("/system/tmp/terb-upd/wisp-servers.json", JSON.stringify(stockDat));
			}
			setProgress(50);
			statusref.current!.innerText = "Scanning and patching changed system files...";
			let processedEntries = 0;
			let changedEntries = 0;
			let skippedEntries = 0;
			let removedEntries = 0;
			for (const item of paths) {
				processedEntries += 1;
				const itemText = item.toString();
				statusref.current!.innerText = `Checking ${itemText}...`;
				setProgress(20 + Math.floor((processedEntries / paths.length) * 55));
				const isDir = item.toString().endsWith("/");
				if (isDir) {
					try {
						// @ts-expect-error
						await window.tb.fs.promises.mkdir(`/apps/system/${itemText}`, { recursive: true });
					} catch (err) {
						console.error(err);
					}
				} else if (itemText.endsWith(".tapp.zip")) {
					const res = await fetch(`/apps/${itemText}`);
					if (!res.ok) {
						console.error(`Failed to fetch /apps/${itemText}: ${res.status} ${res.statusText}`);
						continue;
					}
					const data = await res.arrayBuffer();
					const tempZip = `/system/tmp/terb-upd/${itemText}`;
					const extractedDir = `/system/tmp/terb-upd/extracted/${itemText.slice(0, -4)}`;
					await ensureDirForPath(tempZip);
					if (await dirExists(extractedDir)) {
						await window.tb.sh.promises.rm(extractedDir, { recursive: true });
					}
					await window.tb.fs.promises.writeFile(tempZip, window.tb.buffer.from(data));
					await unzip(tempZip, extractedDir);
					const targetDir = `/apps/system/${itemText.slice(0, -4)}`;
					const result = await syncDirectoryDiff(extractedDir, targetDir);
					changedEntries += result.updated;
					removedEntries += result.removed;
					skippedEntries += result.skipped;
					await window.tb.fs.promises.unlink(tempZip).catch(() => {});
					await window.tb.sh.promises.rm(extractedDir, { recursive: true }).catch(() => {});
				} else {
					const path = `/apps/system/${itemText}`;
					const dir = path.substring(0, path.lastIndexOf("/"));
					try {
						if (!(await dirExists(dir))) {
							// @ts-expect-error
							await window.tb.fs.promises.mkdir(dir, { recursive: true });
						}
						const res = await fetch(`/apps/${itemText}`);
						if (!res.ok) {
							console.error(`Failed to fetch /apps/${itemText}: ${res.status} ${res.statusText}`);
							continue;
						}
						const data = await res.arrayBuffer();
						const changed = await writeFileIfChanged(path, window.tb.buffer.from(data));
						if (changed) {
							changedEntries += 1;
						} else {
							skippedEntries += 1;
						}
					} catch (err) {
						console.error(err);
					}
				}
			}
			statusref.current!.innerText = `System file scan complete (${changedEntries} updated, ${removedEntries} removed, ${skippedEntries} unchanged)`;
			await window.tb.fs.promises.writeFile("/apps/system/settings.tapp/wisp-servers.json", await window.tb.fs.promises.readFile("/system/tmp/terb-upd/wisp-servers.json"));
			await window.tb.fs.promises.writeFile("/system/etc/terbium/hash.cache", hash);
			await mergeFileIcons();
			const user = sessionStorage.getItem("currAcc") || JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8")).defaultUser;
			// v2.0-Beta2 update
			if (!(await fileExists("/apps/installed.json"))) {
				statusref.current!.innerText = "Installing Terbium v2.0-Beta2 prerequisites...";
				let insapps = [
					{
						name: "About",
						config: "/apps/system/about.tapp/index.json",
						user: "System",
					},
					{
						name: "App Store",
						config: "/apps/system/app store.tapp/index.json",
						user: "System",
					},
					{
						name: "Calculator",
						config: "/apps/system/calculator.tapp/index.json",
						user: "System",
					},
					{
						name: "Feedback",
						config: "/apps/system/feedback.tapp/index.json",
						user: "System",
					},
					{
						name: "Files",
						config: "/apps/system/files.tapp/index.json",
						user: "System",
					},
					{
						name: "Media Viewer",
						config: "/apps/system/media viewer.tapp/index.json",
						user: "System",
					},
					{
						name: "Settings",
						config: "/apps/system/settings.tapp/index.json",
						user: "System",
					},
					{
						name: "Task Manager",
						config: "/apps/system/task manager.tapp/index.json",
						user: "System",
					},
					{
						name: "Terminal",
						config: "/apps/system/terminal.tapp/index.json",
						user: "System",
					},
					{
						name: "Text Editor",
						config: "/apps/system/text editor.tapp/index.json",
						user: "System",
					},
					{
						name: "Anura File Manager",
						config: "/system/etc/anura/configs/Anura File Manager.json",
						user: "System",
					},
				];
				const startApps = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8")).system_apps;
				for (const app of startApps) {
					let appName = "";
					let appTitle = "";
					if (typeof app.title === "object" && app.title !== null && "text" in app.title) {
						appTitle = app.title.text;
					} else if (typeof app.title === "string") {
						appTitle = app.title;
					} else if (typeof app.name === "string") {
						appTitle = app.name;
					}
					appName = appTitle?.toLowerCase?.() || "";
					const isSysApp = sysapps.some(s => s.toLowerCase() === appName) || appName === "anura file manager" || appName === "browser";
					const alreadyInstalled = insapps.some(a => a.name?.toLowerCase?.() === appName || a.name?.toLowerCase?.() === appTitle?.toLowerCase?.());
					if (!isSysApp && !alreadyInstalled) {
						let configPath = "/apps/";
						if (app.name) {
							let appDir = `/apps/system/${app.name}/`;
							let configFile = "";
							if (await fileExists(`${appDir}.tbconfig`)) {
								configFile = `${appDir}.tbconfig`;
							} else {
								if (user) {
									appDir = `/apps/user/${user}/${app.name}/`;
								} else {
									appDir = `/apps/user/${JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8")).defaultUser}/${app.name}/`;
								}
								if (await fileExists(`${appDir}.tbconfig`)) {
									configFile = `${appDir}.tbconfig`;
								} else {
									configFile = `${appDir}index.json`;
								}
							}
							if (configFile) {
								configPath = configFile;
							}
						}
						insapps.push({
							name: appTitle,
							config: configPath,
							user: user || "System",
						});
					}
				}
				await window.tb.fs.promises.mkdir("/system/etc/anura/configs/");
				await window.tb.fs.promises.writeFile("/apps/installed.json", JSON.stringify(insapps));
				await window.tb.fs.promises.writeFile("/system/var/terbium/recent.json", JSON.stringify([]));
			}
			await migrateInstalledSystemEntries();
			await migrateBootEntries();
			// v2.1 update
			if (!(await fileExists(`/apps/user/${user}/app store/repos.json`))) {
				await window.tb.fs.promises.mkdir(`/apps/user/${user}/app store/`);
				await window.tb.fs.promises.writeFile(
					`/apps/user/${user}/app store/repos.json`,
					JSON.stringify([
						{
							name: "TB App Repo",
							url: "https://raw.githubusercontent.com/TerbiumOS/tb-repo/refs/heads/main/manifest.json",
						},
						{
							name: "XSTARS XTRAS",
							url: "https://raw.githubusercontent.com/Notplayingallday383/app-repo/refs/heads/main/manifest.json",
						},
						{
							name: "Anura App Repo",
							url: "https://raw.githubusercontent.com/MercuryWorkshop/anura-repo/refs/heads/master/manifest.json",
							icon: "https://anura.pro/icon.png",
						},
					]),
				);
			}
			if (!(await fileExists(`/apps/user/${user}/browser/favorites.json`))) {
				await window.tb.fs.promises.mkdir(`/apps/user/${user}/browser/`);
				await window.tb.fs.promises.writeFile(`/apps/user/${user}/browser/favorites.json`, JSON.stringify([]));
				await window.tb.fs.promises.writeFile(`/apps/user/${user}/browser/userscripts.json`, JSON.stringify([]));
			}
			// v2.2 Update
			for (const user of await window.tb.fs.promises.readdir("/home/")) {
				const usrSettings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/settings.json`, "utf8"));
				if (!usrSettings.window) {
					usrSettings.window = {
						winAccent: "#ffffff",
						blurlevel: 18,
						alwaysMaximized: false,
						alwaysFullscreen: false,
					};
					usrSettings.showFPS = false;
					await window.tb.fs.promises.writeFile(`/home/${user}/settings.json`, JSON.stringify(usrSettings, null, 4));
				}
				// hotfix for v2.2.1 & migration from v2.0.0-beta.x to v2.1.x
				if (await fileExists(`/home/${user}/desktop/browser.lnk`)) {
					await window.tb.fs.promises.writeFile(`/home/${user}/desktop/browser.lnk`, "symlink:/apps/system/browser.tapp/index.json:file");
					const desktopItems = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
					const hasBrowserShortcut = desktopItems.some((item: any) => item.name?.toLowerCase?.() === "browser" || item.item === `/home/${user}/desktop/browser.lnk`);
					if (!hasBrowserShortcut) {
						desktopItems.push({
							name: "Browser",
							item: `/home/${user}/desktop/browser.lnk`,
							position: {
								custom: false,
								top: desktopItems.length,
								left: 0,
							},
						});
						await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopItems, null, 4));
					}
				}
			}
			if (!(await fileExists("/system/etc/terbium/taccs.json"))) {
				await window.tb.fs.promises.writeFile("/system/etc/terbium/taccs.json", JSON.stringify({}));
			}
			if (!(await fileExists("/system/var/terbium/startup.json"))) {
				const users = await window.tb.fs.promises.readdir("/home/");
				const startupObj = {
					System: {},
					...Object.fromEntries(users.map(user => [user, {}])),
				};
				await window.tb.fs.promises.writeFile("/system/var/terbium/startup.json", JSON.stringify(startupObj), "utf8");
			}
			// v2.3 update
			const dockConfig = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/dock.json", "utf8"));
			const startConfig = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
			try {
				let changed = false;
				const termHtml = `<div class="term-tab-container">\n<style>.term-tabs{display:flex;align-items:center;gap:6px;width:100%;height:100%;}.term-tab-list{display:flex;gap:6px;align-items:center;overflow:hidden;white-space:nowrap}.term-tab{display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border-radius:8px;background:transparent;color:#fff;font-weight:700;cursor:pointer;user-select:none;border:1px solid transparent}.term-tab.active{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.08)}.term-tab .close{opacity:0.6;font-weight:600;margin-left:8px}.term-tab-controls{display:flex;gap:6px;align-items:center}.term-add{background:#ffffff0f;color:#fff;border-radius:6px;padding:2px 6px;border:none;font-weight:700;cursor:pointer}</style>\n<div class="term-tabs">\n<div class="term-tab-list" aria-hidden="false"></div>\n<div class="term-tab-controls">\n<button class="term-add" title="New tab">+</button>\n</div>\n</div>\n</div>`;
				function upgradeEntry(entry: any): boolean {
					if (!entry || typeof entry !== "object") return false;
					let updated = false;
					if (typeof entry.title === "string" && entry.title.toLowerCase() === "terminal") {
						entry.title = { text: "Terminal", html: termHtml };
						updated = true;
					}
					if (entry.title && typeof entry.title === "object" && entry.title.text && entry.title.text.toLowerCase() === "terminal" && !entry.title.html) {
						entry.title.html = termHtml;
						updated = true;
					}
					if (entry.src && typeof entry.src === "string" && entry.src.includes("terminal.tapp")) {
						if (typeof entry.title === "string") {
							entry.title = { text: "Terminal", html: termHtml };
							updated = true;
						} else if (entry.title && typeof entry.title === "object" && !entry.title.html) {
							entry.title.html = termHtml;
							updated = true;
						}
					}
					if (entry.size && typeof entry.size === "object" && entry.size.height === 400) {
						entry.size.height = 415;
						updated = true;
					}
					return updated;
				}
				if (Array.isArray(dockConfig)) {
					dockConfig.forEach((e: any) => {
						if (upgradeEntry(e)) changed = true;
					});
				} else if (dockConfig && typeof dockConfig === "object") {
					if (Array.isArray(dockConfig.pinned_apps)) {
						dockConfig.pinned_apps.forEach((e: any) => {
							if (upgradeEntry(e)) changed = true;
						});
					}
					if (Array.isArray(dockConfig.apps)) {
						dockConfig.apps.forEach((e: any) => {
							if (upgradeEntry(e)) changed = true;
						});
					}
					if (Array.isArray(dockConfig.items)) {
						dockConfig.items.forEach((e: any) => {
							if (upgradeEntry(e)) changed = true;
						});
					}
				}
				if (startConfig && Array.isArray(startConfig.system_apps)) {
					startConfig.system_apps.forEach((app: any) => {
						if (upgradeEntry(app)) changed = true;
					});
				}
				if (changed) {
					await window.tb.fs.promises.writeFile("/system/var/terbium/dock.json", JSON.stringify(dockConfig, null, 4), "utf8");
					await window.tb.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(startConfig, null, 4), "utf8");
					console.log("Migrated terminal entries in dock.json/start.json to new metadata");
				}
			} catch (err) {
				console.warn("Failed to migrate dock/start config:", err);
			}

			setProgress(80);
			statusref.current!.innerText = "Cleaning up...";
			setProgress(95);
			await window.tb.sh.promises.rm(`/system/tmp/terb-upd/`, { recursive: true });
			window.onbeforeunload = null;
			sessionStorage.setItem("justUpdated", "true");
			setProgress(100);
			statusref.current!.innerText = "Restarting...";
			window.location.reload();
		};
		const migrateFs = async () => {
			async function copyRecursive(src: string, dest: string) {
				const entries = await Filer.fs.promises.readdir(src);
				for (const entry of entries) {
					const srcPath = src.endsWith("/") ? src + entry : src + "/" + entry;
					const destPath = dest.endsWith("/") ? dest + entry : dest + "/" + entry;
					const stat = await Filer.fs.promises.stat(srcPath);
					if (!stat) continue;
					if (stat.isDirectory()) {
						if (!(await dirExists(destPath))) {
							await window.tb.fs.promises.mkdir(destPath);
						}
						await copyRecursive(srcPath, destPath);
					} else {
						const fileBuffer = await Filer.fs.promises.readFile(srcPath);
						await window.tb.fs.promises.writeFile(destPath, fileBuffer);
					}
					statusref.current!.innerText = `Copying: ${srcPath}`;
				}
			}
			await copyRecursive("/", "/");
			setProgress(85);
			statusref.current!.innerText = "Recreating Desktop Shortcuts...";
			for (const user of await window.tb.fs.promises.readdir("/home/")) {
				const items = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
				for (const item of items) {
					const target = await Filer.fs.promises.readlink(item.item);
					await window.tb.fs.promises.symlink(target, item.item);
					statusref.current!.innerText = `Creating shortcut: ${item.name}.lnk...`;
				}
			}
			setProgress(93);
			statusref.current!.innerText = "Formatting Filer...";
			const fsh = new Filer.fs.Shell();
			for (const loc of await Filer.fs.promises.readdir("//")) {
				await fsh.promises.rm(`/${loc}`, { recursive: true });
			}
			setProgress(99);
			statusref.current!.innerText = "Migration complete!";
			sessionStorage.removeItem("migrateFs");
			statusref.current!.innerText = "Updating System Files...";
			main();
		};
		const run = async () => {
			if (!sessionStorage.getItem("migrateFs")) {
				const existsOPFS = await dirExists("/system/etc/terbium/");
				const existsFiler = await Filer.fs.promises
					.stat("/system/etc/terbium/")
					.then(() => true)
					.catch(() => false);
				if (!existsOPFS && existsFiler) {
					sessionStorage.setItem("migrateFs", "true");
				}
			}
			if (sessionStorage.getItem("migrateFs")) {
				await migrateFs();
			} else {
				await main();
			}
		};
		run();
	}, []);

	return (
		<div className="bg-[#0e0e0e] h-full justify-center items-center flex flex-col lg:h-full md:h-full">
			<img src="/tb.svg" alt="Terbium" className="w-[25%] h-[25%]" />
			<div className="duration-150 flex flex-col justify-center items-center">
				<div className="text-container relative flex flex-col justify-center items-end">
					<div className="bg-linear-to-b from-[#ffffff] to-[#ffffff77] text-transparent bg-clip-text flex flex-col lg:items-center md:items-center sm:items-center">
						<span className="font-bold lg:text-[34px] md:text-[28px] sm:text-[22px] text-right duration-150">
							<span className="font-[1000] duration-150">Terbium is updating</span>
						</span>
						<br />
						<p>Please DO NOT close this tab</p>
					</div>
				</div>
			</div>
			<p ref={statusref} className="mt-1">
				Downloading Updates...
			</p>
			<div className="relative flex w-[30%] h-3 rounded-full bg-[#00000020] overflow-hidden mt-4">
				<div className="absolute h-full bg-[#50bf66] rounded-full" style={{ width: `${progress}%` }}></div>
			</div>
		</div>
	);
}

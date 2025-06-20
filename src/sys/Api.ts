import { setDialogFn } from "./apis/Dialogs";
import { setNotifFn } from "./apis/Notifications";
import { Anura } from "./liquor/Anura";
import { AliceWM } from "./liquor/AliceWM";
import { LocalFS } from "./liquor/api/LocalFS";
import { ExternalApp } from "./liquor/coreapps/ExternalApp";
import { ExternalLib } from "./liquor/libs/ExternalLib";
import { registry } from "./apis/Registry";
import { type MediaProps, type cmprops, type dialogProps, type launcherProps, type NotificationProps, type COM, type User, type WindowConfig, fileExists, dirExists, UserSettings, SysSettings } from "./types";
import { System } from "./apis/System";
import { setMusicFn, setVideoFn, isExistingFn, hideFn } from "./apis/Mediaisland";
import { XOR } from "./apis/Xor";
import { libcurl } from "libcurl.js/bundled";
import { BareMuxConnection } from "@mercuryworkshop/bare-mux";
import pwd from "./apis/Crypto";
import * as fflate from "fflate";
import parse from "./Parser";
import { AppIslandProps, clearControls, clearInfo, updateControls } from "./gui/AppIsland";
import { createWindow } from "./gui/WindowArea";
import { TDockItem } from "./gui/Dock";
import { useWindowStore } from "./Store";
import { AnuraBareClient } from "./liquor/bcc";
import apps from "../apps.json";
import { hash } from "../hash.json";
import { Lemonade } from "./lemonade";
import { initializeWebContainer } from "./Node/runtimes/Webcontainers/nodeProc";
const system = new System();
const Filer = window.Filer;
const pw = new pwd();
declare const tb: COM;
declare global {
	interface Window {
		tb: COM;
		Filer: FilerType;
		ScramjetController: any;
	}
}

export default async function Api() {
	window.tb = {
		registry: registry,
		sh: new Filer.fs.Shell(),
		battery: {
			async showPercentage() {
				let settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
				settings["battery-percent"] = true;
				await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings));
				window.dispatchEvent(new CustomEvent("controlBatteryPercentVisibility", { detail: true }));
				return "Success";
			},
			async hidePercentage() {
				let settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
				settings["battery-percent"] = false;
				await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings));
				window.dispatchEvent(new CustomEvent("controlBatteryPercentVisibility", { detail: false }));
				return "Success";
			},
			async canUse() {
				if ("BatteryManager" in window) {
					const battery = await navigator.getBattery();
					return battery ? true : false;
				}
				return false;
			},
		},
		launcher: {
			async addApp(props: launcherProps) {
				const apps: any = JSON.parse(await Filer.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
				if (!props.name) throw new Error("Name is required");
				if (!props.icon) throw new Error("Icon is required");
				if (apps.system_apps.some((app: any) => app.title === props.name)) {
					throw new Error("App with the same name already exists");
				}
				apps.system_apps.push(props);
				await Filer.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
				window.dispatchEvent(new Event("updApps"));
				return true;
			},
			async removeApp(name: string) {
				if (!name) throw new Error("Name is required");
				const data: any = JSON.parse(await Filer.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
				const apps = data.system_apps;
				const realName = String(name)
					.replace(/[^a-zA-Z0-9]/g, "")
					.toLowerCase();
				const appIndex = apps.findIndex((app: any) => {
					const n = app.name ? app.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";
					return n === realName;
				});
				if (appIndex !== -1) {
					apps.splice(appIndex, 1);
				} else {
					throw new Error(`App with name '${name}' not found`);
				}
				await Filer.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(data, null, 2));
				window.dispatchEvent(new Event("updApps"));
				return true;
			},
		},
		theme: {
			async get() {
				return JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["theme"];
			},
			async set(data: string) {
				return new Promise(async resolve => {
					const settings: SysSettings = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"));
					settings["theme"] = data;
					await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(settings), "utf8");
					resolve(true);
				});
			},
		},
		desktop: {
			preferences: {
				async setTheme(color: string) {
					color.toString().includes('"') ? (color = color.replace(/"/g, "")) : (color = color);
					document.body.setAttribute("theme", color);
					const settings: SysSettings = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"));
					settings["theme"] = color;
					await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(settings), "utf8");
				},
				async theme() {
					const settings: SysSettings = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"));
					return settings["theme"];
				},
				async setAccent(color: string) {
					const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
					settings["accent"] = color;
					await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings), "utf8");
				},
				async getAccent() {
					return JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"))["accent"];
				},
			},
			wallpaper: {
				async set(path: string) {
					const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
					settings["wallpaper"] = path;
					await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings));
					window.dispatchEvent(new Event("updWallpaper"));
				},
				async contain() {
					const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
					settings["wallpaperMode"] = "contain";
					await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings), "utf8");
					window.dispatchEvent(new Event("updWallpaper"));
				},
				async stretch() {
					const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
					settings["wallpaperMode"] = "stretch";
					await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings), "utf8");
					window.dispatchEvent(new Event("updWallpaper"));
				},
				async cover() {
					const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
					settings["wallpaperMode"] = "cover";
					await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings), "utf8");
					window.dispatchEvent(new Event("updWallpaper"));
				},
				async fillMode() {
					return new Promise(async resolve => {
						resolve(JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"))["wallpaperMode"]);
					});
				},
			},
			dock: {
				async pin(app: any) {
					let apps: Array<TDockItem> = JSON.parse(await Filer.fs.promises.readFile("/system/var/terbium/dock.json"));
					apps.push(app);
					await Filer.fs.promises.writeFile("/system/var/terbium/dock.json", JSON.stringify(apps));
					window.dispatchEvent(new Event("updPins"));
					return "Success";
				},
				async unpin(app: string) {
					let apps: Array<TDockItem> = JSON.parse(await Filer.fs.promises.readFile("/system/var/terbium/dock.json"));
					const appExists = apps.some(appIndex => appIndex.title === app);
					if (!appExists) {
						throw new Error(`App with title "${app}" not found in the dock.`);
					}
					apps = apps.filter(appIndex => appIndex.title !== app);
					apps.filter(appIndex => appIndex.title !== app);
					await Filer.fs.promises.writeFile("/system/var/terbium/dock.json", JSON.stringify(apps));
					window.dispatchEvent(new Event("updPins"));
					return "Success";
				},
			},
		},
		window: {
			getId() {
				return useWindowStore.getState().currentPID;
			},
			create(props: any) {
				createWindow(props);
			},
			content: {
				get() {
					return new Promise(resolve => {
						const getContent = (e: CustomEvent) => {
							window.removeEventListener("curr-win-content", getContent as EventListener);
							resolve(e.detail);
						};
						window.addEventListener("curr-win-content", getContent as EventListener);
						window.dispatchEvent(new CustomEvent("get-content", { detail: useWindowStore.getState().currentPID }));
					});
				},
				set(html: string | HTMLElement) {
					const msg = {
						currWin: useWindowStore.getState().currentPID,
						content: html,
					};
					window.dispatchEvent(new CustomEvent("upd-wincont", { detail: JSON.stringify(msg) }));
				},
			},
			titlebar: {
				setColor(hex: string) {
					const msg = {
						currWin: useWindowStore.getState().currentPID,
						color: hex,
					};
					window.dispatchEvent(new CustomEvent("upd-winbarcol", { detail: JSON.stringify(msg) }));
				},
				setText(text: string) {
					const msg = {
						currWin: useWindowStore.getState().currentPID,
						txt: text,
					};
					window.dispatchEvent(new CustomEvent("upd-winbartxt", { detail: JSON.stringify(msg) }));
				},
				setBackgroundColor(hex: string) {
					const msg = {
						currWin: useWindowStore.getState().currentPID,
						color: hex,
					};
					window.dispatchEvent(new CustomEvent("upd-winbarbg", { detail: JSON.stringify(msg) }));
				},
			},
			island: {
				addControl(args: AppIslandProps) {
					if (!args.text) throw new Error("text is required");
					if (!args.click) throw new Error("click function is required");
					if (!args.appname) throw new Error("appname is required");
					if (!args.id) throw new Error("control_id is required");
					updateControls({
						text: args.text,
						appname: args.appname,
						id: args.id,
						click: () => {
							if (args.click) {
								args.click();
							}
						},
					});
				},
				removeControl(control_id: string) {
					if (!control_id) throw new Error("control_id is required");
					clearControls(control_id);
				},
			},
			changeSrc(src: string) {
				const currWin = useWindowStore.getState().currentPID;
				window.dispatchEvent(new CustomEvent("upd-src", { detail: JSON.stringify({ pid: currWin, url: src }) }));
			},
			reload() {
				const currWin = useWindowStore.getState().currentPID;
				window.dispatchEvent(new CustomEvent("reload-win", { detail: currWin }));
			},
			minimize() {
				const currWin = useWindowStore.getState().currentPID;
				window.dispatchEvent(new CustomEvent("min-win", { detail: currWin }));
			},
			maximize() {
				const currWin = useWindowStore.getState().currentPID;
				window.dispatchEvent(new CustomEvent("max-win", { detail: currWin }));
			},
			close() {
				const currWin = useWindowStore.getState().currentPID;
				clearInfo();
				useWindowStore.getState().killWindow(currWin);
			},
		},
		contextmenu: {
			create(props: cmprops) {
				window.dispatchEvent(
					new CustomEvent("ctxm", {
						detail: {
							props: {
								titlebar: props.titlebar || false,
								x: props.x,
								y: props.y,
								options: props.options,
							},
						},
					}),
				);
			},
			close() {
				window.dispatchEvent(new Event("close-ctxm"));
			},
		},
		user: {
			async username() {
				try {
					const username = JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"))["username"];
					return username || "Guest";
				} catch (error) {
					console.error("Error Fetching username:", error);
					return "Guest";
				}
			},
			async pfp() {
				try {
					return JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"))["pfp"] || "/assets/img/defualt - blue.png";
				} catch (error) {
					console.error("Error Fetching pfp:", error);
					return "/assets/img/defualt - blue.png";
				}
			},
		},
		proxy: {
			async get() {
				const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
				return settings["proxy"];
			},
			async set(proxy: "Ultraviolet" | "Scramjet") {
				const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
				settings["proxy"] = proxy;
				await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings, null, 2), "utf8");
				window.tb.proxy.updateSWs();
				return true;
			},
			async updateSWs() {
				await navigator.serviceWorker.getRegistrations().then(registrations => {
					registrations.forEach(registration => {
						registration.unregister().catch(error => {
							console.error("Error unregistering service worker:", error);
						});
					});
				});
				const request = indexedDB.open("$scramjet");
				request.onsuccess = () => {
					const db = request.result;
					if (db.objectStoreNames.length === 0) {
						db.close();
						const deleteRequest = indexedDB.deleteDatabase("$scramjet");
						deleteRequest.onsuccess = () => {
							console.log(`Cleared SJ DB`);
						};
						deleteRequest.onerror = err => {
							console.error(err);
						};
					} else {
						console.log(`Scramjet is fine`);
					}
				};
				request.onerror = err => {
					console.error(err);
				};
				const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`));
				const updateTransport = async () => {
					const wispserver = settings.wispServer || `${window.location.origin.replace(/^https?:\/\//, "ws://")}/wisp/`;
					const connection = new BareMuxConnection("/baremux/worker.js");
					if (settings.transport === "Default (Epoxy)") {
						await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispserver }]);
					} else if (settings.transport === "Anura BCC") {
						// @ts-expect-error
						await connection.setRemoteTransport(new AnuraBareClient(), "AnuraBareClient");
					} else {
						await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispserver }]);
					}
				};
				const scramjet = new window.ScramjetController({
					prefix: "/service/",
					files: {
						wasm: "/scramjet/scramjet.wasm.wasm",
						worker: "/scramjet/scramjet.worker.js",
						client: "/scramjet/scramjet.client.js",
						shared: "/scramjet/scramjet.shared.js",
						sync: "/scramjet/scramjet.sync.js",
					},
					defaultFlags: {
						rewriterLogs: false,
					},
					codec: {
						encode: `
                            if (!url) return Promise.resolve(url);
                            let result = "";
	                        let len = url.length;
	                            for (let i = 0; i < len; i++) {
	                                const char = url[i];
	                                result += i % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char;
                                }
	                        return encodeURIComponent(result);
                        `,
						decode: `
                            if (!url) return Promise.resolve(url);
	                        url = decodeURIComponent(url);
	                        let result = "";
	                        let len = url.length;
	                        for (let i = 0; i < len; i++) {
	                            const char = url[i];
	                            result += i % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char;
	                        }
		                    return result;
                        `,
					},
				});
				scramjet.init();
				navigator.serviceWorker
					.register("anura-sw.js", {
						scope: "/",
					})
					.then(() => {
						updateTransport();
					});
				navigator.serviceWorker.ready.then(async () => {
					await updateTransport();
				});
				if (settings.wispServer === null) {
					// @ts-ignore
					window.tb.libcurl.set_websocket(`${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`);
				} else {
					window.tb.libcurl.set_websocket(settings.wispServer);
				}
			},
			async encode(url: string, encoder: string) {
				if (encoder === "xor" || encoder === "XOR") {
					const enc = await XOR.encode(url);
					return enc;
				} else {
					throw new Error("Encoder not found");
				}
				// Stubbed for future addition of say AES
			},
			async decode(url: string, decoder: string) {
				if (decoder === "xor" || decoder === "XOR") {
					const dec = await XOR.decode(url);
					return dec;
				} else {
					throw new Error("Encoder not found");
				}
				// Stubbed for future addition of say AES
			},
		},
		notification: {
			Message(props: NotificationProps) {
				setNotifFn("message", props);
			},
			Toast(props: NotificationProps) {
				setNotifFn("toast", props);
			},
			Installing(props: NotificationProps) {
				setNotifFn("installing", props);
			},
		},
		dialog: {
			Alert(props: dialogProps) {
				setDialogFn("alert", props);
			},
			Message(props: dialogProps) {
				setDialogFn("message", props);
			},
			Select(props: dialogProps) {
				setDialogFn("select", props);
			},
			Auth(props: dialogProps, options: { sudo: boolean }) {
				setDialogFn("auth", props, options);
			},
			Permissions(props: dialogProps) {
				setDialogFn("permissions", props);
			},
			FileBrowser(props: dialogProps) {
				setDialogFn("filebrowser", props);
			},
			DirectoryBrowser(props: dialogProps) {
				setDialogFn("directorybrowser", props);
			},
			SaveFile(props: dialogProps) {
				setDialogFn("savefile", props);
			},
			Cropper(props: dialogProps) {
				setDialogFn("cropper", props);
			},
			WebAuth(props: dialogProps) {
				setDialogFn("webauth", props);
			},
		},
		system: {
			version: () => {
				return system.version("string");
			},
			openApp: async (pkg: string) => {
				const exists = JSON.parse(await Filer.fs.promises.readFile("//apps/web_apps.json", "utf8")).apps.includes(pkg) && fileExists("//apps/web_apps.json");
				if (exists) {
					window.tb.window.create(JSON.parse(await Filer.fs.promises.readFile(`//apps/user/${await window.tb.user.username()}/${pkg}/index.json`, "utf8")).wmArgs);
				} else {
					if (await dirExists(`/apps/system/${pkg}/`)) {
						window.tb.window.create(JSON.parse(await Filer.fs.promises.readFile(`/apps/system/${pkg}/.tbconfig`, "utf8")).wmArgs);
					} else if (await dirExists(`/apps/user/${await window.tb.user.username()}/${pkg}/`)) {
						window.tb.window.create(JSON.parse(await Filer.fs.promises.readFile(`/apps/user/${await window.tb.user.username()}/${pkg}/.tbconfig`, "utf8")).wmArgs);
					} else throw new Error("Application not found");
				}
			},
			download: async (url: string, location: string) => {
				try {
					const response: Response = await window.parent.tb.libcurl.fetch(url);
					if (!response.ok) {
						throw new Error(`Failed to download the file. Status: ${response.status}`);
					}
					const content = await response.arrayBuffer();
					await Filer.fs.promises.writeFile(location, Filer.Buffer.from(content));
					console.log(`File saved successfully at: ${location}`);
				} catch (error) {
					console.error(error);
				}
			},
			exportfs: async () => {
				let zip: { [key: string]: Uint8Array } = {};
				async function addzip(inp: string, basePath = "") {
					const files = await Filer.fs.promises.readdir(inp);
					for (const file of files) {
						const fullPath = `${inp}/${file}`;
						const stats = await Filer.fs.promises.stat(fullPath);
						const zipPath = `${basePath}${file}`;
						if (stats.isDirectory()) {
							await addzip(fullPath, `${zipPath}/`);
						} else {
							const fileData = await Filer.fs.promises.readFile(fullPath);
							zip[zipPath] = new Uint8Array(fileData);
						}
					}
				}
				await addzip("//");
				const link = document.createElement("a");
				const zipBlob = new Blob([window.parent.tb.fflate.zipSync(zip)], { type: "application/zip" });
				link.href = URL.createObjectURL(zipBlob);
				link.download = "tbfs.backup.zip";
				link.click();
			},
			users: {
				async list() {},
				async add(user: User) {
					const { username, password, pfp, perm, securityQuestion } = user;
					const userDir = `/home/${username}`;
					await Filer.fs.promises.mkdir(userDir);
					const userJson: User = {
						id: username,
						username: username,
						password: password,
						pfp: pfp,
						perm: perm,
					};
					if (securityQuestion) {
						userJson.securityQuestion = {
							question: securityQuestion.question,
							answer: securityQuestion.answer,
						};
					}
					await Filer.fs.promises.writeFile(`${userDir}/user.json`, JSON.stringify(userJson));
					let userSettings = {
						wallpaper: "/assets/wallpapers/1.png",
						wallpaperMode: "cover",
						animations: true,
						proxy: "Ultraviolet",
						transport: "Default (Epoxy)",
						wispServer: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`,
						"battery-percent": false,
						accent: "#32ae62",
						times: {
							format: "12h",
							internet: false,
							showSeconds: false,
						},
					};
					await Filer.fs.promises.writeFile(`${userDir}/settings.json`, JSON.stringify(userSettings));
					const defaultDirs = ["desktop", "documents", "downloads", "music", "pictures", "videos"];
					defaultDirs.forEach(async dir => {
						await Filer.fs.promises.mkdir(`${userDir}/${dir}`);
					});
					await Filer.fs.promises.mkdir(`/apps/user/${username}`);
					await Filer.fs.promises.mkdir(`/apps/user/${username}/files`);
					await Filer.fs.promises.writeFile(
						`/apps/user/${username}/files/config.json`,
						JSON.stringify({
							"quick-center": true,
							"sidebar-width": 180,
							drives: {
								"File System": `/home/${username}/`,
							},
							storage: {
								"File System": "storage-device",
								localStorage: "storage-device",
							},
							"open-collapsibles": {
								"quick-center": true,
								drives: true,
							},
						}),
						"utf8",
					);
					await Filer.fs.promises.writeFile(`/apps/user/${username}/files/davs.json`, JSON.stringify([]));
					const response = await fetch("/apps/files.tapp/icons.json");
					const dat = await response.json();
					await Filer.fs.promises.writeFile(`/apps/user/${username}/files/icns.json`, JSON.stringify(dat));
					await Filer.fs.promises.writeFile(
						`/apps/user/${username}/files/quick-center.json`,
						JSON.stringify({
							paths: {
								Documents: `/home/${username}/documents`,
								Images: `/home/${username}/images`,
								Videos: `/home/${username}/videos`,
								Music: `/home/${username}/music`,
								Trash: `/system/trash`,
							},
						}),
						"utf8",
					);
					let items: any[] = [];
					let r2 = [];
					for (let i = 0; i < apps.length; i++) {
						const app = apps[i];
						const name = app.name.toLowerCase();
						var topPos: number = 0;
						var leftPos: number = 0;
						if (i % 12 === 0) {
							topPos = 0;
						} else {
							topPos = i % 12;
						}
						if (i < 12) {
							leftPos = 0;
						} else {
							leftPos = 1;
						}
						if (topPos * 66 > window.innerHeight - 130) {
							leftPos = 1.15;
							if (r2.length === 0) {
								topPos = 0;
							} else {
								topPos = r2.length % 12;
							}
							r2.push({
								name: app.name,
							});
						}
						items.push({
							name: app.name,
							item: `/home/${username}/desktop/${name}.lnk`,
							position: {
								custom: false,
								top: topPos,
								left: leftPos,
							},
						});
						await Filer.fs.promises.symlink(`/apps/system/${name}.tapp/index.json`, `/home/${username}/desktop/${name}.lnk`);
					}
					await Filer.fs.promises.writeFile(`/home/${username}/desktop/.desktop.json`, JSON.stringify(items));
					return true;
				},
				async remove(id: string) {
					const userDir = `/home/${id}`;
					try {
						const uDir = await Filer.fs.promises.stat(userDir);
						if (uDir.type === "DIRECTORY") {
							// @ts-expect-error
							await new Filer.fs.Shell().promises.rm(userDir, { recursive: true });
						}
					} catch (err: any) {
						throw new Error(err.message);
					}
					try {
						const appDir = await Filer.fs.promises.stat(`/apps/user/${id}`);
						if (appDir.type === "DIRECTORY") {
							// @ts-expect-error
							await new Filer.fs.Shell().promises.rm(`/apps/user/${id}`, { recursive: true });
						}
					} catch (err: any) {
						throw new Error(err.message);
					}
					const sudoUsers: string[] = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/sudousers.json", "utf8"));
					const users = await Filer.fs.promises.readdir("/home/");
					const idx = sudoUsers.indexOf(id);
					if (idx !== -1) {
						sudoUsers.splice(idx, 1);
						await Filer.fs.promises.writeFile("/system/etc/terbium/sudousers.json", JSON.stringify(sudoUsers, null, 2), "utf8");
						if (sudoUsers.length === 0) {
							window.tb.dialog.Select({
								title: "Select new sudo user",
								message: "Please select a new sudo user",
								options: users.map(u => ({ text: u, value: u })),
								onOk: async (selected: string) => {
									await Filer.fs.promises.writeFile("/system/etc/terbium/sudousers.json", JSON.stringify({ id: selected }), "utf8");
									window.tb.notification.Toast({
										application: "System",
										iconSrc: "/fs/apps/system/about.tapp/icon.svg",
										message: `Sudo user changed to ${selected}`,
									});
									const syssettings: SysSettings = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"));
									if (id === syssettings.defaultUser) {
										syssettings.defaultUser = selected;
										await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(syssettings, null, 2), "utf8");
									}
									if (id === sessionStorage.getItem("currAcc")) {
										sessionStorage.setItem("logged-in", "false");
										sessionStorage.removeItem("currAcc");
										window.location.reload();
									}
								},
							});
						}
					}
					return true;
				},
				async update(user: User) {
					const { username, password, pfp, perm, securityQuestion } = user;
					const userDir = `/home/${username}`;
					const userConfig = JSON.parse(await Filer.fs.promises.readFile(`${userDir}/user.json`, "utf8"));
					await Filer.fs.promises.writeFile(
						`${userDir}/user.json`,
						JSON.stringify({
							id: userConfig.id,
							username: username === userConfig.username ? userConfig.username : username,
							password: password === userConfig.password ? userConfig.password : password,
							pfp: pfp === userConfig.pfp ? userConfig.pfp : pfp,
							perm: perm === userConfig.perm ? userConfig.perm : perm,
							...(securityQuestion !== undefined ? { securityQuestion: securityQuestion === userConfig.securityQuestion ? userConfig.securityQuestion : securityQuestion } : userConfig.securityQuestion !== undefined ? { securityQuestion: userConfig.securityQuestion } : {}),
						}),
					);
				},
			},
			bootmenu: {
				async addEntry(name: string, file: string) {
					const data = JSON.parse(await Filer.fs.promises.readFile("/bootentries.json", "utf8"));
					data.push({
						name: name,
						action: `() => { sessionStorage.setItem("cusboot", "true"); sessionStorage.setItem("bootfile", "${file}"); window.location.reload(); }`,
					});
					await Filer.fs.promises.writeFile("/bootentries.json", JSON.stringify(data, null, 2));
				},
				async removeEntry(name: string) {
					const data = JSON.parse(await Filer.fs.promises.readFile("/bootentries.json", "utf8"));
					const dat = data.filter((entry: any) => entry.name !== name);
					await Filer.fs.promises.writeFile("/bootentries.json", JSON.stringify(dat, null, 2));
				},
			},
		},
		libcurl: libcurl,
		fflate: fflate,
		fs: Filer,
		node: {
			webContainer: {},
			servers: new Map<number, string>(),
			isReady: false,
		},
		crypto: async (pass: string, file?: string) => {
			const newpw = pw.harden(pass);
			if (file) {
				await Filer.fs.promises.writeFile(file, newpw);
				return "Complete";
			} else {
				return newpw;
			}
		},
		platform: {
			async getPlatform() {
				const mobileuas =
					/(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|samsungbrowser.*mobile|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|playbook|silk|iPhone|iPad/i;
				const crosua = /CrOS/;
				if (mobileuas.test(navigator.userAgent) && !crosua.test(navigator.userAgent)) {
					return "mobile";
				} else if (!mobileuas.test(navigator.userAgent) && navigator.maxTouchPoints > 1 && navigator.userAgent.indexOf("Macintosh") !== -1 && navigator.userAgent.indexOf("Safari") !== -1) {
					return "mobile";
				} else {
					return "desktop";
				}
			},
		},
		process: {
			kill(config: string | number) {
				clearInfo();
				if (typeof config === "number") {
					useWindowStore.getState().killWindow(String(config));
				} else {
					useWindowStore.getState().killWindow(config);
				}
			},
			list() {
				let list = {};
				const wins = useWindowStore.getState().windows;
				wins.forEach((win: WindowConfig, index: number) => {
					const winID = win.pid || `win-${index}`;
					// @ts-expect-error
					list[winID] = {
						name: win.title,
						wid: win.wid,
						icon: win.icon,
						pid: win.pid,
					};
				});
				return list;
			},
			parse: {
				build(src: string) {
					parse.build(src);
				},
			},
			create() {
				createWindow({
					title: {
						text: "Generic Window",
					},
					src: "about:blank",
				});
			},
		},
		screen: {
			async captureScreen() {
				if (!navigator.mediaDevices.getDisplayMedia) throw new Error("API Not Avalible on your browser");
				// @ts-expect-error
				const stream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true });
				const capture = new ImageCapture(stream.getVideoTracks()[0]);
				// @ts-expect-error
				const frame = await capture.grabFrame();
				stream.getVideoTracks()[0].stop();
				const canvas: HTMLCanvasElement = document.createElement("canvas");
				const ctx: any = canvas.getContext("2d");
				canvas.width = frame.width;
				canvas.height = frame.height;
				ctx.drawImage(frame, 0, 0, frame.width, frame.height);
				const dataURI = await new Promise(res => {
					canvas.toBlob(blobImage => {
						res(blobImage);
					});
				});
				canvas.remove();
				const obj = await new Promise<ArrayBuffer>((resolve, reject) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result as ArrayBuffer);
					reader.onerror = () => reject(new Error("Failed to read blob"));
					// @ts-expect-error
					reader.readAsArrayBuffer(dataURI);
				});
				await tb.dialog.SaveFile({
					title: "Save screenshot",
					filename: "screenshot.png",
					onOk: async (filePath: string) => {
						Filer;
						await Filer.fs.promises.writeFile(filePath, Filer.Buffer.from(obj));
					},
				});
			},
		},
		mediaplayer: {
			music(props: MediaProps) {
				setMusicFn(props);
			},
			video(props: MediaProps) {
				setVideoFn(props);
			},
			hide: () => {
				hideFn();
			},
			pauseplay: () => {
				window.dispatchEvent(new Event("tb-pause-isl"));
			},
			isExisting: () => {
				return new Promise(resolve => {
					isExistingFn();
					const getContent = (e: CustomEvent) => {
						window.removeEventListener("isExistingMP", getContent as EventListener);
						resolve(e.detail);
					};
					window.addEventListener("isExistingMP", getContent as EventListener);
				});
			},
		},
		file: {
			handler: {
				openFile: async (path: string, type: string) => {
					const settings = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"));
					const fApps = settings["fileAssociatedApps"];
					const app = fApps[type];
					try {
						let appInfo;
						if (await fileExists(`/apps/system/${app}/.tbconfig`)) {
							appInfo = JSON.parse(await Filer.fs.promises.readFile(`/apps/system/${app}/.tbconfig`, "utf8"));
						} else if (await fileExists(`/apps/user/${await window.tb.user.username()}/${app}/.tbconfig`)) {
							appInfo = JSON.parse(await Filer.fs.promises.readFile(`/apps/user/${await window.tb.user.username()}/${app}/.tbconfig`, "utf8"));
						} else {
							appInfo = JSON.parse(await Filer.fs.promises.readFile(`/apps/user/${await window.tb.user.username()}/${app}/index.json`, "utf8"));
						}
						const message = { type: "process", path: path };
						createWindow({
							title: appInfo.name,
							src: appInfo.src,
							size: {
								width: 460,
								height: 460,
								minWidth: 160,
								minHeight: 160,
							},
							icon: appInfo.icon,
							message: JSON.stringify(message),
						});
					} catch (err: any) {
						if (err.code === "ENOENT") {
							const message = { type: "process", path: path };
							switch (type) {
								case "text":
									createWindow({
										title: "Text Editor",
										src: "/fs/apps/system/text editor.tapp/index.html",
										size: {
											width: 460,
											height: 460,
											minWidth: 160,
											minHeight: 160,
										},
										icon: "/fs/apps/system/text editor.tapp/icon.svg",
										message: JSON.stringify(message),
									});
									break;
								case "image":
								case "video":
								case "audio":
								case "pdf":
									createWindow({
										title: "Media Viewer",
										src: "/fs/apps/system/media viewer.tapp/index.html",
										size: {
											width: 460,
											height: 460,
											minWidth: 160,
											minHeight: 160,
										},
										icon: "/fs/apps/system/media viewer.tapp/icon.svg",
										message: JSON.stringify(message),
									});
									break;
								case "webpage":
									createWindow({
										title: "Terbium Webview",
										src: `/fs/${path}`,
										size: {
											width: 460,
											height: 460,
											minWidth: 160,
											minHeight: 160,
										},
										icon: "/apps/browser.tapp/icon.svg",
									});
									break;
							}
						} else {
							throw err;
						}
					}
				},
				addHandler: async (app: string, ext: string) => {
					let settings: SysSettings = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"));
					(settings.fileAssociatedApps as Record<string, string>)[ext] = app;
					await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(settings, null, 2), "utf8");
					return true;
				},
				removeHandler: async (ext: string) => {
					let settings: SysSettings = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"));
					delete (settings.fileAssociatedApps as Record<string, string>)[ext];
					await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(settings, null, 2), "utf8");
					return true;
				},
			},
		},
	};

	//@ts-expect-error stfu
	if (window.loadLock)
		// this function seems to be called twice, anura doesn't like initing twice, so well, this is the weird fix I chose instead of tackling the root problem - Rafflesia
		return;
	(window as any).loadLock = true;

	let anura = await Anura.new({
		milestone: 5,
		FileExts: {
			txt: { handler_type: "module", id: "anura.fileviewer" },
			mp3: { handler_type: "module", id: "anura.fileviewer" },
			flac: { handler_type: "module", id: "anura.fileviewer" },
			wav: { handler_type: "module", id: "anura.fileviewer" },
			ogg: { handler_type: "module", id: "anura.fileviewer" },
			mp4: { handler_type: "module", id: "anura.fileviewer" },
			mov: { handler_type: "module", id: "anura.fileviewer" },
			webm: { handler_type: "module", id: "anura.fileviewer" },
			gif: { handler_type: "module", id: "anura.fileviewer" },
			png: { handler_type: "module", id: "anura.fileviewer" },
			jpg: { handler_type: "module", id: "anura.fileviewer" },
			jpeg: { handler_type: "module", id: "anura.fileviewer" },
			svg: { handler_type: "module", id: "anura.fileviewer" },
			pdf: { handler_type: "module", id: "anura.fileviewer" },
			py: { handler_type: "module", id: "anura.fileviewer" },
			js: { handler_type: "module", id: "anura.fileviewer" },
			mjs: { handler_type: "module", id: "anura.fileviewer" },
			cjs: { handler_type: "module", id: "anura.fileviewer" },
			json: { handler_type: "module", id: "anura.fileviewer" },
			html: { handler_type: "module", id: "anura.fileviewer" },
			css: { handler_type: "module", id: "anura.fileviewer" },
			default: { handler_type: "module", id: "anura.fileviewer" },
		},
		"handler-migration-complete": true,
		apps: ["apps/fsapp.app"],
		defaultsettings: {
			"use-sw-cache": true,
			applist: ["anura.browser", "anura.settings", "anura.fsapp", "anura.term"],
			"relay-url": "wss://relay.widgetry.org/",
			directories: {
				apps: "/apps/anura/",
				libs: "/system/lib/anura/",
				init: "/system/etc/anura/init/",
				bin: "/system/bin/anura/",
			},
		},
		x86: {
			debian: {
				bzimage: "/images/debian-boot/vmlinuz-6.1.0-11-686",
				initrd: "/images/debian-boot/initrd.img-6.1.0-11-686",
				rootfs: [
					"images/debian-rootfs/aa",
					"images/debian-rootfs/ab",
					"images/debian-rootfs/ac",
					"images/debian-rootfs/ad",
					"images/debian-rootfs/ae",
					"images/debian-rootfs/af",
					"images/debian-rootfs/ag",
					"images/debian-rootfs/ah",
					"images/debian-rootfs/ai",
					"images/debian-rootfs/aj",
					"images/debian-rootfs/ak",
					"images/debian-rootfs/al",
					"images/debian-rootfs/am",
					"images/debian-rootfs/an",
					"images/debian-rootfs/ao",
					"images/debian-rootfs/ap",
					"images/debian-rootfs/aq",
					"images/debian-rootfs/ar",
					"images/debian-rootfs/as",
					"images/debian-rootfs/at",
					"images/debian-rootfs/au",
					"images/debian-rootfs/av",
					"images/debian-rootfs/aw",
					"images/debian-rootfs/ax",
					"images/debian-rootfs/ay",
					"images/debian-rootfs/az",
					"images/debian-rootfs/ba",
					"images/debian-rootfs/bb",
					"images/debian-rootfs/bc",
					"images/debian-rootfs/bd",
					"images/debian-rootfs/be",
					"images/debian-rootfs/bf",
					"images/debian-rootfs/bg",
					"images/debian-rootfs/bh",
					"images/debian-rootfs/bi",
					"images/debian-rootfs/bj",
					"images/debian-rootfs/bk",
					"images/debian-rootfs/bl",
					"images/debian-rootfs/bm",
					"images/debian-rootfs/bn",
					"images/debian-rootfs/bo",
				],
			},
		},
	});
	window.anura = anura;
	window.AliceWM = AliceWM;
	window.LocalFS = LocalFS;
	window.ExternalApp = ExternalApp;
	window.ExternalLib = ExternalLib;
	window.electron = new Lemonade();
	const getupds = async () => {
		if (hash !== (await Filer.fs.promises.readFile("/system/etc/terbium/hash.cache", "utf8"))) {
			window.tb.notification.Toast({
				application: "System",
				iconSrc: "/fs/apps/system/about.tapp/icon.svg",
				message: "A new version of terbium is ready to install",
				onOk: async () => {
					window.location.reload();
				},
			});
		}
	};
	if (!(await fileExists("/system/etc/terbium/hash.cache"))) {
		await Filer.fs.promises.writeFile("/system/etc/terbium/hash.cache", "invalid");
		window.tb.notification.Toast({
			application: "System",
			iconSrc: "/fs/apps/system/about.tapp/icon.svg",
			message: "A new version of terbium is ready to install",
			onOk: async () => {
				window.location.reload();
			},
		});
	} else {
		getupds();
	}
	setInterval(() => {
		getupds();
	}, 300000);
	const libcurlload = (srv: any) => {
		window.tb.libcurl.set_websocket(srv);
	};
	const wsld = async () => {
		const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
		if (settings.wispServer === null) {
			libcurlload(`${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`);
		} else {
			libcurlload(settings.wispServer);
		}
	};
	let triggered = false;
	const down = (e: KeyboardEvent) => {
		if (e.altKey && e.shiftKey) {
			if (!triggered) {
				window.tb.screen.captureScreen();
				triggered = true;
			}
		}
	};
	const up = (e: KeyboardEvent) => {
		if (!e.altKey || !e.shiftKey) {
			triggered = false;
		}
	};
	document.addEventListener("keydown", down);
	document.addEventListener("keyup", up);
	wsld();
	await window.tb.proxy.updateSWs();
	window.tb.node.webContainer = await initializeWebContainer();
	document.addEventListener("libcurl_load", wsld);
}

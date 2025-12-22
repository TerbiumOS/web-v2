// @ts-expect-error
import { WindowInformation, AliceWM } from "./AliceWM";
import { WMAPI } from "./api/WmApi";
import { ContextMenuAPI } from "./api/ContextMenuAPI";
import { FilesAPI } from "./api/Files";
import { NotificationService } from "./api/NotificationService";
import { Settings } from "./api/Settings";
import { App } from "./coreapps/App";
import { ExternalApp } from "./coreapps/ExternalApp";
import { Networking } from "./api/Networking";
import { URIHandlerAPI } from "./api/URIHandler";
import { ExternalLib } from "./libs/ExternalLib";
import { Lib } from "./libs/lib";
import { Processes } from "./api/Process";
import { Platform } from "./api/Platform";
import { Dialog } from "./api/Dialog";
import { Systray } from "./api/Systray";
import { AnuraFilesystem } from "./api/Filesystem";
import { TFSProvider } from "./api/TFS";
import { AnuraUI } from "./api/UI";

declare global {
	interface Window {
		anura: Anura;
	}
}

export class Anura {
	version = {
		semantic: {
			major: "2",
			minor: "1",
			patch: "0",
		},
		buildstate: "Stable",
		codename: `Liquor "Starboy" Stable`,
		get pretty() {
			const semantic = this.semantic;
			return `${semantic.major}.${semantic.minor}.${semantic.patch} ${this.buildstate}`;
		},
	};
	initComplete = false;
	// x86: null | V86Backend;
	settings: Settings;
	fs: AnuraFilesystem;
	config: any;
	net: Networking;
	notifications: NotificationService;
	// x86hdd: FakeFile;
	processes: Processes;
	ui = new AnuraUI();
	dialog: Dialog;
	platform: Platform;
	systray: Systray;

	private constructor(
		fs: AnuraFilesystem,
		settings: Settings,
		config: any,
		// hdd: FakeFile,
	) {
		this.fs = fs;
		this.settings = settings;
		this.config = config;
		// this.x86hdd = hdd;

		this.net = new Networking();
		this.notifications = new NotificationService();
		this.processes = new Processes();
		this.ui = new AnuraUI();
		this.platform = new Platform();
		this.dialog = new Dialog();
		this.systray = new Systray();
		// @ts-expect-error
		this.fs.readdir("/apps/anura", (err: Error, files: string[]) => {
			// Fixes a weird edgecase that I was facing where no user apps are installed, nothing breaks it just throws an error which I would like to mitigate.
			if (files == undefined) return;
			files.forEach(file => {
				try {
					this.registerExternalApp("/fs/apps/anura/" + file);
				} catch (e) {
					this.logger.error("Anura failed to load an app " + e);
				}
			});
		});

		try {
			// @ts-expect-error
			this.fs.readdir("/system/lib/anura/", (err: Error, files: string[]) => {
				// Fixes a weird edgecase that I was facing where no user apps are installed, nothing breaks it just throws an error which I would like to mitigate.
				if (files == undefined) return;
				files.forEach(file => {
					try {
						this.fs.readFile(
							"/system/lib/anura//" + file,
							// @ts-expect-error
							function (err: Error, data: Uint8Array) {
								if (err) throw "Failed to read file";
								try {
									eval(new TextDecoder("utf-8").decode(data));
								} catch (e) {
									console.error(e);
								}
							},
						);
					} catch (e) {
						this.logger.error("Anura failed to load an app " + e);
					}
				});
			});
		} catch (e) {
			this.logger.error(e);
		}
		this.registerExternalApp("/apps/fsapp.app");
		if (import.meta.env.DEV) {
			this.registerExternalLib("/public/apps/libfileview.lib");
			this.registerExternalLib("/public/apps/libfilepicker.lib");
			this.registerExternalLib("/public/apps/libpersist.lib");
		} else {
			this.registerExternalLib("/apps/libfileview.lib");
			this.registerExternalLib("/apps/libfilepicker.lib");
			this.registerExternalLib("/apps/libpersist.lib");
		}
	}

	static async new(config: any): Promise<Anura> {
		// File System Initialization //
		const filerProvider = new TFSProvider(window.tb.fs);
		// @ts-expect-error
		const fs = new AnuraFilesystem([filerProvider]);
		// @ts-expect-error
		const settings = await Settings.new(fs, config.defaultsettings);

		// const hdd = await InitV86Hdd();
		const anuraPartial = new Anura(fs, settings, config);
		(window as any).tb.liquor = anuraPartial;
		return anuraPartial;
	}

	wm = new WMAPI();

	apps: any = {};
	libs: any = {};
	logger = {
		log: console.log.bind(console, "anuraOS:"),
		debug: console.debug.bind(console, "anuraOS:"),
		warn: console.warn.bind(console, "anuraOS:"),
		error: console.error.bind(console, "anuraOS:"),
	};
	// net = new Networking();
	async registerApp(app: App) {
		if (app.package in this.apps) {
			throw "Application already installed";
		}
		const apps: any = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
		// @ts-expect-error
		if (apps.system_apps.some(existingApp => existingApp.title === app.name)) {
			console.log("Application already installed");
		} else {
			console.log(app);
			apps.system_apps.push({
				title: app.name,
				icon: app.icon,
				// @ts-expect-error
				src: `${app.source}/${app.manifest.index}`,
			});
			await window.tb.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
			window.dispatchEvent(new Event("updApps"));
			await window.tb.fs.promises.writeFile(`/system/etc/anura/configs/${app.name}.json`, JSON.stringify(app, null, 2));
			const installedApps = JSON.parse(await window.tb.fs.promises.readFile("/apps/installed.json", "utf8"));
			installedApps.push({
				name: app.name,
				config: `/system/etc/anura/configs/${app.name}.json`,
				user: "System",
			});
			await window.tb.fs.promises.writeFile("/apps/installed.json", JSON.stringify(installedApps));
		}
		this.apps[app.package] = {
			title: app.name,
			icon: app.icon,
			id: app.package,
		};
		return app;
	}
	async registerExternalApp(source: string): Promise<ExternalApp> {
		const resp = await fetch(`${source}/manifest.json`);
		const manifest = (await resp.json()) as AppManifest;
		if (manifest.type === "auto" || manifest.type === "manual") {
			const app = new ExternalApp(manifest, source);
			await this.registerApp(app);
			return app;
		}
		const handlers = this.settings.get("ExternalAppHandlers");
		if (!handlers || !handlers[manifest.type]) {
			const error = `Could not register external app from source: "${source}" because no external handlers are registered for type "${manifest.type}"`;
			this.notifications.add({
				title: "AnuraOS",
				description: error,
			});
			throw error;
		}
		const handler = handlers[manifest.type];
		const handlerModule = await this.import(handler);
		if (!handlerModule) {
			const error = `Failed to load external app handler ${handler}`;
			this.notifications.add({
				title: "AnuraOS",
				description: error,
			});
			throw error;
		}
		if (!handlerModule.createApp) {
			const error = `Handler ${handler} does not have a createApp function`;
			this.notifications.add({
				title: "AnuraOS",
				description: error,
			});
			throw error;
		}
		const app = handlerModule.createApp(manifest, source);
		await this.registerApp(app); // This will let us capture error messages
		return app;
	}
	registerExternalAppHandler(id: string, handler: string) {
		const handlers = this.settings.get("ExternalAppHandlers") || {};
		handlers[handler] = id;
		this.settings.set("ExternalAppHandlers", handlers);
	}
	async registerLib(lib: Lib) {
		if (lib.package in this.libs) {
			throw "Library already installed";
		}
		this.libs[lib.package] = lib;
		return lib;
	}
	async registerExternalLib(source: string): Promise<ExternalLib> {
		const resp = await fetch(`${source}/manifest.json`);
		const manifest = await resp.json();
		const lib = new ExternalLib(manifest, source);
		await this.registerLib(lib); // This will let us capture error messages
		return lib;
	}
	ContextMenu = ContextMenuAPI;
	removeStaleApps() {
		for (const appName in this.apps) {
			const app = this.apps[appName];
			app.windows.forEach((win: any) => {
				if (!win.element.parentElement) {
					app.windows.splice(app.windows.indexOf(win));
				}
			});
		}
	}
	async import(packageName: string, searchPath?: string) {
		if (searchPath) {
			// Using node-style module resolution
			let scope: string | null;
			let name: string;
			let filename: string;
			if (packageName.startsWith("@")) {
				const [_scope, _name, ...rest] = packageName.split("/");
				scope = _scope!;
				name = _name!;
				filename = rest.join("/");
			} else {
				const [_name, ...rest] = packageName.split("/");
				scope = null;
				name = _name!;
				filename = rest.join("/");
			}

			if (!filename || filename === "") {
				const data: any = await this.fs.promises.readFile(`${searchPath}/${scope}/${name}/package.json`);
				const pkg = JSON.parse(data);
				console.log("pkg", pkg);
				if (pkg.main) {
					filename = pkg.main;
				} else {
					filename = "index.js";
				}
			}

			const file = await this.fs.promises.readFile(`${searchPath}/${scope}/${name}/${filename}`);
			// @ts-ignore
			const blob = new Blob([file], { type: "application/javascript" });
			const url = URL.createObjectURL(blob);
			// @vite-ignore
			return await import(/* @vite-ignore */ url);
		}
		const splitName = packageName.split("@");
		const pkg: string = splitName[0]!;
		const version = splitName[1] || null;
		if (this.libs[pkg]) {
			return await this.libs[pkg].getImport(version);
		}
	}
	uri = new URIHandlerAPI();
	files = new FilesAPI();
	get wsproxyURL() {
		return this.settings.get("wisp-url");
	}
}

export interface AppManifest {
	name: string;
	type: "manual" | "auto" | "webview" | string;
	package: string;
	index?: string;
	icon: string;
	handler?: string;
	src?: string;
	hidden?: boolean;
	background?: string;
	wininfo: string; //| WindowInformation;
	useIdbWrapper?: boolean;
}

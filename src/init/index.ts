import { dirExists, TAuthSSData, UserSettings } from "../sys/types";
import apps from "../apps.json";
import { copyfs } from "./fs.init";
import { hash } from "../hash.json";

export async function init() {
	/**
	 * create home structure
	 */
	console.log("Initing File System please wait...");
	if (!(await dirExists("/home"))) {
		await window.tb.fs.promises.mkdir("/home");
	}
	const user = JSON.parse(`${sessionStorage.getItem("new-user")}`).username;

	/**
	 * create apps structure
	 */
	if (!(await dirExists("/apps"))) {
		await window.tb.fs.promises.mkdir("/apps");
		await window.tb.fs.promises.mkdir("/apps/system");
		await copyfs();
		await window.tb.fs.promises.mkdir("/apps/user");
		await window.tb.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify({ apps: [] }));
	} else {
		if (!(await dirExists("/apps/user"))) {
			await window.tb.fs.promises.mkdir("/apps/user");
		}
	}

	if (!(await dirExists(`/apps/user/${user}`))) {
		await window.tb.fs.promises.mkdir(`/apps/user/${user}`);
		await window.tb.fs.promises.mkdir(`/apps/user/${user}/files`);
		await window.tb.fs.promises.mkdir(`/apps/user/${user}/terminal`);
	}

	/**
	 * create system structure
	 */
	if (!(await dirExists("/system"))) {
		await window.tb.fs.promises.mkdir("/system");
		await window.tb.fs.promises.mkdir("/system/trash");
		await window.tb.fs.promises.mkdir("/system/bin");
		await window.tb.fs.promises.mkdir("/system/etc");
		await window.tb.fs.promises.mkdir("/system/etc/terbium");
		let stockSettings = {
			theme: "dark",
			"system-blur": true,
			"dock-full": false,
			fileAssociatedApps: {
				text: "text-editor",
				image: "media-viewer",
				video: "media-viewer",
				audio: "media-viewer",
			},
			location: "40.7831,-73.9712",
			weather: {
				unit: "Celsius",
			},
			"host-name": "terbium",
		};
		await window.tb.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(stockSettings));
		await window.tb.fs.promises.writeFile("/system/etc/terbium/sudousers.json", JSON.stringify([]));
		await window.tb.fs.promises.mkdir("/system/etc/terbium/wallpapers");
		await window.tb.fs.promises.mkdir("/system/var");
		await window.tb.fs.promises.mkdir("/system/var/terbium");
		await window.tb.fs.promises.writeFile("/system/etc/terbium/hash.cache", hash);
		let startApps = {
			system_apps: apps.map(app => app.config),
			pinned_apps: [],
		};
		await window.tb.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(startApps));
		await window.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify([]));
		await window.tb.fs.promises.mkdir("/apps/anura/");
		let dockPins = [
			{
				title: "Terminal",
				icon: "/fs/apps/system/terminal.tapp/icon.svg",
				isPinnable: true,
				src: "/fs/apps/system/terminal.tapp/index.html",
				size: {
					width: 612,
					height: 400,
				},
			},
			{
				title: "Files",
				icon: "/fs/apps/system/files.tapp/icon.svg",
				isPinnable: true,
				src: "/fs/apps/system/files.tapp/index.html",
				size: {
					width: 600,
					height: 500,
				},
			},
			{
				title: "Settings",
				icon: "/fs/apps/system/settings.tapp/icon.svg",
				isPinnable: true,
				src: "/fs/apps/system/settings.tapp/index.html",
				single: true,
			},
			{
				title: "Feedback",
				icon: "/fs/apps/system/feedback.tapp/icon.svg",
				proxy: true,
				isPinnable: true,
				src: "https://forms.gle/m664xxmrugWQADQt9",
				size: {
					width: 600,
					height: 500,
				},
			},
		];
		await window.tb.fs.promises.writeFile("/system/var/terbium/dock.json", JSON.stringify(dockPins));
		await window.tb.fs.promises.mkdir("/system/lib");
		await window.tb.fs.promises.mkdir("/system/lib/anura");
		await window.tb.fs.promises.mkdir("/system/tmp");

		let recentApps: any[] = [];
		await window.tb.fs.promises.writeFile("/system/var/terbium/recent.json", JSON.stringify(recentApps));
	}

	const tcaccSettings: TAuthSSData = sessionStorage.getItem("tacc-settings") ? JSON.parse(sessionStorage.getItem("tacc-settings")!) : null;
	var items: any[] = [];

	if (!(await dirExists(`/home/${user}`))) {
		await window.tb.fs.promises.mkdir(`/home/${user}`);
		let userSettings: UserSettings = {
			wallpaper: "/assets/wallpapers/1.png",
			wallpaperMode: "cover",
			animations: true,
			// @ts-ignore
			proxy: sessionStorage.getItem("selectedProxy") || "Scramjet",
			transport: "Default (Epoxy)",
			wispServer: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`,
			"battery-percent": false,
			accent: "#32ae62",
			times: {
				format: "12h",
				internet: false,
				showSeconds: false,
			},
			showFPS: false,
			windowOptimizations: false,
			window: {
				winAccent: "#ffffff",
				blurlevel: 18,
				alwaysMaximized: false,
				alwaysFullscreen: false,
			},
		};
		if (tcaccSettings && Array.isArray(tcaccSettings) && tcaccSettings[0] && tcaccSettings[0].settings) {
			userSettings = {
				...userSettings,
				...tcaccSettings[0].settings,
			};
		}
		await window.tb.fs.promises.writeFile(`/home/${user}/settings.json`, JSON.stringify(userSettings));
		await window.tb.fs.promises.mkdir(`/home/${user}/desktop`);
		let r2 = [];
		let sysapps: { name: string; config: string; user: string }[] = [];
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
				item: `/home/${user}/desktop/${name}.lnk`,
				position: {
					custom: false,
					top: topPos,
					left: leftPos,
				},
			});
			await window.tb.fs.promises.mkdir(`/apps/system/${name}.tapp`);
			await window.tb.fs.promises.writeFile(
				`/apps/system/${name}.tapp/index.json`,
				JSON.stringify({
					name: app.name,
					config: app.config,
					icon: app.config.icon,
				}),
			);
			sysapps.push({
				name: app.name,
				config: `/apps/system/${name}.tapp/index.json`,
				user: "System",
			});
			await window.tb.fs.promises.symlink(`/apps/system/${name}.tapp/index.json`, `/home/${user}/desktop/${name}.lnk`);
		}
		await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(items));
		if (tcaccSettings && Array.isArray(tcaccSettings) && tcaccSettings[0]) {
			await window.tb.fs.promises.writeFile(
				`/apps/user/${user}/files/config.json`,
				JSON.stringify({
					"quick-center": true,
					"sidebar-width": 180,
					drives: {
						"File System": `/home/${user}/`,
						...tcaccSettings[0].davs.reduce((acc: any, d: any) => {
							const driveName = d.name || d.driveName;
							acc[driveName] = `/mnt/${driveName}/`;
							return acc;
						}, {}),
					},
					storage: {
						"File System": "storage-device",
						localStorage: "storage-device",
					},
					"open-collapsibles": {
						"quick-center": true,
						drives: true,
					},
					"show-hidden-files": false,
				}),
				"utf8",
			);
			await window.tb.fs.promises.writeFile(`/apps/user/${user}/files/davs.json`, JSON.stringify(tcaccSettings[0].davs, null, 2));
		} else {
			await window.tb.fs.promises.writeFile(
				`/apps/user/${user}/files/config.json`,
				JSON.stringify({
					"quick-center": true,
					"sidebar-width": 180,
					drives: {
						"File System": `/home/${user}/`,
					},
					storage: {
						"File System": "storage-device",
						localStorage: "storage-device",
					},
					"open-collapsibles": {
						"quick-center": true,
						drives: true,
					},
					"show-hidden-files": false,
				}),
				"utf8",
			);
			await window.tb.fs.promises.writeFile(`/apps/user/${user}/files/davs.json`, JSON.stringify([]));
		}
		await window.tb.fs.promises.mkdir(`/apps/user/${user}/browser`);
		await window.tb.fs.promises.writeFile(`/apps/user/${user}/browser/favorites.json`, JSON.stringify([]));
		await window.tb.fs.promises.writeFile(`/apps/user/${user}/browser/userscripts.json`, JSON.stringify([]));
		await window.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(sysapps));
		const response = await fetch("/apps/files.tapp/icons.json");
		const dat = await response.json();
		const iconNames = Object.keys(dat["name-to-path"]);
		var iconArrays: { [key: string]: string } = {};

		await window.tb.fs.promises.mkdir(`/system/etc/terbium/file-icons`);
		for (const name of iconNames) {
			const path = `/system/etc/terbium/file-icons/${name}.svg`;
			iconArrays[name] = path;
			const icon = dat["name-to-path"][name];
			await window.tb.fs.promises.writeFile(path, icon as any);
		}
		await window.tb.fs.promises.writeFile(
			`/system/etc/terbium/file-icons.json`,
			JSON.stringify({
				"ext-to-name": dat["ext-to-name"],
				"name-to-path": iconArrays,
			}),
		);
		await window.tb.fs.promises.writeFile(
			`/apps/user/${user}/files/quick-center.json`,
			JSON.stringify({
				paths: {
					Desktop: `/home/${user}/desktop`,
					Documents: `/home/${user}/documents`,
					Images: `/home/${user}/images`,
					Videos: `/home/${user}/videos`,
					Music: `/home/${user}/music`,
					Trash: `/system/trash`,
				},
			}),
			"utf8",
		);
		await window.tb.fs.promises.writeFile(`/apps/user/${user}/terminal/info.json`, JSON.stringify({}));
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
	return true;
}

import { useEffect, useState, useRef } from "react";
import { dirExists, fileExists, unzip, UserSettings } from "./sys/types";
import { hash } from "./hash.json";
import paths from "./installer.json";

export default function Updater() {
	const [progress, setProgress] = useState(0);
	const statusref = useRef<HTMLDivElement>(null);

	async function copyDir(inp: string, dest: string, rn?: boolean) {
		if (rn === true) {
			if (!(await dirExists(dest))) {
				await window.tb.fs.promises.mkdir(dest);
			}
		}
		const files = await window.tb.fs.promises.readdir(inp);
		const totalFiles = files.length;
		for (const [index, file] of files.entries()) {
			const stats = await window.tb.fs.promises.stat(`${inp}/${file}`);
			if (stats && stats.isDirectory()) {
				await window.tb.fs.promises.mkdir(`${dest}/${file}`);
				await copyDir(`${inp}/${file}`, `${dest}/${file}`, true);
			} else {
				await window.tb.fs.promises.writeFile(`${dest}/${file}`, await window.tb.fs.promises.readFile(`${inp}/${file}`, "utf8"));
			}
			statusref.current!.innerText = `Creating a copy of: ${file}...`;
			setProgress(Math.floor(((index + 1) / totalFiles) * 100));
		}
	}

	useEffect(() => {
		const main = async () => {
			window.onbeforeunload = e => {
				e.preventDefault();
				e.returnValue = "Terbium is still updating";
			};
			let sysapps = ["about.tapp", "app store.tapp", "browser.tapp", "calculator.tapp", "feedback.tapp", "files.tapp", "media viewer.tapp", "settings.tapp", "task manager.tapp", "terminal.tapp", "text editor.tapp"];
			let sysscripts = [
				"cat.js",
				"cd.js",
				"clear.js",
				"curl.js",
				"echo.js",
				"exit.js",
				"git.js",
				"help.js",
				"info.json",
				"info.schema.json",
				"ls.js",
				"mkdir.js",
				"node.js",
				"ping.js",
				"pkg.js",
				"pkill.js",
				"pwd.js",
				"qwick.js",
				"qwick_install.js",
				"rm.js",
				"rmdir.js",
				"sysfetch.js",
				"taskkill.js",
				"tb.js",
				"touch.js",
				"unzip.js",
			];
			if (await dirExists("/system/tmp/terb-upd/")) {
				await window.tb.sh.promises.rm(`/system/tmp/terb-upd/`, { recursive: true });
			}
			statusref.current!.innerText = "Installing latest version of TB...";
			await window.tb.fs.promises.mkdir("/system/tmp/terb-upd/");
			const apps = await window.tb.fs.promises.readdir("/apps/system/");
			const scripts = await window.tb.fs.promises.readdir("/apps/system/terminal.tapp/scripts/");
			setProgress(20);
			statusref.current!.innerText = "Creating a backup";
			if (await fileExists("/apps/system/settings.tapp/wisp-servers.json")) {
				await window.tb.fs.promises.writeFile("/system/tmp/terb-upd/wisp-servers.json", await window.tb.fs.promises.readFile("/apps/system/settings.tapp/wisp-servers.json"));
			} else {
				const stockDat = [
					{ id: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`, name: "Backend" },
					{ id: "wss://wisp.terbiumon.top/wisp/", name: "TB Wisp Instance" },
				];
				await window.tb.fs.promises.writeFile("/system/tmp/terb-upd/wisp-servers.json", JSON.stringify(stockDat));
			}
			for (const item of apps) {
				setProgress(prevProgress => prevProgress + 1);
				if (sysapps.includes(item)) {
					if (item === "terminal.tapp") {
						for (const item of scripts) {
							setProgress(prevProgress => prevProgress + 1);
							if (!sysscripts.includes(item)) {
								console.log(`Skipping ${item}...`);
							}
						}
					} else {
						await copyDir(`/apps/system/${item}/`, `/system/tmp/terb-upd/${item}.old`, true);
						await window.tb.sh.promises.rm(`/apps/system/${item}/`, { recursive: true });
					}
				} else {
					console.log(`Skipping ${item}...`);
				}
			}
			setProgress(50);
			statusref.current!.innerText = "Updating Terbium...";
			setProgress(0);
			for (const item of paths) {
				setProgress(prevProgress => prevProgress + 1);
				statusref.current!.innerText = `Installing ${item}...`;
				const isDir = item.toString().endsWith("/");
				if (isDir) {
					try {
						// @ts-expect-error
						await window.tb.fs.promises.mkdir(`/apps/system/${item.toString()}`, { recursive: true });
					} catch (err) {
						console.error(err);
					}
				} else if (item.toString().endsWith(".tapp.zip")) {
					const res = await fetch(`/apps/${item.toString()}`);
					if (!res.ok) {
						console.error(`Failed to fetch /apps/${item.toString()}: ${res.status} ${res.statusText}`);
						continue;
					}
					const data = await res.arrayBuffer();
					await window.tb.fs.promises.writeFile(`/apps/system/${item}`, window.tb.buffer.from(data));
					await unzip(`/apps/system/${item}`, `/apps/system/${item.slice(0, -4)}`);
					await window.tb.fs.promises.unlink(`/apps/system/${item}`);
				} else {
					const path = `/apps/system/${item.toString()}`;
					const dir = path.substring(0, path.lastIndexOf("/"));
					try {
						if (!(await dirExists(dir))) {
							// @ts-expect-error
							await window.tb.fs.promises.mkdir(dir, { recursive: true });
						}
						const res = await fetch(`/apps/${item.toString()}`);
						const data = await res.text();
						await window.tb.fs.promises.writeFile(path, data);
					} catch (err) {
						console.error(err);
					}
				}
			}
			await window.tb.fs.promises.writeFile("/apps/system/settings.tapp/wisp-servers.json", await window.tb.fs.promises.readFile("/system/tmp/terb-upd/wisp-servers.json"));
			await window.tb.fs.promises.writeFile("/system/etc/terbium/hash.cache", hash);
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
						<span className="font-[700] lg:text-[34px] md:text-[28px] sm:text-[22px] text-right duration-150">
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

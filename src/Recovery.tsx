import { useEffect, useRef, useState } from "react";
import { version } from "../package.json";
import { unzipSync } from "fflate";
import { libcurl } from "libcurl.js";
import { dirExists } from "./sys/types";
import { hash } from "./hash.json";
import apps from "./apps.json";

export default function Recovery() {
	const [selected, setSelected] = useState(0);
	const [showCursor, setShowCursor] = useState(false);
	const [msg, setMsg] = useState<string | null>(null);
	const [action, setAction] = useState<string>("");
	const [progress, setProgress] = useState(0);
	const [updCache, setUpdCache] = useState(false);
	const msgbox = useRef<HTMLDivElement>(null);
	const main = useRef<HTMLDivElement>(null);
	const progresscheck = useRef<HTMLDivElement>(null);
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

	const getTmp = async () => {
		if (await dirExists("/system/tmp/terb-upd/")) {
			setUpdCache(true);
		}
	};
	getTmp();

	const prodins = async () => {
		setShowCursor(false);
		msgbox.current!.classList.remove("flex");
		msgbox.current!.classList.add("hidden");
		progresscheck.current!.classList.remove("hidden");
		progresscheck.current!.classList.add("flex");
		if (localStorage.getItem("setup")) {
			await window.tb.sh.format();
			const boot = () => {
				sessionStorage.setItem("boot", "true");
				window.location.reload();
			};

			const cloak = () => {
				const newWindow = window.open("about:blank", "_blank");
				const newDocument = newWindow!.document.open();
				sessionStorage.setItem("boot", "true");
				newDocument.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style type="text/css">
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                </style>
            </head>
            <body>
                <iframe style="border: none; width: 100%; height: 100vh;" src="${window.location.href}?boot=true"></iframe>
            </body>
            </html>
        `);
				newDocument.close();
				window.location.href = "https://google.com";
				console.log("Cloak Opened!");
			};

			const recovery = () => {
				sessionStorage.setItem("recovery", "true");
				window.location.reload();
			};
			await window.tb.fs.promises.writeFile(
				"/bootentries.json",
				JSON.stringify([
					{ name: "TB React", action: boot.toString() },
					{ name: "TB React (Cloaked)", action: cloak.toString() },
					{ name: "TB System Recovery", action: recovery.toString() },
				]),
			);
		}
		await download("https://cdn.terbiumon.top/recovery/latest.zip", "/uploaded.zip");
		setShowCursor(false);
		await unzip("//uploaded.zip", "//");
		await window.tb.fs.promises.mkdir("/system/tmp/");
		await window.tb.sh.promises.rm("/home/Guest/desktop/", { recursive: true });
		await window.tb.fs.promises.mkdir("/home/Guest/desktop/");
		let r2 = [];
		let sysapps: { name: string; config: string; user: string }[] = [];
		let items: { name: string; item: string; position: { custom: boolean; top: number; left: number } }[] = [];
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
				item: `/home/Guest/desktop/${name}.lnk`,
				position: {
					custom: false,
					top: topPos,
					left: leftPos,
				},
			});
			sysapps.push({
				name: app.name,
				config: `/apps/system/${name}.tapp/index.json`,
				user: "System",
			});
			await window.tb.fs.promises.writeFile(`/home/Guest/desktop/.desktop.json`, JSON.stringify(items));
			await window.tb.fs.promises.symlink(`/apps/system/${name}.tapp/index.json`, `/home/Guest/desktop/${name}.lnk`);
		}
		statusref.current!.innerText = "Cleaning up...";
		setProgress(85);
		await window.tb.fs.promises.unlink("//uploaded.zip");
		setProgress(100);
		statusref.current!.innerText = "Restarting...";
		sessionStorage.clear();
		sessionStorage.setItem("boot", "true");
		localStorage.setItem("setup", "true");
		window.location.reload();
	};

	// @ts-expect-error types
	window.prodins = prodins;

	const zipins = async () => {
		const fauxput = document.createElement("input");
		fauxput.type = "file";
		fauxput.accept = ".zip";
		fauxput.onchange = async e => {
			const target = e.target as HTMLInputElement;
			if (target && target.files) {
				const file = target.files[0];
				const content = await file.arrayBuffer();
				setProgress(10);
				if (localStorage.getItem("setup")) {
					await window.tb.sh.format();
					const boot = () => {
						sessionStorage.setItem("boot", "true");
						window.location.reload();
					};

					const cloak = () => {
						const newWindow = window.open("about:blank", "_blank");
						const newDocument = newWindow!.document.open();
						sessionStorage.setItem("boot", "true");
						newDocument.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style type="text/css">
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                </style>
            </head>
            <body>
                <iframe style="border: none; width: 100%; height: 100vh;" src="${window.location.href}?boot=true"></iframe>
            </body>
            </html>
        `);
						newDocument.close();
						window.location.href = "https://google.com";
						console.log("Cloak Opened!");
					};

					const recovery = () => {
						sessionStorage.setItem("recovery", "true");
						window.location.reload();
					};
					await window.tb.fs.promises.writeFile(
						"/bootentries.json",
						JSON.stringify([
							{ name: "TB React", action: boot.toString() },
							{ name: "TB React (Cloaked)", action: cloak.toString() },
							{ name: "TB System Recovery", action: recovery.toString() },
						]),
					);
				}
				setProgress(25);
				await window.tb.fs.promises.writeFile("//uploaded.zip", window.tb.buffer.from(content), "arraybuffer");
				setProgress(35);
				setShowCursor(false);
				main.current!.classList.remove("flex");
				main.current!.classList.add("hidden");
				progresscheck.current!.classList.remove("hidden");
				progresscheck.current!.classList.add("flex");
				await unzip("//uploaded.zip", "//");
				setProgress(72);
				const users = await window.tb.fs.promises.readdir("/home/");
				for (const user of users) {
					// note from XSTARS, this is a workaround that fixes the stupid symlink bug but it fucks over people with custom symlinks so be aware of that
					await window.tb.sh.promises.rm(`/home/${user}/desktop/`, { recursive: true });
					await window.tb.fs.promises.mkdir(`/home/${user}/desktop/`);
					let r2 = [];
					let sysapps: { name: string; config: string; user: string }[] = [];
					let items: { name: string; item: string; position: { custom: boolean; top: number; left: number } }[] = [];
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
						sysapps.push({
							name: app.name,
							config: `/apps/system/${name}.tapp/index.json`,
							user: "System",
						});
						await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(items));
						await window.tb.fs.promises.symlink(`/apps/system/${name}.tapp/index.json`, `/home/${user}/desktop/${name}.lnk`);
					}
				}
				await window.tb.fs.promises.mkdir("/system/tmp/");
				statusref.current!.innerText = "Cleaning up...";
				setProgress(85);
				await window.tb.fs.promises.unlink("//uploaded.zip");
				setProgress(100);
				statusref.current!.innerText = "Restarting...";
				sessionStorage.clear();
				sessionStorage.setItem("boot", "true");
				localStorage.setItem("setup", "true");
				window.location.reload();
			}
		};
		fauxput.click();
	};

	async function unzip(path: string, target: string) {
		const response = await fetch("/fs/" + path);
		const zipFileContent = await response.arrayBuffer();
		if (!(await dirExists(target))) {
			// @ts-expect-error types
			await window.tb.fs.promises.mkdir(target, { recursive: true });
		}
		const compressedFiles = unzipSync(new Uint8Array(zipFileContent));
		for (const [relativePath, content] of Object.entries(compressedFiles)) {
			const fullPath = `${target}/${relativePath}`;
			const pathParts = fullPath.split("/");
			let currentPath = "";
			for (let i = 0; i < pathParts.length; i++) {
				currentPath += pathParts[i] + "/";
				if (i === pathParts.length - 1 && !relativePath.endsWith("/")) {
					await window.tb.fs.promises.writeFile(currentPath.slice(0, -1), window.tb.buffer.from(content), "arraybuffer");
				} else if (!(await dirExists(currentPath))) {
					await window.tb.fs.promises.mkdir(currentPath);
				}
			}
			if (relativePath.endsWith("/")) {
				await window.tb.fs.promises.mkdir(fullPath);
			}
		}
		return "Done!";
	}

	async function download(url: string, location: string) {
		if (!window.loadLock) {
			window.loadLock = true;
			await libcurl.load_wasm("https://cdn.jsdelivr.net/npm/libcurl.js@latest/libcurl.wasm");
		}
		// @ts-expect-error types
		libcurl.set_websocket(`${window.location.protocol.replace("http", "ws")}//${window.location.hostname}:${window.location.port}/wisp/`);
		const response = await libcurl.fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download the file. Status: ${response.status}`);
		}
		const content = await response.arrayBuffer();
		await window.tb.fs.promises.writeFile(location, window.tb.buffer.from(content), "arraybuffer");
		console.log(`File saved successfully at: ${location}`);
	}

	const migrateFs = async () => {
		setShowCursor(false);
		main.current!.classList.remove("flex");
		main.current!.classList.add("hidden");
		progresscheck.current!.classList.remove("hidden");
		progresscheck.current!.classList.add("flex");
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
		const entries = await Filer.fs.promises.readdir("/");
		for (const entry of entries as string[]) {
			const stats = await Filer.fs.promises.stat(entry);
			if (stats && stats.type === "DIRECTORY") {
				// @ts-expect-error types
				await new Filer.fs.Shell().promises.rm(entry, { recursive: true });
			} else {
				await Filer.fs.promises.unlink(entry);
			}
		}
		setProgress(100);
		statusref.current!.innerText = "Migration complete!";
		sessionStorage.clear();
		sessionStorage.setItem("boot", "true");
		localStorage.setItem("setup", "true");
		window.location.reload();
	};

	// @ts-expect-error types
	window.migrateFs = migrateFs;

	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.key === "ArrowUp") {
				setSelected(prevSelected => (prevSelected === 0 ? (updCache ? 5 : 4) : prevSelected - 1));
			} else if (e.key === "ArrowDown") {
				setSelected(prevSelected => (prevSelected === (updCache ? 5 : 4) ? 0 : prevSelected + 1));
			} else if (e.key === "Enter") {
				if (selected === 0) {
					localStorage.clear();
					sessionStorage.clear();
					sessionStorage.setItem("boot", "true");
					if (localStorage.getItem("setup")) {
						await window.tb.sh.format();
						const boot = () => {
							sessionStorage.setItem("boot", "true");
							window.location.reload();
						};

						const cloak = () => {
							const newWindow = window.open("about:blank", "_blank");
							const newDocument = newWindow!.document.open();
							sessionStorage.setItem("boot", "true");
							newDocument.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style type="text/css">
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                </style>
            </head>
            <body>
                <iframe style="border: none; width: 100%; height: 100vh;" src="${window.location.href}?boot=true"></iframe>
            </body>
            </html>
        `);
							newDocument.close();
							window.location.href = "https://google.com";
							console.log("Cloak Opened!");
						};

						const recovery = () => {
							sessionStorage.setItem("recovery", "true");
							window.location.reload();
						};
						await window.tb.fs.promises.writeFile(
							"/bootentries.json",
							JSON.stringify([
								{ name: "TB React", action: boot.toString() },
								{ name: "TB React (Cloaked)", action: cloak.toString() },
								{ name: "TB System Recovery", action: recovery.toString() },
							]),
						);
					}
					window.location.reload();
				} else if (selected === 1) {
					msgbox.current!.classList.remove("hidden");
					msgbox.current!.classList.add("flex");
					main.current!.classList.add("hidden");
					main.current!.classList.remove("flex");
					setShowCursor(true);
					setMsg("BE AWARE if your static hosting this download will NOT work. Proceed?");
					setAction("prodins()");
				} else if (selected === 2) {
					migrateFs();
				} else if (selected === 3) {
					zipins();
				} else if (selected === 4 && updCache) {
					setShowCursor(false);
					msgbox.current!.classList.remove("flex");
					msgbox.current!.classList.add("hidden");
					progresscheck.current!.classList.remove("hidden");
					progresscheck.current!.classList.add("flex");
					await copyDir("/system/tmp/terb-upd/", "/apps/", true);
					await window.tb.fs.promises.writeFile("/system/etc/terbium/hash.cache", hash);
					await window.tb.sh.promises.rm("/system/tmp/terb-upd/", { recursive: true });
					window.location.reload();
				} else if (selected === (updCache ? 5 : 4)) {
					sessionStorage.clear();
					window.location.reload();
				}
			} else if (e.key === "Escape") {
				setShowCursor(prev => !prev);
			}
		};
		const getPlatform = () => {
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
		};
		if (getPlatform() === "mobile") {
			setShowCursor(true);
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [selected]);

	return (
		<div className={`overflow-hidden w-full h-full flex justify-center pt-[30px] bg-[#0e0e0e] ${showCursor ? null : "cursor-none"}`}>
			<div className="flex flex-col items-center w-full p-2 text-[#ffffff48] overflow-hidden">
				<div className="py-10 w-full flex justify-center text-[#ffffff68] font-bold text-2xl duration-150">Terbium Recovery Utility - Version {version}</div>
				<div ref={msgbox} className="hidden mt-1 p-2 flex-col flex-grow overflow-auto w-full border-solid border-[#ffffff68] border-2 rounded-xl z-10">
					<div className="flex flex-col items-center justify-center h-full">
						<div className="flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-45">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
							</svg>
							<span className="ml-2 text-5xl">{msg}</span>
						</div>
						<div className="flex mt-4">
							<button
								className="mr-2 cursor-pointer bg-[#ffffff0a] text-[#ffffff38] border-[#ffffff22] hover:bg-[#ffffff10] hover:text-[#ffffff8d] focus:bg-[#ffffff1f] focus:text-[#ffffff8d] focus:border-[#73a9ffd6] focus:ring-[#73a9ff74] focus:outline-hidden focus:ring-2 ring-[transparent] ring-0 border-[1px] font-[600] px-[20px] py-[8px] rounded-[6px] duration-150"
								onClick={() => eval(action)}
							>
								Proceed
							</button>
							<button
								className="cursor-pointer bg-[#ffffff0a] text-[#ffffff38] border-[#ffffff22] hover:bg-[#ffffff10] hover:text-[#ffffff8d] focus:bg-[#ffffff1f] focus:text-[#ffffff8d] focus:border-[#73a9ffd6] focus:ring-[#73a9ff74] focus:outline-hidden focus:ring-2 ring-[transparent] ring-0 border-[1px] font-[600] px-[20px] py-[8px] rounded-[6px] duration-150"
								onClick={() => {
									setShowCursor(false);
									msgbox.current!.classList.remove("flex");
									msgbox.current!.classList.add("hidden");
									main.current!.classList.add("flex");
									main.current!.classList.remove("hidden");
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
				<div ref={progresscheck} className="hidden bg-[#0e0e0e] h-full justify-center items-center flex-col lg:h-full md:h-full">
					<img src="/tb.svg" alt="Terbium" className="w-[25%] h-[25%]" />
					<div className="duration-150 flex flex-col justify-center items-center">
						<div className="text-container relative flex flex-col justify-center items-end">
							<div className="bg-linear-to-b from-[#ffffff] to-[#ffffff77] text-transparent bg-clip-text flex flex-col lg:items-center md:items-center sm:items-center">
								<span className="font-[700] lg:text-[34px] md:text-[28px] sm:text-[22px] text-right duration-150">
									<span className="font-[1000] duration-150">Terbium is installing</span>
								</span>
								<br />
								<p>Please DO NOT close this tab</p>
							</div>
						</div>
					</div>
					<p ref={statusref} className="mt-1">
						Downloading...
					</p>
					<div className="relative flex w-[30%] h-3 rounded-full bg-[#00000020] overflow-hidden mt-4">
						<div className="absolute h-full bg-[#50bf66] rounded-full" style={{ width: `${progress}%` }}></div>
					</div>
				</div>
				<div ref={main} className="mt-1 p-2 flex flex-col flex-grow overflow-auto w-full border-solid border-[#ffffff68] border-2 rounded-xl">
					<span
						className={
							"p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md" +
							" " +
							`
							${selected === 0 && showCursor !== true ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"}
							${showCursor ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : null}
						`
						}
						onClick={async () => {
							localStorage.clear();
							sessionStorage.clear();
							sessionStorage.setItem("boot", "true");
							if (localStorage.getItem("setup")) {
								await window.tb.sh.format();
								const boot = () => {
									sessionStorage.setItem("boot", "true");
									window.location.reload();
								};

								const cloak = () => {
									const newWindow = window.open("about:blank", "_blank");
									const newDocument = newWindow!.document.open();
									sessionStorage.setItem("boot", "true");
									newDocument.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style type="text/css">
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                </style>
            </head>
            <body>
                <iframe style="border: none; width: 100%; height: 100vh;" src="${window.location.href}?boot=true"></iframe>
            </body>
            </html>
        `);
									newDocument.close();
									window.location.href = "https://google.com";
									console.log("Cloak Opened!");
								};

								const recovery = () => {
									sessionStorage.setItem("recovery", "true");
									window.location.reload();
								};
								await window.tb.fs.promises.writeFile(
									"/bootentries.json",
									JSON.stringify([
										{ name: "TB React", action: boot.toString() },
										{ name: "TB React (Cloaked)", action: cloak.toString() },
										{ name: "TB System Recovery", action: recovery.toString() },
									]),
								);
							}
							window.location.reload();
						}}
					>
						Reinstall Terbium
					</span>
					<span
						className={
							"p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md" +
							" " +
							`
							${selected === 1 && showCursor !== true ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"}
							${showCursor ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : null}
						`
						}
						onClick={() => {
							msgbox.current!.classList.remove("hidden");
							msgbox.current!.classList.add("flex");
							main.current!.classList.add("hidden");
							main.current!.classList.remove("flex");
							setShowCursor(true);
							setMsg("BE AWARE if your static hosting this download will NOT work. Proceed?");
							setAction("prodins()");
						}}
					>
						Restore from Production Instance (Beta)
					</span>
					<span
						className={
							"p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md" +
							" " +
							`
							${selected === 2 && showCursor !== true ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"}
							${showCursor ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : null}
						`
						}
						onClick={() => {
							migrateFs();
						}}
					>
						Migrate from Filer to OPFS
					</span>
					<span
						className={
							"p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md" +
							" " +
							`
							${selected === 3 && showCursor !== true ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"}
							${showCursor ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : null}
						`
						}
						onClick={() => {
							zipins();
						}}
					>
						Restore from ZIP (Beta)
					</span>
					{updCache && (
						<span
							className={
								"p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md" +
								" " +
								`
								${selected === 4 && showCursor !== true ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"}
								${showCursor ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : null}
							`
							}
							onClick={async () => {
								setShowCursor(false);
								msgbox.current!.classList.remove("flex");
								msgbox.current!.classList.add("hidden");
								progresscheck.current!.classList.remove("hidden");
								progresscheck.current!.classList.add("flex");
								await copyDir("/system/tmp/terb-upd/", "/apps/", true);
								await window.tb.fs.promises.writeFile("/system/etc/terbium/hash.cache", hash);
								await window.tb.sh.promises.rm("/system/tmp/terb-upd/", { recursive: true });
								window.location.reload();
							}}
						>
							Restore from Update Cache
						</span>
					)}
					<span
						className={
							"p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md" +
							" " +
							`
							${selected === (updCache ? 5 : 4) && showCursor !== true ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"}
							${showCursor ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : null}
						`
						}
						onClick={() => {
							sessionStorage.clear();
							window.location.reload();
						}}
					>
						Exit
					</span>
				</div>
				<span className="font-mono">
					Use the <span className="text-[#ffffff68] text-2xl">↑</span> and <span className="text-[#ffffff68] text-2xl">↓</span> keys to switch entry.
				</span>
				<span className="font-mono">
					Press the <span className="text-[#ffffff68] font-sans font-bold">enter</span> key to select.
				</span>
			</div>
		</div>
	);
}

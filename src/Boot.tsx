import { useEffect, useState } from "react";
import { version } from "../package.json";
import { dirExists, fileExists } from "./sys/types";
import { BootEntry, DEFAULT_BOOT_ENTRIES, upgradeLegacyBootEntries } from "./sys/bootentries";

export default function Boot() {
	const [selected, setSelected] = useState(0);
	const [showCursor, setShowCursor] = useState(false);
	const [bootentries, setentries] = useState<BootEntry[]>([]);

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

	const executeBootEntry = (entry: BootEntry) => {
		if (!entry || typeof entry.file !== "string") return;
		if (entry.file === "tb:root") {
			boot();
			return;
		}
		if (entry.file === "tb:root-cloak") {
			cloak();
			return;
		}
		if (entry.file === "tb:recovery") {
			recovery();
			return;
		}
		sessionStorage.setItem("cusboot", "true");
		sessionStorage.setItem("bootfile", entry.file);
		window.location.reload();
	};

	useEffect(() => {
		const getEntries = async () => {
			let entries: any[] = [];
			if (!(await fileExists("/bootentries.json"))) {
				entries = DEFAULT_BOOT_ENTRIES;
				await window.tb.fs.promises.writeFile("/bootentries.json", JSON.stringify(entries, null, 2), "utf8");
				console.log("Added default bootentries");
			} else {
				try {
					const raw = await window.tb.fs.promises.readFile("/bootentries.json", "utf8");
					entries = JSON.parse(raw);
					if (!Array.isArray(entries)) {
						entries = DEFAULT_BOOT_ENTRIES;
					}
				} catch (err) {
					console.warn("Failed to read /bootentries.json, replacing with default entries", err);
					entries = DEFAULT_BOOT_ENTRIES;
				}
			}

			const FilerDirExists = async (path: string): Promise<boolean> => {
				return new Promise(resolve => {
					Filer.fs.stat(path, (err: any, stats: any) => {
						if (err) {
							if (err.code === "ENOENT") {
								resolve(false);
							} else {
								console.error(err);
								resolve(false);
							}
						} else {
							const exists = stats.type === "DIRECTORY";
							resolve(exists);
						}
					});
				});
			};

			const { entries: normalizedEntries, changed } = upgradeLegacyBootEntries(entries);
			if (changed) {
				await window.tb.fs.promises.writeFile("/bootentries.json", JSON.stringify(normalizedEntries, null, 2), "utf8");
			}
			if (localStorage.getItem("setup") === "true" && (!(await dirExists("/system/etc/terbium/")) || !(await dirExists("/apps/system/")))) {
				const bootent = normalizedEntries.filter((entry: BootEntry) => entry.name !== "TB React" && entry.name !== "TB React (Cloaked)");
				const fsxr = await FilerDirExists("/system/etc/terbium");
				if (fsxr) {
					sessionStorage.setItem("migrateFs", "true");
					setentries(normalizedEntries);
				} else {
					setentries(bootent);
				}
			} else {
				setentries(normalizedEntries);
			}
		};
		getEntries();
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

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowUp") {
				setSelected(prevSelected => (bootentries.length === 0 ? 0 : prevSelected === 0 ? bootentries.length - 1 : prevSelected - 1));
			} else if (e.key === "ArrowDown") {
				setSelected(prevSelected => (prevSelected === bootentries.length - 1 ? 0 : prevSelected + 1));
			} else if (e.key === "Enter") {
				const selectedEntry = bootentries[selected];
				executeBootEntry(selectedEntry);
			} else if (e.key === "Escape") {
				setShowCursor(prev => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [selected, bootentries]);

	return (
		<div className={`overflow-hidden w-full h-full flex justify-center pt-7.5 bg-[#0e0e0e] ${showCursor ? null : "cursor-none"}`}>
			<div className="flex flex-col items-center w-full p-2 text-[#ffffff48] overflow-hidden">
				<div className="py-10 w-full flex justify-center text-[#ffffff68] font-bold text-2xl duration-150">Terbium Boot Loader - Version {version}</div>
				<div className="mt-1 p-2 flex flex-col grow overflow-auto w-full border-solid border-[#ffffff68] border-2 rounded-xl">
					{bootentries.map((entry, index) => (
						<span
							key={index}
							className={`p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border rounded-md ${selected === index && showCursor !== true ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"} ${showCursor ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : null}`}
							onClick={() => {
								showCursor ? executeBootEntry(entry) : null;
							}}
						>
							{entry.name}
						</span>
					))}
				</div>
				<span className="font-mono">
					Use the <span className="text-[#ffffff68] text-2xl">↑</span> and <span className="text-[#ffffff68] text-2xl">↓</span> keys to switch entry.
				</span>
				<span className="font-mono">
					Press the <span className="text-[#ffffff68] font-sans font-bold">enter</span> key to boot into the selection.
				</span>
			</div>
		</div>
	);
}

export class Settings {
	private cache: { [key: string]: any } = {};
	fs: FilerFS;
	private constructor(fs: FilerFS, inital: { [key: string]: any }) {
		this.fs = fs;
		this.cache = inital;

		navigator.serviceWorker.ready.then(isReady => {
			isReady.active!.postMessage({
				anura_target: "anura.cache",
				value: this.cache["use-sw-cache"],
			});
			isReady.active!.postMessage({
				anura_target: "anura.bareurl",
				value: this.cache["bare-url"],
			});
			console.debug("ANURA-SW: For this boot, cache will be " + (this.cache["use-sw-cache"] ? "enabled" : "disabled"));
			this.cache["FileExts"] = {
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
			};
		});
	}

	static async new(fs: FilerFS, defaultsettings: { [key: string]: any }) {
		const initial = defaultsettings;

		if (!initial["wisp-url"]) {
			const tbs = JSON.parse(await fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
			initial["wisp-url"] = tbs.wispServer;
		}

		try {
			const raw = await fs.promises.readFile("/system/etc/anura/anura_settings.json");
			// This Uint8Array is actuallly a buffer, so JSON.parse can handle it
			Object.assign(initial, JSON.parse(raw as any));
		} catch (e) {
			fs.mkdir("/system/etc/anura/");
			fs.mkdir("/system/etc/anura/configs/");
			fs.mkdir("/system/etc/anura/init/");
			fs.mkdir("/system/bin/anura/");
			fs.writeFile(
				"/system/etc/anura/theme.json",
				JSON.stringify({
					foreground: "#ffffff",
					secondaryForeground: "#ffffff38",
					border: "#ffffff28",
					darkBorder: "#333333",
					background: "#0e0e0e",
					secondaryBackground: "#383838",
					darkBackground: "#161616",
					accent: "#32ae62",
				}),
			);
			fs.writeFile("/system/etc/anura/anura_settings.json", JSON.stringify(initial));
		}

		return new Settings(fs, initial);
	}

	get(prop: string): any {
		return this.cache[prop];
	}
	has(prop: string): boolean {
		return prop in this.cache;
	}
	async set(prop: string, val: any, subprop?: string) {
		console.debug("Setting " + prop + " to " + val);
		if (subprop) {
			this.cache[prop][subprop] = val;
		} else {
			this.cache[prop] = val;
		}
		this.save();
	}
	async save() {
		console.debug("Saving settings to fs", this.cache);
		await this.fs.promises.writeFile("/system/etc/anura/anura_settings.json", JSON.stringify(this.cache));
	}
	async remove(prop: string, subprop?: string) {
		console.warn("anura.settings.remove() is a debug feature, and should not be used outside of development.");
		if (subprop) {
			delete this.cache[prop][subprop];
		} else {
			delete this.cache[prop];
		}
		this.save();
	}
}

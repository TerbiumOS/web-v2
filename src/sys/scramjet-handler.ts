import LibcurlClient from "@mercuryworkshop/libcurl-transport";
import EpoxyClient from "@mercuryworkshop/epoxy-transport";
import { SJConfig, SJFlags, SysSettings, UserSettings } from "./types";
import { defaultConfigDev } from "@mercuryworkshop/scramjet";

export class ScramjetHandler {
	transportVar!: string;
	wispUrl!: string;
	initReady: Promise<void>;
	libcurl!: LibcurlClient;
	epoxy!: EpoxyClient;
	controller: any;
	private activeTransport: string = "epoxy";
	private readonly controllerConfig: SJConfig;
	private readonly scramjetFlags: SJFlags;

	constructor(Controller: any, SW: any, config: SJConfig, flags: SJFlags) {
		this.controllerConfig = config;
		this.scramjetFlags = flags;
		if (localStorage.getItem("setup")) {
			(async () => {
				if (sessionStorage.getItem("currAcc")) {
					const settings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
					this.wispUrl = settings.wispServer;
					this.transportVar = settings.transport;
				} else {
					const syssettings: SysSettings = JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"));
					const usersettings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${syssettings.defaultUser}/settings.json`, "utf8"));
					this.wispUrl = usersettings.wispServer;
					this.transportVar = usersettings.transport;
				}
			})();
		} else {
			this.wispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
			this.transportVar = "epoxy";
		}
		this.initReady = (async () => {
			const transportConfig = await this.buildTransportConfig();
			this.controller = new Controller({
				serviceworker: navigator.serviceWorker.controller ?? SW.active,
				transport: transportConfig.instance,
				config: config,
				scramjetConfig: defaultConfigDev || flags,
			});
			await this.controller.wait();
		})();
	}

	async TransportMapping(): Promise<Record<any, any>> {
		return {
			epoxy: {
				constructor: EpoxyClient,
				opts: ["wisp"],
			},
			libcurl: {
				constructor: LibcurlClient,
				opts: ["wisp", "proxy"],
			},
		};
	}

	private async buildTransportConfig() {
		const transportMap = await this.TransportMapping();
		const selectedTransport = this.transportVar || "epoxy";
		const fallbackTransport = transportMap.libcurl;
		const mappedTransport = transportMap[selectedTransport] || fallbackTransport;
		this.activeTransport = transportMap[selectedTransport] ? selectedTransport : "epoxy";
		const wispUrl = this.wispUrl;
		const clientOptions: Record<string, any> = {
			wisp: wispUrl,
		};
		const transportOptions: Record<string, any> = {
			wisp: wispUrl,
		};
		if (clientOptions.proxy) {
			transportOptions.proxy = clientOptions.proxy;
		}
		return {
			key: this.activeTransport,
			instance: new mappedTransport.constructor(clientOptions),
			connectionOptions: transportOptions,
		};
	}

	async setTransports() {
		await this.initReady;
		console.log("[Proxy] setTransports() called, wispUrl:", this.wispUrl);
		const transportConfig = await this.buildTransportConfig();
		if (this.controller && typeof this.controller.setTransport === "function") {
			await this.controller.setTransport(transportConfig.instance);
		}
		console.log("[Proxy] Transport set with options:", {
			controller: transportConfig.key,
		});
	}
}

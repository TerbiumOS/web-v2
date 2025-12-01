import { AnuraWMWeakRef } from "@/sys/types";
import { AliceWM, WindowInformation } from "../AliceWM";
import { App } from "../coreapps/App";

export class WMAPI {
	windows: WeakRef<any>[] = [];
	constructor() {
		setInterval(() => {
			for (const proc of Object.values(window.tb.process.list())) {
				this.convertProc(proc.pid);
			}
		}, 50);
	}
	async create(ctx: App | any, _info: WindowInformation, _onfocus: (() => void) | null = null, _onresize: ((w: number, h: number) => void) | null = null) {
		const win = await AliceWM.create(ctx);
		this.windows.push(new WeakRef(win));
		return win;
	}
	async createGeneric(_ctx: App, info: object) {
		if (!info) {
			info = {
				title: "Generic Window",
				icon: "/assets/img/logo.png",
				minheight: 40,
				minwidth: 40,
				width: "1000px",
				height: "500px",
				allowMultipleInstance: false,
			};
		}
		// @ts-expect-error
		const win = await AliceWM.create(info);
		//ctx.windows.push(win); This was causing problems
		this.windows.push(new WeakRef(win));
		return win;
	}

	/** NON SPECED FOR TERBIUM COMPATABILITY ONLY */
	convertProc(pid: number) {
		const winInf = window.tb.process.list()[pid];
		if (!winInf) return;
		for (const ref of this.windows) {
			const r = ref?.deref?.() ?? null;
			if (!r) continue;
			if (r.pid === pid) return;
			if (typeof r.title === "string" && r.title === winInf.name) return;
		}
		const tbanuraproperties: WindowInformation = {
			title: winInf.name,
			icon: winInf.icon,
			minheight: 40,
			minwidth: 40,
			width: winInf.size.width,
			height: winInf.size.height,
			allowMultipleInstance: false,
		};
		const obj: AnuraWMWeakRef = {
			element: null,
			content: null,
			// @ts-expect-error keep same behavior — ExternalApp may be nonstandard
			app: new ExternalApp(winInf),
			dragForceX: 0,
			dragForceY: 0,
			dragging: false,
			height: winInf.size.height,
			width: winInf.size.width,
			pid: pid,
			state: null,
			maximized: false,
			minimizing: false,
			mouseLeft: null,
			mouseTop: null,
			onclose: () => null,
			onfocus: () => null,
			onresize: (_w: number, _h: number) => null,
			onsnap: (_side: string) => null,
			onunmaximize: () => null,
			restoreSvg: null,
			kill() {
				if (obj.pid != null) window.tb.process.kill(obj.pid);
			},
			get alive() {
				return window.tb.process.list()[pid] != null;
			},
			maximizeImg: null,
			maximizeSvg: null,
			wininfo: tbanuraproperties,
			title: winInf.name,
		};
		this.windows.push(new WeakRef(obj));
	}

	getWeakRef(pid: number) {
		for (const ref of this.windows) {
			const r = ref.deref();
			if (!r) continue;
			if (r.pid === pid) return r;
		}
	}
}

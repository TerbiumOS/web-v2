import { createWindow } from "../gui/WindowArea";
import { ExternalApp } from "./coreapps/ExternalApp";

export interface WindowInformation {
	title: string;
	width: string | number;
	minwidth: number;
	height: string | number;
	minheight: number;
	allowMultipleInstance: boolean;
	icon?: string;
	src?: string | URL | any;
	/**
	 * @description For Terbium Compatability only
	 */
	msg?: any;
}

export const AliceWM = {
	create: function (givenWinInfo?: string | WindowInformation) {
		console.trace();
		// Default param
		let wininfo: WindowInformation = {
			title: "Generic Window",
			minheight: 40,
			minwidth: 40,
			width: "1000px",
			height: "500px",
			allowMultipleInstance: false,
		};
		// Param given in argument
		if (typeof givenWinInfo == "object") wininfo = givenWinInfo;

		if (typeof givenWinInfo == "string") {
			// Only title given
			wininfo.title = givenWinInfo;
		}
		console.log(givenWinInfo);
		console.log(wininfo);
		console.log(wininfo);
		const parseSize = (v: string | number) => {
			if (typeof v === "number") return v;
			const num = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
			return Number.isFinite(num) ? num : 0;
		};
		let resp: (val: any) => void = () => {};
		let er: (err: any) => void = () => {};
		const ready = new Promise<any>((resolve, reject) => {
			resp = resolve;
			er = reject;
		});
		const obj: any = {
			element: null,
			content: null,
			// @ts-expect-error keep same behavior — ExternalApp may be nonstandard
			app: new ExternalApp(wininfo),
			dragForceX: 0,
			dragForceY: 0,
			dragging: false,
			height: wininfo.height,
			width: wininfo.width,
			pid: null,
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
			kill: () => {
				if (obj.pid != null) window.tb.process.kill(obj.pid);
			},
			get alive() {
				return window.tb.window.getId() === obj.pid;
			},
			maximizeImg: null,
			maximizeSvg: null,
			wininfo,
			title: wininfo.title,
		};

		obj.then = (onFulfilled: (val: any) => any, onRejected?: (err: any) => any) => ready.then(onFulfilled, onRejected);
		obj.catch = (onRejected: (err: any) => any) => ready.catch(onRejected);
		obj.finally = (cb: () => void) => ready.finally(cb);
		createWindow({
			title: wininfo.title,
			icon: wininfo.icon || "/assets/img/logo.png",
			src: wininfo.src || "about:blank",
			size: {
				width: parseSize(wininfo.width),
				height: parseSize(wininfo.height),
			},
			single: false,
			resizable: true,
			message: wininfo.msg,
		})
			.then(n => {
				setTimeout(() => {
					try {
						console.log(`created ${n}`);
						// Sorry I had to use DOM it was like the only way for actual cross compatability
						const currPID = window.tb.window.getId();
						const elem = document.querySelector(`div[pid="${currPID}"]`);
						const winControls = elem?.querySelectorAll(".controls.flex.gap-1") ?? [];
						window.tb.window.content.set("<div></div>");
						obj.element = elem;
						obj.content = elem?.querySelector("div:not([class]):not([pid]):not([style]):not([data-resizer]):not([message])");
						// @ts-expect-error types
						obj.app = new ExternalApp(wininfo);
						obj.dragForceX = 0;
						obj.dragForceY = 0;
						obj.dragging = false;
						obj.height = wininfo.height;
						obj.width = wininfo.width;
						obj.pid = currPID;
						obj.state = null;
						obj.maximized = false;
						obj.minimizing = false;
						obj.mouseLeft = null;
						obj.mouseTop = null;
						obj.onclose = () => null;
						obj.onfocus = () => null;
						obj.onresize = (_w: number, _h: number) => null;
						obj.onsnap = (_side: string) => null;
						obj.onunmaximize = () => null;
						obj.restoreSvg = winControls[0]?.childNodes[1] || null;
						obj.maximizeImg = winControls[0]?.childNodes[1] || null;
						obj.maximizeSvg = winControls[0]?.childNodes[1] || null;
						obj.wininfo = wininfo;
						obj.title = wininfo.title;
						resp(obj);
					} catch (err) {
						er(err);
					}
				}, 500);
			})
			.catch(err => {
				er(err);
			});

		return obj;
	},
};

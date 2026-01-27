import { UserSettings } from "../types";

interface ElectronWinArgs {
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	x?: number;
	y?: number;
	title?: string;
	icon?: string;
	resizable?: boolean;
	maximizable?: boolean;
	minimizable?: boolean;
	closable?: boolean;
	alwaysOnTop?: boolean;
	fullscreen?: boolean;
	skipTaskbar?: boolean;
	backgroundColor?: string;
	show?: boolean;
	frame?: boolean;
	parent?: BrowserWindow;
	modal?: boolean;
	webPreferences?: {
		nodeIntegration?: boolean;
		contextIsolation?: boolean;
		preload?: string;
		devTools?: boolean;
		webSecurity?: boolean;
		allowRunningInsecureContent?: boolean;
		sandbox?: boolean;
	};
}

export class BrowserWindow {
	private eventHandlers: Map<string, Function[]> = new Map();
	private _isDestroyed: boolean = false;

	constructor(args: ElectronWinArgs = {}) {
		window.tb.window.create({
			title: args.title || "Lemonade Instance",
			size: {
				width: args.width || 500,
				height: args.height || 500,
				minWidth: args.minWidth || 300,
				minHeight: args.minHeight || 300,
			},
			icon: args.icon || "/assets/img/logo.png",
			resizable: args.resizable !== false,
			maximizable: args.maximizable !== false,
			minimizable: args.minimizable !== false,
			src: "about:blank",
		});
	}

	loadFile(path: string) {
		window.tb.window.changeSrc(`/fs/${path}`);
	}

	async loadURL(src: string) {
		const settings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
		window.tb.window.changeSrc(settings.proxy === "Ultraviolet" ? `/uv/service/${await window.tb.proxy.encode(src, "XOR")}` : `/service/${await window.tb.proxy.encode(src, "XOR")}`);
	}

	destroy() {
		if (this._isDestroyed) return;
		this._isDestroyed = true;
		this.emit("closed");
		window.tb.window.close();
	}

	close() {
		if (this._isDestroyed) return;
		this.emit("close");
		this.destroy();
	}

	show() {
		this.emit("show");
		console.log("Window show");
	}

	blur() {
		this.emit("blur");
		window.blur();
	}

	focus() {
		this.emit("focus");
		window.focus();
	}

	hide() {
		this.emit("hide");
		window.tb.window.minimize();
	}

	minimize() {
		this.emit("minimize");
		window.tb.window.minimize();
	}

	maximize() {
		this.emit("maximize");
		window.tb.window.maximize?.();
	}

	unmaximize() {
		this.emit("unmaximize");
		console.log("API Stub")
	}

	isMaximized(): boolean {
		return false;
	}

	isMinimized(): boolean {
		return false;
	}

	isVisible(): boolean {
		return !this.isMinimized();
	}

	isDestroyed(): boolean {
		return this._isDestroyed;
	}

	setTitle(title: string) {
		window.tb.window.titlebar.setText(title);
	}

	getTitle(): string {
		return document.title;
	}

	setSize(width: number, height: number, _animate?: boolean) {
		console.log(`setSize called: ${width}x${height}`);
	}

	getSize(): [number, number] {
		return [window.innerWidth, window.innerHeight];
	}

	setPosition(x: number, y: number, _animate?: boolean) {
		console.log(`setPosition called: ${x}, ${y}`);
	}

	getPosition(): [number, number] {
		return [window.screenX, window.screenY];
	}

	setAlwaysOnTop(flag: boolean, level?: string, relativeLevel?: number) {
		console.log("setAlwaysOnTop:", flag, level, relativeLevel);
	}

	isAlwaysOnTop(): boolean {
		return false;
	}

	center() {
		const [width, height] = this.getSize();
		const x = (window.screen.width - width) / 2;
		const y = (window.screen.height - height) / 2;
		this.setPosition(x, y);
	}

	setFullScreen(flag: boolean) {
		if (flag) {
			document.documentElement.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	}

	isFullScreen(): boolean {
		return !!document.fullscreenElement;
	}

	setResizable(resizable: boolean) {
		console.log("setResizable:", resizable);
	}

	isResizable(): boolean {
		return true;
	}

	setMovable(movable: boolean) {
		console.log("setMovable:", movable);
	}

	isMovable(): boolean {
		return true;
	}

	setMinimizable(minimizable: boolean) {
		console.log("setMinimizable:", minimizable);
	}

	isMinimizable(): boolean {
		return true;
	}

	setMaximizable(maximizable: boolean) {
		console.log("setMaximizable:", maximizable);
	}

	isMaximizable(): boolean {
		return true;
	}

	setClosable(closable: boolean) {
		console.log("setClosable:", closable);
	}

	isClosable(): boolean {
		return true;
	}

	flashFrame(flag: boolean) {
		console.log("flashFrame:", flag);
	}

	on(event: string, listener: Function): this {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, []);
		}
		this.eventHandlers.get(event)!.push(listener);
		return this;
	}

	once(event: string, listener: Function): this {
		const wrapper = (...args: any[]) => {
			listener(...args);
			this.removeListener(event, wrapper);
		};
		return this.on(event, wrapper);
	}

	removeListener(event: string, listener: Function): this {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			const index = handlers.indexOf(listener);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
		return this;
	}

	removeAllListeners(event?: string): this {
		if (event) {
			this.eventHandlers.delete(event);
		} else {
			this.eventHandlers.clear();
		}
		return this;
	}

	private emit(event: string, ...args: any[]): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.forEach(handler => handler(...args));
		}
	}

	webContents = {
		send: (channel: string, ...args: any[]) => {
			console.log("webContents.send:", channel, args);
		},
		openDevTools: () => {
			console.log("DevTools opened (if available)");
		},
		closeDevTools: () => {
			console.log("DevTools closed");
		},
		isDevToolsOpened: () => false,
		loadURL: (url: string) => this.loadURL(url),
		loadFile: (path: string) => this.loadFile(path),
		executeJavaScript: async (code: string) => {
			try {
				return eval(code);
			} catch (error) {
				console.error("executeJavaScript error:", error);
				throw error;
			}
		},
	};
}

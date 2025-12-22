/**
 * @file src/sys/types.ts
 * @description This file contains all the types and interfaces used in the Terbium system.
 */

import { System } from "./apis/System";

declare global {
	namespace React.JSX {
		interface IntrinsicElements {
			"window-area": React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
			window: React.HTMLAttributes<HTMLDivElement>;
			region: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
			"window-body": React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
			"dock-item": React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
		}
	}
	interface Window {
		AliceWM: any;
		LocalFS: any;
		ExternalApp: any;
		ExternalLib: any;
		electron: any;
	}
}

export const isURL = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

export const dirExists = async (path: string): Promise<boolean> => {
	return new Promise(resolve => {
		window.tb.fs.stat(path, (err: any, stats: any) => {
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

export const fileExists = async (path: string): Promise<boolean> => {
	return new Promise(resolve => {
		window.tb.fs.stat(path, (err: any, stats: any) => {
			if (err) {
				if (err.code === "ENOENT") {
					resolve(false);
				} else {
					console.error(err);
					resolve(false);
				}
			} else {
				const exists = stats.type === "FILE";
				resolve(exists);
			}
		});
	});
};

/**
 * @interface User
 * @description The information about a user.
 * @property `id` The user ID.
 * @property `username` The username of the user.
 * @property `password` The password of the user.
 * @property `email` The email of the user.
 * @property `permissions` The permissions of the user.
 * @property `groups` The groups the user is in.
 */
export interface User {
	id: string;
	username: string;
	password: string | boolean;
	pfp: string;
	perm: Perm[];
	securityQuestion?: { question: string; answer: string };
	email?: string;
	groups?: string[];
}

/**
 * @interface Group
 * @description The information about a group.
 * @property `id` The group ID.
 * @property `name` The name of the group.
 * @property `permissions` The permissions of the group.
 * @property `users` The users in the group.
 */
export interface Group {
	id: string;
	name: string;
	perm: Perm[];
	users: string[];
}

/**
 * @enum Perm
 * @description The permissions that can be assigned to a user or group.
 * @constant `sys` The system permission. This is the highest level of permission and can only be assigned to the system administrator.
 * @constant `usr` The user permission. This is the default permission level for a user.
 * @constant `grp` The group permission. This is the default permission level for a group.
 * @constant `pub` The public permission. This is the lowest level of permission and is assigned to all users by default.
 */
export enum Perm {
	sys,
	usr,
	grp,
	pub,
}

export enum Errors {
	ENOENT = "ENOENT",
	EEXIST = "EEXIST",
	EISDIR = "EISDIR",
	ENOTDIR = "ENOTDIR",
	EPERM = "EPERM",
	EACCES = "EACCES",
	ENOTEMPTY = "ENOTEMPTY",
	EBUSY = "EBUSY",
	EROFS = "EROFS",
	ENOTFOUND = "ENOTFOUND",
	EINVALID = "EINVALID",
	EUNKNOWN = "EUNKNOWN",
	ECONFLICT = "ECONFLICT",
	EINVALIDARGS = "EINVALIDARGS",
	EINVALIDTYPE = "EINVALIDTYPE",
	EINVALIDNAME = "EINVALIDNAME",
	EINVALIDVALUE = "EINVALIDVALUE",
	EINVALIDPATH = "EINVALIDPATH",
	EINVALIDDATA = "EINVALIDDATA",
	EINVALIDSTATE = "EINVALIDSTATE",
	EINVALIDFORMAT = "EINVALIDFORMAT",
	EINVALIDLENGTH = "EINVALIDLENGTH",
	EINVALIDINDEX = "EINVALIDINDEX",
	EINVALIDKEY = "EINVALIDKEY",
	EINVALIDID = "EINVALIDID",
	EINVALIDDATE = "EINVALIDDATE",
	EINVALIDTIME = "EINVALIDTIME",
	EINVALIDDATETIME = "EINVALIDDATETIME",
	EINVALIDCHAR = "EINVALIDCHAR",
	EINVALIDCHARSET = "EINVALIDCHARSET",
	EINVALIDENCODING = "EINVALIDENCODING",
}

export enum ExitCodes {
	SUCCESS = 0,
	FAILURE = 1,
	FORBIDDEN = 2,
	INVALID = 3,
	ERROR = 4,
	TIMEOUT = 5,
	INTERRUPT = 6,
	ABORTED = 7,
}

/**
 * @interface ProcessInfo
 * @description The information about a process.
 * @property `name` The name of the process.
 * @property `pid` The process ID.
 * @property `token` The token of the process.
 * @property `parent` The parent process ID.
 * @property `children` The child process IDs.
 * @property `status` The status of the process.
 * @property `memory` The memory usage of the process.
 * @property `cpu` The CPU usage of the process.
 * @property `uptime` The time the process has been running.
 * @property `startTime` The time the process started.
 * @property `exitCode` The exit code of the process.
 */
export interface ProcessInfo {
	name: string;
	pid: number;
	parent: number;
	children: number[];
	status: "running" | "stopped";
	memory: number;
	cpu: number;
	uptime: number;
	startTime: number;
	exitCode: ExitCodes;
}

/**
 * @interface WindowConfig
 * @description The configuration for a window.
 * @property `title` The title of the window.
 * @property `icon` The icon of the window.
 * @property `src` The source of the window.
 * @property `size` The size of the window.
 * @property `controls` The controls of the window.
 * @property `resizable` Whether the window is resizable.
 * @property `maximizable` Whether the window is maximizable.
 * @property `minimizable` Whether the window is minimizable.
 * @property `closable` Whether the window is closable.
 * @property `snapable` Whether the window is snapable.
 */
export interface WindowConfig {
	title:
		| string
		| {
				text: string;
				weight?: number;
				html?: string;
		  };
	src: string;
	icon?: string;
	size?: {
		width?: number;
		height?: number;
		minWidth?: number;
		minHeight?: number;
	};
	single?: boolean;
	controls?: Array<"minimize" | "maximize" | "close">;
	resizable?: boolean;
	maximizable?: boolean;
	minimizable?: boolean;
	closable?: boolean;
	snapable?: boolean;
	message?: any;
	proxy?: boolean;

	// non window affecting properties
	pid?: string;
	wid?: string;
	zIndex?: number;
	focused?: boolean;
}

declare let props: any;

export interface NotificationProps {
	message: string;
	application: string;
	iconSrc: string;
	time?: number;
	onOk?: void | any;
	onCancel?: void | any;
	txt?: string;
}

export interface launcherProps {
	name: string;
	icon: string;
	src: string;
	user?: string;
}

export interface dialogProps {
	title: string;
	options?: {
		text: string;
		value: string;
	}[];
	message?: string;
	defaultValue?: string;
	filter?: string;
	defaultUsername?: string;
	defualtDir?: string;
	filename?: string;
	img?: string;
	onOk: void | any;
	onCancel?: void | any;
	sudo?: boolean;
}

export interface cmprops {
	titlebar?: string | React.ReactNode;
	x: number;
	y: number;
	options: {
		text: string;
		color?: string;
		click: () => void;
	}[];
}

export interface AppData {
	wmArgs: {
		app_id: string;
		title: {
			text: string;
			weight: number;
		};
		icon?: string;
		src: string;
		native: boolean;
		size: {
			width: number | string;
			height: number | string;
			minWidth?: number | string;
			minHeight?: number | string;
		};
		single: boolean;
		resizable?: boolean;
		snappable?: boolean;
	};
	icon: string;
	name: string;
	title: string;
}

export interface MediaProps {
	artist: string;
	track_name: string;
	creator: string;
	video_name: string;
	album?: string;
	time?: number;
	background?: string;
	endtime: number;
	onPausePlay: void;
	onNext?: void;
	onBack?: void;
}

export type websocketUrl = `wss://${string}` | `ws://${string}`;
export interface Libcurl {
	set_websocket: (url: websocketUrl) => void;
	fetch: (...args: any) => Promise<Response>;
	ready: boolean;
	version: {
		lib: string;
		curl: string;
		ssl: string;
		brotli: string;
		nghttp2: string;
		protocols: string[];
		wisp: string;
	};
	wisp: {
		wisp_connections: Record<string, unknown>;
	};
	transport: "wisp";
	copyright: string;
	websocket_url: websocketUrl;
	events: Record<string, unknown>;
	onload: (callback: () => void) => void;
}

export interface UserSettings {
	wallpaper: string;
	wallpaperMode: "cover" | "contain" | "stretch";
	animations: boolean;
	proxy: "Ultraviolet" | "Scramjet";
	transport: string;
	wispServer: websocketUrl | string | any;
	"battery-percent": boolean;
	accent: string;
	windowOptimizations?: boolean;
	showFPS?: boolean;
	times: {
		format: "12h" | "24h";
		internet: boolean;
		showSeconds: boolean;
	};
}

export interface SysSettings {
	theme: string;
	"system-blur": boolean;
	"dock-full": boolean;
	fileAssociatedApps: {
		text: string;
		image: string;
		video: string;
		audio: string;
	};
	location: string;
	weather: {
		unit: string;
	};
	"host-name": string;
	setup: boolean;
	defaultUser: string;
}

export interface COM {
	registry: any;
	sh: any;
	battery: {
		showPercentage(): void;
		hidePercentage(): void;
		canUse(): Promise<boolean>;
	};
	launcher: {
		addApp(props: launcherProps): Promise<boolean>;
		removeApp(name: string): Promise<boolean>;
	};
	/** @deprecated API Stub for legacy applications */
	theme: {
		get(): Promise<any>;
		set(data: any): Promise<boolean>;
	};
	desktop: {
		preferences: {
			setTheme(color: string): Promise<void>;
			theme(): void;
			setAccent(color: string): Promise<void>;
			getAccent(): Promise<string>;
		};
		wallpaper: {
			set(path: string): Promise<void>;
			contain(): Promise<void>;
			stretch(): Promise<void>;
			cover(): Promise<void>;
			fillMode(): Promise<any>;
		};
		dock: {
			pin(app: any): void;
			unpin(app: any): void;
		};
	};
	window: {
		getId(): void;
		create(props: WindowConfig): void;
		content: {
			get(): void;
			set(html: string | HTMLElement): void;
		};
		titlebar: {
			setColor(hex: string): void;
			setText(text: string): void;
			setBackgroundColor(hex: string): void;
		};
		island: {
			addControl(args: any): void;
			removeControl(control_id: string): void;
		};
		changeSrc(src: string): void;
		reload(): void;
		minimize(): void;
		maximize(): void;
		close(): void;
	};
	contextmenu: {
		create(props: cmprops): void;
		close(): void;
	};
	user: {
		username(): Promise<string>;
		pfp(): Promise<string>;
	};
	proxy: {
		get(): Promise<"Ultraviolet" | "Scramjet">;
		set(proxy: string): Promise<boolean>;
		updateSWs(): Promise<void>;
		encode(url: string, encoder: string): Promise<string>;
		decode(url: string, decoder: string): Promise<string>;
	};
	notification: {
		Message(props: NotificationProps): void;
		Toast(props: NotificationProps): void;
		Installing(props: NotificationProps): void;
	};
	dialog: {
		Alert(props: dialogProps): void;
		Message(props: dialogProps): void;
		Select(props: dialogProps): void;
		Auth(iprops: dialogProps, options: { sudo: boolean }): void;
		Permissions(props: dialogProps): void;
		FileBrowser(props: dialogProps): void;
		DirectoryBrowser(props: dialogProps): void;
		SaveFile(props: dialogProps): void;
		Cropper(props: dialogProps): void;
		WebAuth(props: dialogProps): void;
	};
	system: {
		version(): string | number | unknown;
		instance: System["instance"];
		openApp(pkg: string): Promise<void>;
		download(url: string, location: string): Promise<void>;
		exportfs(): void;
		users: {
			list(): Promise<void>;
			add(user: User): Promise<boolean>;
			remove(id: string): Promise<boolean>;
			update(user: User): Promise<void>;
		};
		bootmenu: {
			addEntry(name: string, file: string): void;
			removeEntry(name: string): void;
		};
	};
	libcurl: Libcurl;
	fflate: any;
	fs: FilerFS;
	crypto(pass: string, file: string): Promise<string>;
	platform: {
		getPlatform(): Promise<"desktop" | "mobile">;
	};
	process: {
		kill(config: string | number | any): void;
		list(): Object;
		create(): void;
		parse: {
			build(src: string): void;
		};
	};
	screen: {
		captureScreen(): Promise<void>;
	};
	mediaplayer: {
		music(props: MediaProps): void;
		video(props: MediaProps): void;
		hide(): void;
		pauseplay(): void;
		isExisting(): void | boolean | Promise<boolean>;
	};
	file: {
		handler: {
			openFile(path: string, type: string): void;
			addHandler(app: string, ext: string): void;
			removeHandler(ext: string): void;
		};
	};
	node: {
		webContainer: import("@webcontainer/api").WebContainer | {};
		servers: Map<number, string>;
		isReady: boolean;
		start: () => void;
		stop(): boolean;
	};
}

// @ts-expect-error: No types
import * as webdav from "../../public/apps/files.tapp/webdav.js";
import { FSType } from "@terbiumos/tfs";

export interface ServerInfo {
	name: string;
	url: string;
	username: string;
	password: string;
}

export interface ServerConnection {
	name: string;
	connected: boolean;
	connection: any | null;
	url: string;
}

export class vFS {
	servers: Map<string, ServerConnection> = new Map();
	currentServer: ServerConnection | null = null;

	private constructor(servers: Map<string, ServerConnection>) {
		this.servers = servers;
		window.tb.fs.watch(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, { recursive: true }, async () => {
			const data: ServerInfo[] = JSON.parse(await window.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
			this.servers.clear();
			this.servers = new Map<string, ServerConnection>(
				data.map(info => [
					info.name,
					{
						name: info.name,
						connected: false,
						connection: null,
						url: info.url,
					},
				]),
			);
			await this.mountAll();
		});
	}

	static async create(): Promise<vFS> {
		const data: ServerInfo[] = JSON.parse(await window.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
		const servers = new Map<string, ServerConnection>();
		for (const info of data) {
			servers.set(info.name, {
				name: info.name,
				connected: false,
				connection: null,
				url: info.url,
			});
		}
		const vfs = new vFS(servers);
		window.addEventListener("libcurl_load", async () => {
			await vfs.mountAll();
		});
		return vfs;
	}

	async mount(serverName: string): Promise<any> {
		const data: ServerInfo[] = JSON.parse(await window.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
		const { url, username, password } = data.find(s => s.name === serverName) || {};
		if (!url) throw new Error(`Server "${serverName}" not found`);
		try {
			const client = webdav.createClient(url, { username, password });
			await client.getDirectoryContents("/");
			this.servers.set(serverName, {
				name: serverName,
				connected: true,
				connection: new vFSOperations(client),
				url,
			});
		} catch (e) {
			this.servers.set(serverName, {
				name: serverName,
				connected: false,
				connection: null,
				url,
			});
			console.warn(`Failed to connect to server "${serverName}":`, e);
		}
	}

	async mountAll(): Promise<void> {
		for (const serverName of this.servers.keys()) {
			await this.mount(serverName);
		}
	}

	async addServer(info: ServerInfo): Promise<void> {
		const davjson = JSON.parse(await window.tb.fs.promises.readFile(`/apps/user/${await window.tb.user.username()}/files/davs.json`, "utf8"));
		davjson.push({
			name: info.name,
			url: info.url,
			username: info.username,
			password: info.password,
		});
		await window.tb.fs.promises.writeFile(`/apps/user/${await window.tb.user.username()}/files/davs.json`, JSON.stringify(davjson, null, 2));
		const config = JSON.parse(await window.tb.fs.promises.readFile(`/apps/user/${await window.tb.user.username()}/files/config.json`, "utf8"));
		config.drives[info.name] = `/mnt/${info.name}/`;
		await window.tb.fs.promises.writeFile(`/apps/user/${await window.tb.user.username()}/files/config.json`, JSON.stringify(config, null, 2));
		window.tb.notification.Toast({
			application: "System",
			iconSrc: "/fs/apps/system/about.tapp/icon.svg",
			message: "New Dav Device has been added",
		});
	}

	async removeServer(serverName: string): Promise<void> {
		const davjson = JSON.parse(await window.tb.fs.promises.readFile(`/apps/user/${await window.tb.user.username()}/files/davs.json`, "utf8"));
		const index = davjson.findIndex((entry: any) => entry.name.toLowerCase() === serverName.toLowerCase());
		if (index !== -1) {
			davjson.splice(index, 1);
			await window.tb.fs.promises.writeFile(`/apps/user/${await window.tb.user.username()}/files/davs.json`, JSON.stringify(davjson, null, 2));
			const config = JSON.parse(await window.tb.fs.promises.readFile(`/apps/user/${await window.tb.user.username()}/files/config.json`, "utf8"));
			delete config.drives[serverName.toLowerCase()];
			await window.tb.fs.promises.writeFile(`/apps/user/${await window.tb.user.username()}/files/config.json`, JSON.stringify(config, null, 2));
			window.tb.notification.Toast({
				application: "System",
				iconSrc: "/fs/apps/system/about.tapp/icon.svg",
				message: "Dav Drive has been removed",
			});
		} else {
			window.tb.notification.Toast({
				application: "System",
				iconSrc: "/fs/apps/system/about.tapp/icon.svg",
				message: "Dav Drive not found",
			});
		}
	}

	setServer(serverName: string): boolean {
		const server = this.servers.get(serverName);
		if (server && server.connected) {
			this.currentServer = server;
			return true;
		}
		return false;
	}

	whatFS(path: string): vFSOperations | FSType {
		if (path.startsWith("/mnt/")) {
			const parts = path.split("/");
			if (parts.length > 2) {
				return this.servers.get(parts[2])?.connection;
			}
		}
		return window.tb.fs;
	}
}

export class vFSOperations {
	client: any;

	constructor(client: any) {
		this.client = client;
	}

	pathtourl(path: string): string {
		if (!path.startsWith("/mnt/")) return path;
		const parts = path.split("/").filter(Boolean);
		if (parts.length < 2) return path;
		const serverName = parts[1];
		const servers: Map<string, any> | undefined = window.tb.vfs.servers;
		const server = servers?.get(serverName);
		if (!server || !server.url) return path;
		const rest = parts.slice(2).join("/");
		const base = server.url.replace(/\/+$/, "");
		return rest ? `${base}/${rest}` : `${base}/`;
	}

	pathtoFSPath(path: string): string {
		if (!path.startsWith("/mnt/")) return path;
		const parts = path.split("/").filter(Boolean);
		if (parts.length < 2) return "/";
		const rest = parts.slice(2).join("/");
		return rest ? `/${rest}` : "/";
	}

	readdir(path: string, callback: (err: any, files?: any[]) => void): void {
		this.client
			.getDirectoryContents(this.pathtoFSPath(path))
			.then((files: any[]) => {
				const basenames = files.map((f: any) => {
					if (typeof f === "string") return f.split("/").filter(Boolean).pop() || "";
					if (f && typeof f.basename === "string") return f.basename;
					if (f && typeof f.filename === "string") return f.filename.split("/").filter(Boolean).pop() || "";
					return "";
				});
				callback(null, basenames);
			})
			.catch((err: any) => callback(err));
	}

	readFile(path: string, callback: (err: any, data?: string) => void): void {
		try {
			this.client
				.getFileContents(this.pathtoFSPath(path), { format: "binary" })
				.then((data: any) => {
					let uint8: Uint8Array | null = null;
					if (data instanceof ArrayBuffer) {
						uint8 = new Uint8Array(data);
					} else if (ArrayBuffer.isView(data)) {
						uint8 = new Uint8Array((data as any).buffer, (data as any).byteOffset || 0, (data as any).byteLength || undefined);
					} else if (typeof data === "string") {
						return callback(null, data);
					} else if (data && data.buffer instanceof ArrayBuffer) {
						uint8 = new Uint8Array(data.buffer);
					} else {
						try {
							const asBuffer = Buffer.isBuffer(data) ? data : null;
							if (asBuffer) uint8 = new Uint8Array(asBuffer);
						} catch (e) {
							return callback(null, data);
						}
					}
					if (!uint8) return callback(null, data);
					const len = Math.min(uint8.length, 512);
					let nonText = 0;
					for (let i = 0; i < len; i++) {
						const ch = uint8[i];
						if (ch === 0) {
							nonText = Infinity;
							break;
						}
						if ((ch >= 7 && ch <= 13) || (ch >= 32 && ch <= 126)) {} else {
							nonText++;
						}
					}
					if (nonText === Infinity || nonText / len > 0.3) {
						// @ts-expect-error
						return callback(null, uint8.buffer);
					} else {
						try {
							const text = new TextDecoder("utf-8", { fatal: false }).decode(uint8);
							return callback(null, text);
						} catch (e) {
							// @ts-expect-error
							return callback(null, uint8.buffer);
						}
					}
				})
				.catch((err: any) => callback(err));
		} catch (err) {
			callback(err);
		}
	}

	writeFile(path: string, data: string | ArrayBuffer, callback: (err: any) => void): void {
		this.client
			.putFileContents(this.pathtoFSPath(path), data)
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	delete(path: string, callback: (err: any) => void): void {
		this.client
			.deleteFile(this.pathtoFSPath(path))
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	rename(oldPath: string, newPath: string, callback: (err: any) => void): void {
		this.client
			.moveFile(this.pathtoFSPath(oldPath), this.pathtoFSPath(newPath))
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	mkdir(path: string, callback: (err: any) => void): void {
		this.client
			.createDirectory(this.pathtoFSPath(path))
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	exists(path: string, callback: (err: any, exists?: boolean) => void): void {
		this.client
			.exists(this.pathtoFSPath(path))
			.then((exists: boolean) => callback(null, exists))
			.catch((err: any) => callback(err));
	}

	stat(path: string, callback: (err: any, stat?: any) => void): void {
		this.client
			.stat(this.pathtoFSPath(path))
			.then((stat: any) => callback(null, stat))
			.catch((err: any) => callback(err));
	}

	copyFile(source: string, destination: string, callback: (err: any) => void): void {
		this.client
			.copyFile(this.pathtoFSPath(source), this.pathtoFSPath(destination))
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	unlink(path: string, callback: (err: any) => void): void {
		this.client
			.deleteFile(this.pathtoFSPath(path))
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	move(source: string, destination: string, callback: (err: any) => void): void {
		this.client
			.moveFile(this.pathtoFSPath(source), this.pathtoFSPath(destination))
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	appendFile(path: string, data: string | ArrayBuffer, callback: (err: any) => void): void {
		this.client
			.getFileContents(this.pathtoFSPath(path), { format: "text" })
			.then((existingData: string) => {
				const newData = existingData + data;
				return this.client.putFileContents(this.pathtoFSPath(path), newData);
			})
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	access(path: string, ...rest: any[]): void {
		this.exists(path, (err, exists) => {
			const callback = rest.pop();
			if (err) return callback(err);
			if (!exists) return callback(new Error("File does not exist"));
			callback(null);
		});
	}

	promises = {
		readdir: (path: string): Promise<any[]> =>
			new Promise((resolve, reject) => {
				this.readdir(path, (err, files) => (err ? reject(err) : resolve(files!)));
			}),
		readFile: (path: string): Promise<string> =>
			new Promise((resolve, reject) => {
				this.readFile(path, (err, data) => (err ? reject(err) : resolve(data!)));
			}),
		writeFile: (path: string, data: string | ArrayBuffer): Promise<void> =>
			new Promise((resolve, reject) => {
				this.writeFile(path, data, err => (err ? reject(err) : resolve()));
			}),
		delete: (path: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.delete(path, err => (err ? reject(err) : resolve()));
			}),
		rename: (oldPath: string, newPath: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.rename(oldPath, newPath, err => (err ? reject(err) : resolve()));
			}),
		mkdir: (path: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.mkdir(path, err => (err ? reject(err) : resolve()));
			}),
		exists: (path: string): Promise<boolean> =>
			new Promise((resolve, reject) => {
				this.exists(path, (err, exists) => (err ? reject(err) : resolve(exists!)));
			}),
		stat: (path: string): Promise<any> =>
			new Promise((resolve, reject) => {
				this.stat(path, (err, stat) => (err ? reject(err) : resolve(stat!)));
			}),
		copyFile: (source: string, destination: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.copyFile(source, destination, err => (err ? reject(err) : resolve()));
			}),
		unlink: (path: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.unlink(path, err => (err ? reject(err) : resolve()));
			}),
		move: (source: string, destination: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.move(source, destination, err => (err ? reject(err) : resolve()));
			}),
		appendFile: (path: string, data: string | ArrayBuffer): Promise<void> =>
			new Promise((resolve, reject) => {
				this.appendFile(path, data, err => (err ? reject(err) : resolve()));
			}),
		access: (path: string, ...rest: any[]): Promise<void> =>
			new Promise((resolve, reject) => {
				this.access(path, ...rest, (err: any) => (err ? reject(err) : resolve()));
			}),
	};
}

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
				return this.servers.get(parts[2])?.connection
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

	readdir(path: string, callback: (err: any, files?: any[]) => void): void {
		this.client.getDirectoryContents(path)
			.then((files: any[]) => callback(null, files))
			.catch((err: any) => callback(err));
	}

	readFile(path: string, callback: (err: any, data?: string) => void): void {
		this.client.getFileContents(path, { format: "text" })
			.then((data: string) => callback(null, data))
			.catch((err: any) => callback(err));
	}

	writeFile(path: string, data: string | ArrayBuffer, callback: (err: any) => void): void {
		this.client.putFileContents(path, data)
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	delete(path: string, callback: (err: any) => void): void {
		this.client.deleteFile(path)
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	rename(oldPath: string, newPath: string, callback: (err: any) => void): void {
		this.client.moveFile(oldPath, newPath)
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	createDirectory(path: string, callback: (err: any) => void): void {
		this.client.createDirectory(path)
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	exists(path: string, callback: (err: any, exists?: boolean) => void): void {
		this.client.exists(path)
			.then((exists: boolean) => callback(null, exists))
			.catch((err: any) => callback(err));
	}

	stat(path: string, callback: (err: any, stat?: any) => void): void {
		this.client.stat(path)
			.then((stat: any) => callback(null, stat))
			.catch((err: any) => callback(err));
	}

	copy(source: string, destination: string, callback: (err: any) => void): void {
		this.client.copyFile(source, destination)
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	unlink(path: string, callback: (err: any) => void): void {
		this.client.deleteFile(path)
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	move(source: string, destination: string, callback: (err: any) => void): void {
		this.client.moveFile(source, destination)
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	appendFile(path: string, data: string | ArrayBuffer, callback: (err: any) => void): void {
		this.client.getFileContents(path, { format: "text" })
			.then((existingData: string) => {
				const newData = existingData + data;
				return this.client.putFileContents(path, newData);
			})
			.then(() => callback(null))
			.catch((err: any) => callback(err));
	}

	promises = {
		readdir: (path: string): Promise<any[]> =>
			new Promise((resolve, reject) => {
				this.readdir(path, (err, files) => err ? reject(err) : resolve(files!));
			}),
		readFile: (path: string): Promise<string> =>
			new Promise((resolve, reject) => {
				this.readFile(path, (err, data) => err ? reject(err) : resolve(data!));
			}),
		writeFile: (path: string, data: string | ArrayBuffer): Promise<void> =>
			new Promise((resolve, reject) => {
				this.writeFile(path, data, err => err ? reject(err) : resolve());
			}),
		delete: (path: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.delete(path, err => err ? reject(err) : resolve());
			}),
		rename: (oldPath: string, newPath: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.rename(oldPath, newPath, err => err ? reject(err) : resolve());
			}),
		createDirectory: (path: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.createDirectory(path, err => err ? reject(err) : resolve());
			}),
		exists: (path: string): Promise<boolean> =>
			new Promise((resolve, reject) => {
				this.exists(path, (err, exists) => err ? reject(err) : resolve(exists!));
			}),
		stat: (path: string): Promise<any> =>
			new Promise((resolve, reject) => {
				this.stat(path, (err, stat) => err ? reject(err) : resolve(stat!));
			}),
		copy: (source: string, destination: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.copy(source, destination, err => err ? reject(err) : resolve());
			}),
		unlink: (path: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.unlink(path, err => err ? reject(err) : resolve());
			}),
		move: (source: string, destination: string): Promise<void> =>
			new Promise((resolve, reject) => {
				this.move(source, destination, err => err ? reject(err) : resolve());
			}),
		appendFile: (path: string, data: string | ArrayBuffer): Promise<void> =>
			new Promise((resolve, reject) => {
				this.appendFile(path, data, err => err ? reject(err) : resolve());
			}),
	}
}

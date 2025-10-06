// @ts-expect-error: No types
import * as webdav from "../../public/apps/files.tapp/webdav.js";

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
}

export class vFSOperations {
	client: any;

	constructor(client: any) {
		this.client = client;
	}

	async readDir(path: string): Promise<any[]> {
		return this.client.getDirectoryContents(path);
	}

	async readFile(path: string): Promise<string> {
		return this.client.getFileContents(path, { format: "text" });
	}

	async writeFile(path: string, data: string | ArrayBuffer): Promise<void> {
		return this.client.putFileContents(path, data);
	}

	async delete(path: string): Promise<void> {
		return this.client.deleteFile(path);
	}

	async rename(oldPath: string, newPath: string): Promise<void> {
		return this.client.moveFile(oldPath, newPath);
	}

	async createDirectory(path: string): Promise<void> {
		return this.client.createDirectory(path);
	}

	async exists(path: string): Promise<boolean> {
		return this.client.exists(path);
	}

	async stat(path: string): Promise<any> {
		return this.client.stat(path);
	}

	async copy(source: string, destination: string): Promise<void> {
		return this.client.copyFile(source, destination);
	}

	async unlink(path: string): Promise<void> {
		return this.client.deleteFile(path);
	}

	async move(source: string, destination: string): Promise<void> {
		return this.client.moveFile(source, destination);
	}
}

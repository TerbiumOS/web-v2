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
		await vfs.mountAll();
		return vfs;
	}

	async mount(serverName: string): Promise<any> {
		const data: ServerInfo[] = JSON.parse(await window.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
		const { url, username, password } = data.find(s => s.name === serverName) || {};
		if (!url) throw new Error(`Server "${serverName}" not found`);
		try {
			const client = webdav.createClient(url, { username, password });
			this.servers.set(serverName, {
				name: serverName,
				connected: true,
				connection: new vFSOperations(client),
				url,
			});
			return new vFSOperations(client);
		} catch (e) {
			this.servers.set(serverName, {
				name: serverName,
				connected: false,
				connection: null,
				url,
			});
			throw new Error(e as string);
		}
	}

	async mountAll(): Promise<void> {
		for (const serverName of this.servers.keys()) {
			await this.mount(serverName);
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

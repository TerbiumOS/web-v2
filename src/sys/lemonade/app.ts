interface AppDetails {
	name: string;
	version: string;
}

export class App {
	private appDetails: AppDetails = {
		name: "Lemonade App",
		version: "1.0.0",
	};

	getName(): string {
		return this.appDetails.name;
	}

	setName(name: string): void {
		this.appDetails.name = name;
	}

	getVersion(): string {
		return this.appDetails.version;
	}

	getPath(name: "home" | "appData" | "userData" | "temp" | "downloads" | "documents" | "desktop"): string {
		const username = sessionStorage.getItem("currAcc") || "user";
		const pathMap: Record<typeof name, string> = {
			home: `/home/${username}`,
			appData: `/apps/user/${username}/`,
			userData: `/home/${username}/lemonade.conf`,
			temp: `/system/temp/`,
			downloads: `/home/${username}/`,
			documents: `/home/${username}/Documents`,
			desktop: `/home/${username}/Desktop`,
		};
		return pathMap[name] || `/home/${username}`;
	}

	getAppPath(): string {
		return "/";
	}

	isReady(): boolean {
		return true;
	}

	whenReady(): Promise<void> {
		return Promise.resolve();
	}

	quit(): void {
		console.log("App quit requested - not implemented in web environment");
	}

	exit(exitCode: number = 0): void {
		console.log(`App exit requested with code ${exitCode} - not implemented in web environment`);
	}

	relaunch(options?: { args?: string[]; execPath?: string }): void {
		console.log("App relaunch requested - not implemented in web environment", options);
		window.location.reload();
	}

	focus(): void {
		window.focus();
	}

	hide(): void {
		console.log("App hide requested - not implemented in web environment");
	}

	show(): void {
		console.log("App show requested - not implemented in web environment");
	}

	setAppLogsPath(path: string): void {
		console.log(`App logs path set to: ${path}`);
	}

	getLocale(): string {
		return navigator.language || "en-US";
	}

	getSystemLocale(): string {
		return navigator.language || "en-US";
	}

	isPackaged(): boolean {
		return false;
	}

	requestSingleInstanceLock(): boolean {
		return true;
	}

	hasSingleInstanceLock(): boolean {
		return true;
	}

	releaseSingleInstanceLock(): void {
		console.log("Single instance lock released");
	}

	setAsDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean {
		console.log(`Setting as default protocol client for ${protocol}`, path, args);
		return false;
	}

	isDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean {
		console.log(`Checking if default protocol client for ${protocol}`, path, args);
		return false;
	}
}

export const app = new App();

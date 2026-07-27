import type { ProcessManager } from "@nightnetwork/dusk";

/**
 * Registry for tracking HTTP server ports and their URLs.
 * Compatible with WebContainer's server-ready event pattern.
 */
export class ServerRegistry {
	private servers: Map<number, string>;
	private _processManager: ProcessManager;

	constructor(processManager: ProcessManager) {
		this.servers = new Map();
		this._processManager = processManager;
	}

	/**
	 * Register a server port and its URL.
	 */
	register(port: number, url: string): void {
		this.servers.set(port, url);
		console.info(`[Dusk Runtime] Server ready on port ${port}: ${url}`);

		// Dispatch event for compatibility with existing code that listens for server-ready
		if (typeof window !== "undefined") {
			window.dispatchEvent(new CustomEvent("dusk-server-ready", { detail: { port, url } }));
		}
	}

	/**
	 * Get the URL for a registered server port.
	 */
	get(port: number): string | undefined {
		return this.servers.get(port);
	}

	/**
	 * Get all registered servers.
	 */
	getAll(): Map<number, string> {
		return new Map(this.servers);
	}

	/**
	 * Unregister a server port.
	 */
	unregister(port: number): void {
		this.servers.delete(port);
		console.info(`[Dusk Runtime] Server removed from port ${port}`);
	}

	/**
	 * Clear all registered servers.
	 */
	clear(): void {
		this.servers.clear();
	}
}

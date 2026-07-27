import { bootRepl, type BootReplResult } from "@nightnetwork/dusk";
import { setupNetworking } from "./networkConfig";
import { ServerRegistry } from "./util/serverRegistry";

let duskInstance: BootReplResult | null = null;
let serverRegistry: ServerRegistry | null = null;
let duskProcessPid: number | null = null;

/**
 * Initialize the Dusk runtime with shared TFS filesystem and Nova networking.
 * Requires Cross-Origin Isolation (COOP + COEP headers) to be set on the server.
 * @returns Promise resolving to BootReplResult
 * @throws Error if Cross-Origin Isolation is not enabled or initialization fails
 */
export async function initializeDusk(): Promise<BootReplResult> {
	if (duskInstance) {
		console.warn("[Dusk Runtime] Already initialized");
		return duskInstance;
	}

	try {
		if (!crossOriginIsolated) {
			throw new Error("Dusk requires Cross-Origin Isolation. " + "Ensure COOP: same-origin and COEP: require-corp headers are set correctly.");
		}

		if (typeof SharedArrayBuffer === "undefined") {
			throw new Error("SharedArrayBuffer is not available. Check browser compatibility.");
		}
		console.info("[Dusk Runtime] Initializing...");
		const username = await window.tb.user.username();
		const netConfig = await setupNetworking();
		duskInstance = await bootRepl(
			(text: string) => {
				console.log("[Dusk]", text);
			},
			{
				net: netConfig,
				fs: "tfs",
				layout: true,
				user: username,
				hostname: "terbium",
				skipPidZero: false,
				via: "startRepl",
			},
		);
		serverRegistry = new ServerRegistry(duskInstance.processManager);
		duskProcessPid = window.tb.process.create("runtime", {
			name: "Terbium Dusk Runtime",
			wid: null,
			src: null,
			size: null,
			icon: null,
			onKill: () => {
				stopDusk().catch(err => console.error("[Dusk Runtime] Error during process kill:", err));
			},
		});

		console.info("[Dusk Runtime] Initialized successfully!");
		return duskInstance;
	} catch (error) {
		duskInstance = null;
		serverRegistry = null;
		console.error("[Dusk Runtime] Initialization failed:", error);
		if (typeof window !== "undefined" && window.tb && window.tb.notification && typeof window.tb.notification.Toast === "function") {
			window.tb.notification.Toast({
				application: "Dusk Runtime",
				iconSrc: "/assets/img/defualt - blue.png",
				message: `Failed to initialize: ${error instanceof Error ? error.message : "Unknown error"}`,
			});
		}

		throw error;
	}
}

/**
 * Stop the Dusk runtime and clean up all resources.
 * @returns Promise resolving to true if stopped successfully
 * @throws Error if no runtime is running
 */
export async function stopDusk(): Promise<boolean> {
	if (!duskInstance) {
		throw new Error("No Dusk runtime is running");
	}
	try {
		console.info("[Dusk Runtime] Stopping...");
		await duskInstance.engine.terminate();
		duskInstance = null;
		serverRegistry = null;
		if (duskProcessPid !== null && window.tb?.process?.procs) {
			delete window.tb.process.procs[duskProcessPid];
		}
		duskProcessPid = null;
		console.info("[Dusk Runtime] Stopped");
		return true;
	} catch (error) {
		duskInstance = null;
		serverRegistry = null;
		console.error("[Dusk Runtime] Stop failed:", error);
		throw error;
	}
}

/**
 * Get the current Dusk runtime instance, or null if not initialized.
 */
export function getDuskInstance(): BootReplResult | null {
	return duskInstance;
}

/**
 * Get the server registry instance, or null if not initialized.
 */
export function getServerRegistry(): ServerRegistry | null {
	return serverRegistry;
}

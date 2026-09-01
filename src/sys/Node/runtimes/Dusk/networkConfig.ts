import novaInit, { LibCurl } from "@nightnetwork/nova";
import type { BootReplNetOptions } from "@nightnetwork/dusk";
import { wispServerUrl, type UserSettings } from "../../../types";

let novaInitialized = false;

/**
 * Setup networking configuration for Dusk with Nova HTTP client.
 * @param proxyUrl Optional custom Wisp proxy URL (overrides default)
 * @returns Promise resolving to BootReplNetOptions
 */
export async function setupNetworking(proxyUrl?: string): Promise<BootReplNetOptions> {
	try {
		if (!novaInitialized) {
			await novaInit();
			novaInitialized = true;
			console.info("[Dusk Net] Nova HTTP client initialized");
		}
		const wispUrl = proxyUrl ?? (await getDefaultWispProxyUrl());
		const netConfig: BootReplNetOptions = {
			loadLibcurl: async () => {
				return new LibCurl();
			},
			proxyUrl: wispUrl,
		};
		console.info(`[Dusk Net] Using Wisp server: ${wispUrl}`);
		return netConfig;
	} catch (error) {
		console.error("[Dusk Net] Failed to setup networking:", error);
		throw new Error(`Network configuration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

/**
 * Get the default Wisp proxy URL with priority order:
 * 1. VITE_WISP_SERVER environment variable (for static hosting)
 * 2. User's configured wispServer from Terbium settings
 * 3. Built-in Wisp server on same origin
 */
export async function getDefaultWispProxyUrl(): Promise<string> {
	if (import.meta.env.VITE_WISP_SERVER) {
		return import.meta.env.VITE_WISP_SERVER as string;
	}
	try {
		if (typeof window !== "undefined" && window.tb) {
			const username = await window.tb.user.username();
			const raw = await window.tb.fs.promises.readFile(`/home/${username}/settings.json`, "utf8");
			const settings: UserSettings = JSON.parse(raw as string);
			if (settings?.wispServer) {
				return settings.wispServer;
			}
		}
	} catch {
		console.warn("[Dusk Net] Could not read Wisp server from settings, using built-in");
	}
	return wispServerUrl;
}

import { WebContainer } from "@webcontainer/api";
import getFileTree from "./util/getFileTree";

/**
 * Initialize and boot WebContainer with mounted file tree mirrored from Terbium's FS
 * @returns Promise resolving to WebContainer instance
 */
export async function initializeWebContainer(): Promise<WebContainer> {
	const webContainer = await WebContainer.boot();

	// Start the Nodebox runtime and setup FS mirroring from Terbium's FS on it
	const fileTree = await getFileTree();
	await webContainer.mount(fileTree);

	if (!window.tb.node.servers) {
		window.tb.node.servers = new Map<number, string>();
	}

	webContainer.on("server-ready", (port, url) => {
		window.tb.node.servers.set(port, url);
		console.info(`[Node.js Subsystem] Server ready on port ${port}: ${url}`);
	});

	console.info("[Node.js Subsystem] WebContainer has been initialized!");
	window.tb.node.isReady = true;
	window.tb.process.create("runtime", {
		name: "Terbium Node.js Runtime",
		wid: null,
		src: null,
		size: null,
		icon: null,
		onKill: () => {
			window.tb.node.stop();
		}
	});

	return webContainer;
}

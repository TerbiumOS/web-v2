declare module "libcurl.js" {
	export type websocketUrl = `wss://${string}` | `ws://${string}`;
	export const libcurl: {
		set_websocket: (url: websocketUrl) => void;
		fetch: (...args) => Promise<Response>;
		load_wasm: (wasmPath: string) => Promise<void>;
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
	};
}

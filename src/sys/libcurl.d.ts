declare module "libcurl.js" {
	export * from "libcurl.js/bundled";
	export { default } from "libcurl.js/bundled";
}
declare module "libcurl.js/bundled" {
	export type WebsocketUrl = `wss://${string}` | `ws://${string}`;
	export type ProxyUrl = `socks5h://${string}` | `socks4a://${string}` | `http://${string}`;
	export interface LibcurlVersion {
		lib: string;
		curl: string;
		ssl: string;
		brotli: string;
		nghttp2: string;
		protocols: string[];
		wisp: string;
	}
	export interface HTTPSessionOptions {
		enable_cookies?: boolean;
		cookie_jar?: string;
		proxy?: ProxyUrl;
	}
	export interface SessionOptions {
		proxy?: ProxyUrl;
		verbose?: boolean;
		headers?: Record<string, string> | Headers;
	}
	export interface WebSocketOptions extends SessionOptions {
		proxy?: ProxyUrl;
	}
	export interface TLSSocketOptions extends SessionOptions {
		verbose?: boolean;
	}
	export interface RequestCallbacks {
		end: (error: number) => void;
		data: (chunk: Uint8Array) => void;
		headers: (chunk: Uint8Array) => void;
	}
	export class HeadersDict {
		constructor(obj: Record<string, string>);
		[key: string]: string;
	}
	export class CurlSession {
		constructor(options?: SessionOptions);
		session_ptr: number;
		active_requests: number;
		event_loop: null | any;
		requests_list: unknown[];
		to_remove: unknown[];
		end_callback_ptr: number;
		headers_callback_ptr: number;
		data_callback_ptr: number;
		request_callbacks: Record<string, RequestCallbacks>;
		last_request_id: number;
		options: SessionOptions;
		assert_ready(): void;
		set_connections(connections_limit: number, cache_limit: number, host_conn_limit?: number): void;
		end_callback(request_id: number, error: number): void;
		data_callback(request_id: number, chunk_ptr: number, chunk_size: number): void;
		headers_callback(request_id: number, chunk_ptr: number, chunk_size: number): void;
		create_request(url: string, js_data_callback: (chunk: Uint8Array) => void, js_end_callback: (error: number) => void, js_headers_callback: (chunk: Uint8Array) => void): number;
		remove_request_now(request_ptr: number): void;
		remove_request(request_ptr: number): void;
		start_request(request_ptr: number): void;
		close(): void;
	}
	export class HTTPSession extends CurlSession {
		constructor(options?: HTTPSessionOptions);
		base_url?: string;
		cookie_filename: string;
		import_cookies(): void;
		export_cookies(): string;
		close(): void;
		request_async(url: string, params: RequestInit, body?: Uint8Array): Promise<Response>;
		fetch(resource: string | URL | Request, params?: RequestInit): Promise<Response>;
		static create_response(response_data: Uint8Array | null, response_info: any): Response;
		static create_options(params: RequestInit): Promise<Uint8Array | null>;
	}
	export class CurlWebSocket extends CurlSession {
		constructor(url: WebsocketUrl, protocols?: string[], options?: WebSocketOptions);
		url: WebsocketUrl;
		protocols: string[];
		connected: boolean;
		recv_loop: number | null;
		http_handle: number | null;
		recv_buffer: unknown[];
		onopen: () => void;
		onerror: (error?: any) => void;
		onmessage: (data: string | Uint8Array) => void;
		onclose: () => void;
		connect(): void;
		send(data: string | Uint8Array): void;
		recv(): string | Uint8Array | null;
		close(): void;
		cleanup(error?: boolean | number): void;
	}
	export class FakeWebSocket extends EventTarget {
		constructor(url: WebsocketUrl, protocols?: string[], options?: WebSocketOptions);
		readonly CONNECTING: 0;
		readonly OPEN: 1;
		readonly CLOSING: 2;
		readonly CLOSED: 3;
		url: WebsocketUrl;
		protocols: string[];
		options: WebSocketOptions;
		binaryType: "blob" | "arraybuffer";
		status: 0 | 1 | 2 | 3;
		socket: CurlWebSocket | null;
		onopen: (event: Event) => void;
		onerror: (event: Event) => void;
		onmessage: (event: MessageEvent) => void;
		onclose: (event: CloseEvent) => void;
		connect(): void;
		send(data: string | Blob | ArrayBuffer | ArrayBufferView): void;
		close(): void;
	}
	export class TLSSocket extends CurlSession {
		constructor(hostname: string, port: number, options?: TLSSocketOptions);
		hostname: string;
		port: number;
		url: string;
		connected: boolean;
		recv_loop: number | null;
		onopen: () => void;
		onerror: (error?: any) => void;
		onmessage: (data: Uint8Array) => void;
		onclose: () => void;
		connect(): void;
		send(data: string | Uint8Array): void;
		recv(): Uint8Array | null;
		close(): void;
		cleanup(error?: boolean | number): void;
	}
	export interface WispConnection {
		[key: string]: unknown;
	}
	export class WispWebSocket {
		constructor(url: WebsocketUrl);
	}
	export function logger(type: "log" | "warn" | "error", text: string): void;
	export function log_msg(text: string): void;
	export function warn_msg(text: string): void;
	export function error_msg(text: string): void;
	export function data_to_array(data: string | ArrayBuffer | ArrayBufferView | Uint8Array): Uint8Array;
	export function merge_arrays(arrays: Uint8Array[]): Uint8Array;
	export function get_error_str(error_code: number): string;
	export function c_func(target: Function, args?: any[]): any;
	export function c_func_str(target: Function, args?: any[]): string;
	export const libcurl: {
		set_websocket: (url: WebsocketUrl) => void;
		fetch: (resource: string | URL | Request, params?: RequestInit) => Promise<Response>;
		load_wasm: (wasmPath: string) => Promise<void>;
		get_cacert: () => string;
		get_error_string: (error_code: number) => string;
		ready: boolean;
		websocket_url: WebsocketUrl | null;
		transport: "wisp" | "wsproxy" | string | Function;
		copyright: string;
		version: LibcurlVersion | null;
		HTTPSession: typeof HTTPSession;
		WebSocket: typeof FakeWebSocket;
		CurlWebSocket: typeof CurlWebSocket;
		TLSSocket: typeof TLSSocket;
		wisp: {
			wisp_connections: Record<string, WispConnection>;
			WispConnection: typeof WispConnection;
			WispWebSocket: typeof WispWebSocket;
		};
		stdout: (text: string) => void;
		stderr: (text: string) => void;
		logger: (type: "log" | "warn" | "error", text: string) => void;
		events: EventTarget;
		onload: (callback?: () => void) => void;
	};
	export default libcurl;
}

import type { ProxyTransport, RawHeaders, TransferrableResponse, WebSocketDataType } from "@mercuryworkshop/proxy-transports";

function normalizeHeaders(headers: HeadersInit | RawHeaders | undefined): RawHeaders {
	if (!headers) return [];
	if (headers instanceof Headers) return [...headers.entries()];
	if (Array.isArray(headers)) return headers;

	const rawHeaders: RawHeaders = [];
	for (const [key, value] of Object.entries(headers)) {
		if (Array.isArray(value)) {
			for (const item of value) rawHeaders.push([key, item]);
		} else {
			rawHeaders.push([key, value]);
		}
	}

	return rawHeaders;
}

export class AnuraBareClient implements ProxyTransport {
	ready = true;

	constructor(_options?: unknown) {}

	async init() {
		this.ready = true;
	}

	async request(remote: URL, method: string, body: BodyInit | null, headers: RawHeaders, signal: AbortSignal | undefined): Promise<TransferrableResponse> {
		const payload = await window.anura.net.fetch(remote.href, {
			method,
			headers,
			body,
			signal,
			redirect: "manual",
			duplex: "half",
		});

		return {
			body: payload.body!,
			headers: normalizeHeaders(payload.raw_headers ?? payload.headers),
			status: payload.status,
			statusText: payload.statusText,
		};
	}

	connect(
		url: URL,
		protocols: string[],
		requestHeaders: RawHeaders,
		onopen: (protocol: string, extensions: string) => void,
		onmessage: (data: WebSocketDataType) => void,
		onclose: (code: number, reason: string) => void,
		onerror: (error: string) => void,
	): [(data: WebSocketDataType) => void, (code: number, reason: string) => void] {
		//@ts-ignore
		const socket = new window.anura.net.WebSocket(url.toString(), protocols, {
			headers: requestHeaders,
		});
		socket.binaryType = "arraybuffer";

		socket.onopen = () => {
			onopen(socket.protocol ?? "", socket.extensions ?? "");
		};
		socket.onclose = (event: CloseEvent) => {
			onclose(event.code, event.reason);
		};
		socket.onerror = (event: Event) => {
			onerror(event instanceof ErrorEvent ? event.message : "");
		};
		socket.onmessage = (event: MessageEvent) => {
			onmessage(event.data);
		};

		return [
			(data: WebSocketDataType) => {
				socket.send(data);
			},
			(code, reason) => {
				socket.close(code, reason);
			},
		];
	}
}

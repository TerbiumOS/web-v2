interface RequestOptions {
	method?: string;
	headers?: Record<string, string>;
	body?: any;
	redirect?: "follow" | "error" | "manual";
	signal?: AbortSignal;
	timeout?: number;
}

export class Net {
	async request(url: string, options: RequestOptions = {}): Promise<Response> {
		const controller = options.timeout ? new AbortController() : null;
		const timeoutId = options.timeout
			? setTimeout(() => controller?.abort(), options.timeout)
			: null;

		try {
			const response = await window.tb.libcurl.fetch(url, {
				method: options.method || "GET",
				headers: options.headers || {},
				body: options.body ? JSON.stringify(options.body) : undefined,
				signal: options.signal || controller?.signal,
			});
			return response;
		} finally {
			if (timeoutId) clearTimeout(timeoutId);
		}
	}

	fetch(url: string, options: RequestOptions = {}): Promise<Response> {
		return this.request(url, options);
	}

	isOnline(): boolean {
		return navigator.onLine;
	}

	getOnlineStatus(): "online" | "offline" {
		return navigator.onLine ? "online" : "offline";
	}

	createClientRequest(options: { url?: string; method?: string; protocol?: string; host?: string; port?: number; path?: string }): any {
		const url = options.url || `${options.protocol || "https:"}//${options.host}${options.port ? `:${options.port}` : ""}${options.path || "/"}`;
		const method = options.method || "GET";

		const request = {
			url,
			method,
			headers: {} as Record<string, string>,
			body: null as any,
			setHeader: (name: string, value: string) => {
				request.headers[name] = value;
			},
			write: (chunk: any) => {
				request.body = request.body ? request.body + chunk : chunk;
			},
			end: async () => {
				return await this.request(url, {
					method,
					headers: request.headers,
					body: request.body,
				});
			},
			abort: () => {
				console.log("Request aborted");
			},
			on: (event: string, _listener: Function) => {
				console.log(`Event listener added for: ${event}`);
			},
		};

		return request;
	}
}

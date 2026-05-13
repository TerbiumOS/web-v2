import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type * as ScramjetGlobal from "@mercuryworkshop/scramjet";
import type { CookieSyncOptions, CookieSyncEntry, ScramjetConfig, ScramjetContext, ScramjetFetchHandler } from "@mercuryworkshop/scramjet";
import { BareResponse, type ProxyTransport, type RawHeaders } from "@mercuryworkshop/proxy-transports";

declare const $scramjet: typeof ScramjetGlobal;

type ScramjetController = {
	config: {
		scramjetPath: string;
		injectPath: string;
		wasmPath: string;
		virtualWasmPath: string;
		codec: {
			encode: (input: string) => string;
			decode: (input: string) => string;
		};
	};
	scramjetConfig: ScramjetConfig;
	prefix: string;
	cookieJar: {
		dump: () => string;
	};
	transport: ProxyTransport;
	frames: ScramjetControllerFrame[];
	wait?: () => Promise<void>;
	persistCookies: () => Promise<void>;
	propagateCookieSync: (cookies: Array<{ url: string; cookie: string }>, options?: CookieSyncOptions) => Promise<void>;
};

type FrameInitHooks = {
	pre: {
		context: {
			window: Window;
			client: unknown;
			isTopLevel: boolean;
		};
		props: Record<string, never>;
	};
	post: {
		context: {
			window: Window;
			client: unknown;
			isTopLevel: boolean;
		};
		props: Record<string, never>;
	};
};

export type ScramjetControllerFrame = {
	controller: ScramjetController;
	element: HTMLIFrameElement;
	id: string;
	prefix: string;
	fetchHandler: ScramjetFetchHandler;
	hooks: {
		fetch: ScramjetFetchHandler["hooks"]["fetch"];
		frameInit: ScramjetGlobal.TapInstance<FrameInitHooks>;
	};
	context: ScramjetContext;
	download: ScramjetDownloadHandler;
	back: () => void;
	forward: () => void;
	reload: () => void;
	go: (url: string) => void;
};

export type ScramjetFrameHandle = {
	iframe: HTMLIFrameElement | null;
	frame: ScramjetControllerFrame | null;
	back: () => void;
	forward: () => void;
	reload: () => void;
	go: (url: string) => void;
};

export type ScramjetDownload = {
	url: string;
	filename: string;
	body: BodyInit | ScramjetGlobal.BodyType | null;
	headers?: Headers | RawHeaders;
};

export type ScramjetDownloadHandler = (download: ScramjetDownload) => Promise<void>;

export type ScramjetFrameProps = Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, "ref" | "src"> & {
	url?: string;
	controller?: ScramjetController;
	onDownload?: ScramjetDownloadHandler;
	onFrameReady?: (frame: ScramjetControllerFrame) => void;
	onFrameDestroy?: (frame: ScramjetControllerFrame) => void;
};

const CONTROLLER_FRAME = Symbol.for("controller frame handle");

function makeId(): string {
	return Math.random().toString(36).substring(2, 10);
}

function base64Encode(text: string): string {
	return btoa(
		new TextEncoder()
			.encode(text)
			.reduce<string[]>((data, byte) => {
				data.push(String.fromCharCode(byte));
				return data;
			}, [])
			.join(""),
	);
}

function rawHeadersToHeaders(rawHeaders?: Headers | RawHeaders): Headers {
	const headers = new Headers();
	if (!rawHeaders) return headers;
	if (rawHeaders instanceof Headers) return rawHeaders;

	for (const [key, value] of rawHeaders) {
		headers.append(key, value);
	}

	return headers;
}

function getHeader(rawHeaders: Headers | RawHeaders | undefined, headerName: string): string | null {
	return rawHeadersToHeaders(rawHeaders).get(headerName);
}

function parseContentDispositionFilename(contentDisposition: string | null): string | null {
	if (!contentDisposition) return null;

	const encodedMatch = contentDisposition.match(/filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i);
	if (encodedMatch?.[1]) {
		try {
			return decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, ""));
		} catch {
			return encodedMatch[1].trim().replace(/^"|"$/g, "");
		}
	}

	const filenameMatch = contentDisposition.match(/filename\s*=\s*("[^"]+"|[^;]+)/i);
	return filenameMatch?.[1]?.trim().replace(/^"|"$/g, "") || null;
}

function getFilenameFromUrl(url: string): string {
	try {
		const pathname = new URL(url, location.href).pathname;
		const filename = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
		return filename || "download";
	} catch {
		return "download";
	}
}

function sanitizeFilename(filename: string): string {
	return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim() || "download";
}

async function bodyToUint8Array(body: ScramjetDownload["body"]): Promise<Uint8Array> {
	if (!body) return new Uint8Array();
	if (body instanceof Uint8Array) return body;
	if (body instanceof ArrayBuffer) return new Uint8Array(body);
	if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
	if (body instanceof ReadableStream) {
		const response = new Response(body);
		return new Uint8Array(await response.arrayBuffer());
	}
	if (body instanceof URLSearchParams || body instanceof FormData) {
		return new TextEncoder().encode(body.toString());
	}
	if (typeof body === "string") return new TextEncoder().encode(body);

	return new Uint8Array(await new Response(body).arrayBuffer());
}

async function defaultDownloadHandler({ filename, body }: ScramjetDownload): Promise<void> {
	const safeFilename = sanitizeFilename(filename);
	const user = await window.tb.user.username();
	const defaultDir = user ? `/home/${user}/downloads` : "/";
	const data = await bodyToUint8Array(body);

	await new Promise<void>((resolve, reject) => {
		window.tb.dialog.SaveFile({
			title: "Save download",
			defualtDir: defaultDir,
			filename: safeFilename,
			onOk: async (path: string) => {
				try {
					const bufferFactory = window.tb.buffer as { from?: (value: ArrayBuffer | Uint8Array) => unknown } | undefined;
					const fileData = bufferFactory?.from ? bufferFactory.from(data) : data;
					await window.tb.fs.promises.writeFile(path, fileData as any, "arraybuffer");
					resolve();
				} catch (error) {
					reject(error);
				}
			},
			onCancel: () => resolve(),
		});
	});
}

function yieldGetInjectScripts(config: ScramjetController["config"], sjconfig: ScramjetConfig, prefix: URL, cookieJar: ScramjetController["cookieJar"], codecEncode: (input: string) => string, codecDecode: (input: string) => string): ScramjetContext["interface"]["getInjectScripts"] {
	return (meta, handler, htmlcontext, script) => {
		void meta;
		void handler;

		return [
			script(config.scramjetPath),
			script(prefix.href + config.virtualWasmPath),
			script(config.injectPath),
			script(
				"data:text/javascript;charset=utf-8;base64," +
					base64Encode(`
					document.querySelectorAll("script[scramjet-injected]").forEach(script => script.remove());
					$scramjetController.load({
						config: ${JSON.stringify(config)},
						sjconfig: ${JSON.stringify(sjconfig)},
						prefix: new URL("${prefix.href}"),
						cookies: ${JSON.stringify(cookieJar.dump())},
						yieldGetInjectScripts: ${yieldGetInjectScripts.toString()},
						codecEncode: ${codecEncode.toString()},
						codecDecode: ${codecDecode.toString()},
						initHeaders: ${JSON.stringify(htmlcontext.headers ?? [])},
						history: ${JSON.stringify(htmlcontext.history ?? [])},
					})
				`),
			),
		];
	};
}

function createReactScramjetFrame(controller: ScramjetController, element: HTMLIFrameElement, downloadHandler: ScramjetDownloadHandler): ScramjetControllerFrame {
	const id = makeId();
	const prefix = controller.prefix + id + "/";

	const frame = {
		controller,
		element,
		id,
		prefix,
		get context(): ScramjetContext {
			return {
				config: controller.scramjetConfig,
				prefix: new URL(prefix, location.href),
				cookieJar: controller.cookieJar as ScramjetContext["cookieJar"],
				interface: {
					getInjectScripts: yieldGetInjectScripts(controller.config, controller.scramjetConfig, new URL(prefix, location.href), controller.cookieJar, controller.config.codec.encode, controller.config.codec.decode),
					getWorkerInjectScripts: (meta, type, script) => {
						void meta;
						void type;

						let source = "";
						source += script(controller.config.scramjetPath);
						source += script(prefix + controller.config.virtualWasmPath);
						source += script(
							"data:text/javascript;charset=utf-8;base64," +
								base64Encode(`
					(() => {
						const { ScramjetClient, setWasm } = $scramjet;

						setWasm(Uint8Array.from(atob(self.WASM), (c) => c.charCodeAt(0)));
						delete self.WASM;

						const sjconfig = ${JSON.stringify(controller.scramjetConfig)};
						const prefix = new URL("${prefix}", location.href);

						const context = {
							config: sjconfig,
							prefix,
							interface: {
								codecEncode: ${controller.config.codec.encode.toString()},
								codecDecode: ${controller.config.codec.decode.toString()},
							},
						};

						const client = new ScramjetClient(globalThis, {
							context,
							transport: null,
							shouldPassthroughWebsocket: () => false,
						});

						client.hook();
					})();
					`),
						);

						return source;
					},
					codecEncode: controller.config.codec.encode,
					codecDecode: controller.config.codec.decode,
				},
			};
		},
		fetchHandler: undefined as unknown as ScramjetFetchHandler,
		hooks: undefined as unknown as {
			fetch: ScramjetFetchHandler["hooks"]["fetch"];
			frameInit: ScramjetGlobal.TapInstance<FrameInitHooks>;
		},
		download: downloadHandler,
		back() {
			element.contentWindow?.history.back();
		},
		forward() {
			element.contentWindow?.history.forward();
		},
		reload() {
			element.contentWindow?.location.reload();
		},
		go(url: string) {
			element.src = $scramjet.rewriteUrl(url, this.context, {
				origin: new URL(location.href) as ScramjetGlobal.URLMeta["origin"],
				base: new URL(location.href) as ScramjetGlobal.URLMeta["base"],
			});
		},
	} satisfies ScramjetControllerFrame;

	frame.fetchHandler = new $scramjet.ScramjetFetchHandler({
		crossOriginIsolated: self.crossOriginIsolated,
		context: frame.context,
		transport: controller.transport,
		async sendSetCookie(cookies: CookieSyncEntry[], options?: CookieSyncOptions) {
			await controller.persistCookies();
			await controller.propagateCookieSync(
				cookies.map(({ url, cookie }) => ({
					url: url.href,
					cookie,
				})),
				options,
			);
		},
		async fetchBlobUrl(url: string) {
			return BareResponse.fromNativeResponse(await fetch(url));
		},
		async fetchDataUrl(url: string) {
			return BareResponse.fromNativeResponse(await fetch(url));
		},
	});

	frame.hooks = {
		fetch: frame.fetchHandler.hooks.fetch,
		frameInit: $scramjet.Tap.create<FrameInitHooks>(),
	};

	const downloadPlugin = new $scramjet.Plugin("terbium-download-handler");
	downloadPlugin.tap(frame.hooks.fetch.response, async (context, props) => {
		const disposition = getHeader(props.response.headers.toRawHeaders(), "content-disposition");
		if (!disposition || !/\battachment\b/i.test(disposition)) return;

		const filename = sanitizeFilename(parseContentDispositionFilename(disposition) ?? getFilenameFromUrl(context.request.rawUrl.href));
		await frame.download({
			url: context.request.rawUrl.href,
			filename,
			body: props.response.body,
			headers: props.response.headers.toRawHeaders(),
		});

		props.response = {
			body: "",
			headers: $scramjet.ScramjetHeaders.fromRawHeaders([["Content-Type", "text/plain"]]),
			status: 204,
			statusText: "No Content",
		};
	});

	(element as HTMLIFrameElement & { [CONTROLLER_FRAME]?: ScramjetControllerFrame })[CONTROLLER_FRAME] = frame;

	return frame;
}

function getDefaultController(): ScramjetController | undefined {
	return window.scramjetTb?.controller as unknown as ScramjetController | undefined;
}

export const ScramjetFrame = forwardRef<ScramjetFrameHandle, ScramjetFrameProps>(({ url, controller, onDownload, onFrameReady, onFrameDestroy, ...iframeProps }, ref) => {
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const frameRef = useRef<ScramjetControllerFrame | null>(null);
	const onDownloadRef = useRef(onDownload);
	const onFrameReadyRef = useRef(onFrameReady);
	const onFrameDestroyRef = useRef(onFrameDestroy);
	const [isReady, setIsReady] = useState(false);
	const [resolvedController, setResolvedController] = useState<ScramjetController | undefined>(() => controller ?? getDefaultController());

	useEffect(() => {
		onDownloadRef.current = onDownload;
		onFrameReadyRef.current = onFrameReady;
		onFrameDestroyRef.current = onFrameDestroy;
	}, [onDownload, onFrameDestroy, onFrameReady]);

	useEffect(() => {
		if (controller) {
			setResolvedController(controller);
			return;
		}

		const currentController = getDefaultController();
		if (currentController) {
			setResolvedController(currentController);
			return;
		}

		const interval = window.setInterval(() => {
			const nextController = getDefaultController();
			if (!nextController) return;

			setResolvedController(nextController);
			window.clearInterval(interval);
		}, 50);

		return () => window.clearInterval(interval);
	}, [controller]);

	useImperativeHandle(
		ref,
		() => ({
			get iframe() {
				return iframeRef.current;
			},
			get frame() {
				return frameRef.current;
			},
			back: () => frameRef.current?.back(),
			forward: () => frameRef.current?.forward(),
			reload: () => frameRef.current?.reload(),
			go: (targetUrl: string) => frameRef.current?.go(targetUrl),
		}),
		[],
	);

	useEffect(() => {
		const element = iframeRef.current;
		if (!element || !resolvedController) return;

		let disposed = false;

		void (async () => {
			await resolvedController.wait?.();
			if (disposed) return;

			const frame = createReactScramjetFrame(resolvedController, element, async download => {
				await (onDownloadRef.current ?? defaultDownloadHandler)(download);
			});
			frameRef.current = frame;
			resolvedController.frames.push(frame);
			setIsReady(true);
			onFrameReadyRef.current?.(frame);
		})();

		return () => {
			disposed = true;
			const frame = frameRef.current;
			if (!frame) return;

			const frameIndex = resolvedController.frames.indexOf(frame);
			if (frameIndex !== -1) resolvedController.frames.splice(frameIndex, 1);
			delete (
				element as HTMLIFrameElement & {
					[CONTROLLER_FRAME]?: ScramjetControllerFrame;
				}
			)[CONTROLLER_FRAME];
			frameRef.current = null;
			setIsReady(false);
			onFrameDestroyRef.current?.(frame);
		};
	}, [resolvedController]);

	useEffect(() => {
		if (!url || !isReady) return;
		frameRef.current?.go(url);
	}, [isReady, url]);

	return <iframe className="w-full h-full" {...iframeProps} ref={iframeRef} />;
});

ScramjetFrame.displayName = "ScramjetFrame";

export default ScramjetFrame;

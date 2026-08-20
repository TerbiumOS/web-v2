/**
 * WebContainer Compatibility Shim
 * Provides a WebContainer-like API that internally delegates to tb.dusk.
 * All methods emit deprecation warnings directing users to the tb.dusk API.
 *
 * @deprecated Use window.tb.dusk instead. tb.node will be removed in v3.0.
 */

interface WebContainerLikeProcess {
	input: WritableStream<string>;
	output: ReadableStream<string>;
	exit: Promise<number>;
	resize(options: { cols: number; rows: number }): void;
}

export class WebContainerShim {
	private readonly serverReadyListeners: Map<EventListener, () => void> = new Map();

	/**
	 * Spawn a process (WebContainer-compatible).
	 * @deprecated Use tb.dusk.spawn() instead.
	 */
	async spawn(command: string, args?: string[], options?: { terminal?: { cols: number; rows: number }; cwd?: string; env?: Record<string, string> }): Promise<WebContainerLikeProcess> {
		console.warn("[tb.node] DEPRECATED: Use tb.dusk.spawn() instead. tb.node will be removed in v3.0.");

		try {
			const duskProcess = await window.tb.dusk.spawn(command, args, {
				pty: options?.terminal ? { cols: options.terminal.cols, rows: options.terminal.rows } : undefined,
				cwd: options?.cwd,
				env: options?.env,
			});

			return {
				input: new WritableStream<string>({
					async write(chunk) {
						await duskProcess.stdin.write(new TextEncoder().encode(chunk));
					},
					async close() {
						await duskProcess.stdin.close();
					},
				}),

				output: duskProcess.stdout.pipeThrough(
					new TransformStream<Uint8Array, string>({
						transform(chunk, controller) {
							controller.enqueue(new TextDecoder().decode(chunk));
						},
					}),
				),

				exit: duskProcess.exit,

				resize(opts: { cols: number; rows: number }) {
					window.tb.dusk.resizePty(duskProcess.pid, opts.cols, opts.rows);
				},
			};
		} catch (error) {
			throw new Error(`[tb.node] spawn failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Mount filesystem tree (no-op: Dusk shares TFS directly with Terbium).
	 * @deprecated Not needed when using Dusk. Dusk shares TFS directly.
	 */
	async mount(_tree: unknown): Promise<void> {
		console.warn("[tb.node] DEPRECATED: mount() is a no-op. Dusk shares TFS directly with Terbium. Use tb.dusk directly — no mounting required.");
		return Promise.resolve();
	}

	/**
	 * Register event handler. Supports `server-ready` event forwarding.
	 * @deprecated Use window.addEventListener("dusk-server-ready", handler) instead.
	 */
	on(event: string, handler: (...args: unknown[]) => void): void {
		console.warn("[tb.node] DEPRECATED: .on() is deprecated. For server-ready events, " + 'use window.addEventListener("dusk-server-ready", handler) instead.');

		if (event === "server-ready") {
			const listener: EventListener = (e: Event) => {
				const { port, url } = (e as CustomEvent<{ port: number; url: string }>).detail;
				handler(port, url);
			};
			window.addEventListener("dusk-server-ready", listener);
			this.serverReadyListeners.set(listener, () => window.removeEventListener("dusk-server-ready", listener));
		} else {
			console.warn(`[tb.node] Unsupported event: "${event}". The handler will never fire.`);
		}
	}

	/**
	 * Teardown the runtime.
	 * @deprecated Use tb.dusk.stop() instead.
	 */
	async teardown(): Promise<void> {
		console.warn("[tb.node] DEPRECATED: Use tb.dusk.stop() instead.");
		for (const unregister of this.serverReadyListeners.values()) {
			unregister();
		}
		this.serverReadyListeners.clear();
		try {
			await window.tb.dusk.stop();
		} catch (error) {
			throw new Error(`[tb.node] teardown failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

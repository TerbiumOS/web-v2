type IpcHandler = (event: any, ...args: any[]) => any;

export class IpcRenderer {
	private handlers: Map<string, IpcHandler[]> = new Map();
	private onceHandlers: Map<string, IpcHandler[]> = new Map();

	on(channel: string, listener: IpcHandler): this {
		if (!this.handlers.has(channel)) {
			this.handlers.set(channel, []);
		}
		this.handlers.get(channel)!.push(listener);
		return this;
	}

	once(channel: string, listener: IpcHandler): this {
		if (!this.onceHandlers.has(channel)) {
			this.onceHandlers.set(channel, []);
		}
		this.onceHandlers.get(channel)!.push(listener);
		return this;
	}

	off(channel: string, listener: IpcHandler): this {
		const handlers = this.handlers.get(channel);
		if (handlers) {
			const index = handlers.indexOf(listener);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
		return this;
	}

	removeListener(channel: string, listener: IpcHandler): this {
		return this.off(channel, listener);
	}

	removeAllListeners(channel?: string): this {
		if (channel) {
			this.handlers.delete(channel);
			this.onceHandlers.delete(channel);
		} else {
			this.handlers.clear();
			this.onceHandlers.clear();
		}
		return this;
	}

	send(channel: string, ...args: any[]): void {
		console.log(`IPC Send: ${channel}`, args);
		window.postMessage(
			{
				type: "ipc-message",
				channel,
				args,
			},
			"*",
		);
	}

	sendSync(channel: string, ...args: any[]): any {
		console.log(`IPC SendSync: ${channel}`, args);
		return null;
	}

	invoke(channel: string, ...args: any[]): Promise<any> {
		console.log(`IPC Invoke: ${channel}`, args);
		return new Promise((resolve, reject) => {
			const messageId = Math.random().toString(36).substring(7);
			const responseHandler = (event: MessageEvent) => {
				if (event.data?.type === "ipc-response" && event.data?.messageId === messageId) {
					window.removeEventListener("message", responseHandler);
					if (event.data.error) {
						reject(event.data.error);
					} else {
						resolve(event.data.result);
					}
				}
			};

			window.addEventListener("message", responseHandler);
			window.postMessage(
				{
					type: "ipc-invoke",
					channel,
					args,
					messageId,
				},
				"*",
			);
			setTimeout(() => {
				window.removeEventListener("message", responseHandler);
				reject(new Error(`IPC invoke timeout: ${channel}`));
			}, 30000);
		});
	}

	sendToHost(channel: string, ...args: any[]): void {
		console.log(`IPC SendToHost: ${channel}`, args);
		this.send(channel, ...args);
	}

	_triggerEvent(channel: string, ...args: any[]): void {
		const event = { sender: this };
		const handlers = this.handlers.get(channel);
		if (handlers) {
			handlers.forEach(handler => handler(event, ...args));
		}
		const onceHandlers = this.onceHandlers.get(channel);
		if (onceHandlers) {
			onceHandlers.forEach(handler => handler(event, ...args));
			this.onceHandlers.delete(channel);
		}
	}
}

export class IpcMain {
	private handlers: Map<string, IpcHandler[]> = new Map();
	private handlersOnce: Map<string, IpcHandler[]> = new Map();
	private invokeHandlers: Map<string, IpcHandler> = new Map();
	on(channel: string, listener: IpcHandler): this {
		if (!this.handlers.has(channel)) {
			this.handlers.set(channel, []);
		}
		this.handlers.get(channel)!.push(listener);
		return this;
	}
	once(channel: string, listener: IpcHandler): this {
		if (!this.handlersOnce.has(channel)) {
			this.handlersOnce.set(channel, []);
		}
		this.handlersOnce.get(channel)!.push(listener);
		return this;
	}
	removeListener(channel: string, listener: IpcHandler): this {
		const handlers = this.handlers.get(channel);
		if (handlers) {
			const index = handlers.indexOf(listener);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
		return this;
	}
	removeAllListeners(channel?: string): this {
		if (channel) {
			this.handlers.delete(channel);
			this.handlersOnce.delete(channel);
			this.invokeHandlers.delete(channel);
		} else {
			this.handlers.clear();
			this.handlersOnce.clear();
			this.invokeHandlers.clear();
		}
		return this;
	}
	handle(channel: string, listener: IpcHandler): void {
		this.invokeHandlers.set(channel, listener);
	}
	handleOnce(channel: string, listener: IpcHandler): void {
		const wrapper: IpcHandler = (event, ...args) => {
			this.invokeHandlers.delete(channel);
			return listener(event, ...args);
		};
		this.invokeHandlers.set(channel, wrapper);
	}
	removeHandler(channel: string): void {
		this.invokeHandlers.delete(channel);
	}
}

export const ipcRenderer = new IpcRenderer();
export const ipcMain = new IpcMain();

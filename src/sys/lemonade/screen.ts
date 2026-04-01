interface Display {
	id: number;
	bounds: { x: number; y: number; width: number; height: number };
	workArea: { x: number; y: number; width: number; height: number };
	size: { width: number; height: number };
	workAreaSize: { width: number; height: number };
	scaleFactor: number;
	rotation: number;
	internal: boolean;
	touchSupport: "available" | "unavailable" | "unknown";
}

export class Screen {
	private eventHandlers: Map<string, Function[]> = new Map();

	getCursorScreenPoint(): { x: number; y: number } {
		return { x: 0, y: 0 };
	}

	getPrimaryDisplay(): Display {
		return {
			id: 1,
			bounds: {
				x: 0,
				y: 0,
				width: window.screen.width,
				height: window.screen.height,
			},
			workArea: {
				x: 0,
				y: 0,
				width: window.screen.availWidth,
				height: window.screen.availHeight,
			},
			size: {
				width: window.screen.width,
				height: window.screen.height,
			},
			workAreaSize: {
				width: window.screen.availWidth,
				height: window.screen.availHeight,
			},
			scaleFactor: window.devicePixelRatio,
			rotation: 0,
			internal: false,
			touchSupport: "ontouchstart" in window ? "available" : "unavailable",
		};
	}

	getAllDisplays(): Display[] {
		return [this.getPrimaryDisplay()];
	}

	getDisplayNearestPoint(_point: { x: number; y: number }): Display {
		return this.getPrimaryDisplay();
	}

	getDisplayMatching(_rect: { x: number; y: number; width: number; height: number }): Display {
		return this.getPrimaryDisplay();
	}

	on(event: "display-added" | "display-removed" | "display-metrics-changed", listener: Function): this {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, []);
		}
		this.eventHandlers.get(event)!.push(listener);
		return this;
	}

	removeListener(event: string, listener: Function): this {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			const index = handlers.indexOf(listener);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
		return this;
	}
}

export const screen = new Screen();

/**
 * Window Performance Monitor
 *
 * This utility helps measure window rendering performance.
 * Usage in browser console:
 *
 * const monitor = new WindowPerformanceMonitor();
 * monitor.start();
 * // Perform window operations (drag, resize, open/close)
 * monitor.stop();
 * monitor.getReport();
 */

class WindowPerformanceMonitor {
	private startTime: number = 0;
	private metrics: {
		frameRates: number[];
		paintTimes: number[];
		layoutTimes: number[];
		dragCount: number;
		resizeCount: number;
		renderCount: number;
	} = {
		frameRates: [],
		paintTimes: [],
		layoutTimes: [],
		dragCount: 0,
		resizeCount: 0,
		renderCount: 0,
	};
	private observer: PerformanceObserver | null = null;
	private rafId: number | null = null;
	private lastFrameTime: number = 0;

	start() {
		console.log("🚀 Window Performance Monitor started");
		this.startTime = performance.now();
		this.lastFrameTime = this.startTime;

		this.observer = new PerformanceObserver(list => {
			for (const entry of list.getEntries()) {
				if (entry.entryType === "paint") {
					this.metrics.paintTimes.push(entry.startTime);
				} else if (entry.entryType === "measure") {
					if (entry.name.includes("layout")) {
						this.metrics.layoutTimes.push(entry.duration);
					}
				}
			}
		});

		this.observer.observe({ entryTypes: ["paint", "measure"] });

		const measureFrameRate = () => {
			const now = performance.now();
			const delta = now - this.lastFrameTime;
			const fps = 1000 / delta;
			this.metrics.frameRates.push(fps);
			this.lastFrameTime = now;
			this.rafId = requestAnimationFrame(measureFrameRate);
		};

		this.rafId = requestAnimationFrame(measureFrameRate);

		const mutationObserver = new MutationObserver(mutations => {
			this.metrics.renderCount += mutations.length;
		});

		const windowArea = document.querySelector("window-area");
		if (windowArea) {
			mutationObserver.observe(windowArea, {
				attributes: true,
				childList: true,
				subtree: true,
			});
		}

		this.monitorWindowOperations();
	}

	private monitorWindowOperations() {
		const originalAddEventListener = window.addEventListener;
		let isDragging = false;
		let isResizing = false;

		window.addEventListener = function (type: string, listener: any, options?: any) {
			if (type === "mousemove") {
				const wrappedListener = (e: MouseEvent) => {
					if (isDragging) {
						// @ts-ignore
						this.metrics.dragCount++;
					}
					if (isResizing) {
						// @ts-ignore
						this.metrics.resizeCount++;
					}
					listener(e);
				};
				// @ts-ignore
				return originalAddEventListener.call(window, type, wrappedListener, options);
			}
			return originalAddEventListener.call(window, type, listener, options);
		}.bind(this);

		window.addEventListener("mousedown", (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target.closest(".region")) {
				isDragging = true;
			}
			if (target.dataset.resizer) {
				isResizing = true;
			}
		});

		window.addEventListener("mouseup", () => {
			isDragging = false;
			isResizing = false;
		});
	}

	stop() {
		console.log("Window Performance Monitor stopped");
		if (this.observer) {
			this.observer.disconnect();
		}
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
		}
	}

	getReport() {
		const duration = performance.now() - this.startTime;
		const avgFPS = this.metrics.frameRates.reduce((a, b) => a + b, 0) / this.metrics.frameRates.length;
		const minFPS = Math.min(...this.metrics.frameRates);
		const maxFPS = Math.max(...this.metrics.frameRates);
		const avgPaintTime = this.metrics.paintTimes.reduce((a, b) => a + b, 0) / this.metrics.paintTimes.length;
		const avgLayoutTime = this.metrics.layoutTimes.reduce((a, b) => a + b, 0) / this.metrics.layoutTimes.length;

		const report = {
			duration: `${(duration / 1000).toFixed(2)}s`,
			frameRate: {
				average: `${avgFPS.toFixed(2)} FPS`,
				min: `${minFPS.toFixed(2)} FPS`,
				max: `${maxFPS.toFixed(2)} FPS`,
				samples: this.metrics.frameRates.length,
			},
			performance: {
				avgPaintTime: `${avgPaintTime.toFixed(2)}ms`,
				avgLayoutTime: `${avgLayoutTime.toFixed(2)}ms`,
			},
			operations: {
				dragOperations: this.metrics.dragCount,
				resizeOperations: this.metrics.resizeCount,
				renders: this.metrics.renderCount,
			},
			health: this.getPerformanceHealth(avgFPS, minFPS),
		};

		console.table(report);
		return report;
	}

	private getPerformanceHealth(avgFPS: number, minFPS: number) {
		if (avgFPS >= 55 && minFPS >= 45) {
			return "Excellent (60 FPS target met)";
		} else if (avgFPS >= 45 && minFPS >= 30) {
			return "Good (some frame drops)";
		} else if (avgFPS >= 30) {
			return "Fair (noticeable lag)";
		} else {
			return "Poor (significant performance issues)";
		}
	}

	getDetailedMetrics() {
		return {
			frameRates: this.metrics.frameRates,
			paintTimes: this.metrics.paintTimes,
			layoutTimes: this.metrics.layoutTimes,
			dragCount: this.metrics.dragCount,
			resizeCount: this.metrics.resizeCount,
			renderCount: this.metrics.renderCount,
		};
	}
}

if (typeof window !== "undefined") {
	// @ts-ignore
	window.WindowPerformanceMonitor = WindowPerformanceMonitor;
	console.log("💡 Window Performance Monitor loaded. Usage:");
	console.log("  const monitor = new WindowPerformanceMonitor();");
	console.log("  monitor.start();");
	console.log("  // Perform window operations");
	console.log("  monitor.stop();");
	console.log("  monitor.getReport();");
}

export default WindowPerformanceMonitor;

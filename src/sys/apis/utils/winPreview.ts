// utility for showing a lightweight preview of an element
// call getPrev(elem) to display the preview, hidePrev() to remove it.
// Uses modern-screenshot for static snapshots to avoid RAM spikes from live content like iframes.

import { domToCanvas } from "modern-screenshot";

let container: HTMLDivElement | null = null;
let snapshotCache = new WeakMap<HTMLElement, HTMLCanvasElement>();
let currentTarget: HTMLElement | null = null;
let pendingTarget: HTMLElement | null = null;
let pendingOptions: PreviewOptions | undefined;
let updateScheduled = false;

interface PreviewOptions {
	maxSize?: number;
	x?: number;
	y?: number;
	scale?: number;
}

function ensureContainer() {
	if (container) return;
	if (!document.getElementById("win-preview-styles")) {
		const styleEl = document.createElement("style");
		styleEl.id = "win-preview-styles";
		styleEl.textContent = `
.win-preview-container {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 1000000;
    transition: opacity 0.1s;
    opacity: 0;
    will-change: transform,opacity;
}

.win-preview-container * {
    pointer-events: none;
}
        `;
		document.head.appendChild(styleEl);
	}

	container = document.createElement("div");
	container.className = "win-preview-container";
	document.body.appendChild(container);
}

function scheduleUpdate(target: HTMLElement, options?: PreviewOptions) {
	pendingTarget = target;
	pendingOptions = options;
	if (!updateScheduled) {
		updateScheduled = true;
		requestAnimationFrame(performUpdate);
	}
}

function performUpdate() {
	updateScheduled = false;
	if (!pendingTarget) return;
	const target = pendingTarget;
	const opts = pendingOptions || {};
	if (target === currentTarget) {
		positionContainer(opts);
		return;
	}
	ensureContainer();

	// check cache first
	let canvas = snapshotCache.get(target);
	if (!canvas) {
		currentTarget = target;
		// capture snapshot asynchronously
		const filter = (node: Node) => {
			const tagName = (node as Element).tagName;
			if (tagName === "IFRAME" || tagName === "SCRIPT" || tagName === "NOSCRIPT") return false;
			return true;
		};

		const drawResolvedCanvas = (newCanvas: HTMLCanvasElement) => {
			snapshotCache.set(target, newCanvas);
			if (currentTarget === target) {
				updateContainerWithCanvas(newCanvas, target, opts);
			}
		};

		domToCanvas(target, {
			scale: 1,
			backgroundColor: null,
			filter,
			features: {
				restoreScrollPosition: true,
			},
		})
			.then(newCanvas => {
				drawResolvedCanvas(newCanvas);
			})
			.catch(() => {
				// silently fail to avoid spamming console
			});
		// for now, show a placeholder or nothing
		return;
	}

	updateContainerWithCanvas(canvas, target, opts);
	currentTarget = target;
}

function updateContainerWithCanvas(canvas: HTMLCanvasElement, target: HTMLElement, opts: PreviewOptions) {
	if (!container) return;

	// clear and add canvas
	container.innerHTML = "";
	container.appendChild(canvas);

	const rect = target.getBoundingClientRect();
	let scale = opts.scale ?? 1;
	if (opts.maxSize) {
		const maxSz = opts.maxSize;
		const factor = Math.min(maxSz / rect.width, maxSz / rect.height, 1);
		scale = Math.min(scale, factor);
	}
	canvas.style.transformOrigin = "top left";
	canvas.style.transform = `scale(${scale})`;
	container.style.width = `${rect.width * scale}px`;
	container.style.height = `${rect.height * scale}px`;

	positionContainer(opts);
	container.style.opacity = "1";
}

function positionContainer(opts: PreviewOptions) {
	if (!container) return;
	if (opts.x != null && opts.y != null) {
		container.style.transform = `translate(${opts.x}px, ${opts.y}px) ${container.style.transform.replace(/translate\([^)]*\)/, "")}`;
	}
}

/**
 * Show a preview of the given element. The preview is positioned fixed relative to the viewport.
 *
 * @param el the element to preview
 * @param options optional configuration: maxSize, x/y coordinate, scale
 */
export function getPrev(el: HTMLElement, options?: PreviewOptions) {
	if (!el || !(el instanceof HTMLElement)) return;
	scheduleUpdate(el, options);
}

/**
 * Hide the preview immediately.
 */
export function hidePrev() {
	if (container) container.style.opacity = "0";
	currentTarget = null;
	pendingTarget = null;
}

export function previewAtMouse(el: HTMLElement, evt: MouseEvent, options?: PreviewOptions) {
	const coords = { x: evt.clientX + 10, y: evt.clientY + 10 };
	getPrev(el, { ...options, ...coords });
}

export default {
	getPrev,
	hidePrev,
	previewAtMouse,
};

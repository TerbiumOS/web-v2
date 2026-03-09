import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles/win_switcher.css";
import { useWindowStore } from "../Store";
import { WindowConfig } from "../types";
import { domToCanvas } from "modern-screenshot";

type ThumbnailMap = Record<string, string>;

const titleText = (windowConfig: WindowConfig) => (typeof windowConfig.title === "string" ? windowConfig.title : windowConfig.title?.text);

const getPreviewSourceElement = (wid?: string) => {
	if (!wid) return null;
	const windowElement = document.getElementById(wid);
	if (!windowElement) return null;
	const mainElement = windowElement.querySelector(".w-full.h-full") as HTMLElement | null;
	if (!mainElement) return null;
	const iframeElement = mainElement.querySelector("iframe") as HTMLElement | null;
	return iframeElement ?? mainElement;
};

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

const captureWindowPreview = async (wid?: string, attempt = 0): Promise<string | null> => {
	const sourceEl = getPreviewSourceElement(wid);
	if (!sourceEl) return null;
	const rect = sourceEl.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		if (attempt < 2) {
			await nextFrame();
			return captureWindowPreview(wid, attempt + 1);
		}
		return null;
	}
	const filter = (node: Node) => {
		const tagName = (node as Element).tagName;
		if (tagName === "SCRIPT" || tagName === "NOSCRIPT" || tagName === "IFRAME") return false;
		return true;
	};
	try {
		const fullCanvas = await domToCanvas(sourceEl, {
			scale: 1,
			backgroundColor: null,
			filter,
			features: {
				restoreScrollPosition: true,
			},
		});
		if (fullCanvas.width <= 0 || fullCanvas.height <= 0) {
			if (attempt < 2) {
				await nextFrame();
				return captureWindowPreview(wid, attempt + 1);
			}
			return null;
		}
		return fullCanvas.toDataURL("image/png");
	} catch {
		if (attempt < 2) {
			await nextFrame();
			return captureWindowPreview(wid, attempt + 1);
		}
		return null;
	}
};

const WinSwitcher: React.FC = () => {
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const [activeIndex, setActiveIndex] = useState<number>(0);
	const [thumbnails, setThumbnails] = useState<ThumbnailMap>({});
	const [thumbnailErrors, setThumbnailErrors] = useState<Set<string>>(new Set());
	const [loadingThumbs, setLoadingThumbs] = useState<Set<string>>(new Set());
	const isVisibleRef = useRef<boolean>(false);
	const activeIndexRef = useRef<number>(0);
	const windowsRef = useRef<WindowConfig[]>([]);
	const isCapturingRef = useRef<Set<string>>(new Set());
	const triggerModifierRef = useRef<"alt" | "shift" | null>(null);
	const windows = useWindowStore(state => state.windows);
	const orderedWindows = useMemo(() => {
		return [...windows].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
	}, [windows]);
	useEffect(() => {
		isVisibleRef.current = isVisible;
	}, [isVisible]);
	useEffect(() => {
		activeIndexRef.current = activeIndex;
	}, [activeIndex]);
	useEffect(() => {
		windowsRef.current = orderedWindows;
		const validIds = new Set(orderedWindows.map(win => win.wid).filter(Boolean) as string[]);
		setThumbnails(prev => Object.fromEntries(Object.entries(prev).filter(([wid]) => validIds.has(wid))));
		setThumbnailErrors(prev => new Set([...prev].filter(wid => validIds.has(wid))));
		setLoadingThumbs(prev => new Set([...prev].filter(wid => validIds.has(wid))));
		isCapturingRef.current = new Set([...isCapturingRef.current].filter(wid => validIds.has(wid)));
		if (orderedWindows.length === 0) {
			setIsVisible(false);
			setActiveIndex(0);
		}
		if (activeIndex >= orderedWindows.length) {
			setActiveIndex(0);
		}
	}, [orderedWindows, activeIndex]);
	const cycleSelection = (direction: number) => {
		const currentWindows = windowsRef.current;
		if (currentWindows.length === 0) return;
		const nextIndex = (activeIndexRef.current + direction + currentWindows.length) % currentWindows.length;
		setActiveIndex(nextIndex);
	};
	const commitSelection = () => {
		const currentWindows = windowsRef.current;
		if (currentWindows.length === 0) {
			setIsVisible(false);
			return;
		}
		const win = currentWindows[activeIndexRef.current];
		if (win?.wid) {
			window.dispatchEvent(new CustomEvent("sel-win", { detail: win.wid }));
			window.dispatchEvent(new CustomEvent("currWID", { detail: win.wid }));
		}
		setIsVisible(false);
	};
	const commitByWindow = (windowConfig: WindowConfig) => {
		if (windowConfig?.wid) {
			window.dispatchEvent(new CustomEvent("sel-win", { detail: windowConfig.wid }));
			window.dispatchEvent(new CustomEvent("currWID", { detail: windowConfig.wid }));
		}
		setIsVisible(false);
	};
	const openSwitcher = (direction: number) => {
		const currentWindows = windowsRef.current;
		if (currentWindows.length === 0) return;
		const focusedIndex = currentWindows.findIndex(win => win.focused);
		const baseIndex = focusedIndex >= 0 ? focusedIndex : 0;
		const nextIndex = (baseIndex + direction + currentWindows.length) % currentWindows.length;
		setActiveIndex(nextIndex);
		setIsVisible(true);
	};
	const captureForWindow = async (windowConfig: WindowConfig) => {
		if (!windowConfig.wid) return;
		if (thumbnails[windowConfig.wid] || thumbnailErrors.has(windowConfig.wid) || isCapturingRef.current.has(windowConfig.wid)) return;
		isCapturingRef.current.add(windowConfig.wid);
		setLoadingThumbs(prev => {
			const next = new Set(prev);
			next.add(windowConfig.wid as string);
			return next;
		});
		const thumbnail = await captureWindowPreview(windowConfig.wid);
		if (thumbnail) {
			setThumbnails(prev => ({ ...prev, [windowConfig.wid as string]: thumbnail }));
		} else {
			setThumbnailErrors(prev => {
				const next = new Set(prev);
				next.add(windowConfig.wid as string);
				return next;
			});
		}
		setLoadingThumbs(prev => {
			const next = new Set(prev);
			next.delete(windowConfig.wid as string);
			return next;
		});
		isCapturingRef.current.delete(windowConfig.wid);
	};
	useEffect(() => {
		const onDown = (e: KeyboardEvent) => {
			if (e.key === "Tab" && e.altKey) {
				e.preventDefault();
				triggerModifierRef.current = "alt";
				if (!isVisibleRef.current) {
					openSwitcher(e.shiftKey ? -1 : 1);
				} else {
					cycleSelection(e.shiftKey ? -1 : 1);
				}
			}
			if (e.key === "Tab" && e.shiftKey && !e.altKey) {
				e.preventDefault();
				triggerModifierRef.current = "shift";
				if (!isVisibleRef.current) {
					openSwitcher(-1);
				} else {
					cycleSelection(-1);
				}
			}
			if (isVisibleRef.current && e.key === "Escape") {
				e.preventDefault();
				setIsVisible(false);
				triggerModifierRef.current = null;
			}
		};
		const onUp = (e: KeyboardEvent) => {
			if (e.key === "Alt" && isVisibleRef.current && triggerModifierRef.current === "alt") {
				e.preventDefault();
				commitSelection();
				triggerModifierRef.current = null;
			}
			if (e.key === "Shift" && isVisibleRef.current && triggerModifierRef.current === "shift") {
				e.preventDefault();
				commitSelection();
				triggerModifierRef.current = null;
			}
		};
		const onBlur = () => {
			if (isVisibleRef.current) {
				setIsVisible(false);
				triggerModifierRef.current = null;
			}
		};
		window.addEventListener("keydown", onDown);
		window.addEventListener("keyup", onUp);
		window.addEventListener("blur", onBlur);
		return () => {
			window.removeEventListener("keydown", onDown);
			window.removeEventListener("keyup", onUp);
			window.removeEventListener("blur", onBlur);
		};
	}, []);
	useEffect(() => {
		if (!isVisible) return;
		orderedWindows.forEach(windowConfig => {
			captureForWindow(windowConfig);
		});
	}, [isVisible, orderedWindows]);
	if (orderedWindows.length === 0) return null;
	return (
		<div className={`win-switcher-backdrop ${isVisible ? "visible" : ""}`}>
			<div className={`win-switcher-panel ${isVisible ? "visible" : ""}`}>
				{orderedWindows.map((windowConfig: WindowConfig, index: number) => {
					const text = titleText(windowConfig);
					const thumbSrc = windowConfig.wid ? thumbnails[windowConfig.wid] : null;
					const showFallback = (windowConfig.wid && thumbnailErrors.has(windowConfig.wid)) || !thumbSrc;
					const isLoading = !!windowConfig.wid && loadingThumbs.has(windowConfig.wid);
					const spinnerId = `a12-switch-${windowConfig.wid ?? index}`;
					return (
						<button
							type="button"
							key={windowConfig.wid}
							data-index={index}
							className={`win-switcher-item ${index === activeIndex ? "active" : ""}`}
							onMouseEnter={() => setActiveIndex(index)}
							onClick={() => {
								setActiveIndex(index);
								commitByWindow(windowConfig);
							}}
						>
							<div className="thumb-frame">
								{showFallback ? (
									<div className="thumb-fallback">
										<img src={windowConfig.icon ?? "/assets/img/null.svg"} alt={text} className="thumb-fallback-icon" />
									</div>
								) : (
									<img src={thumbSrc} alt={text} className="thumb-image" />
								)}
								{isLoading && (
									<div className="thumb-loading-overlay">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="thumb-loading-spinner" aria-hidden="true">
											<defs>
												<radialGradient id={spinnerId} cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
													<stop offset="0" stopColor="#32ae62"></stop>
													<stop offset=".3" stopColor="#32ae62" stopOpacity=".9"></stop>
													<stop offset=".6" stopColor="#32ae62" stopOpacity=".6"></stop>
													<stop offset=".8" stopColor="#32ae62" stopOpacity=".3"></stop>
													<stop offset="1" stopColor="#32ae62" stopOpacity="0"></stop>
												</radialGradient>
											</defs>
											<circle style={{ transformOrigin: "center" }} fill="none" stroke={`url(#${spinnerId})`} strokeWidth="15" strokeLinecap="round" strokeDasharray="200 1000" strokeDashoffset="0" cx="100" cy="100" r="70">
												<animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2s" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
											</circle>
											<circle style={{ transformOrigin: "center" }} fill="none" opacity=".2" stroke="#32ae62" strokeWidth="15" strokeLinecap="round" cx="100" cy="100" r="70"></circle>
										</svg>
									</div>
								)}
							</div>
							<div className="item-meta">
								<img src={windowConfig.icon ?? "/assets/img/null.svg"} alt="" aria-hidden="true" className="item-icon" />
								<span className="item-title">{text}</span>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default WinSwitcher;

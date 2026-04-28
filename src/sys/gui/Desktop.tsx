import { FC, createElement, useRef, useState, useEffect } from "react";
import Dock, { TDockItem } from "./Dock";
import WindowArea from "./WindowArea";
import Shell from "./Shell";
import { WispMenu } from "./Wifi";
import DialogContainer from "../apis/Dialogs";
import NotificationContainer from "../apis/Notifications";
import { NotificationMenu } from "./NotificationCenter";
import { dirExists, UserSettings, WindowConfig } from "../types";
import WinSwitcher from "./WinSwitcher";
import ContextMenuArea from "./ContextMenu";
import { domToCanvas } from "modern-screenshot";

// Mostly for testing stuff but these are the prod settings rn. Feel free to change in dev
const PREVIEW_DEBUG = false;
const THUMB_WIDTH = 250;
const THUMB_HEIGHT = 200;

interface IDesktopProps {
	desktop: number;
	onContextMenu?: (e: MouseEvent) => void;
}

const Desktop: FC<IDesktopProps> = ({ desktop, onContextMenu }) => {
	const desktopRef = useRef<HTMLDivElement>(null);
	const [showMenu, setShowMenu] = useState(false);
	const [showNotif, setShowNotif] = useState(false);
	const [pinned, setPinned] = useState<Array<TDockItem>>([]);
	const [winPrev, setWinPrev] = useState<{ open: boolean; windows: any; location: string } | null>(null);
	const [previewWin, setPreviewWin] = useState<string | null>(null);
	const [windowOptimizationsEnabled, setWindowOptimizationsEnabled] = useState(false);
	const [thumbnailFallbacks, setThumbnailFallbacks] = useState<Set<string>>(new Set());
	const [thumbnailLoading, setThumbnailLoading] = useState<Set<string>>(new Set());
	const thumbnailCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

	const setThumbnailLoadingState = (winId: string, loading: boolean) => {
		setThumbnailLoading(prev => {
			const isLoading = prev.has(winId);
			if (loading === isLoading) return prev;
			const next = new Set(prev);
			if (loading) {
				next.add(winId);
			} else {
				next.delete(winId);
			}
			return next;
		});
	};

	const markThumbnailFallback = (winId: string) => {
		setThumbnailFallbacks(prev => {
			if (prev.has(winId)) return prev;
			const next = new Set(prev);
			next.add(winId);
			return next;
		});
	};

	const drawCanvasFitted = (ctx: CanvasRenderingContext2D, source: HTMLCanvasElement, targetWidth: number, targetHeight: number) => {
		ctx.clearRect(0, 0, targetWidth, targetHeight);
		ctx.fillStyle = "#111";
		ctx.fillRect(0, 0, targetWidth, targetHeight);
		if (source.width <= 0 || source.height <= 0) return;
		const scale = Math.min(targetWidth / source.width, targetHeight / source.height);
		const drawWidth = source.width * scale;
		const drawHeight = source.height * scale;
		const offsetX = (targetWidth - drawWidth) / 2;
		const offsetY = (targetHeight - drawHeight) / 2;
		ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
	};

	const renderWindowThumbnail = (winId: string, canvasEl: HTMLCanvasElement, attempt = 0) => {
		setThumbnailLoadingState(winId, true);
		if (windowOptimizationsEnabled) {
			markThumbnailFallback(winId);
			setThumbnailLoadingState(winId, false);
			return;
		}

		const ctx = canvasEl.getContext("2d");
		if (!ctx) {
			if (PREVIEW_DEBUG) console.warn("[win-preview] no 2d context", { winId, attempt });
			setThumbnailLoadingState(winId, false);
			return;
		}

		const cachedCanvas = thumbnailCacheRef.current.get(winId);
		if (cachedCanvas) {
			if (PREVIEW_DEBUG) console.debug("[win-preview] draw from cache", { winId, attempt, width: cachedCanvas.width, height: cachedCanvas.height });
			drawCanvasFitted(ctx, cachedCanvas, THUMB_WIDTH, THUMB_HEIGHT);
			canvasEl.dataset.rendered = "1";
			setThumbnailLoadingState(winId, false);
			return;
		}

		const parElem = document.getElementById(winId);
		const mainparElem = parElem?.querySelector(".w-full.h-full");
		let elem = mainparElem;
		if (mainparElem?.querySelector("iframe")) {
			elem = mainparElem.querySelector("iframe") as HTMLElement | null;
		}
		if (!elem) {
			if (PREVIEW_DEBUG) console.warn("[win-preview] missing element", { winId });
			markThumbnailFallback(winId);
			canvasEl.dataset.rendered = "0";
			setThumbnailLoadingState(winId, false);
			return;
		}

		const rect = elem.getBoundingClientRect();
		if (PREVIEW_DEBUG) console.debug("[win-preview] element rect", { winId, attempt, width: rect.width, height: rect.height, x: rect.x, y: rect.y });
		if (rect.width <= 0 || rect.height <= 0) {
			if (attempt < 2) {
				if (PREVIEW_DEBUG) console.warn("[win-preview] zero rect, retrying", { winId, attempt });
				requestAnimationFrame(() => renderWindowThumbnail(winId, canvasEl, attempt + 1));
				return;
			}
			if (PREVIEW_DEBUG) console.error("[win-preview] zero rect after retries", { winId });
			markThumbnailFallback(winId);
			canvasEl.dataset.rendered = "0";
			setThumbnailLoadingState(winId, false);
			return;
		}

		const filter = (node: Node) => {
			const tagName = (node as Element).tagName;
			if (tagName === "IFRAME" || tagName === "SCRIPT" || tagName === "NOSCRIPT") return false;
			return true;
		};

		if (PREVIEW_DEBUG) console.debug("[win-preview] rendering via modern-screenshot domToCanvas", { winId, attempt });
		domToCanvas(elem, {
			scale: 1,
			backgroundColor: null,
			filter,
			features: {
				restoreScrollPosition: true,
			},
		})
			.then(fullCanvas => {
				if (PREVIEW_DEBUG) console.debug("[win-preview] modern-screenshot success", { winId, width: fullCanvas.width, height: fullCanvas.height });
				thumbnailCacheRef.current.set(winId, fullCanvas);
				drawCanvasFitted(ctx, fullCanvas, THUMB_WIDTH, THUMB_HEIGHT);
				canvasEl.dataset.rendered = "1";
				setThumbnailLoadingState(winId, false);
			})
			.catch(err => {
				if (PREVIEW_DEBUG) console.error("[win-preview] modern-screenshot failed", { winId, attempt, err });
				if (attempt < 2) {
					requestAnimationFrame(() => renderWindowThumbnail(winId, canvasEl, attempt + 1));
					return;
				}
				markThumbnailFallback(winId);
				canvasEl.dataset.rendered = "0";
				setThumbnailLoadingState(winId, false);
			});
	};

	useEffect(() => {
		const menu = () => {
			setShowMenu(prev => !prev);
		};
		const nMenu = () => {
			setShowNotif(prev => !prev);
		};
		const getWallpaper = async () => {
			const settings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`));
			setWindowOptimizationsEnabled(settings.windowOptimizations ?? false);
			if (settings.wallpaper.startsWith("/system")) {
				if (!desktopRef.current) return;
				desktopRef.current.style.backgroundImage = `url("/fs/${settings.wallpaper}")`;
				desktopRef.current.style.backgroundSize = settings.wallpaperMode === "stretch" ? "100% 100%" : settings.wallpaperMode;
				desktopRef.current.style.backgroundPosition = "center";
				desktopRef.current.style.backgroundRepeat = "no-repeat";
			} else {
				if (!desktopRef.current) return;
				desktopRef.current.style.backgroundImage = `url("${settings.wallpaper}")`;
				desktopRef.current.style.backgroundSize = settings.wallpaperMode === "stretch" ? "100% 100%" : settings.wallpaperMode;
				desktopRef.current.style.backgroundPosition = "center";
				desktopRef.current.style.backgroundRepeat = "no-repeat";
			}
		};
		const showWinPrev = (e: CustomEvent) => {
			const data = JSON.parse(e.detail);
			setWinPrev(data);
			if (!data.open) {
				setPreviewWin(null);
				setThumbnailLoading(new Set());
				document.querySelectorAll(".window-element").forEach(el => {
					(el as HTMLElement).style.opacity = "1";
				});
			}
		};
		const getPins = async () => {
			if (await dirExists("/system")) {
				try {
					const newPins = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/dock.json", "utf8"));
					setPinned(prev => (JSON.stringify(prev) === JSON.stringify(newPins) ? prev : newPins));
				} catch (e) {
					console.error(e);
				}
			}
		};

		window.addEventListener("tfsready", getWallpaper);
		window.addEventListener("open-net", menu);
		window.addEventListener("open-notif", nMenu);
		window.addEventListener("load", getWallpaper);
		window.addEventListener("updWallpaper", getWallpaper);
		window.addEventListener("updPins", getPins);
		// @ts-expect-error
		window.addEventListener("windows-prev", showWinPrev);
		return () => {
			window.removeEventListener("open-net", menu);
			window.removeEventListener("open-notif", nMenu);
			window.removeEventListener("load", getWallpaper);
			window.removeEventListener("updWallpaper", getWallpaper);
			window.removeEventListener("updPins", getPins);
			// @ts-expect-error
			window.removeEventListener("windows-prev", showWinPrev);
			window.removeEventListener("tfsready", getWallpaper);
		};
	}, []);

	useEffect(() => {
		const getPins = async () => {
			if (await dirExists("/system")) {
				try {
					const newPins = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/dock.json", "utf8"));
					setPinned(prev => (JSON.stringify(prev) === JSON.stringify(newPins) ? prev : newPins));
				} catch (e) {
					console.error(e);
				}
			}
		};
		getPins();
	}, []);

	return (
		<div
			className={`desktop flex flex-col h-[inherit] overflow-hidden `}
			data-desktop={desktop}
			ref={desktopRef}
			onContextMenuCapture={(e: React.MouseEvent<HTMLDivElement>) => {
				onContextMenu?.(e.nativeEvent);
			}}
		>
			<Shell />
			<WispMenu isOpen={showMenu} />
			<WindowArea className="h-full m-2 mt-0" />
			<DialogContainer />
			<NotificationContainer />
			<NotificationMenu isOpen={showNotif} />
			<ContextMenuArea />
			<WinSwitcher />
			<div
				data-win-preview="true"
				className={`${winPrev?.open ? "opacity-100" : "opacity-0"} duration-150`}
				onMouseLeave={() => {
					setPreviewWin(null);
					document.querySelectorAll(".window-element").forEach(el => {
						(el as HTMLElement).style.opacity = "1";
					});
					thumbnailCacheRef.current.clear();
					setThumbnailFallbacks(new Set());
					setThumbnailLoading(new Set());
				}}
			>
				{winPrev?.windows && winPrev.windows.length > 0 && (
					<div data-win-preview="true" className={`absolute bottom-16 flex justify-center items-start gap-2 rounded-lg bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-[100px] border-none overflow-hidden z-9999999 p-2`} style={{ left: `calc(${winPrev?.location}px - ${120 * winPrev?.windows.length}px)` }}>
						{winPrev.windows[0].map((win: WindowConfig) => {
							const winId = win.wid;
							if (!winId) return null;
							const shouldUseLogoFallback = windowOptimizationsEnabled || thumbnailFallbacks.has(winId);
							const isThumbnailLoading = !shouldUseLogoFallback && thumbnailLoading.has(winId);
							const iconSrc = win.icon ?? "/assets/img/null.svg";
							return (
								<div
									key={winId}
									data-win-preview="true"
									className="relative cursor-pointer w-54 rounded-md bg-[#0f0f0fa8] p-1"
									onMouseEnter={e => {
										const canvasEl = e.currentTarget.querySelector("canvas") as HTMLCanvasElement | null;
										if (!shouldUseLogoFallback && canvasEl && canvasEl.dataset.rendered !== "1") {
											if (PREVIEW_DEBUG) console.debug("[win-preview] hover-triggered thumbnail retry", { winId });
											renderWindowThumbnail(winId, canvasEl);
										}

										if (previewWin !== winId) {
											setPreviewWin(winId);
											document.querySelectorAll(".window-element").forEach(otherEl => {
												if (otherEl.id !== winId) {
													(otherEl as HTMLElement).style.opacity = "0";
												} else {
													(otherEl as HTMLElement).style.opacity = "1";
													if (!otherEl.classList.contains("shadow-window-shadow")) {
														otherEl.classList.add("shadow-window-shadow");
													}
												}
											});
										}
									}}
									onClick={() => {
										window.dispatchEvent(new CustomEvent("sel-win", { detail: winId }));
										window.dispatchEvent(new CustomEvent("currWID", { detail: winId }));
										setPreviewWin(null);
										document.querySelectorAll(".window-element").forEach(el => {
											(el as HTMLElement).style.opacity = "1";
										});
										setWinPrev(prev => ({
											...prev,
											open: false,
											windows: prev?.windows,
											location: prev?.location ?? "",
										}));
									}}
								>
									<div className="mb-1 flex items-center gap-1 px-1">
										<img src={iconSrc} alt="Window icon" className="size-3 rounded-sm" />
										<span className="max-w-45 truncate text-[10px] leading-none text-white/90">{typeof win.title === "string" ? win.title : win.title?.text}</span>
										<button
											type="button"
											className="ml-auto size-4 rounded-sm bg-red-500/20 text-[10px] leading-none text-red-200 hover:bg-red-500/35"
											onClick={e => {
												e.stopPropagation();
												window.tb.process.kill(win.pid);
												setWinPrev(prev => ({
													...prev,
													windows: prev?.windows.map((w: WindowConfig[]) => w.filter((windowItem: WindowConfig) => windowItem.wid !== winId)),
													open: prev?.open ?? false,
													location: prev?.location ?? "",
												}));
											}}
										>
											×
										</button>
									</div>
									<div className="relative w-50 h-32">
										{shouldUseLogoFallback ? (
											<div className="rounded border border-[#ffffff20] w-50 h-32 bg-[#1f1f1f] flex items-center justify-center">
												<img src={iconSrc} alt="App logo" className="size-12 rounded-md" />
											</div>
										) : (
											<canvas
												width={THUMB_WIDTH}
												height={THUMB_HEIGHT}
												className="rounded border border-[#ffffff20] w-50 h-32"
												ref={canvasRef => {
													if (canvasRef && canvasRef.dataset.rendered !== "1") {
														renderWindowThumbnail(winId, canvasRef);
													}
												}}
											/>
										)}
										{isThumbnailLoading && (
											<div className="absolute inset-0 rounded border border-[#ffffff20] bg-[#111111b0] flex items-center justify-center pointer-events-none">
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="size-8">
													<defs>
														<radialGradient id={`a12-${winId}`} cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
															<stop offset="0" stopColor="#32ae62"></stop>
															<stop offset=".3" stopColor="#32ae62" stopOpacity=".9"></stop>
															<stop offset=".6" stopColor="#32ae62" stopOpacity=".6"></stop>
															<stop offset=".8" stopColor="#32ae62" stopOpacity=".3"></stop>
															<stop offset="1" stopColor="#32ae62" stopOpacity="0"></stop>
														</radialGradient>
													</defs>
													<circle style={{ transformOrigin: "center" }} fill="none" stroke={`url(#a12-${winId})`} strokeWidth="15" strokeLinecap="round" strokeDasharray="200 1000" strokeDashoffset="0" cx="100" cy="100" r="70">
														<animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2s" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
													</circle>
													<circle style={{ transformOrigin: "center" }} fill="none" opacity=".2" stroke="#32ae62" strokeWidth="15" strokeLinecap="round" cx="100" cy="100" r="70"></circle>
												</svg>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
			<Dock pinned={pinned} />
		</div>
	);
};

export const createDesktop = (amount: number) => {
	for (let i = 0; i < amount; i++) {
		createElement(Desktop, { desktop: i });
	}
};

export default Desktop;

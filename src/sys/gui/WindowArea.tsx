import { useState, useRef, useEffect, memo } from "react";
import { fileExists, UserSettings, WindowConfig } from "../types";
import { clearInfo, updateInfo } from "./AppIsland";
import { useWindowStore } from "../Store";

interface WindowProps {
	config: WindowConfig;
	className?: string;
	children?: React.ReactNode;
	onSnapPreview?: (pos: string) => void;
	onSnapDone?: () => void;
}

interface DesktopItem {
	name: string;
	icon: string;
	position: {
		custom: boolean;
		left: number | string;
		top: number | string;
	};
	item: string;
	type: string;
	config: WindowConfig;
}

const WindowElement: React.FC<WindowProps> = ({ className, config, onSnapDone, onSnapPreview }) => {
	const windowStore = useWindowStore();
	const [optimizationsEnabled, setOptimizationsEnabled] = useState(true);

	const windowRef = useRef<HTMLDivElement>(null);
	const regionRef = useRef<HTMLDivElement>(null);
	const focuserRef = useRef<HTMLDivElement>(null);
	const srcRef = useRef<HTMLIFrameElement>(null);
	const miniRef = useRef<SVGSVGElement>(null);
	const minMaxRef = useRef<SVGSVGElement>(null);
	const closeRef = useRef<SVGSVGElement>(null);

	const contentRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLSpanElement>(null);
	const thtmlref = useRef<HTMLDivElement>(null);

	const [zIndex, setZIndex] = useState(config.zIndex);
	const [isMouseDown, setIsMouseDown] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [x, setX] = useState<number | string>("center");
	const [y, setY] = useState<number | string>("center");
	const [width, setWidth] = useState(config.size?.width || 400);
	const [height, setHeight] = useState(config.size?.height || 400);
	const [titlebarhtml] = useState(typeof config.title === "object" ? config.title?.html : undefined);
	const [maximized, setMaximized] = useState(false);
	const [minimized, setMinimized] = useState(false);
	const [title] = useState(typeof config.title === "string" ? config.title : config.title?.text);
	const [snapRegion, setSnapRegion] = useState<string | null>(null);
	const [isResizing, setIsResizing] = useState<boolean>(false);
	const [controls, setControls] = useState(config.controls);
	const [src, setSrc] = useState(config.src);
	const originalSize = useRef<{ width: number; height: number } | null>(null);
	const [isSnapped, setIsSnapped] = useState(false);
	const [accent, setAccent] = useState<string>("#ffffff18");
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
	const mobileCheck = async () => {
		const platform = await window.tb.platform.getPlatform();
		const settings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
		if (platform === "mobile" || settings.window.alwaysMaximized === true) {
			setMaximized(true);
		}
	};
	mobileCheck();
	
	useEffect(() => {
		const loadOptimizationSettings = async () => {
			try {
				const settings: UserSettings = JSON.parse(
					await window.tb.fs.promises.readFile(
						`/home/${sessionStorage.getItem("currAcc")}/settings.json`,
						"utf8"
					)
				);
				setOptimizationsEnabled(settings.windowOptimizations ?? true);
			} catch (err) {
				console.error("Failed to load optimization settings:", err);
				setOptimizationsEnabled(true); // Default to enabled
			}
		};
		loadOptimizationSettings();
	}, []);
	useEffect(() => {
		updateInfo({ appname: typeof config.title === "string" ? config.title : config.title?.text });
	}, [config]);
	useEffect(() => {
		if (windowRef.current) {
			if (x === "center") {
				setX(window.innerWidth / 2 - windowRef.current.offsetWidth / 2);
			}
			if (y === "center") {
				setY(window.innerHeight / 2 - windowRef.current.offsetHeight / 2);
			}
			windowRef.current.classList.remove("opacity-0", "translate-y-3");
			setTimeout(() => {
				windowRef.current?.classList.remove("duration-150");
			}, 150);
		}
		if (thtmlref.current && titlebarhtml) {
			thtmlref.current.innerHTML = titlebarhtml;
		}
		const prox = async () => {
			if (config.proxy === true) {
				const settings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
				setSrc("about:blank");
				console.log(settings.proxy);
				if (settings.proxy === "Ultraviolet") {
					setSrc(`${window.location.origin}/uv/service/${await window.tb.proxy.encode(config.src, "XOR")}`);
				} else {
					setSrc(`${window.location.origin}/service/${await window.tb.proxy.encode(config.src, "XOR")}`);
				}
				const instanceWin = (await window.anura.wm.getWeakRef(Number(config.pid))) || {};
				Object.assign(srcRef.current?.contentWindow as typeof window, {
					tb: window.parent.tb,
					anura: window.parent.anura,
					AliceWM: window.parent.AliceWM,
					LocalFS: window.parent.LocalFS,
					ExternalApp: window.parent.ExternalApp,
					ExternalLib: window.parent.ExternalLib,
					Filer: window.parent.Filer,
					instanceWindow: instanceWin,
				});
			} else {
				console.log(await window.anura.wm.getWeakRef(Number(config.pid)));
				const instanceWin = (await window.anura.wm.getWeakRef(Number(config.pid))) || {};
				Object.assign(srcRef.current?.contentWindow as typeof window, {
					tb: window.parent.tb,
					anura: window.parent.anura,
					AliceWM: window.parent.AliceWM,
					LocalFS: window.parent.LocalFS,
					ExternalApp: window.parent.ExternalApp,
					ExternalLib: window.parent.ExternalLib,
					Filer: window.parent.Filer,
					instanceWindow: instanceWin,
				});
			}
		};
		prox();
	}, [srcRef, src]);
	useEffect(() => {
		const reload = (e: CustomEvent) => {
			if (e.detail === config.pid) {
				if (srcRef.current?.contentWindow) {
					srcRef.current.contentWindow.location.reload();
					srcRef.current.onload = () => {
						Object.assign(srcRef.current?.contentWindow!, {
							tb: window.parent.tb,
							anura: window.parent.anura,
							AliceWM: window.parent.AliceWM,
							LocalFS: window.parent.LocalFS,
							ExternalApp: window.parent.ExternalApp,
							ExternalLib: window.parent.ExternalLib,
							Filer: window.parent.Filer,
							instanceWindow: window.anura.wm.getWeakRef(Number(config.pid)) || {},
						});
					};
				}
			}
		};
		const max = (e: CustomEvent) => {
			if (e.detail === config.pid) {
				setMaximized(true);
				windowStore.arrange(config.wid);
			}
		};
		const min = (e: CustomEvent) => {
			if (e.detail === config.pid) {
				setMinimized(true);
			}
		};
		const returnCont = (e: CustomEvent) => {
			if (e.detail === config.pid) {
				window.dispatchEvent(new CustomEvent("curr-win-content", { detail: contentRef.current }));
			}
		};
		const setCont = (e: CustomEvent) => {
			const msg = JSON.parse(e.detail);
			if (msg.currWin === config.pid) {
				if (contentRef.current) {
					contentRef.current.innerHTML = msg.content;
				}
			}
		};
		const setBC = (e: CustomEvent) => {
			const msg = JSON.parse(e.detail);
			if (msg.currWin === config.pid) {
				if (titleRef.current) {
					titleRef.current.style.color = msg.color;
				}
			}
		};
		const setBG = (e: CustomEvent) => {
			const msg = JSON.parse(e.detail);
			if (msg.currWin === config.pid) {
				if (titleRef.current) {
					titleRef.current.style.backgroundColor = msg.color;
				}
			}
		};
		const settxt = (e: CustomEvent) => {
			const msg = JSON.parse(e.detail);
			if (msg.currWin === config.pid) {
				if (titleRef.current) {
					titleRef.current.innerText = msg.txt;
				}
			}
		};
		const selWin = (e: CustomEvent) => {
			if (e.detail === config.wid) {
				windowStore.arrange(config.wid);
				// @ts-ignore
				setZIndex(windowStore.getWindow(config.wid)?.zIndex);
				setMinimized(false);
				setTimeout(() => {
					windowRef.current?.classList.remove("duration-150");
				}, 150);
				if (focuserRef.current) focuserRef.current.click();
				updateInfo({ appname: typeof config.title === "string" ? config.title : config.title?.text });
			}
		};
		const debugCTX = (e: MouseEvent) => {
			const rect = (e.target as HTMLElement).getBoundingClientRect();
			window.tb.contextmenu.create({
				x: rect.left + 100,
				y: rect.top + 40,
				options: [
					{
						text: "Minimize",
						click: () => {
							setMinimized(true);
						},
					},
					{
						text: "Maximize",
						click: () => {
							setMaximized(true);
						},
					},
					{
						text: "Reload",
						click: () => {
							if (srcRef.current?.contentWindow) {
								srcRef.current.contentWindow.location.reload();
								Object.assign(srcRef.current?.contentWindow!, {
									tb: window.parent.tb,
									anura: window.parent.anura,
									AliceWM: window.parent.AliceWM,
									LocalFS: window.parent.LocalFS,
									ExternalApp: window.parent.ExternalApp,
									ExternalLib: window.parent.ExternalLib,
									Filer: window.parent.Filer,
									instanceWindow: window.anura.wm.getWeakRef(Number(config.pid)) || {},
								});
							}
						},
					},
					{
						text: "Close",
						click: () => {
							windowStore.removeWindow(config.wid);
							clearInfo();
						},
					},
				],
			});
		};
		const changeURL = (e: CustomEvent) => {
			const det = JSON.parse(e.detail);
			if (det.pid === config.pid) {
				if (srcRef.current?.contentWindow) {
					setSrc(det.url);
					srcRef.current.onload = () => {
						Object.assign(srcRef.current?.contentWindow!, {
							tb: window.parent.tb,
							anura: window.parent.anura,
							AliceWM: window.parent.AliceWM,
							LocalFS: window.parent.LocalFS,
							ExternalApp: window.parent.ExternalApp,
							ExternalLib: window.parent.ExternalLib,
							Filer: window.parent.Filer,
							instanceWindow: window.anura.wm.getWeakRef(Number(config.pid)) || {},
						});
					};
				}
			}
		};
		const minall: any = () => {
			if (!minimized) setMinimized(true);
		};

		const updAccent = async () => {
			const settings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8")) as UserSettings;
			setAccent(`${settings.window.winAccent}${settings.window.blurlevel}`);
			setIsFullscreen(settings.window.alwaysFullscreen);
		};
		updAccent();

		window.addEventListener("reload-win", reload as EventListener);
		window.addEventListener("max-win", max as EventListener);
		window.addEventListener("min-win", min as EventListener);
		window.addEventListener("get-content", returnCont as EventListener);
		window.addEventListener("upd-wincont", setCont as EventListener);
		window.addEventListener("upd-winbarcol", setBC as EventListener);
		window.addEventListener("upd-winbartxt", settxt as EventListener);
		window.addEventListener("upd-winbarbg", setBG as EventListener);
		window.addEventListener("upd-src", changeURL as EventListener);
		window.addEventListener("sel-win", selWin as EventListener);
		window.addEventListener("min-wins", minall);
		window.addEventListener("upd-accent", updAccent);
		if (regionRef.current) regionRef.current.addEventListener("contextmenu", debugCTX);
		return () => {
			window.removeEventListener("reload-win", reload as EventListener);
			window.removeEventListener("max-win", max as EventListener);
			window.removeEventListener("min-win", min as EventListener);
			window.removeEventListener("get-content", returnCont as EventListener);
			window.removeEventListener("upd-wincont", setCont as EventListener);
			window.removeEventListener("upd-winbarcol", setBC as EventListener);
			window.removeEventListener("upd-winbartxt", settxt as EventListener);
			window.removeEventListener("upd-winbarbg", setBG as EventListener);
			window.removeEventListener("upd-src", changeURL as EventListener);
			window.removeEventListener("sel-win", selWin as EventListener);
			window.removeEventListener("min-wins", minall);
			window.removeEventListener("upd-accent", updAccent);
			if (regionRef.current) regionRef.current.removeEventListener("contextmenu", debugCTX);
		};
	}, []);

	const handleSnap = (newX: number, newY: number) => {
		if (config.snapable !== false) {
			if (!windowRef.current) return;
			originalSize.current = { width, height };
			const windowWidth = windowRef.current.offsetWidth;
			const windowHeight = windowRef.current.offsetHeight;
			const SNAP_THRESHOLD = 7;
			const CORNER_THRESHOLD = 40;
			const atLeft = newX <= SNAP_THRESHOLD;
			const atRight = newX + windowWidth >= window.innerWidth - SNAP_THRESHOLD;
			const atTop = newY <= SNAP_THRESHOLD;
			const atBottom = newY + windowHeight >= window.innerHeight - SNAP_THRESHOLD;
			if (atLeft && atTop && newX <= CORNER_THRESHOLD && newY <= CORNER_THRESHOLD) {
				setX(0);
				setY(0);
				setSnapRegion("top-left");
				onSnapPreview?.("top-left");
			} else if (atRight && atTop && newX + windowWidth >= window.innerWidth - CORNER_THRESHOLD && newY <= CORNER_THRESHOLD) {
				setX(window.innerWidth - windowWidth);
				setY(0);
				setSnapRegion("top-right");
				onSnapPreview?.("top-right");
			} else if (atLeft && atBottom && newX <= CORNER_THRESHOLD && newY + windowHeight >= window.innerHeight - CORNER_THRESHOLD) {
				setX(0);
				setY(window.innerHeight - windowHeight);
				setSnapRegion("bottom-left");
				onSnapPreview?.("bottom-left");
			} else if (atRight && atBottom && newX + windowWidth >= window.innerWidth - CORNER_THRESHOLD && newY + windowHeight >= window.innerHeight - CORNER_THRESHOLD) {
				setX(window.innerWidth - windowWidth);
				setY(window.innerHeight - windowHeight);
				setSnapRegion("bottom-right");
				onSnapPreview?.("bottom-right");
			} else if (atLeft) {
				setX(0);
				setSnapRegion("left");
				onSnapPreview?.("left");
			} else if (atRight) {
				setX(window.innerWidth - windowWidth);
				setSnapRegion("right");
				onSnapPreview?.("right");
			} else if (atTop) {
				setY(0);
				setSnapRegion("top");
				onSnapPreview?.("top");
			} else {
				if (snapRegion && originalSize.current) {
					setWidth(originalSize.current.width);
					setHeight(originalSize.current.height);
				}
				setSnapRegion(null);
				onSnapDone?.();
			}
		}
	};
	useEffect(() => {
		if (isDragging && isSnapped && originalSize.current && windowRef.current) {
			windowRef.current.style.width = `${originalSize.current.width}px`;
			windowRef.current.style.height = `${originalSize.current.height}px`;
			setIsSnapped(false);
			setSnapRegion(null);
			onSnapDone?.();
		}
	}, [isDragging, isSnapped]);

	// Disable pointer events on all iframes when dragging
	useEffect(() => {
		if (isDragging || isResizing) {
			const iframes = document.querySelectorAll('iframe');
			iframes.forEach(iframe => {
				iframe.style.pointerEvents = 'none';
			});
		} else {
			const iframes = document.querySelectorAll('iframe');
			iframes.forEach(iframe => {
				iframe.style.pointerEvents = 'auto';
			});
		}
	}, [isDragging, isResizing]);

	useEffect(() => {
		const snap = () => {
			setIsMouseDown(false);
			setIsDragging(false);
			if (windowRef.current) {
				if (snapRegion === "left") {
					windowRef.current.style.left = "0";
					windowRef.current.style.width = "50%";
					windowRef.current.style.height = "100%";
					windowRef.current.style.top = "0";
					setIsSnapped(true);
				} else if (snapRegion === "right") {
					windowRef.current.style.left = "50%";
					windowRef.current.style.width = "50%";
					windowRef.current.style.height = "100%";
					windowRef.current.style.top = "0";
					setIsSnapped(true);
				} else if (snapRegion === "top") {
					setMaximized(true);
					setIsSnapped(true);
				} else if (snapRegion === "top-left") {
					windowRef.current.style.left = "0";
					windowRef.current.style.top = "0";
					windowRef.current.style.width = "50%";
					windowRef.current.style.height = "50%";
					setIsSnapped(true);
				} else if (snapRegion === "top-right") {
					windowRef.current.style.left = "50%";
					windowRef.current.style.top = "0";
					windowRef.current.style.width = "50%";
					windowRef.current.style.height = "50%";
					setIsSnapped(true);
				} else if (snapRegion === "bottom-left") {
					windowRef.current.style.left = "0";
					windowRef.current.style.top = "50%";
					windowRef.current.style.width = "50%";
					windowRef.current.style.height = "50%";
					setIsSnapped(true);
				} else if (snapRegion === "bottom-right") {
					windowRef.current.style.left = "50%";
					windowRef.current.style.top = "50%";
					windowRef.current.style.width = "50%";
					windowRef.current.style.height = "50%";
					setIsSnapped(true);
				}
			}
			setSnapRegion(null);
			onSnapDone?.();
		};
		window.addEventListener("mouseup", snap);
		return () => window.removeEventListener("mouseup", snap);
	}, [snapRegion, isDragging, maximized, isResizing]);

	const handleMouseDown = (direction: "top" | "left" | "right" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right") => {
		let animationFrameId: number | null = null;
		let lastMouseEvent: MouseEvent | null = null;

		const onMove = (e: MouseEvent) => {
			if (!optimizationsEnabled) {
				// Without optimizations: update immediately
				setIsResizing(true);
				setMaximized(false);
				windowRef.current!.style.transform = "";

				if (direction.includes("top")) {
					const offsetY = e.clientY - 65;
					const newY = Math.max(offsetY, 0);
					const newHeight = height + (typeof y === "number" ? y - newY : 0);
					if (newHeight >= (config.size?.minHeight ?? 224)) {
						setHeight(newHeight);
						setY(newY);
					}
				}
				if (direction.includes("left")) {
					const offsetX = e.clientX - 10;
					const newX = Math.max(offsetX, 0);
					const newWidth = width + (typeof x === "number" ? x - newX : 0);
					if (newWidth >= (config.size?.minWidth ?? 224)) {
						setWidth(newWidth);
						setX(newX);
					}
				}
				if (direction.includes("right")) {
					const offsetX = e.clientX - 5;
					const newX = typeof x === "number" ? x : 0;
					const newWidth = offsetX - newX;
					if (newWidth >= (config.size?.minWidth ?? 224)) {
						setWidth(newWidth);
						setX(newX);
					}
				}
				if (direction.includes("bottom")) {
					const offsetY = e.clientY - 55;
					const newY = typeof y === "number" ? y : 0;
					const newHeight = offsetY - newY;
					if (newHeight >= (config.size?.minHeight ?? 224)) {
						setHeight(newHeight);
						setY(newY);
					}
				}
				return;
			}
			
			// With optimizations: use requestAnimationFrame
			lastMouseEvent = e;
			
			if (!animationFrameId) {
				animationFrameId = requestAnimationFrame(() => {
					if (!lastMouseEvent) return;
					const e = lastMouseEvent;
					
					setIsResizing(true);
					setMaximized(false);
					windowRef.current!.style.transform = "";

					if (direction.includes("top")) {
						const offsetY = e.clientY - 65;
						const newY = Math.max(offsetY, 0);
						const newHeight = height + (typeof y === "number" ? y - newY : 0);
						if (newHeight >= (config.size?.minHeight ?? 224)) {
							setHeight(newHeight);
							setY(newY);
						}
					}
					if (direction.includes("left")) {
						const offsetX = e.clientX - 10;
						const newX = Math.max(offsetX, 0);
						const newWidth = width + (typeof x === "number" ? x - newX : 0);
						if (newWidth >= (config.size?.minWidth ?? 224)) {
							setWidth(newWidth);
							setX(newX);
						}
					}
					if (direction.includes("right")) {
						const offsetX = e.clientX - 5;
						const newX = typeof x === "number" ? x : 0;
						const newWidth = offsetX - newX;
						if (newWidth >= (config.size?.minWidth ?? 224)) {
							setWidth(newWidth);
							setX(newX);
						}
					}
					if (direction.includes("bottom")) {
						const offsetY = e.clientY - 55;
						const newY = typeof y === "number" ? y : 0;
						const newHeight = offsetY - newY;
						if (newHeight >= (config.size?.minHeight ?? 224)) {
							setHeight(newHeight);
							setY(newY);
						}
					}
					
					animationFrameId = null;
				});
			}
			originalSize.current = { width, height };
		};

		const onUp = () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
			window.removeEventListener("blur", onUp);
			setIsMouseDown(false);
			setIsResizing(false);
		};

		window.onmouseleave = () => {
			setIsDragging(false);
			setIsMouseDown(false);
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
			window.removeEventListener("blur", onUp);
		};

		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
		window.addEventListener("blur", onUp);
		setIsMouseDown(true);
	};

	return (
		<div
			ref={windowRef}
			id={config.wid}
			// @ts-ignore
			pid={config.pid}
			className={`
            ${className ? className : ""}
            absolute
            bg-[${accent}]
            rounded-lg shadow-window-shadow overflow-hidden
            ${minimized ? "translate-y-3 opacity-0 duration-150 hidden" : " translate-y-0 opacity-100"}
            ${maximized ? `left-0 right-0 top-0 bottom-0 opacity-100 w-full ${isFullscreen ? "h-[106%]" : "h-full"}` : `w-[${width}px] h-[${height}px]`}
        `}
			style={{
				left: maximized ? "" : x,
				top: maximized ? "" : y,
				height: maximized ? undefined : height,
				width: maximized ? undefined : width,
				zIndex: minimized ? 2 : zIndex,
				...(optimizationsEnabled && {
					contain: "layout style paint",
					willChange: isDragging || isResizing ? "transform, left, top" : "auto",
				}),
				backgroundColor: accent,
			}}
			onMouseDown={() => {
				updateInfo({ appname: typeof config.title === "string" ? config.title : config.title?.text });
			}}
		>
			<div
				className="absolute left-0 top-0 size-full rounded-lg backdrop-blur-[20px] pointer-events-none shadow-tb-border -z-1 bg-[#00000048]"
				style={{
					backgroundImage: "url(/assets/img/grain.png)",
				}}
			></div>
			{isSnapped ? (
				<div
					ref={focuserRef}
					className={`absolute rounded-lg ${config.focused ? "inset-x-2 top-[calc(40px+0.5rem)] bottom-2 pointer-events-none opacity-0" : "inset-x-[1px] top-[40px] bottom-[1px] opacity-100"} duration-150`}
					onMouseDown={() => {
						windowStore.arrange(config.wid);
						// @ts-ignore
						setZIndex(windowStore.getWindow(config.wid)?.zIndex);
					}}
				></div>
			) : (
				<div
					ref={focuserRef}
					className={`absolute rounded-lg ${config.focused ? "inset-x-2 top-[calc(40px+0.5rem)] bottom-2 pointer-events-none opacity-0" : "inset-x-[1px] top-[40px] bottom-[1px] backdrop-blur-[4px] opacity-100"} duration-150`}
					onMouseDown={() => {
						windowStore.arrange(config.wid);
						// @ts-ignore
						setZIndex(windowStore.getWindow(config.wid)?.zIndex);
					}}
				></div>
			)}
			<div className="absolute left-0 right-0 h-[6px] cursor-n-resize z-10" data-resizer="top" onMouseDown={() => handleMouseDown("top")} />
			<div className="absolute left-0 top-[6px] bottom-[6px] w-[6px] cursor-w-resize z-10" data-resizer="left" onMouseDown={() => handleMouseDown("left")} />
			<div className="absolute right-0 top-[6px] bottom-[6px] w-[6px] cursor-e-resize z-10" data-resizer="right" onMouseDown={() => handleMouseDown("right")} />
			<div className="absolute bottom-0 left-0 right-0 h-[6px] cursor-s-resize z-10" data-resizer="bottom" onMouseDown={() => handleMouseDown("bottom")} />
			<div className="absolute top-0 left-0 size-4 cursor-nw-resize z-20" data-resizer="top-left" onMouseDown={() => handleMouseDown("top-left")} />
			<div className="absolute top-0 right-0 size-4 cursor-ne-resize z-20" data-resizer="top-right" onMouseDown={() => handleMouseDown("top-right")} />
			<div className="absolute bottom-0 left-0 size-4 cursor-sw-resize z-20" data-resizer="bottom-left" onMouseDown={() => handleMouseDown("bottom-left")} />
			<div className="absolute bottom-0 right-0 size-4 cursor-se-resize z-20" data-resizer="bottom-right" onMouseDown={() => handleMouseDown("bottom-right")} />
			<div
				ref={regionRef}
				className="region flex justify-between items-center bg-[#ffffff10] p-2 min-w-[224px] select-none"
				onMouseDown={(e: React.MouseEvent) => {
					windowStore.arrange(config.wid);
					// @ts-ignore
					setZIndex(windowStore.getWindow(config.wid)?.zIndex);
					if ((e.target as HTMLElement).classList.contains("no-drag")) return;
					const offsetX = e.clientX - windowRef.current!.offsetLeft;
					const offsetY = e.clientY - windowRef.current!.offsetTop;

					let animationFrameId: number | null = null;
					let lastMouseEvent: MouseEvent | null = null;

					const onMove = (e: MouseEvent) => {
						if (!optimizationsEnabled) {
							// Without optimizations: update immediately
							if (windowRef.current) windowRef.current.style.transform = "";
							setIsDragging(true);
							setMaximized(false);
							const newX = e.clientX - offsetX;
							const newY = e.clientY - offsetY;
							handleSnap(newX, newY);
							if (newY > 0 && newY < window.innerHeight - windowRef.current!.offsetHeight) setY(newY);
							if (newX > 0 && newX < window.innerWidth - windowRef.current!.offsetWidth) setX(newX);
							return;
						}
						
						// With optimizations: use requestAnimationFrame
						lastMouseEvent = e;
						
						if (!animationFrameId) {
							animationFrameId = requestAnimationFrame(() => {
								if (!lastMouseEvent) return;
								const e = lastMouseEvent;
								
								if (windowRef.current) windowRef.current.style.transform = "";
								setIsDragging(true);
								setMaximized(false);
								const newX = e.clientX - offsetX;
								const newY = e.clientY - offsetY;
								handleSnap(newX, newY);
								if (newY > 0 && newY < window.innerHeight - windowRef.current!.offsetHeight) setY(newY);
								if (newX > 0 && newX < window.innerWidth - windowRef.current!.offsetWidth) setX(newX);
								
								animationFrameId = null;
							});
						}
					};

					const onUp = () => {
						if (animationFrameId) {
							cancelAnimationFrame(animationFrameId);
							animationFrameId = null;
						}
						window.removeEventListener("mousemove", onMove);
						window.removeEventListener("mouseup", onUp);
						window.removeEventListener("blur", onUp);
						setIsMouseDown(false);
						setIsDragging(false);
					};

					window.addEventListener("mousemove", onMove);
					window.addEventListener("mouseup", onUp);
					window.addEventListener("blur", onUp);

					window.onmouseleave = () => {
						setIsDragging(false);
						setIsMouseDown(false);
						window.removeEventListener("mousemove", onMove);
						window.removeEventListener("mouseup", onUp);
						window.removeEventListener("blur", onUp);
					};

					setIsMouseDown(true);
				}}
				onMouseUp={() => {
					setIsMouseDown(false);
					setIsDragging(false);
				}}
				onMouseLeave={() => {
					if (isMouseDown) {
						setIsDragging(false);
					}
				}}
				onMouseEnter={() => {
					if (isMouseDown) {
						setIsDragging(true);
					}
				}}
				onDoubleClick={() => {
					if (config.maximizable !== false)
						if (windowRef.current) {
							windowRef.current.style.transitionProperty = "width, height, left, top";
							windowRef.current.style.transitionDuration = "150ms";
						}
					setTimeout(() => {
						if (windowRef.current) {
							windowRef.current.style.transitionProperty = "";
							windowRef.current.style.transitionDuration = "";
						}
					}, 150);
					setMaximized(!maximized);
				}}
			>
				<div className="flex gap-2 items-center flex-row w-full">
					<img src={config.icon} alt="icon" className="w-5 h-5 pointer-events-none select-none" draggable={false} />
					<span ref={titleRef} className="font-[680] pointer-events-none select-none">
						{title}
					</span>
					{titlebarhtml && <div className="w-[80%]" ref={thtmlref} />}
				</div>
				{controls ? (
					<div className="controls flex gap-1">
						{controls?.map((control, index) => {
							if (control === "minimize") {
								return (
									<svg
										ref={miniRef}
										key={index}
										className={`group size-4 ${config.minimizable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
										viewBox="0 0 24 24"
										fill="none"
										onMouseDown={() => {
											if (config.minimizable === false) return;
											if (windowRef.current) {
												windowRef.current.style.transitionProperty = "transform, opacity";
												windowRef.current.style.transitionDuration = "150ms";
											}
											setTimeout(() => {
												if (windowRef.current) {
													windowRef.current.style.transitionProperty = "";
													windowRef.current.style.transitionDuration = "";
												}
											}, 150);
											setMinimized(true);
										}}
									>
										<rect
											className={`
                                                    ${config.minimizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                                `}
											x="4"
											y="10"
											width="16"
											height="3"
											rx="2"
										/>
									</svg>
								);
							}
							if (control === "maximize") {
								return (
									<svg
										ref={minMaxRef}
										key={index}
										className={`group size-4 ${config.maximizable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
										viewBox="0 0 24 24"
										fill="none"
										onMouseDown={() => {
											if (config.maximizable === false) return;
											if (windowRef.current) {
												windowRef.current.style.transitionProperty = "width, height, left, top";
												windowRef.current.style.transitionDuration = "150ms";
											}
											setTimeout(() => {
												if (windowRef.current) {
													windowRef.current.style.transitionProperty = "";
													windowRef.current.style.transitionDuration = "";
												}
											}, 150);
											setMaximized(!maximized);
										}}
									>
										{maximized ? (
											<>
												<path
													className={`
                                                                    ${config.maximizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                                                `}
													d="M6 6C6 3.79086 7.79086 2 10 2H18C20.2091 2 22 3.79086 22 6V14C22 16.2091 20.2091 18 18 18H16V16H18C19.1046 16 20 15.1046 20 14V6C20 4.89543 19.1046 4 18 4H10C8.89543 4 8 4.89543 8 6V8H6V6Z"
												/>
												<path
													className="fill-[#ffffffbb] group-hover:fill-white duration-150 pointer-events-none"
													fillRule="evenodd"
													clipRule="evenodd"
													d="M6 6C3.79086 6 2 7.79086 2 10V18C2 20.2091 3.79086 22 6 22H14C16.2091 22 18 20.2091 18 18V10C18 7.79086 16.2091 6 14 6H6ZM6 8C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H14C15.1046 20 16 19.1046 16 18V10C16 8.89543 15.1046 8 14 8H6Z"
												/>
											</>
										) : (
											<path
												className={`
                                                                ${config.maximizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                                            `}
												fillRule="evenodd"
												clipRule="evenodd"
												d="M8 4C5.79086 4 4 5.79086 4 8V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V8C20 5.79086 18.2091 4 16 4H8ZM8 6C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8Z"
											/>
										)}
									</svg>
								);
							}
							if (control === "close") {
								return (
									<svg
										ref={closeRef}
										key={index}
										className={`group size-4 ${config.closable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
										viewBox="0 0 24 24"
										fill="none"
										onMouseDown={() => {
											if (config.closable === false) return;
											if (windowRef.current) {
												windowRef.current.style.transitionProperty = "transform, opacity";
												windowRef.current.style.transitionDuration = "150ms";
												windowRef.current.classList.add("translate-y-3", "opacity-0");
											}
											setTimeout(() => {
												clearInfo();
												windowStore.removeWindow(config.wid);
											}, 150);
										}}
									>
										<path
											className={`
                                                    ${config.closable === false ? "stroke-[#ffffff60]" : "stroke-[#ffffffbb] group-hover:stroke-white"} duration-150 pointer-events-none
                                                `}
											d="M6 18L18 6M6 6L18 18"
											stroke="white"
											strokeWidth="2.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								);
							}
						})}
					</div>
				) : (
					<div className="controls flex gap-1">
						<svg
							ref={miniRef}
							className={`group size-4 ${config.minimizable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
							viewBox="0 0 24 24"
							fill="none"
							onMouseDown={() => {
								if (config.minimizable === false) return;
								if (windowRef.current) {
									windowRef.current.style.transitionProperty = "transform, opacity";
									windowRef.current.style.transitionDuration = "150ms";
								}
								setTimeout(() => {
									if (windowRef.current) {
										windowRef.current.style.transitionProperty = "";
										windowRef.current.style.transitionDuration = "";
									}
								}, 150);
								windowStore.minimize(config.wid);
								window.dispatchEvent(new CustomEvent("min-win", { detail: config.pid }));
								setMinimized(true);
							}}
						>
							<rect
								className={`
                                    ${config.minimizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                `}
								x="4"
								y="10"
								width="16"
								height="3"
								rx="2"
							/>
						</svg>
						<svg
							ref={minMaxRef}
							className={`group size-4 ${config.maximizable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
							viewBox="0 0 24 24"
							fill="none"
							onMouseDown={() => {
								if (config.maximizable === false) return;
								if (windowRef.current) {
									windowRef.current.style.transitionProperty = "width, height, left, top";
									windowRef.current.style.transitionDuration = "150ms";
								}
								setTimeout(() => {
									if (windowRef.current) {
										windowRef.current.style.transitionProperty = "";
										windowRef.current.style.transitionDuration = "";
									}
								}, 150);
								setMaximized(!maximized);
							}}
						>
							{maximized ? (
								<>
									<path
										className={`
                                                ${config.maximizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                            `}
										d="M6 6C6 3.79086 7.79086 2 10 2H18C20.2091 2 22 3.79086 22 6V14C22 16.2091 20.2091 18 18 18H16V16H18C19.1046 16 20 15.1046 20 14V6C20 4.89543 19.1046 4 18 4H10C8.89543 4 8 4.89543 8 6V8H6V6Z"
									/>
									<path
										className="fill-[#ffffffbb] group-hover:fill-white duration-150 pointer-events-none"
										fillRule="evenodd"
										clipRule="evenodd"
										d="M6 6C3.79086 6 2 7.79086 2 10V18C2 20.2091 3.79086 22 6 22H14C16.2091 22 18 20.2091 18 18V10C18 7.79086 16.2091 6 14 6H6ZM6 8C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H14C15.1046 20 16 19.1046 16 18V10C16 8.89543 15.1046 8 14 8H6Z"
									/>
								</>
							) : (
								<path
									className={`
                                            ${config.maximizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                        `}
									fillRule="evenodd"
									clipRule="evenodd"
									d="M8 4C5.79086 4 4 5.79086 4 8V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V8C20 5.79086 18.2091 4 16 4H8ZM8 6C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8Z"
								/>
							)}
						</svg>
						<svg
							ref={closeRef}
							className={`group size-4 ${config.closable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
							viewBox="0 0 24 24"
							fill="none"
							onMouseDown={() => {
								if (config.closable === false) return;
								if (windowRef.current) {
									windowRef.current.style.transitionProperty = "transform, opacity";
									windowRef.current.style.transitionDuration = "150ms";
									windowRef.current.classList.add("translate-y-3", "opacity-0");
								}
								setTimeout(() => {
									clearInfo();
									windowStore.removeWindow(config.wid);
								}, 150);
							}}
						>
							<path
								className={`
                                    ${config.closable === false ? "stroke-[#ffffff60]" : "stroke-[#ffffffbb] group-hover:stroke-white"} duration-150 pointer-events-none
                                `}
								d="M6 18L18 6M6 6L18 18"
								stroke="white"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
				)}
			</div>
			<div ref={contentRef} className="w-full h-full" style={optimizationsEnabled ? { contain: "strict" } : {}}>
				<iframe
					key={config.src}
					ref={srcRef}
					src={src}
					loading={optimizationsEnabled && minimized ? "lazy" : "eager"}
					onLoad={() => {
						if (config.message) {
							srcRef.current?.contentWindow!.postMessage(config.message, "*");
						}
						const sr1 = document.createElement("script");
						const sr2 = document.createElement("script");
						sr1.src = "/cursor_changer.js";
						sr2.src = "/media_interactions.js";
						srcRef.current?.contentDocument?.head.appendChild(sr1);
						srcRef.current?.contentDocument?.head.appendChild(sr2);
					}}
					referrerPolicy="no-referrer"
					style={{ 
						border: "none", 
						all: "initial", 
						width: "100%", 
						height: "calc(100% - 40px)", 
						pointerEvents: isMouseDown ? "none" : "auto", 
						userSelect: "none",
						...(optimizationsEnabled && { contain: "strict" }),
					}}
				></iframe>
			</div>
		</div>
	);
};

// Memoize WindowElement to prevent unnecessary re-renders
const MemoizedWindowElement = memo(WindowElement, (prevProps, nextProps) => {
	// Only re-render if config changes in meaningful ways
	return (
		prevProps.config.wid === nextProps.config.wid &&
		prevProps.config.zIndex === nextProps.config.zIndex &&
		prevProps.config.focused === nextProps.config.focused &&
		prevProps.className === nextProps.className
	);
});

const DesktopItems = () => {
	const [items, setItems] = useState<any[]>([]);
	const [dragging, setDragging] = useState<boolean>(false);
	const draggedItemIndex = useRef<number | null>(null);
	const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [dragradius, setDragradius] = useState<boolean>(false);
	const [selected, setSelected] = useState<any>(null);
	const selectedRef = useRef<HTMLDivElement>(null);
	const user = sessionStorage.getItem("currAcc");

	useEffect(() => {
		const addDesktopListener = async () => {
			let desktopItems: string[] = await window.tb.fs.promises.readdir(`/home/${user}/desktop`);

			const handleDesktopChange = async () => {
				try {
					const updatedItems = await window.tb.fs.promises.readdir(`/home/${user}/desktop`);
					const addedItems = updatedItems.filter(item => !desktopItems.includes(item));
					const removedItems = desktopItems.filter(item => !updatedItems.includes(item));
					var desktopConfig = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
					if (addedItems.length > 0) {
						const findLastItem = () => {
							for (let i = desktopConfig.length - 1; i >= 0; i--) {
								if (!desktopConfig[i].position.custom) {
									return desktopConfig[i];
								}
							}
							return null;
						};

						const lastItem: any = findLastItem();
						const highestLeft = Math.max(...desktopConfig.map((item: any) => item.position.left));
						let topPos = 0;
						let leftPos = 0;

						if (lastItem && lastItem.position.top < 11) {
							topPos = Math.floor(lastItem.position.top + 1);
							leftPos = lastItem.position.left;
						} else {
							leftPos = Math.floor(highestLeft + 1);
						}

						for (const item of addedItems) {
							const itemExists = desktopConfig.some((config: any) => config.item === `/home/${user}/desktop/${item}`);
							if (!itemExists) {
								const type = (await window.tb.fs.promises.stat(`/home/${user}/desktop/${item}`))!.type.toLowerCase();
								if (type === "symlink") {
									const isAppJson = (await window.tb.fs.promises.readFile(await window.tb.fs.promises.readlink(`/home/${user}/desktop/${item}`))).includes("config");
									desktopConfig.push({
										name: isAppJson ? JSON.parse(await window.tb.fs.promises.readFile(await window.tb.fs.promises.readlink(`/home/${user}/desktop/${item}`)))["config"].title : item,
										item: `/home/${user}/desktop/${item}`,
										position: {
											custom: false,
											top: topPos,
											left: leftPos,
										},
									});
								} else if (type === "file") {
									const ext = item.split(".").pop();
									const icons = JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/file-icons.json"));
									const iconName = ext ? icons["ext-to-name"][ext] : "Unknown";
									const iconPath = iconName ? icons["name-to-path"][iconName] : "/system/etc/terbium/file-icons/Unknown.svg";
									const iconData = await window.tb.fs.promises.readFile(iconPath, "utf8");

									desktopConfig.push({
										name: item,
										item: `/home/${user}/desktop/${item}`,
										position: {
											custom: false,
											top: topPos,
											left: leftPos,
										},
										icon: iconData,
									});
								}
							}
						}
					}

					if (removedItems.length > 0) {
						for (const item of removedItems) {
							const index = desktopConfig.findIndex((config: any) => config.item === `/home/${user}/desktop/${item}`);
							desktopConfig.splice(index, 1);
						}
					}

					desktopItems = updatedItems;
					await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
				} catch (error) {
					console.error("Error while reading directory:", error);
				}
				window.dispatchEvent(new Event("upd-desktop"));
			};

			handleDesktopChange();
		};

		addDesktopListener();
	}, []);

	useEffect(() => {
		const getItems = async () => {
			var allItems: any[] = [];
			const items = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
			for (const item of items) {
				const type = (await window.tb.fs.promises.stat(item.item))!.type.toLowerCase();
				const position = item.position;
				if (type === "symlink") {
					allItems.push({
						name: item.name,
						type: "symlink",
						item: item.item,
						position: {
							custom: position.custom,
							top: position.top,
							left: position.left,
						},
						config: JSON.parse(await window.tb.fs.promises.readFile(await window.tb.fs.promises.readlink(item.item)))["config"],
					});
				} else if (type === "file") {
					const ext = item.name.split(".").pop();
					const icons = JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/file-icons.json"));
					const iconName = ext ? icons["ext-to-name"][ext] : "Unknown";
					const iconPath = iconName ? icons["name-to-path"][iconName] : "/system/etc/terbium/file-icons/Unknown.svg";
					const iconData = await window.tb.fs.promises.readFile(iconPath, "utf8");
					allItems.push({
						name: item.name,
						type: "file",
						item: item.item,
						position: {
							custom: position.custom,
							top: position.top,
							left: position.left,
						},
						icon: iconData,
					});
				} else if (type === "directory") {
					allItems.push({
						name: item.name,
						type: "directory",
						item: item.item,
						position: {
							custom: position.custom,
							top: position.top,
							left: position.left,
						},
						icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" /></svg>`,
					});
				}
			}

			setItems(allItems);
		};
		getItems();
		window.addEventListener("upd-desktop", getItems);
		return () => window.removeEventListener("upd-desktop", getItems);
	}, []);

	const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
		let holdTimeout: NodeJS.Timeout | null = null;
		let renamingIndex: number | null = null;
		const startDragging = () => {
			setDragradius(true);
			setDragging(true);
			draggedItemIndex.current = index;
		};

		const saveName = async () => {
			if (selectedRef.current && renamingIndex !== null) {
				const spanElement = selectedRef.current.querySelector("span");
				if (spanElement) {
					const newName = spanElement.innerText;
					const oldName = items[renamingIndex].name;
					const itemPath = items[renamingIndex].item;
					const newPath = itemPath.replace(oldName, newName);
					if (selectedRef.current?.dataset.type === "shortcut") {
						const desktopItems = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
						const itemIndex = desktopItems.findIndex((item: any) => item.item === itemPath);
						if (itemIndex !== -1) {
							desktopItems[itemIndex].name = newName;
							desktopItems[itemIndex].item = newPath;
							await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopItems, null, 4));
							window.dispatchEvent(new Event("upd-desktop"));
						}
					} else {
						await window.tb.fs.promises.rename(itemPath, newPath);
						const desktopItems = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
						const itemIndex = desktopItems.findIndex((item: any) => item.item === itemPath);
						if (itemIndex !== -1) {
							desktopItems[itemIndex].name = newName;
							desktopItems[itemIndex].item = newPath;
							await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopItems, null, 4));
							window.dispatchEvent(new Event("upd-desktop"));
							selectedRef.current = null;
						}
					}
				}
			}
			renamingIndex = null;
		};

		if (selectedRef.current && selectedRef.current === e.currentTarget) {
			if (selectedRef.current && selectedRef.current !== null) {
				const spanElement = selectedRef.current.querySelector("span");
				if (spanElement) {
					spanElement.contentEditable = "true";
					const range = document.createRange();
					const selection = window.getSelection();
					range.selectNodeContents(spanElement);
					range.collapse(false);
					selection?.removeAllRanges();
					selection?.addRange(range);
					spanElement.addEventListener("keydown", async e => {
						if (e.key === "Enter") {
							e.preventDefault();
							await saveName();
						}
					});
					spanElement.focus();
					renamingIndex = index;
				}
				const mouseDownHandler = async (e: MouseEvent) => {
					if (selectedRef.current && !selectedRef.current.contains(e.target as Node)) {
						setSelected(null);
						const spanElement = selectedRef.current.querySelector("span");
						if (spanElement) {
							await saveName();
							spanElement.contentEditable = "false";
							spanElement.blur();
							selectedRef.current = null;
						}
					}
				};
				document.addEventListener("mousedown", mouseDownHandler, { once: true });
			}
		} else {
			selectedRef.current = e.currentTarget;
			renamingIndex = index;
		}

		holdTimeout = setTimeout(startDragging, 300);
		const clearHoldTimeout = () => {
			if (holdTimeout) {
				clearTimeout(holdTimeout);
				holdTimeout = null;
			}
		};
		window.onmouseup = async (e: MouseEvent) => {
			setDragging(false);
			window.removeEventListener("mousemove", onMouseMove);
			if (draggedItemIndex.current !== null && !holdTimeout) {
				const draggedApp = items[draggedItemIndex.current];
				const updatedApp = {
					...draggedApp,
					leftPos: e.clientX - 44,
					topPos: e.clientY - 80,
				};
				await savePos(draggedApp.item, updatedApp.leftPos, updatedApp.topPos);
			}
			draggedItemIndex.current = null;
			clearHoldTimeout();
			setDragradius(false);
		};

		window.onmouseleave = async () => {
			clearHoldTimeout();
			setDragging(false);
			window.removeEventListener("mousemove", onMouseMove);
			if (draggedItemIndex.current !== null && dragging) {
				const draggedApp = items[draggedItemIndex.current];
				const updatedApp = {
					...draggedApp,
					leftPos: draggedApp.position.left,
					topPos: draggedApp.position.top,
				};
				await savePos(draggedApp.item, updatedApp.leftPos, updatedApp.topPos);
			}
			draggedItemIndex.current = null;
		};

		e.preventDefault();
		e.target.addEventListener("mouseup", clearHoldTimeout, { once: true });
	};

	const onMouseMove = (e: MouseEvent) => {
		if (dragging && draggedItemIndex !== null) {
			let newX = e.clientX - offset.x - 44;
			let newY = e.clientY - offset.y - 80;

			setItems(prevApps => prevApps.map((app, index) => (index === draggedItemIndex.current ? { ...app, position: { ...app.position, left: newX, top: newY, custom: true } } : app)));
		}
	};

	const savePos = async (item: string, left: number, top: number) => {
		try {
			const desktopConfig = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
			const itemIndex = desktopConfig.findIndex((config: any) => config.item === item);
			if (itemIndex !== -1) {
				const currentLeft = desktopConfig[itemIndex].position.left;
				const currentTop = desktopConfig[itemIndex].position.top;
				if ((Math.abs(Math.round(currentLeft) - Math.round(left)) > 67 || Math.abs(Math.round(currentTop) - Math.round(top)) > 67) && (Math.round(currentLeft) !== Math.round(left) || Math.round(currentTop) !== Math.round(top))) {
					desktopConfig[itemIndex].position.left = Math.round(left);
					desktopConfig[itemIndex].position.top = Math.round(top);
					desktopConfig[itemIndex].position.custom = true;
					await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
					console.log("Saved app position");
				}
			}
		} catch (error) {
			console.error("Error saving app position:", error);
		}
	};

	useEffect(() => {
		document.addEventListener("mousemove", onMouseMove);
		return () => {
			document.removeEventListener("mousemove", onMouseMove);
		};
	}, [dragging]);

	return (
		<div className="flex gap-1 flex-wrap h-full">
			{items.map((item: DesktopItem, i: any) => {
				return item.type === "file" ? (
					<div
						title={item.name}
						key={`${item.name}`}
						id="desktop-item"
						className="group relative size-max min-w-16 min-h-16 flex flex-col items-center justify-center p-2 text-sm font-medium text-wrap select-none"
						onDoubleClick={async () => {
							let handlers = JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["fileAssociatedApps"];
							handlers = Object.entries(handlers).filter(([type, app]) => {
								return !(type === "text" && app === "text-editor") && !(type === "image" && app === "media-viewer") && !(type === "video" && app === "media-viewer") && !(type === "audio" && app === "media-viewer");
							});
							let hands = [];
							for (const [type, app] of handlers) {
								hands.push({ text: app, value: type });
							}
							await window.tb.dialog.Select({
								title: `Select a application to open: ${item.item.split("/").pop()}`,
								options: [
									{
										text: "Text Editor",
										value: "text",
									},
									{
										text: "Media Viewer",
										value: "media",
									},
									{
										text: "Webview",
										value: "webview",
									},
									...hands,
									{
										text: "Other",
										value: "other",
									},
								],
								onOk: async (val: any) => {
									const data = await fetch(`/fs//system/etc/terbium/file-icons.json`).then(res => res.json());
									const ext = item.name.split(".").pop();
									switch (val) {
										case "text":
											parent.window.tb.file.handler.openFile(item.item, "text");
											break;
										case "media":
											if (data["image"].includes(ext)) {
												parent.window.tb.file.handler.openFile(item.item, "image");
											} else if (data["video"].includes(ext)) {
												parent.window.tb.file.handler.openFile(item.item, "video");
											} else if (data["audio"].includes(ext)) {
												parent.window.tb.file.handler.openFile(item.item, "audio");
											}
											break;
										case "webview":
											parent.window.tb.file.handler.openFile(item.item, "webpage");
											break;
										case "other":
											window.tb.dialog.DirectoryBrowser({
												title: "Select a application",
												filter: ".tapp",
												onOk: async (val: any) => {
													const app = JSON.parse(await window.tb.fs.promises.readFile(`${val}/.tbconfig`, "utf8"));
													createWindow({ ...app, message: { type: "process", path: item.item } });
												},
											});
											break;
										default:
											if (hands.length === 0) {
												parent.window.tb.file.handler.openFile(item.item, "text");
											} else {
												parent.window.tb.file.handler.openFile(item.item, val);
											}
											break;
									}
								},
							});
						}}
						onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => onMouseDown(e, i)}
						onContextMenuCapture={(e: React.MouseEvent<HTMLDivElement>) => {
							setDragging(false);
							draggedItemIndex.current = null;
							setDragradius(false);
							e.preventDefault();
							const { clientX, clientY } = e;
							window.tb.contextmenu.create({
								x: clientX,
								y: clientY,
								options: [
									{
										text: "Open",
										click: () => {
											sessionStorage.setItem("ldir", item.item);
											createWindow({
												title: "Files",
												icon: "/fs/apps/system/files.tapp/icon.svg",
												src: "/fs/apps/system/files.tapp/index.html",
												size: {
													width: 600,
													height: 500,
												},
											});
										},
									},
									{
										text: "Delete Shortcut",
										click: async () => {
											let idx = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
											idx = idx.filter((entry: any) => entry.name !== item.name);
											await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(idx, null, 4));
											window.dispatchEvent(new Event("upd-desktop"));
										},
									},
								],
							});
						}}
						style={{
							position: "absolute",
							left: item.position.custom === true ? item.position.left : Math.floor(Number(item.position.left) * 80),
							top: item.position.custom === true ? item.position.top : Math.floor(Number(item.position.top) * 66),
						}}
					>
						<div className="absolute z-1 size-full rounded-md bg-[#ffffff10] backdrop-blur-xl opacity-0 shadow-tb-border-shadow group-hover:opacity-100 focus:opacity-100 duration-150 ease-in pointer-events-none select-none"></div>
						<div className="flex z-2 size-full flex-col items-center justify-center pointer-events-none">
							{<div className="size-6 pointer-events-none select-none" dangerouslySetInnerHTML={{ __html: item.icon }} />}
							<span className="leading-none bg-transparent text-white text-center select-none w-16" style={{ textShadow: "0 0 4px #00000052" }}>
								{item.name.length > 12 ? `${item.name.slice(0, 10)}...` : item.name}
							</span>
						</div>
					</div>
				) : item.type === "directory" ? (
					<div
						title={item.name}
						key={`${item.name}`}
						id="desktop-item"
						className="group relative size-max min-w-16 min-h-16 flex flex-col items-center justify-center p-2 text-sm font-medium text-wrap select-none"
						onDoubleClick={() => {
							sessionStorage.setItem("ldir", item.item);
							createWindow({
								title: "Files",
								icon: "/fs/apps/system/files.tapp/icon.svg",
								src: "/fs/apps/system/files.tapp/index.html",
								size: {
									width: 600,
									height: 500,
								},
							});
						}}
						onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => onMouseDown(e, i)}
						onContextMenuCapture={(e: React.MouseEvent<HTMLDivElement>) => {
							setDragging(false);
							draggedItemIndex.current = null;
							setDragradius(false);
							e.preventDefault();
							const { clientX, clientY } = e;
							window.tb.contextmenu.create({
								x: clientX,
								y: clientY,
								options: [
									{
										text: "Open",
										click: () => {
											sessionStorage.setItem("ldir", item.item);
											createWindow({
												title: "Files",
												icon: "/fs/apps/system/files.tapp/icon.svg",
												src: "/fs/apps/system/files.tapp/index.html",
												size: {
													width: 600,
													height: 500,
												},
											});
										},
									},
									{
										text: "Delete Shortcut",
										click: async () => {
											let idx = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
											idx = idx.filter((entry: any) => entry.name !== item.name);
											await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(idx, null, 4));
											window.dispatchEvent(new Event("upd-desktop"));
										},
									},
								],
							});
						}}
						style={{
							position: "absolute",
							left: item.position.custom === true ? item.position.left : Math.floor(Number(item.position.left) * 80),
							top: item.position.custom === true ? item.position.top : Math.floor(Number(item.position.top) * 66),
						}}
					>
						<div className="absolute z-[1] size-full rounded-md bg-[#ffffff10] backdrop-blur-xl opacity-0 shadow-tb-border-shadow group-hover:opacity-100 focus:opacity-100 duration-150 ease-in pointer-events-none select-none"></div>
						<div className="flex z-[2] size-full flex-col items-center justify-center pointer-events-none">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 pointer-events-none select-none">
								<path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
							</svg>
							<span className="leading-none bg-transparent text-white text-center select-none w-16" style={{ textShadow: "0 0 4px #00000052" }}>
								{item.name.length > 12 ? `${item.name.slice(0, 10)}...` : item.name}
							</span>
						</div>
					</div>
				) : (
					<div
						data-type="shortcut"
						title={item.name}
						key={`${item.name}`}
						id="desktop-item"
						className="group relative size-max min-w-16 min-h-16 flex flex-col items-center justify-center p-2 text-sm font-medium text-wrap select-none"
						onDoubleClick={() => {
							createWindow({ ...item.config, wid: undefined });
						}}
						style={{
							position: "absolute",
							left: item.position.custom === true ? item.position.left : Math.floor(Number(item.position.left) * 80),
							top: item.position.custom === true ? item.position.top : Math.floor(Number(item.position.top) * 66),
						}}
						onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => onMouseDown(e, i)}
						onContextMenuCapture={(e: React.MouseEvent<HTMLDivElement>) => {
							setDragging(false);
							draggedItemIndex.current = null;
							setDragradius(false);
							e.preventDefault();
							window.tb.contextmenu.create({
								x: e.clientX - 50,
								y: e.clientY,
								options: [
									{
										text: "Open",
										click: () => {
											createWindow(item.config);
										},
									},
									{
										text: "Pin to Dock",
										click: () => {
											window.tb.desktop.dock.pin(item.config);
										},
									},
									{
										text: "Delete Shortcut",
										click: async () => {
											const stat = await window.tb.fs.promises.stat(`/home/${user}/desktop/${item.item}`);
											if (stat!.isDirectory()) {
												// @ts-expect-error
												await new window.tb.fs.Shell().promises.rm(`/home/${user}/desktop/${item.item}`, { recursive: true });
											} else {
												await window.tb.fs.promises.unlink(`/home/${user}/desktop/${item.item}`);
											}
											window.dispatchEvent(new Event("upd-desktop"));
										},
									},
								],
							});
						}}
					>
						<div className="absolute z-1 size-full rounded-md bg-[#ffffff10] backdrop-blur-xl opacity-0 shadow-tb-border-shadow group-hover:opacity-100 focus:opacity-100 duration-150 ease-in pointer-events-none select-none"></div>
						<div className="flex z-2 size-full flex-col items-center justify-center pointer-events-none">
							<img src={item.config.icon} alt={item.name} className="size-6 pointer-events-none select-none" />
							<span className="leading-none bg-transparent text-white text-center select-none w-16" style={{ textShadow: "0 0 4px #00000052" }}>
								{item.name.length > 12 ? `${item.name.slice(0, 10)}...` : item.name}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
};

interface WindowAreaProps {
	className: string;
}

const WindowArea: React.FC<WindowAreaProps> = ({ className }) => {
	const windowStore = useWindowStore();
	const [prevShowing, showPrev] = useState(false);
	const [direction, setDirection] = useState<string | null>(null);
	const snapPrev = (pos: string) => {
		showPrev(true);
		setDirection(pos);
	};
	const FinishSnap = () => {
		showPrev(false);
	};
	const setClass = () => {
		switch (direction) {
			case "left":
				return `
					left-0 w-6/12 h-full
					${prevShowing ? "translate-x-0" : "-translate-x-4"}
				`;
			case "right":
				return `
					right-0 w-6/12 h-full
					${prevShowing ? "translate-x-0" : "translate-x-4"}
				`;
			case "top":
				return `
					left-0 right-0 w-full h-full
					${prevShowing ? "translate-y-0" : "-translate-y-4"}
				`;
			case "top-left":
				return `
					left-0 top-0 w-6/12 h-6/12
					${prevShowing ? "translate-x-0 translate-y-0" : "-translate-x-4 -translate-y-4"}
				`;
			case "top-right":
				return `
					right-0 top-0 w-6/12 h-6/12
					${prevShowing ? "translate-x-0 translate-y-0" : "translate-x-4 -translate-y-4"}
				`;
			case "bottom-left":
				return `
					left-0 top-[50%] w-6/12 h-6/12
					${prevShowing ? "translate-x-0 translate-y-0" : "-translate-x-4 translate-y-4"}
				`;
			case "bottom-right":
				return `
					right-0 top-[50%] w-6/12 h-6/12
					${prevShowing ? "translate-x-0 translate-y-0" : "translate-x-4 translate-y-4"}
				`;
		}
	};

	return (
		// @ts-ignore
		<window-area
			class={`${className ?? className} relative`}
			// @ts-ignore
			onContextMenuCapture={(e: MouseEvent) => {
				const pos = { x: e.clientX, y: e.clientY };
				window.tb.contextmenu.create({
					options: [
						{
							text: "Change Wallpaper",
							click: () => {
								window.tb.window.create({
									title: "Settings",
									icon: "/fs/apps/system/settings.tapp/icon.svg",
									src: "/fs/apps/system/settings.tapp/index.html",
								});
							},
						},
						{
							text: "New Folder",
							click: () => {
								window.tb.dialog.Message({
									title: "Enter the new name of the folder",
									onOk: async (val: any) => {
										const user = sessionStorage.getItem("currAcc");
										await window.tb.fs.promises.mkdir(`/home/${user}/desktop/${val}`);
										const desktopConfig = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
										const getLastItem = () => {
											for (let i = desktopConfig.length - 1; i >= 0; i--) {
												if (!desktopConfig[i].position.custom) {
													return desktopConfig[i];
												}
											}
											return null;
										};
										const lastItem = getLastItem();
										const highestLeft = Math.max(...desktopConfig.map((item: any) => item.position.left));
										let topPos = 0;
										let leftPos = 0;

										if (lastItem && lastItem.position.top < 11) {
											topPos = Math.floor(lastItem.position.top + 1);
											leftPos = lastItem.position.left;
										} else {
											leftPos = Math.floor(highestLeft + 1);
										}

										desktopConfig.push({
											name: val,
											item: `/home/${user}/desktop/${val}`,
											position: {
												custom: false,
												top: topPos,
												left: leftPos,
											},
										});
										await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
										window.dispatchEvent(new Event("upd-desktop"));
									},
								});
							},
						},
						{
							text: "New File",
							click: () => {
								window.tb.dialog.Message({
									title: "Enter the new name of the file",
									onOk: async (val: any) => {
										const user = sessionStorage.getItem("currAcc");
										await window.tb.fs.promises.writeFile(`/home/${user}/desktop/${val}`, "", "utf8");
										const desktopConfig = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
										const getLastItem = () => {
											for (let i = desktopConfig.length - 1; i >= 0; i--) {
												if (!desktopConfig[i].position.custom) {
													return desktopConfig[i];
												}
											}
											return null;
										};
										const lastItem = getLastItem();
										const highestLeft = Math.max(...desktopConfig.map((item: any) => item.position.left));
										let topPos = 0;
										let leftPos = 0;

										if (lastItem && lastItem.position.top < 11) {
											topPos = Math.floor(lastItem.position.top + 1);
											leftPos = lastItem.position.left;
										} else {
											leftPos = Math.floor(highestLeft + 1);
										}

										desktopConfig.push({
											name: val,
											item: `/home/${user}/desktop/${val}`,
											position: {
												custom: false,
												top: topPos,
												left: leftPos,
											},
										});
										await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
										window.dispatchEvent(new Event("upd-desktop"));
									},
								});
							},
						},
						{
							text: "New Shortcut",
							click: async () => {
								const make = async (item: any) => {
									const user = sessionStorage.getItem("currAcc");
									const desktopConfig = JSON.parse(await window.tb.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
									const getLastItem = () => {
										for (let i = desktopConfig.length - 1; i >= 0; i--) {
											if (!desktopConfig[i].position.custom) {
												return desktopConfig[i];
											}
										}
										return null;
									};
									const lastItem = getLastItem();
									const highestLeft = Math.max(...desktopConfig.map((item: any) => item.position.left));
									let topPos = 0;
									let leftPos = 0;

									if (lastItem && lastItem.position.top < 11) {
										topPos = Math.floor(lastItem.position.top + 1);
										leftPos = lastItem.position.left;
									} else {
										leftPos = Math.floor(highestLeft + 1);
									}

									if (topPos * 66 > window.innerHeight - 130) {
										leftPos = 1.3;
										topPos = 0;
									}

									const aname = item.split("/").pop();
									if (aname.includes(".tapp")) {
										let tconf: any;
										if (await fileExists(`${item}/.tbconfig`)) {
											tconf = JSON.parse(await window.tb.fs.promises.readFile(`${item}/.tbconfig`, "utf8"));
										} else {
											tconf = JSON.parse(await window.tb.fs.promises.readFile(`${item}/index.json`, "utf8"));
										}
										await window.tb.fs.promises.writeFile(
											`${item}/desktopcfg.json`,
											JSON.stringify({
												name: aname.replace(".tapp", ""),
												config: {
													...(tconf.wmArgs ? tconf.wmArgs : tconf.config),
													icon: `/fs/${item}/${tconf.wmArgs ? tconf.wmArgs.icon : tconf.config.icon}`,
													src: `/fs/${item}/${tconf.wmArgs ? tconf.wmArgs.src : tconf.config.src}`,
												},
												icon: `/fs/${item}/${tconf.icon}`,
											}),
										);
										await window.tb.fs.promises.symlink(`${item}/desktopcfg.json`, `/home/${user}/desktop/${aname.replace(".tapp", "")}.lnk`, "file");
										desktopConfig.push({
											name: aname.replace(".tapp", ""),
											item: `/home/${user}/desktop/${aname.replace(".tapp", "")}.lnk`,
											position: {
												custom: false,
												top: topPos,
												left: leftPos,
											},
										});
									} else {
										desktopConfig.push({
											name: aname.replace(".tapp", ""),
											item: item,
											position: {
												custom: false,
												top: topPos,
												left: leftPos,
											},
										});
									}
									await window.tb.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
									window.dispatchEvent(new Event("upd-desktop"));
								};
								await window.tb.dialog.Select({
									title: "Select the type of Shortcut",
									options: [
										{
											text: "Application",
											value: "app",
										},
										{
											text: "Folder",
											value: "dir",
										},
										{
											text: "File",
											value: "file",
										},
									],
									onOk: async (val: any) => {
										switch (val) {
											case "app":
												window.tb.dialog.DirectoryBrowser({
													title: "Select a application",
													filter: ".tapp",
													onOk: async (val: any) => {
														make(val);
													},
												});
												break;
											case "dir":
												window.tb.dialog.DirectoryBrowser({
													title: "Select a application",
													onOk: async (val: any) => {
														make(val);
													},
												});
												break;
											case "file":
												window.tb.dialog.FileBrowser({
													title: "Select a application",
													onOk: async (val: any) => {
														make(val);
													},
												});
												break;
										}
									},
								});
							},
						},
					],
					x: pos.x,
					y: pos.y,
				});
			}}
		>
			<DesktopItems />
			{windowStore.windows.map((window: any) => {
				return <MemoizedWindowElement key={window.wid} config={window} onSnapPreview={snapPrev} onSnapDone={FinishSnap} />;
			})}
			<div
				className={
					`
                    absolute top-0 bottom-0 rounded-lg backdrop-blur bg-slate-700 bg-opacity-50 duration-150 bg-[url(/assets/img/grain.png)] pointer-events-none
                    ${prevShowing ? "opacity-100 duration-200" : "opacity-0"}
                ` +
					" " +
					setClass()
				}
			/>
		</window-area>
	);
};

export const createWindow = async (config: WindowConfig) => {
	const windowStore = useWindowStore.getState();
	if (config.single) {
		const eWindow = windowStore.windows.find(window => window.src === config.src);
		if (eWindow) {
			if (config.message) {
				window.postMessage(config.message, "*");
			}
			return;
		}
	}

	const addWindow = useWindowStore.getState().addWindow;
	addWindow(config);
	return true;
};

export const removeWindow = (wid: string) => {
	// Did this for adding windows via COM
	const removeWindow = useWindowStore.getState().removeWindow;
	removeWindow(wid);
};

export const killWindow = (wid: string) => {
	// Did this for adding windows via COM
	const killWindow = useWindowStore.getState().killWindow;
	killWindow(wid);
};

export default WindowArea;

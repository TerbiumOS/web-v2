import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, ChevronRightIcon, PuzzlePieceIcon } from "@heroicons/react/24/solid";
import "./styles/dock.css";
import { dirExists, isURL, WindowConfig } from "../types";
import { useWindowStore, useSearchMenuStore } from "../Store";
import SearchMenu from "./Search";

export type TDockItem = {
	className?: string;
	title: string;
	icon: string | undefined;
	src: string;
	size?: number[] | any;
	children?: Array<TDockItem>;
	isPinnable?: boolean;
	snapable?: boolean;
	pid?: string;
	wid?: string;
	proxy?: boolean;
	user?: string;
	onClick?: (e: MouseEvent) => void;
	onContextMenu?: (e: MouseEvent) => void;
};

export type TStartItem = {
	title: string;
	icon: string | ReactNode | undefined;
	pid: string | undefined;
	onClick?: (e: MouseEvent) => void;
	inPins?: boolean;
	className?: string;
	src?: string;
	proxy?: boolean;
	size?: { width: number; height: number };
	snapable?: boolean;
};

interface IDockProps {
	showPins?: boolean;
	pinned: Array<TDockItem> | null;
}

interface IUser {
	pfp: string | undefined;
	username: string | undefined;
}

const Dock: FC<IDockProps> = ({ pinned }) => {
	const windowStore = useWindowStore();
	const searchMenuStore = useSearchMenuStore();

	const [isStartOpen, setStartOpen] = useState<boolean>(false);
	const [user, setUser] = useState<IUser>({
		pfp: undefined,
		username: undefined,
	});

	const startRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const searchDockRef = useRef<HTMLDivElement>(null);
	const [searchHasText, setSearchHasText] = useState<boolean>((searchRef.current?.value?.length ?? 0) >= 1);
	const [searchActive, setSearchActive] = useState<boolean>(false);
	const placeholderRef = useRef<HTMLSpanElement>(null);
	const openAppsRef = useRef<HTMLDivElement>(null);
	const startButtonRef = useRef<SVGSVGElement>(null);
	const systemAppsRef = useRef<HTMLDivElement>(null);
	const pinnedAppsRef = useRef<HTMLDivElement>(null);
	const searchMatchRef = useRef<HTMLDivElement>(null);
	const pinnedAppsDockRef = useRef<HTMLDivElement>(null);
	const openedAppsDockRef = useRef<HTMLDivElement>(null);
	const userOptsRef = useRef<HTMLDivElement>(null);
	const [searchMatch, setSearchMatch] = useState<boolean>(false);
	const [systemApps, setSysApps] = useState<Array<TDockItem>>([]);
	const [pins, setPins] = useState<Array<TDockItem>>([]);

	useEffect(() => {
		const fetchData = async () => {
			if (await dirExists("/system")) {
				setSysApps(JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8")).system_apps);
				setPins(JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8")).pinned_apps);
			}
		};
		fetchData();
		if (isStartOpen === true) {
			setStartOpen(false);
		}
		window.addEventListener("updApps", fetchData);
		return () => window.removeEventListener("updApps", fetchData);
	}, []);

	useEffect(() => {
		const fetchUser = async () => {
			const pfp = await window.tb.user.pfp();
			const username = await window.tb.user.username();
			const user = {
				pfp: pfp,
				username: username,
			};
			setUser(user);
		};
		window.addEventListener("accUpd", fetchUser);
		window.addEventListener("tfsready", fetchUser);
		return () => {
			window.removeEventListener("accUpd", fetchUser);
			window.removeEventListener("tfsready", fetchUser);
		};
	}, []);

	const filteredSysApps = systemApps.filter((item, index, self) => index === self.findIndex(t => t.title === item.title && t.icon === item.icon && t.src === item.src) && (!item.user || item.user === user.username));

	// @ts-expect-error
	const filteredPins = pinned.filter((item, index, self) => index === self.findIndex(t => t.src === item.src && t.title === item.title && t.icon === item.icon));

	var openStart = (focusSearch?: boolean | null, close?: boolean) => {
		if (close) {
			setStartOpen(false);
			setSearchHasText(false);
			setSearchMatch(false);
			if (searchRef.current) {
				searchRef.current.value = "";
			}
			const systemApps = systemAppsRef.current;
			const pinnedApps = pinnedAppsRef.current;
			if (systemApps !== null && pinnedApps !== null) {
				const systemAppsChildren = systemApps.children;
				const pinnedAppsChildren = pinnedApps.children;
				for (let i = 0; i < systemAppsChildren.length; i++) {
					const child: Element = systemAppsChildren[i];
					child.classList.remove("hidden");
					child.classList.remove("-translate-x-2");
					child.classList.remove("opacity-0");
				}
				for (let i = 0; i < pinnedAppsChildren.length; i++) {
					const child: Element = pinnedAppsChildren[i];
					child.classList.remove("hidden");
					child.classList.remove("-translate-x-2");
					child.classList.remove("opacity-0");
				}
			}
			return;
		}
		const clickElsewhere = (e: MouseEvent) => {
			if (e.target !== startRef.current && e.target !== startButtonRef.current && !startRef.current?.contains(e.target as Node) && !searchDockRef.current?.contains(e.target as Node)) {
				setStartOpen(false);
				setSearchHasText(false);
				setSearchMatch(false);
				if (searchRef.current) {
					searchRef.current.value = "";
				}
				const systemApps = systemAppsRef.current;
				const pinnedApps = pinnedAppsRef.current;
				if (systemApps !== null && pinnedApps !== null) {
					const systemAppsChildren = systemApps.children;
					const pinnedAppsChildren = pinnedApps.children;
					for (let i = 0; i < systemAppsChildren.length; i++) {
						const child: Element = systemAppsChildren[i];
						child.classList.remove("hidden");
						child.classList.remove("-translate-x-2");
						child.classList.remove("opacity-0");
					}
					for (let i = 0; i < pinnedAppsChildren.length; i++) {
						const child: Element = pinnedAppsChildren[i];
						child.classList.remove("hidden");
						child.classList.remove("-translate-x-2");
						child.classList.remove("opacity-0");
					}
				}
				window.removeEventListener("mousedown", clickElsewhere);
			}
		};
		window.addEventListener("mousedown", clickElsewhere);
		setStartOpen(prev => !prev);
		openSearchMenu(true);
		if (focusSearch) {
			setTimeout(() => {
				searchRef.current?.focus();
			}, 150);
		}
		setTimeout(() => {
			if (searchRef.current) {
				searchRef.current.value = "";
			}
			setSearchHasText(false);
			setSearchMatch(false);
			const systemApps = systemAppsRef.current;
			const pinnedApps = pinnedAppsRef.current;
			if (systemApps !== null && pinnedApps !== null) {
				const systemAppsChildren = systemApps.children;
				const pinnedAppsChildren = pinnedApps.children;
				for (let i = 0; i < systemAppsChildren.length; i++) {
					const child: Element = systemAppsChildren[i];
					child.classList.remove("hidden");
					child.classList.remove("-translate-x-2");
					child.classList.remove("opacity-0");
				}
				for (let i = 0; i < pinnedAppsChildren.length; i++) {
					const child: Element = pinnedAppsChildren[i];
					child.classList.remove("hidden");
					child.classList.remove("-translate-x-2");
					child.classList.remove("opacity-0");
				}
			}
		}, 200);
	};

	var openSearchMenu = (close?: boolean) => {
		const clearout = () => {
			searchMenuStore.setOpen(false);
		};
		if (close) {
			clearout();
			return;
		}
		const clickElsewhere = (e: MouseEvent) => {
			if (e.target !== searchDockRef.current && e.target !== startButtonRef.current && !searchDockRef.current?.contains(e.target as Node) && !searchMenuStore.searchMenuRef.current?.contains(e.target as Node)) {
				clearout();
				window.removeEventListener("mousedown", clickElsewhere);
			}
		};
		window.addEventListener("mousedown", clickElsewhere);
		searchMenuStore.setOpen(!searchMenuStore.open);
		openStart(null, true);
	};

	return (
		<div className="flex flex-col relative justify-center items-center pb-[6px] z-9999999">
			<SearchMenu className={`absolute ${searchMenuStore.open ? "bottom-[calc(12px+48px)] duration-150" : "opacity-0 pointer-events-none bottom-[40px] duration-200"}`} />
			<div
				ref={startRef}
				className={`
                absolute flex flex-col
                bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-sm rounded-xl overflow-hidden
                w-max min-w-[440px] h-max min-h-[200px] ease-in
                ${isStartOpen ? "bottom-[calc(12px+48px)] duration-150" : "opacity-0 pointer-events-none bottom-[40px] duration-200"}
                ${searchHasText ? "scale-110" : ""}
            `}
				style={{ backgroundImage: "url(/assets/img/grain.png)" }}
			>
				<div
					className={`flex gap-2 items-center
                    p-2 pb-0 text-[#ffffffa4]
                    ${isStartOpen ? "" : "translate-y-2 opacity-0"} duration-700
                `}
				>
					<MagnifyingGlassIcon className="size-6 text-[#ffffff86] stroke-current stroke-[2px]" />
					<div className="relative flex items-center w-full">
						<span ref={placeholderRef} className={`absolute font-[680] text-lg pointer-events-none duration-150 ${searchHasText ? "opacity-0 -translate-x-8" : searchActive ? "opacity-100" : "opacity-75"}`}>
							Search
						</span>
						<input
							ref={searchRef}
							className={`bg-transparent focus-within:outline-hidden text-lg font-[680] cursor-[var(--cursor-text)] w-full`}
							type="text"
							onFocus={() => {
								setSearchActive(true);
							}}
							onBlur={() => {
								setSearchActive(false);
							}}
							onInput={(e: React.FormEvent<HTMLInputElement>) => {
								if (e.currentTarget.value.length > 0) {
									setSearchHasText(true);
								} else {
									setSearchHasText(false);
								}
								const query = e.currentTarget.value.toLowerCase();
								const systemApps = systemAppsRef.current;
								const pinnedApps = pinnedAppsRef.current;
								console.log(systemApps, pinnedApps);
								if (systemApps !== null) {
									const systemAppsChildren = systemApps.children;
									let systemAppsMatch = 0;
									for (let i = 0; i < systemAppsChildren.length; i++) {
										const child: Element = systemAppsChildren[i];
										if (child.textContent && child.textContent.toLowerCase().includes(query)) {
											child.classList.remove("hidden");
											setTimeout(() => {
												child.classList.remove("opacity-0");
												child.classList.remove("-translate-x-2");
											}, 150);
											systemAppsMatch++;
										} else {
											child.classList.add("-translate-x-2");
											child.classList.add("opacity-0");
											setTimeout(() => {
												child.classList.add("hidden");
											}, 150);
										}
									}
									if (pinnedApps !== null) {
										const pinnedAppsChildren = pinnedApps.children;
										let pinnedAppsMatch = 0;
										for (let i = 0; i < pinnedAppsChildren.length; i++) {
											const child: Element = pinnedAppsChildren[i];
											if (child.textContent && child.textContent.toLowerCase().includes(query)) {
												child.classList.remove("hidden");
												setTimeout(() => {
													child.classList.remove("opacity-0");
													child.classList.remove("-translate-x-2");
												}, 150);
												pinnedAppsMatch++;
											} else {
												child.classList.add("-translate-x-2");
												child.classList.add("opacity-0");
												setTimeout(() => {
													child.classList.add("hidden");
												}, 150);
											}
										}
										if (systemAppsMatch === 0 && pinnedAppsMatch === 0) {
											setSearchMatch(true);
										} else {
											setSearchMatch(false);
										}
									} else {
										if (systemAppsMatch === 0) {
											setSearchMatch(true);
										} else {
											setSearchMatch(false);
										}
									}
								}
							}}
						/>
					</div>
				</div>
				<div
					className={`relative flex min-h-[104px] overflow-y-auto max-h-[196px] w-full gap-2 p-2 pt-0
                    ${isStartOpen ? "" : "translate-y-4 opacity-0"} duration-1000
                    ${searchMatch ? "justify-center" : "justify-between"}
                `}
				>
					<div
						ref={systemAppsRef}
						className={`
                        grid ${pins.length > 0 ? "max-h-[188px] grid-cols-2" : "w-full grid-cols-3"} gap-1 overflow-y-auto
                    `}
					>
						{filteredSysApps.map((item, index) => (
							<StartItem
								key={index}
								title={item.title}
								icon={item.icon}
								pid={undefined}
								src={item.src}
								size={item.size}
								proxy={item.proxy}
								snapable={item.snapable}
								onClick={() => {
									item.onClick?.(new MouseEvent("click"));
									windowStore.addWindow({
										src: item.src,
										size: item.size,
										icon: typeof item.icon === "string" ? item.icon : undefined,
										title: item.title,
										proxy: item.proxy,
										snapable: item.snapable,
									});
									setStartOpen(false);
								}}
							/>
						))}
					</div>
					{pins.length > 0 ? (
						<div className="flex flex-col gap-2 h-full">
							<span className="font-semibold">Pinned Apps</span>
							<div
								ref={pinnedAppsRef}
								className={`
                                    flex flex-col bg-[#ffffff10] max-h-[200px] overflow-y-auto w-max rounded-lg last:rounded-b-lgration-1000
                                `}
							>
								{pins.length > 0
									? pins.map((item, index) => (
											<StartItem
												className="first:rounded-t-lg last:rounded-b-lg"
												inPins
												pid={undefined}
												key={index}
												title={item.title}
												icon={item.icon}
												src={item.src}
												size={item.size}
												proxy={item.proxy}
												snapable={item.snapable}
												onClick={(e: MouseEvent) => {
													if (e.button === 0) item.onClick?.(new MouseEvent("click"));
													windowStore.addWindow({
														src: item.src,
														icon: typeof item.icon === "string" ? item.icon : undefined,
														size: item.size,
														title: item.title,
														proxy: item.proxy,
														snapable: item.snapable,
													});
													setStartOpen(false);
												}}
											/>
										))
									: null}
							</div>
						</div>
					) : null}
					<div ref={searchMatchRef} className={"absolute top-1/2 left-1/2 -translate-1/2 flex gap-1.5 duration-150" + " " + `${searchMatch ? "" : "opacity-0 pointer-events-none -translate-x-3"}`}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
							<path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1.5 14.25h-3v-1.5h3v1.5Zm0-3h-3V7.5h3v5.75Z" />
						</svg>
						<span className="text-sm">No results found</span>
					</div>
				</div>
				<div ref={userOptsRef} className="flex items-center gap-2 p-2 bg-[#00000048] rounded-b-lg last:rounded-b-lg">
					<div
						className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#ffffff19] hover:scale-95 duration-150 cursor-pointer"
						onClick={() => {
							window.tb.contextmenu.create({
								x: userOptsRef.current?.getBoundingClientRect().x ?? 0,
								y: userOptsRef.current ? userOptsRef.current.getBoundingClientRect().y - 75 : 0,
								options: [
									{
										text: "Manage Account",
										click: () => {
											window.tb.window.create({
												title: "Settings",
												src: "/fs/apps/system/settings.tapp/index.html",
												icon: "/fs/apps/system/settings.tapp/icon.svg",
												single: true,
												message: JSON.stringify({ page: "privacy" }),
											});
										},
									},
									{
										text: "Sign out",
										click: () => {
											sessionStorage.setItem("logged-in", "false");
											window.location.reload();
										},
									},
								],
							});
						}}
					>
						<img className="size-8 rounded-full pointer-events-none" src={user.pfp} alt={user.username} />
						<span className="font-bold text-lg pointer-events-none">{user.username}</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-[#ffffff58]">
						<span
							className="font-medium hover:text-[#ffffff98] cursor-pointer duration-150"
							onClick={() => {
								window.tb.window.create({
									title: "Settings",
									src: "/fs/apps/system/settings.tapp/index.html",
									icon: "/fs/apps/system/settings.tapp/icon.svg",
								});
								setStartOpen(false);
							}}
						>
							Settings
						</span>
						<span
							className="font-medium hover:text-[#ffffff98] cursor-pointer duration-150"
							onClick={() => {
								window.tb.window.create({
									title: "About",
									src: "/fs/apps/system/about.tapp/index.html",
									icon: "/fs/apps/system/about.tapp/icon.svg",
								});
								setStartOpen(false);
							}}
						>
							About
						</span>
						<span
							className="font-medium hover:text-[#ffffff98] cursor-pointer duration-150"
							onClick={() => {
								sessionStorage.setItem("ldir", `/home/${user.username}/Documents`);
								window.tb.window.create({
									title: "Files",
									icon: "/fs/apps/system/files.tapp/icon.svg",
									src: "/fs/apps/system/files.tapp/index.html",
									size: {
										width: 600,
										height: 500,
									},
								});
								setStartOpen(false);
							}}
						>
							Documents
						</span>
					</div>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<div className="flex items-center gap-1.5 shadow-tb-border-shadow backdrop-blur-[8px] bg-[#2020208c] p-2 rounded-[8px]">
					<svg ref={startButtonRef} viewBox="0 0 24 24" fill="currentColor" className="cursor-pointer w-7 h-7" onClick={() => openStart(false)}>
						<path
							className="pointer-events-none"
							fillRule="evenodd"
							d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z"
							clipRule="evenodd"
						/>
					</svg>
					<div ref={searchDockRef} className="flex items-center min-w-34 gap-1 p-2 bg-[#ffffff10] rounded-full cursor-text shadow-tb-border-shadow" onMouseDown={() => openSearchMenu()}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 text-[#ffffffb9] pointer-events-none stroke-2 stroke-current">
							<path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
						</svg>
						<span className="leading-none text-[#ffffffa6] font-bold pointer-events-none select-none">Search</span>
					</div>
				</div>
				<div
					ref={openAppsRef}
					className={`
                    shadow-tb-border-shadow backdrop-blur-[8px] bg-[#2020208c]
                    flex items-center
                    gap-2 py-1.5 px-2 rounded-[8px]
                    duration-150 ease-in
                        ${pinned != null ? ((pinned.length > 0 && windowStore.windows.length > 0) || pinned.length > 0 || windowStore.windows.length > 0 ? "translate-x-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none") : null}
                `}
					style={{ backgroundImage: "url(/assets/img/grain.png)" }}
				>
					{pinned != null && pinned.length > 0 ? (
						<div ref={pinnedAppsDockRef} className="flex items-center">
							{filteredPins.map((item, index) => (
								<PinnedDockItem
									src={item.src}
									key={index}
									title={item.title}
									icon={item.icon ?? "/assets/img/null.svg"}
									size={item.size}
									proxy={item.proxy}
									snapable={item.snapable}
									onContextMenu={(e: MouseEvent) => {
										e.preventDefault();
									}}
								/>
							))}
						</div>
					) : null}
					{(pinned?.length ?? 0) > 0 && windowStore.windows.length > 0 ? <span className="flex bg-[#ffffff38] backdrop-blur-[20px] h-[20px] w-1 rounded-full"></span> : null}
					<div
						ref={openedAppsDockRef}
						className={`
                        flex items-center gap-0.5
                        ${windowStore.windows.length > 0 ? "flex" : "hidden"}
                    `}
					>
						{windowStore.windows
							.filter((item, index, self) => index === self.findIndex(t => (typeof t.title === "string" ? t.title : t.title?.text) === (typeof item.title === "string" ? item.title : item.title?.text)))
							.map((item, index) => (
								<DockItem src={item.src} key={index} title={typeof item.title === "string" ? item.title : item.title.text} icon={item.icon ?? "/assets/img/null.svg"} size={item.size} proxy={item.proxy} wid={item.wid} pid={item.pid} />
							))}
					</div>
				</div>
			</div>
		</div>
	);
};

const DockItem: FC<TDockItem> = ({ className, icon, title, src, onClick, onContextMenu, size, snapable, pid, wid, proxy }) => {
	const windowStore = useWindowStore();
	const dockItemRef = useRef<HTMLDivElement>(null);
	const [currWID, setcurrWID] = useState(wid);
	const [winfocused, setwinfocused] = useState(windowStore.windows.find((w: any) => w.wid === currWID)?.focused);
	const mm = (e: MouseEvent) => {
		const withinRadius = (e: MouseEvent) => {
			if (!dockItemRef.current) return false;
			const rect = dockItemRef.current.getBoundingClientRect();
			const xDistance = Math.abs(e.clientX - (rect.left + rect.width / 2));
			const yDistance = Math.abs(e.clientY - (rect.top + rect.height / 2));
			const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
			return distance > 350;
		};
		if (withinRadius(e)) {
			window.removeEventListener("mousemove", mm);
			window.dispatchEvent(new CustomEvent("windows-prev", { detail: JSON.stringify({ open: false, location: null }) }));
		}
	};
	useEffect(() => {
		const setWID = (e: CustomEvent) => {
			setcurrWID(e.detail);
			setwinfocused(windowStore.windows.find((w: any) => w.wid === e.detail)?.focused);
		};
		const updsel = (e: CustomEvent) => {
			if (e.detail !== title) {
				setwinfocused(false);
			} else {
				setwinfocused(true);
			}
		};
		window.addEventListener("selwin-upd", updsel as EventListener);
		window.addEventListener("currWID", setWID as EventListener);
		return () => {
			window.removeEventListener("currWID", setWID as EventListener);
			window.removeEventListener("mousemove", mm);
		};
	}, [currWID, winfocused]);
	return (
		<dock-item
			ref={dockItemRef}
			// @ts-expect-error
			wid={wid}
			class={
				className
					? className + " cursor-pointer p-1 hover:bg-[#ffffff28] rounded-md duration-100 ease-in select-none"
					: "cursor-pointer p-1 hover:bg-[#ffffff28] rounded-md duration-100 ease-in select-none" +
						`
            ${winfocused ? "bg-[#ffffff28] shadow-tb-border-shadow" : ""}
            `
			}
			onMouseEnter={() => {
				setTimeout(() => {
					const rect = dockItemRef.current?.getBoundingClientRect();
					const x = rect ? rect.x : 0;
					window.addEventListener("mousemove", mm);
					window.dispatchEvent(
						new CustomEvent("windows-prev", {
							detail: JSON.stringify({
								open: true,
								windows: [
									windowStore.matchedWindows.find((group: any[]) =>
										group.some((w: WindowConfig) => {
											if (typeof w.title === "string") {
												return w.title === title;
											} else if (w.title && w.title.text) {
												return w.title.text === title;
											}
											return false;
										}),
									),
								],
								location: x,
							}),
						}),
					);
				}, 950);
			}}
			onClick={() => {
				onClick?.(new MouseEvent("click"));
				window.dispatchEvent(new CustomEvent("sel-win", { detail: currWID }));
			}}
			onContextMenu={(e: React.MouseEvent) => {
				e.preventDefault();
				onContextMenu?.(new MouseEvent("contextmenu"));
				const { clientX, clientY } = e;
				window.tb.contextmenu.create({
					x: clientX - 10,
					y: clientY - 150,
					options: [
						{
							text: "New Window",
							click: () => {
								windowStore.addWindow({
									src: src,
									icon: typeof icon === "string" ? icon : undefined,
									size: size,
									title: title,
									proxy: proxy,
									snapable: snapable,
								});
							},
						},
						{
							text: "Pin to Dock",
							click: () => {
								window.tb.desktop.dock.pin({
									// @ts-expect-error ignore this
									title: typeof title === "string" ? title : title?.text,
									icon: typeof icon === "string" ? icon : undefined,
									isPinnable: true,
									src: src,
									proxy: proxy,
									snapable: snapable,
									size: {
										width: size?.width ?? 600,
										height: size?.height ?? 400,
									},
								});
							},
						},
						{
							text: "Close",
							click: () => {
								window.tb.process.kill(pid);
							},
						},
					],
				});
			}}
		>
			{typeof icon === "undefined" || icon === null ? (
				<img src={"/assets/img/null.svg"} alt={title} className="w-7 h-7 flex items-center justify-center pointer-events-none" />
			) : typeof icon === "string" ? (
				<img src={icon} alt={title} className="w-7 h-7 flex items-center justify-center pointer-events-none" />
			) : (
				<div className="w-7 h-7 flex items-center justify-center pointer-events-none">{icon}</div>
			)}
		</dock-item>
	);
};

const PinnedDockItem: FC<TDockItem> = ({ className, icon, title, src, onClick, onContextMenu, size, snapable, proxy }) => {
	const windowStore = useWindowStore();
	return (
		<dock-item
			// @ts-expect-error
			class={className ? className + " cursor-pointer p-1 hover:bg-[#ffffff28] rounded-md duration-100 ease-in select-none" : "cursor-pointer p-1 hover:bg-[#ffffff28] rounded-md duration-100 ease-in select-none"}
			onContextMenu={() => {
				return;
			}}
			title={title}
			onClick={() => {
				onClick?.(new MouseEvent("click"));
				windowStore.addWindow({
					src: src,
					icon: typeof icon === "string" ? icon : undefined,
					size: size,
					title: title,
					proxy: proxy,
					snapable: snapable,
				});
			}}
			onContextMenuCapture={(e: React.MouseEvent) => {
				e.preventDefault();
				onContextMenu?.(new MouseEvent("contextmenu"));
				const { clientX, clientY } = e;
				window.tb.contextmenu.create({
					x: clientX - 10,
					y: clientY - 100,
					options: [
						{
							text: "New Window",
							click: () => {
								windowStore.addWindow({
									src: src,
									icon: typeof icon === "string" ? icon : undefined,
									size: size,
									title: title,
									proxy: proxy,
									snapable: snapable,
								});
							},
						},
						{
							text: "Unpin from Dock",
							click: () => {
								window.tb.desktop.dock.unpin(title);
							},
						},
					],
				});
			}}
		>
			{typeof icon === "undefined" || icon === null ? (
				<img src={"/assets/img/null.svg"} alt={title} className="w-7 h-7 flex items-center justify-center pointer-events-none" />
			) : typeof icon === "string" ? (
				<img src={icon} alt={title} className="w-7 h-7 flex items-center justify-center pointer-events-none" />
			) : (
				<div className="w-7 h-7 flex items-center justify-center pointer-events-none">{icon}</div>
			)}
		</dock-item>
	);
};

export const StartItem: FC<TStartItem> = ({ icon, title, onClick, inPins, className, src, proxy, size, snapable }) => {
	// @ts-expect-error
	const chars = typeof title === "string" ? title.split("") : title?.text.split("");
	const [resolvedIcon, setResolvedIcon] = useState<string | boolean | undefined>(false);
	let sysapps = [{ title: "Terminal" }, { title: "Files" }, { title: "Settings" }, { title: { text: "App Store" } }, { title: "Browser" }, { title: "Calculator" }, { title: "Feedback" }, { title: "About" }, { title: "Text Editor" }, { title: "Task Manager" }, { title: "Anura File Manager" }];
	// @ts-expect-error
	const isSystemApp = sysapps.map(app => (typeof app.title === "string" ? app.title : app.title.text)).includes(typeof title === "string" ? title : title?.text);

	useEffect(() => {
		const checkIcon = async (icon: string | ReactNode | null) => {
			if (typeof icon === "undefined" || icon === null) {
				setResolvedIcon(false);
			} else if (typeof icon === "string") {
				setResolvedIcon(true);
				if (icon.startsWith("/")) {
					let origin: string;
					let path: string;
					let url: string;
					if (icon.match(isURL)) {
						url = icon;
					} else {
						origin = window.location.origin;
						path = icon.startsWith("/") ? icon : `/${icon}`;
						url = `${origin}${path}`;
					}
					try {
						const response = await fetch(url);
						const data = await response.text();
						if (!data.startsWith("<!")) {
							setResolvedIcon(true);
						} else {
							setResolvedIcon(false);
						}
					} catch {
						setResolvedIcon(false);
					}
				}
			} else {
				setResolvedIcon(false);
			}
		};
		checkIcon(icon);
	}, [icon]);

	return inPins ? (
		<div
			className={`${className ? className : ""} group p-2 pr-2.5 gap-4 flex justify-between items-center hover:bg-[#ffffff28] hover:shadow-tb-border duration-150 cursor-pointer w-full`}
			onClick={() => onClick?.(new MouseEvent("click"))}
			onContextMenu={(e: React.MouseEvent) => {
				e.preventDefault();
				const { clientX, clientY } = e;
				console.log(
					src,
					src
						?.replace("/fs", "")
						.replace(/\/[^/]+\.html$/, "/")
						.replace(/\/\.\//, "/"),
				);
				window.tb.contextmenu.create({
					x: clientX - 10,
					y: clientY - 150,
					options: [
						{
							text: "Open",
							click: () => {
								onClick?.(new MouseEvent("click"));
							},
						},
						{
							text: "Pin to Dock",
							click: async () => {
								window.tb.desktop.dock.pin({
									// @ts-expect-error ignore this
									title: typeof title === "string" ? title : title?.text,
									icon: typeof icon === "string" ? icon : undefined,
									isPinnable: true,
									src: src,
									proxy: proxy,
									snapable: snapable,
									size: {
										width: size?.width ?? 600,
										height: size?.height ?? 400,
									},
								});
							},
						},
						{
							text: "Unpin from Start",
							click: async () => {
								const apps: any = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
								apps.pinned_apps = apps.pinned_apps.filter((app: any) => !(app.title === title && app.icon === icon) && !(app.name === title && app.icon === icon));
								await window.tb.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
								window.dispatchEvent(new Event("updApps"));
							},
						},
						...(isSystemApp
							? []
							: [
									{
										text: "Uninstall",
										click: async () => {
											let appPath = "";
											const appName = typeof title === "string" ? title : title && typeof title === "object" && "text" in title ? (title as { text: string }).text : "";
											if (src?.startsWith("/fs/apps/user/")) {
												if (src.includes(".tapp")) {
													appPath = `/apps/user/${await window.tb.user.username()}/${appName.toLowerCase()}.tapp`;
												} else {
													appPath = `/apps/user/${await window.tb.user.username()}/${appName.toLowerCase()}`;
												}
											} else if (src?.startsWith("/fs/apps/system/")) {
												appPath = `/apps/system/${appName.toLowerCase()}.tapp`;
											} else if (src?.includes("/apps/anura/")) {
												appPath = `/apps/anura/${appName.toLowerCase()}`;
											} else {
												appPath = `/apps/user/${await window.tb.user.username()}/${appName}`;
											}
											let installedApps = JSON.parse(await window.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
											installedApps = installedApps.filter((app: any) => app.title === title);
											await window.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(installedApps));
											await window.tb.sh.promises.rm(appPath, { recursive: true });
											await window.tb.launcher.removeApp(chars);
											window.dispatchEvent(new Event("updApps"));
										},
									},
								]),
					],
				});
			}}
		>
			<div className="flex gap-2 items-center">
				{
					// @ts-expect-error
					resolvedIcon === true ? <img src={icon} className="w-7 h-7 flex items-center justify-center" /> : <div className="w-7 h-7 flex items-center justify-center">{<PuzzlePieceIcon className="size-7" />}</div>
				}
				<span className="text-white font-[680]">{chars.length > 10 ? chars.slice(0, 10).join("") + "..." : chars.join("")}</span>
			</div>
			<ChevronRightIcon
				onClick={async () => {
					const apps: any = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
					apps.pinned_apps = apps.pinned_apps.filter((app: any) => !(app.title === title && app.icon === icon));
					await window.tb.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
					window.dispatchEvent(new Event("updApps"));
				}}
				className="size-7 bg-[#ffffff18] backdrop-blur-[20px] shadow-tb-border-shadow p-1.5 rounded-full text-white stroke-current stroke-[3px] opacity-0 group-hover:opacity-100 duration-150 ease-in"
			/>
		</div>
	) : (
		<div
			className={`${className ? className : ""} group p-2 pr-2.5 gap-2 flex justify-between items-center hover:bg-[#ffffff28] hover:shadow-tb-border duration-150 cursor-pointer rounded-lg w-full`}
			onClick={(e: React.MouseEvent) => {
				if (e.button === 0) onClick?.(new MouseEvent("click"));
			}}
			onContextMenu={async (e: React.MouseEvent) => {
				e.preventDefault();
				const { clientX, clientY } = e;
				const appsStart: any = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
				const appsDock: any = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/dock.json", "utf8"));
				const isPinnedStart = appsStart.pinned_apps.some((app: any) => app.title === title && app.icon === icon);
				const isPinnedDock = appsDock.some((app: any) => app.src === src && app.icon === icon);
				window.tb.contextmenu.create({
					x: clientX - 10,
					y: clientY - 150,
					options: [
						{
							text: "Open",
							click: () => {
								onClick?.(new MouseEvent("click"));
							},
						},
						isPinnedDock
							? {
									text: "Unpin from Dock",
									click: () => {
										window.tb.desktop.dock.unpin(title);
									},
								}
							: {
									text: "Pin to Dock",
									click: async () => {
										window.tb.desktop.dock.pin({
											// @ts-expect-error ignore this
											title: typeof title === "string" ? title : title?.text,
											icon: typeof icon === "string" ? icon : undefined,
											isPinnable: true,
											src: src,
											proxy: proxy,
											snapable: snapable,
											size: {
												width: size?.width ?? 600,
												height: size?.height ?? 400,
											},
										});
									},
								},
						isPinnedStart
							? {
									text: "Unpin from Start",
									click: async () => {
										const apps: any = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
										apps.pinned_apps = apps.pinned_apps.filter((app: any) => !(app.title === title && app.icon === icon));
										await window.tb.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
										window.dispatchEvent(new Event("updApps"));
									},
								}
							: {
									text: "Pin to Start",
									click: async () => {
										const path = src
											?.replace("/fs", "")
											.replace(/\/[^/]+\.html$/, "/")
											.replace(/\/\.\//, "/");
										const appConfig = JSON.parse(await window.tb.fs.promises.readFile(path + "index.json", "utf8"));
										if (appsStart.pinned_apps.some((app: any) => app.title === appConfig.config.title && app.icon === appConfig.config.icon)) {
											return;
										}

										appsStart.pinned_apps.push({
											name: typeof appConfig.config.title === "string" ? appConfig.config.title : appConfig.config.title.text,
											...appConfig.config,
										});
										await window.tb.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(appsStart, null, 2));
										window.dispatchEvent(new Event("updApps"));
									},
								},
						...(isSystemApp
							? []
							: [
									{
										text: "Uninstall",
										click: async () => {
											let appPath = "";
											const appName = typeof title === "string" ? title : title && typeof title === "object" && "text" in title ? (title as { text: string }).text : "";
											if (src?.startsWith("/fs/apps/user/")) {
												if (src.includes(".tapp")) {
													appPath = `/apps/user/${await window.tb.user.username()}/${appName.toLowerCase()}.tapp`;
												} else {
													appPath = `/apps/user/${await window.tb.user.username()}/${appName.toLowerCase()}`;
												}
											} else if (src?.startsWith("/fs/apps/system/")) {
												appPath = `/apps/system/${appName.toLowerCase()}.tapp`;
											} else if (src?.includes("/apps/anura/")) {
												appPath = `/apps/anura/${appName.toLowerCase()}`;
											} else {
												appPath = `/apps/user/${await window.tb.user.username()}/${appName}`;
											}
											let installedApps = JSON.parse(await window.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
											installedApps = installedApps.filter((app: any) => app.title === title);
											await window.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(installedApps));
											await window.tb.sh.promises.rm(appPath, { recursive: true });
											await window.tb.launcher.removeApp(chars);
											window.dispatchEvent(new Event("updApps"));
										},
									},
								]),
					],
				});
			}}
		>
			<div className="flex gap-2 items-center">
				{
					// @ts-expect-error
					resolvedIcon === true ? <img src={icon} className="w-7 h-7 flex items-center justify-center" /> : <div className="w-7 h-7 flex items-center justify-center">{<PuzzlePieceIcon className="size-7" />}</div>
				}
				<span className="text-white font-[680]">{chars.length > 10 ? chars.slice(0, 10).join("") + "..." : chars.join("")}</span>
			</div>
			<ChevronRightIcon
				onClick={async () => {
					const apps: any = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/start.json", "utf8"));
					apps.pinned_apps.push({
						title: title,
						icon: icon,
						src: src,
					});
					await window.tb.fs.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
					window.dispatchEvent(new Event("updApps"));
				}}
				className="size-7 bg-[#ffffff18] backdrop-blur-[20px] shadow-tb-border-shadow p-1.5 rounded-full text-white stroke-current stroke-[3px] opacity-0 group-hover:opacity-100 duration-150 ease-in"
			/>
		</div>
	);
};

export default Dock;

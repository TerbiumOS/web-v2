import { FC, useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useSearchMenuStore } from "../Store";
import { StartItem } from "./Dock";
import { searchApps, searchFiles } from "../apis/SysSearch";
import { createWindow } from "./WindowArea";

interface SearchProps {
	className: string;
	searchRef?: React.RefObject<HTMLInputElement | null>;
}

const SearchMenu: FC<SearchProps> = ({ className }) => {
	const searchMenuStore = useSearchMenuStore();

	const [searchMatch, setSearchMatch] = useState<boolean>(false);
	const [resultOpen, setResultOpen] = useState<boolean>(false);
	const [searchHasText, setSearchHasText] = useState<boolean>(false);
	const [searchActive, setSearchActive] = useState<boolean>(false);
	const [recentApps, setRecentApps] = useState<Object[]>([]);
	const searchMenuRef = useRef<HTMLDivElement>(null);
	const searchRefRef = useRef<HTMLInputElement>(null);
	const placeholderRef = useRef<HTMLSpanElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const resultRef = useRef<HTMLDivElement>(null);
	const recentAppsRef = useRef<HTMLDivElement>(null);
	const [results, setResults] = useState<any[]>([]);
	const [noResutls, setNoResults] = useState<boolean>(false);

	useEffect(() => {
		const getRecentApps = async () => {
			const recentApps = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/recent.json"));
			const recentAppsList = recentApps.map((app: any) => {
				return app;
			});
			setRecentApps(recentAppsList);
			searchRefRef.current!.focus();
		};
		searchMenuStore.open ? getRecentApps() : null;
		if (!searchMenuStore.open) {
			searchRefRef.current!.value = "";
			setNoResults(false);
			setSearchMatch(false);
			setSearchActive(false);
			setSearchHasText(false);
			setResultOpen(false);
			setTimeout(() => {
				recentAppsRef.current!.classList.add("col-span-2");
				containerRef.current!.classList.remove("grid-cols-2");
				containerRef.current!.classList.add("grid-cols-1");
			}, 200);
			setTimeout(() => {
				resultRef.current!.classList.add("absolute");
			}, 300);
			setResults([]);
		}
		getRecentApps();
	}, [searchMenuStore]);

	useEffect(() => {
		searchMenuStore.searchRef = { current: searchRefRef.current };
		searchMenuStore.searchMenuRef = { current: searchMenuRef.current };
	});

	return (
		<div
			ref={searchMenuRef}
			className={
				className +
				`
            bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-sm rounded-xl
            flex flex-col items-center justify-between
            min-w-[440px] h-[266px]
        `
			}
		>
			<div
				className={
					"flex gap-2 items-center text-[#ffffffa4] p-2.5 pb-0 w-full duration-700" +
					" " +
					`
                ${searchMenuStore.open ? "" : "translate-y-2 opacity-0"}
            `
				}
			>
				<MagnifyingGlassIcon className="size-6 text-[#ffffff86] stroke-current stroke-[2px]" />
				<div className="relative flex items-center w-full">
					<span ref={placeholderRef} className={`absolute font-[680] text-lg pointer-events-none duration-150 ${searchHasText ? "opacity-0 -translate-x-1.5" : searchActive ? "opacity-100" : "opacity-75"}`}>
						Search for apps and files
					</span>
					<input
						ref={searchRefRef}
						type="text"
						className="bg-transparent focus-visible:outline-none text-lg font-[680] w-full cursor-text"
						onFocus={() => setSearchActive(true)}
						onBlur={() => setSearchActive(false)}
						onChange={async e => {
							const value = (e.target as HTMLInputElement).value;
							if (value.length > 0) {
								setSearchActive(true);
								resultRef.current!.classList.remove("absolute");
								recentAppsRef.current!.classList.remove("col-span-2");
								setTimeout(() => {
									containerRef.current!.classList.remove("grid-cols-1");
									containerRef.current!.classList.add("grid-cols-2");
								}, 200);
								setTimeout(() => {
									setResultOpen(true);
								}, 200);
								setSearchHasText(true);
								const appres = await searchApps(value);
								const filesres = await searchFiles(value);
								if (appres && Array.isArray(appres) && appres.length > 0) {
									setSearchMatch(true);
									const app = appres[0];
									let iconHtml = "";
									if (typeof app.icon === "string") {
										if (app.icon.trim().startsWith("<svg")) {
											iconHtml = app.icon;
										} else {
											iconHtml = `<img class="w-[49px] h-[49px]" src="${app.icon}"/>`;
										}
									}
									const appName = typeof app.name === "string" ? app.name : app.name && typeof app.name.text === "string" ? app.name.text : "";
									setResults([
										[
											{
												icon: iconHtml,
												name: appName.charAt(0).toUpperCase() + appName.slice(1),
												dir: app.dir || "Unknown Path",
												config: app.cfg,
												click: () => {
													createWindow(app.cfg);
													searchMenuStore.open = false;
													searchRefRef.current!.value = "";
													setSearchMatch(false);
													setSearchActive(false);
													setSearchHasText(false);
													setResultOpen(false);
													setTimeout(() => {
														recentAppsRef.current!.classList.add("col-span-2");
														containerRef.current!.classList.remove("grid-cols-2");
														containerRef.current!.classList.add("grid-cols-1");
													}, 200);
													setTimeout(() => {
														resultRef.current!.classList.add("absolute");
													}, 300);
													setResults([]);
												},
											},
										],
										[],
									]);
									setNoResults(false);
									setSearchActive(false);
								} else if (filesres && Array.isArray(filesres) && filesres.length > 0) {
									setSearchMatch(true);
									window.tb.fs.promises.readFile("/system/etc/terbium/file-icons.json", "utf8").then(async (data: string) => {
										const fileIconsData = JSON.parse(data);
										const getIcon = (ext: string) => {
											let iconName = fileIconsData["ext-to-name"][ext];
											let iconPath = fileIconsData["name-to-path"][iconName];
											if (iconPath) {
												return iconPath;
											} else {
												return fileIconsData["name-to-path"]["Unknown"];
											}
										};
										const fileItems = await Promise.all(
											filesres.map(async (f: any) => {
												const iconSvg = await window.tb.fs.promises.readFile(getIcon(f.ext), "utf8");
												function rewriteSvgSize(svg: string) {
													return svg.replace(/<svg([^>]*)>/, (_, attrs) => {
														let newAttrs = attrs.replace(/\swidth=['"][^'"]*['"]/, "").replace(/\sheight=['"][^'"]*['"]/, "");
														return `<svg${newAttrs} width="48" height="48">`;
													});
												}
												const newSvg = rewriteSvgSize(iconSvg);
												return {
													icon: newSvg,
													name: f.name.charAt(0).toUpperCase() + f.name.slice(1) || value.charAt(0).toUpperCase() + value.slice(1),
													path: f.path || "",
													ext: f.ext,
													dir: f.dir,
													onClick: async () => {
														let handlers = JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["fileAssociatedApps"];
														handlers = Object.entries(handlers).filter(([type, app]) => {
															return !((type === "text" && app === "text-editor") || (type === "image" && app === "media-viewer") || (type === "video" && app === "media-viewer") || (type === "audio" && app === "media-viewer"));
														});
														const dat = JSON.parse(await window.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
														let hands: { text: string; value: string }[] = [];
														for (const [type, app] of handlers) {
															hands.push({ text: app, value: type });
														}
														await window.tb.dialog.Select({
															title: `Select a application to open: ${f.name}`,
															options: [{ text: "Text Editor", value: "text" }, { text: "Media Viewer", value: "media" }, { text: "Webview", value: "webview" }, ...hands, { text: "Other", value: "other" }],
															onOk: async (val: string) => {
																switch (val) {
																	case "text":
																		parent.window.tb.file.handler.openFile(f.path, "text");
																		break;
																	case "media":
																		const ext = f.name.split(".").pop();
																		if (dat["image"].includes(ext)) {
																			parent.window.tb.file.handler.openFile(f.path, "image");
																		} else if (dat["video"].includes(ext)) {
																			parent.window.tb.file.handler.openFile(f.path, "video");
																		} else if (dat["audio"].includes(ext)) {
																			parent.window.tb.file.handler.openFile(f.path, "audio");
																		}
																		break;
																	case "webview":
																		parent.window.tb.file.handler.openFile(f.path, "webpage");
																		break;
																	case "other":
																		parent.window.tb.dialog.DirectoryBrowser({
																			title: "Select a application",
																			filter: ".tapp",
																			onOk: async (val: string) => {
																				const app = JSON.parse(await window.tb.fs.promises.readFile(`${val}/.tbconfig`, "utf8"));
																				window.parent.tb.window.create({
																					...app.wmArgs,
																					message: { type: "process", path: f.dir },
																				});
																			},
																		});
																		break;
																	default:
																		if (hands.length === 0) {
																			parent.window.tb.file.handler.openFile(f.path, "text");
																		} else {
																			parent.window.tb.file.handler.openFile(f.path, val);
																		}
																		break;
																}
																searchMenuStore.open = false;
																searchRefRef.current!.value = "";
																setNoResults(false);
																setSearchMatch(false);
																setSearchActive(false);
																setSearchHasText(false);
																setResultOpen(false);
																setTimeout(() => {
																	recentAppsRef.current!.classList.add("col-span-2");
																	containerRef.current!.classList.remove("grid-cols-2");
																	containerRef.current!.classList.add("grid-cols-1");
																}, 200);
																setTimeout(() => {
																	resultRef.current!.classList.add("absolute");
																}, 300);
																setResults([]);
															},
														});
													},
												};
											}),
										);
										setNoResults(false);
										setResults([[], fileItems]);
										setSearchActive(false);
									});
								} else if (appres === false && filesres === false) {
									setSearchMatch(false);
									setNoResults(true);
								}
							} else {
								setSearchMatch(false);
								setSearchHasText(false);
								setResults([]);
								setResultOpen(false);
								setNoResults(false);
								setTimeout(() => {
									recentAppsRef.current!.classList.add("col-span-2");
									containerRef.current!.classList.remove("grid-cols-2");
									containerRef.current!.classList.add("grid-cols-1");
								}, 200);
								setTimeout(() => {
									resultRef.current!.classList.add("absolute");
								}, 300);
							}
						}}
					/>
				</div>
			</div>
			<div
				className={
					"relative flex items-center min-h-[104px] h-full w-full gap-2 p-2.5 pt-0 duration-1000" +
					" " +
					`
                ${searchMenuStore.open ? "" : "translate-y-4 opacity-0"}`
				}
			>
				<div ref={containerRef} className={"grid gap-2 pt-2 w-full h-full overflow-hidden"}>
					<div
						ref={recentAppsRef}
						className={
							"relative grid overflow-hidden" +
							" " +
							`
                        ${recentApps.length > 0 ? "" : "items-center justify-center"}
                    `
						}
					>
						{recentApps.length <= 0 && (
							<h1
								className={
									"font-bold text-lg leading-none pt-2 text-[#ffffff68]" +
									" " +
									`
                                ${recentApps.length <= 0 ? "" : "opacity-0 pointer-events-none translate-4 duration-200"}
                            `
								}
							>
								No recent apps
							</h1>
						)}
						<div
							className={
								"flex flex-col gap-2" +
								" " +
								`
                            ${recentApps.length > 0 ? "duration-150" : "opacity-0 pointer-events-none translate-4 duration-200"}
                        `
							}
						>
							<h1 className={"font-bold text-lg leading-none text-[#ffffff68]"}>Recent apps</h1>
							<div
								className={
									"grid items-center gap-1 overflow-y-auto rounded-md" +
									" " +
									`
                                ${results.length > 0 ? "grid-cols-1" : "grid-cols-2"}
                            `
								}
							>
								{recentApps.length > 0
									? recentApps
											.sort((a: any, b: any) => {
												const valueDiff = (b.value ?? 0) - (a.value ?? 0);
												if (valueDiff !== 0) return valueDiff;
												return (b.weight ?? 0) - (a.weight ?? 0);
											})
											.slice(0, 8)
											.map((app: any, i: number) => (
												<StartItem
													key={i}
													className="w-full"
													title={app.title}
													icon={app.icon}
													pid={undefined}
													src={app.src}
													size={app.size}
													proxy={app.proxy}
													snapable={app.snapable}
													advanced={app.advanced}
													onClick={() => {
														createWindow({
															...app,
															icon: typeof app.icon === "string" ? app.icon : undefined,
														});
														searchMenuStore.open = false;
													}}
												/>
											))
									: null}
							</div>
						</div>
					</div>
					<div
						ref={resultRef}
						className={
							"flex flex-col p-2 bg-[#15151594] rounded-lg shadow-tb-border-shadow overflow-y-auto" +
							" " +
							`
                        ${searchMatch === false ? "justify-center items-center" : ""}
                        ${resultOpen ? "duration-150" : "opacity-0 pointer-events-none translate-y-4 duration-200"}
                    `
						}
					>
						<h1 className={"font-bold text-lg leading-none pt-2 text-[#ffffff68]"}>Search results</h1>
						{noResutls ? (
							<div className="flex gap-1.5 duration-150 items-center text-[#ffffff51]">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
									<path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1.5 14.25h-3v-1.5h3v1.5Zm0-3h-3V7.5h3v5.75Z" />
								</svg>
								<span className="text-sm font-black">No apps or files relevant to searches</span>
							</div>
						) : results.length > 0 && searchActive ? (
							<div className="flex flex-col items-center justify-center gap-1.5 h-full w-full text-[#ffffffa4] font-[680] text-lg">
								Searching...
								<div className="relative flex w-[80%] h-2 rounded-full bg-[#00000020] overflow-hidden shadow-tb-border-shadow">
									<div className="absolute h-full bg-[#50bf66] rounded-full" style={{ animation: "2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite normal none running anim1" }}></div>
								</div>
							</div>
						) : (
							<div className={"flex flex-col gap-0.5 overflow-y-auto"}>
								{Array.isArray(results[0]) && results[0].length > 0
									? results[0].map((app: any, i: number) => (
											<div
												key={i}
												className={"flex flex-col gap-2 search-result-app cursor-pointer hover:bg-[#22222288] rounded-md p-2"}
												onClick={() => {
													app.click();
												}}
											>
												<div className={"flex flex-row gap-1 items-center"}>
													{typeof app.icon === "string" ? app.icon.trim().startsWith("<svg") ? <span dangerouslySetInnerHTML={{ __html: app.icon }} /> : <img className="w-[49px] h-[49px]" src={app.icon.replace(/^<img.*src="([^"]*)".*$/, "$1")} alt={app.name} /> : app.icon}
													<div>
														<h1 className={"font-extrabold text-xl"}>{app.name}</h1>
														<h3 className={"font-bold text-xs"}>{app.dir || "Unknown Path"}</h3>
													</div>
												</div>
											</div>
										))
									: Array.isArray(results[1]) && results[1].length > 0
										? results[1].map((f: any, i: number) => (
												<div
													key={i}
													className={"flex flex-col gap-2 search-result-file cursor-pointer hover:bg-[#22222288] rounded-md p-2"}
													onClick={() => {
														f.onClick();
													}}
												>
													<div className={"flex flex-row gap-1 items-center"}>
														{typeof f.icon === "string" ? f.icon.trim().startsWith("<svg") ? <span dangerouslySetInnerHTML={{ __html: f.icon }} /> : <img className="w-[49px] h-[49px]" src={f.icon.replace(/^<img.*src="([^"]*)".*$/, "$1")} alt={f.name} /> : f.icon}
														<div>
															<h1 className={"font-extrabold text-xl"}>{f.name}</h1>
															<h3 className={"font-bold text-xs"}>{f.path || ""}</h3>
														</div>
													</div>
												</div>
											))
										: null}
							</div>
						)}
					</div>
				</div>
				{recentApps.length === 0 ||
					(searchMatch === false && (
						<div
							className={
								"absolute top-1/2 left-1/2 -translate-1/2 flex gap-1.5 duration-150 items-center text-[#ffffff51]" +
								" " +
								`
                        ${searchMatch ? "" : "opacity-0 pointer-events-none -translate-x-3"}
                    `
							}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
								<path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1.5 14.25h-3v-1.5h3v1.5Zm0-3h-3V7.5h3v5.75Z" />
							</svg>
							<span className="text-sm font-black">No recent apps or relevant searches</span>
						</div>
					))}
			</div>
		</div>
	);
};

export default SearchMenu;

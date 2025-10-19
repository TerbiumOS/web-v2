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
import { clearInfo } from "./AppIsland";

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

	useEffect(() => {
		const menu = () => {
			setShowMenu(prev => !prev);
		};
		const nMenu = () => {
			setShowNotif(prev => !prev);
		};
		const getWallpaper = async () => {
			const settings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`));
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
			setWinPrev(JSON.parse(e.detail));
		};
		const getPins = async () => {
			if (await dirExists("/system")) {
				setPinned(JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/dock.json", "utf8")));
			}
		};
		getPins();
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
	}, [showNotif, winPrev, pinned]);

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
			<div className={`${winPrev?.open ? "opacity-100" : "opacity-0"} duration-150`}>
				{winPrev?.windows && winPrev.windows.length > 0 && (
					<div className={`absolute bottom-16 flex flex-col justify-center items-center rounded-lg bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-[100px] border-none overflow-hidden z-9999999`} style={{ left: `calc(${winPrev?.location}px - ${45 * winPrev?.windows.length}px)` }}>
						{winPrev.windows[0].map((win: WindowConfig) => (
							<div
								key={win.wid}
								className={`flex justify-center items-center p-2 gap-14 hover:bg-[#ffffff10] ${win.pid === String(window.tb.window.getId()) ? "bg-[#ffffff18]" : ""} duration-150`}
								onClick={() => {
									window.dispatchEvent(new CustomEvent("sel-win", { detail: win.wid }));
									window.dispatchEvent(new CustomEvent("currWID", { detail: win.wid }));
									setWinPrev(prev => ({
										...prev,
										open: true,
										windows: prev?.windows,
										location: prev?.location ?? "",
									}));
								}}
							>
								<div className="flex items-center gap-2">
									<img src={win.icon} className="size-6" alt="App icon" />
									<h2>{typeof win.title === "string" ? win.title : win.title?.text}</h2>
								</div>
								<svg
									className="size-6 p-0.5 rounded-sm cursor-pointer text-[#ffffffbb] no-drag hover:text-white hover:bg-[#ffffff10]"
									viewBox="0 0 24 24"
									fill="none"
									onClick={() => {
										window.tb.process.kill(win.pid);
										setWinPrev(prev => ({
											...prev,
											windows: prev?.windows.map((w: any) => w.filter((w: WindowConfig) => w.wid !== win.wid)),
											open: prev?.open ?? false,
											location: prev?.location ?? "",
										}));
										clearInfo();
									}}
								>
									<path className="duration-150 pointer-events-none" d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
								</svg>
							</div>
						))}
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

import { useState, useRef, useEffect } from "react";
import { PowerIcon, MoonIcon, LockClosedIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

export default function Power() {
	const [showMenu, setShowMenu] = useState(false);
	const [showHardRestart, setShowHardRestart] = useState(false);
	const menu = useRef<HTMLDivElement>(null);
	const iconRef = useRef<SVGSVGElement>(null);
	useEffect(() => {
		const leave = (e: MouseEvent) => {
			if (showMenu) {
				if (e.target instanceof HTMLElement) {
					if (e.target !== menu.current && !menu.current?.contains(e.target)) {
						setShowMenu(false);
						setShowHardRestart(false);
					}
				}
			}
		};
		document.addEventListener("mousedown", leave);
		return () => document.removeEventListener("mousedown", leave);
	});
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				setShowHardRestart(true);
			}
		};
		const up = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				setShowHardRestart(false);
			}
		};
		document.addEventListener("keydown", down);
		document.addEventListener("keyup", up);
		return () => {
			document.removeEventListener("keydown", down);
			document.removeEventListener("keyup", up);
		};
	}, []);
	return (
		<>
			<PowerIcon
				ref={iconRef}
				className="size-6 stroke-[1.3px] stroke-current cursor-pointer duration-150"
				onMouseUp={() => {
					iconRef.current?.classList.remove("scale-90");
					setShowMenu(prev => !prev);
				}}
				onMouseLeave={() => {
					iconRef.current?.classList.remove("scale-90");
				}}
				onMouseOver={() => {
					iconRef.current?.classList.add("scale-90");
				}}
				onClick={() => {
					iconRef.current?.classList.add("scale-90");
				}}
			/>
			<div
				ref={menu}
				className={`
                absolute top-13.5 right-1.5 z-[-1] bg-[#2020208c] bg-[url(/assets/img/grain.png)] shadow-tb-border-shadow
                ${showMenu ? "duration-150" : "opacity-0 -translate-y-6 pointer-events-none duration-200"} rounded-xl backdrop-blur-sm overflow-hidden
            `}
			>
				<div
					className={`
                    flex flex-col duration-1000
                    ${showMenu ? "" : "opacity-0 -translate-y-2"}
                `}
				>
					<button
						className={`
                        first:rounded-t-lg last:rounded-b-lg hover:bg-[#ffffff28] flex gap-8 justify-between items-center px-3 py-2 duration-150
                    `}
					>
						<span className="select-none font-semibold">Sleep</span>
						<MoonIcon className="size-5" />
					</button>
					<button
						className={`
                        first:rounded-t-lg last:rounded-b-lg hover:bg-[#ffffff28] flex gap-8 justify-between items-center px-3 py-2 duration-150
                    `}
						onClick={() => {
							sessionStorage.setItem("logged-in", "false");
							window.location.reload();
						}}
					>
						<span className="select-none font-semibold">Lock</span>
						<LockClosedIcon className="size-5" />
					</button>
					<button
						className={`
                        first:rounded-t-lg last:rounded-b-lg hover:bg-[#ffffff28] flex gap-8 justify-between items-center px-3 py-2 duration-150
                    `}
						onClick={() => {
							sessionStorage.setItem("logged-in", "false");
							window.location.reload();
						}}
					>
						<span className="select-none font-semibold">Restart</span>
						<ArrowPathIcon className="size-5 stroke-[1.3px] stroke-current" />
					</button>
					{showHardRestart && (
						<button
							className={`
                            first:rounded-t-lg last:rounded-b-lg hover:bg-[#ffffff28] flex gap-8 justify-between items-center px-3 py-2 duration-150
                        `}
							onClick={() => {
								sessionStorage.clear();
								window.location.reload();
							}}
						>
							<span className="select-none font-semibold">Hard Restart</span>
							<ArrowPathIcon className="size-5 stroke-[1.3px] stroke-current" />
						</button>
					)}
					<button
						className={`
                        first:rounded-t-lg last:rounded-b-lg hover:bg-[#ff6060ce] flex gap-8 justify-between items-center px-3 py-2 duration-150
                    `}
						onClick={() => {
							sessionStorage.setItem("logged-in", "false");
							window.location.href = "https://google.com";
						}}
					>
						<span className="select-none font-semibold">Shutdown</span>
						<PowerIcon className="size-5 stroke-[1.3px] stroke-current" />
					</button>
				</div>
			</div>
		</>
	);
}

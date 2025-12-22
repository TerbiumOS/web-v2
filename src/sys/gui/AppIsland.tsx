import { useEffect, useState } from "react";
import "./styles/shell.css";
import { createId } from "@paralleldrive/cuid2";

export interface AppIslandProps {
	text?: string;
	click?: () => void;
	appname?: string;
	id?: string;
}

type IslandState = {
	props: AppIslandProps | null;
	controls: React.JSX.Element[];
};

export let updateInfo: (props: AppIslandProps) => void;
export let updateControls: (props: AppIslandProps) => void;
export let clearInfo: () => void;
export let clearControls: (appname: string) => void;
export default function AppIsland() {
	const [islands, setIslands] = useState<{ [appname: string]: IslandState }>({});
	const [activeApp, setActiveApp] = useState<string | null>(null);
	const onUpdate = (props: AppIslandProps) => {
		if (!props.appname) return;
		setIslands(prev => ({
			...prev,
			[props.appname!]: {
				...(prev[props.appname!] || { props: null, controls: [] }),
				props: { ...prev[props.appname!]?.props, ...props },
			},
		}));
		setActiveApp(props.appname);
		window.dispatchEvent(new CustomEvent("selwin-upd", { detail: props.appname }));
	};
	const updconts = (props: AppIslandProps) => {
		if (!props.appname) return;
		const appname = props.appname;
		const controlId = props.id || createId();
		const whenClick = props.click ? props.click : () => {};
		setIslands(prev => {
			const existingControls = prev[appname]?.controls || [];
			if (existingControls.some(control => control.key === controlId)) return prev;
			const control = (
				<button key={controlId} className="cursor-pointer hover:text-[#ffffffe3] leading-none duration-150" control-id={controlId} onClick={whenClick}>
					{props.text}
				</button>
			);
			return {
				...prev,
				[appname]: {
					props: prev[appname]?.props || null,
					controls: [...existingControls, control],
				},
			};
		});
		window.dispatchEvent(new CustomEvent("selwin-upd", { detail: appname }));
	};
	const clear = (appname: string) => {
		setIslands(prev => ({
			...prev,
			[appname]: {
				...prev[appname],
				controls: [],
			},
		}));
	};
	const clearinf = () => {
		setActiveApp(null);
	};
	useEffect(() => {
		updateInfo = onUpdate;
		updateControls = updconts;
		clearInfo = clearinf;
		clearControls = clear;
	});

	return (
		<div className="island-container">
			<div className={`island relative p-3 py-2 flex gap-2 items-center rounded-xl h-min ${activeApp ? "opacity-100" : "opacity-0"}`}>
				{Object.entries(islands).map(([appname, island]) => (
					<div className={`flex gap-3 ${activeApp === appname ? "opacity-100 z-1" : "opacity-0 absolute pointer-events-none"} duration-150`} key={appname} id={island.props?.id} data-app-name={appname}>
						<div className="font-bold text-white text-2xl cursor-(--cursor-text)">{appname}</div>
						{island.controls.length > 0 && <div className="font-medium text-[#ffffff88] text-sm flex gap-2">{island.controls}</div>}
					</div>
				))}
			</div>
		</div>
	);
}

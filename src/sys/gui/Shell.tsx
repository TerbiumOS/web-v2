import Mediaisland from "../apis/Mediaisland";
import Battery from "./Battery";
import "./styles/shell.css";
import Wifi from "./Wifi";
import getTime from "../apis/Time";
import { useEffect, useState } from "react";
import Weather from "./Weather";
import { FPSCounter } from "./FPSCounter";
import NotificationCenter from "./NotificationCenter";
import AppIsland from "./AppIsland";
import Power from "./Power";

const Shell = () => {
	const [time, setTime] = useState<number>(0);
	useEffect(() => {
		const int = setInterval(() => {
			// @ts-expect-error
			setTime(getTime());
		}, 100);
		return () => clearInterval(int);
	}, []);
	return (
		<div className="shell flex z-100 w-full gap-1.5 text-[#5f5f5f] px-1.5 py-1 justify-between">
			<div className="islands_left relative flex gap-2 items-center">
				<AppIsland />
				<Mediaisland />
			</div>
			<div className="islands_right flex gap-1.5 items-center">
				<div className="island p-3 px-3.5 gap-2 rounded-xl select-none *:leading-none" style={{ backgroundImage: "url(/assets/img/grain.png)" }}>
					<FPSCounter />
					<div className="weather font-bold cursor-default">
						<Weather />
					</div>
					<div className="time font-bold cursor-default">{time}</div>
				</div>
				<div className="island system_island gap-2 p-3 px-3.5 pr-2.5 py-2 rounded-xl *:leading-none" style={{ backgroundImage: "url(/assets/img/grain.png)" }}>
					<Power />
					<Wifi />
					<NotificationCenter />
					<Battery />
					{/* Desktop */}
					<div className="show_desk bg-[#ffffff3e] h-8 w-4 rounded-[5px] cursor-pointer" onClick={() => window.dispatchEvent(new Event("min-wins"))}></div>
				</div>
			</div>
		</div>
	);
};

export default Shell;

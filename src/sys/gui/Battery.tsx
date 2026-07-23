import { useEffect, useRef, useState } from "react";
import { UserSettings } from "../types";

declare global {
	interface Navigator {
		getBattery(): Promise<BatteryManager>;
		userAgent: string;
	}
	interface BatteryManager {
		level: number;
		charging: boolean;
		chargingTime: number;
		onchargingchange: (() => void) | null;
		onlevelchange: (() => void) | null;
	}
}

export default function Battery() {
	const [batteryStatus, setBattery] = useState("100%");
	const [charging, setCharging] = useState(false);
	const [shouldRender, setShouldRender] = useState(true);
	const [showPercent, setShowPercent] = useState(false);
	const [batteryNumber, setBatteryNumber] = useState(0);
	const percentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const controlBatteryPercentVisibility = (value: CustomEvent) => {
			if (typeof value.detail !== "boolean") return;
			setShowPercent(value.detail);
		};

		window.addEventListener("controlBatteryPercentVisibility", controlBatteryPercentVisibility as EventListener);

		return () => {
			window.removeEventListener("controlBatteryPercentVisibility", controlBatteryPercentVisibility as EventListener);
		};
	}, []);

	useEffect(() => {
		const getBattery = async () => {
			if ("getBattery" in navigator) {
				try {
					const battery = await navigator.getBattery();
					const batteryChange = () => {
						if (battery.charging) {
							setBattery(`${Math.floor(battery.level * 100)}%`);
							setBatteryNumber(Math.floor(battery.level * 100));
							setCharging(true);
						} else {
							setBattery(`${Math.floor(battery.level * 100)}%`);
							setBatteryNumber(Math.floor(battery.level * 100));
							setCharging(false);
						}
					};
					battery.onchargingchange = batteryChange;
					battery.onlevelchange = batteryChange;
					batteryChange();
				} catch (error) {
					console.error(`Error fetching battery: ${error}`);
					setBattery("none");
				}
			} else {
				setBattery("none");
				setShouldRender(false);
			}
		};
		getBattery();
		const getShowPercent = async () => {
			const settings: UserSettings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
			setShowPercent(settings["battery-percent"]);
		};
		getShowPercent();
	}, []);

	function renderBattery() {
		return (
			shouldRender && (
				<div
					className={`
            relative
            battery tooltip_item flex gap-[6px] items-center
            ${showPercent === true ? "w-[67px] h-[28px]" : "w-[28px] h-[28px]"}
            duration-150
          `}
				>
					<svg
						width="28"
						height="28"
						viewBox="0 0 168 168"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className={`
              absolute right-0
            `}
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M29.7333 43C24.4997 43 19.4805 45.1335 15.7798 48.9311C12.079 52.7287 10 57.8794 10 63.25V103.75C10 109.121 12.079 114.271 15.7798 118.069C19.4805 121.867 24.4997 124 29.7333 124H128.4C133.634 124 138.653 121.867 142.354 118.069C146.054 114.271 148.133 109.121 148.133 103.75V103.5C153.764 102.326 158 97.2227 158 91.0938V75.9062C158 69.784 153.764 64.6743 148.133 63.5065V63.25C148.133 57.8794 146.054 52.7287 142.354 48.9311C138.653 45.1335 133.634 43 128.4 43H29.7333ZM128.4 53.125C131.017 53.125 133.526 54.1917 135.377 56.0905C137.227 57.9893 138.267 60.5647 138.267 63.25V103.75C138.267 106.435 137.227 109.011 135.377 110.909C133.526 112.808 131.017 113.875 128.4 113.875H29.7333C27.1165 113.875 24.6069 112.808 22.7565 110.909C20.9062 109.011 19.8667 106.435 19.8667 103.75V63.25C19.8667 60.5647 20.9062 57.9893 22.7565 56.0905C24.6069 54.1917 27.1165 53.125 29.7333 53.125H128.4Z"
							fill="white"
						/>
						<rect x="29" y="63" width={batteryStatus !== "none" ? batteryNumber : 0} height="41" rx="4" fill={`${batteryNumber < 15 ? "#ff4545" : batteryNumber <= 30 && batteryNumber > 15 ? "#fee685" : "#ffffff"}`} />
						<g filter="url(#filter0_d_355_134)">
							<path
								className={`charge_icon transition duration-150 ${charging === true ? "opacity-100 block -ml-[4px]" : "opacity-0 hidden"} ${charging === true ? "w-6 h-[auto]" : "w-[0px] h-[auto]"}`}
								fillRule="evenodd"
								clipRule="evenodd"
								d="M91.4298 31.4743C92.1538 31.8817 92.7219 32.5226 93.0436 33.2947C93.3654 34.0668 93.4221 34.9256 93.2049 35.7341L83.3555 72.2479H119.292C120.015 72.2479 120.721 72.4615 121.326 72.8624C121.93 73.2632 122.405 73.8339 122.693 74.5042C122.981 75.1745 123.069 75.9153 122.946 76.6354C122.823 77.3555 122.495 78.0237 122.001 78.5577L70.0845 134.806C69.519 135.42 68.7663 135.824 67.9466 135.955C67.127 136.085 66.2878 135.933 65.5634 135.524C64.8389 135.116 64.2709 134.473 63.9504 133.699C63.6298 132.925 63.5752 132.065 63.7951 131.256L73.6445 94.7471H37.7081C36.9854 94.7471 36.2785 94.5335 35.6742 94.1327C35.07 93.7318 34.5947 93.1612 34.3069 92.4908C34.019 91.8205 33.9311 91.0798 34.054 90.3596C34.1769 89.6395 34.5052 88.9714 34.9985 88.4373L86.9155 32.1893C87.481 31.5775 88.2327 31.1747 89.0508 31.0452C89.8689 30.9156 90.7064 31.0667 91.4298 31.4743Z"
								fill="#FFE600"
							/>
						</g>
						<defs>
							<filter id="filter0_d_355_134" x="23" y="20" width="111" height="127" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
								<feFlood floodOpacity="0" result="BackgroundImageFix" />
								<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
								<feOffset />
								<feGaussianBlur stdDeviation="5.5" />
								<feComposite in2="hardAlpha" operator="out" />
								<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0" />
								<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_355_134" />
								<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_355_134" result="shape" />
							</filter>
							<filter id="filter1_d_355_134" x="40" y="46" width="78" height="72" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
								<feFlood floodOpacity="0" result="BackgroundImageFix" />
								<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
								<feOffset />
								<feGaussianBlur stdDeviation="5.5" />
								<feComposite in2="hardAlpha" operator="out" />
								<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0" />
								<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_355_134" />
								<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_355_134" result="shape" />
							</filter>
						</defs>
					</svg>
					<div
						ref={percentRef}
						className={`
              battery_percent text-sm font-bold
              absolute left-0
              ${batteryNumber < 15 ? "text-red-500" : batteryNumber <= 30 && batteryNumber > 15 ? "text-amber-200" : "text-[#ffffffc9]"}
              ${showPercent === true ? "" : "opacity-0 translate-x-2"}
              duration-150
            `}
					>
						{batteryStatus != "none" ? batteryStatus : "N/A"}
					</div>
				</div>
			)
		);
	}
	return renderBattery();
}

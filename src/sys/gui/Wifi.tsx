import { useEffect, useRef, useState } from "react";
import "./styles/wifi.css";
import { fileExists } from "../types";

interface Server {
	id: string;
	name: string;
	latency?: string;
	connected?: boolean;
	isOnline?: boolean;
}

function ping(id: string): Promise<{ status: string; latency: number | string }> {
	return new Promise(resolve => {
		const websocket = new WebSocket(id);
		const startTime = Date.now();
		const onOpen = () => {
			const latency = Date.now() - startTime;
			websocket.close();
			resolve({ status: "OK", latency });
		};
		const onMessage = () => {
			const latency = Date.now() - startTime;
			websocket.close();
			resolve({ status: "OK", latency });
		};
		const onError = () => {
			websocket.close();
			resolve({ status: "Fail", latency: "N/A" });
		};
		websocket.addEventListener("open", onOpen);
		websocket.addEventListener("message", onMessage);
		websocket.addEventListener("error", onError);
		setTimeout(() => {
			websocket.close();
			resolve({ status: "Fail", latency: "N/A" });
		}, 5000);
	});
}

interface WifiIconProps {
	connection: boolean;
}

const WifiIcon: React.FC<WifiIconProps> = ({ connection }) => {
	const iconRef = useRef<SVGSVGElement>(null);
	const LoadMenu = () => window.dispatchEvent(new Event("open-net"));
	return (
		<svg
			ref={iconRef}
			viewBox="0 0 33 24"
			fill="none"
			className={`w-6 h-6 tooltip_item cursor-pointer duration-150 dlcomponent`}
			onMouseUp={() => {
				iconRef.current?.classList.remove("scale-90");
				LoadMenu();
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
		>
			{connection === true ? (
				<path
					className={`pointer-events-none`}
					fillRule="evenodd"
					clipRule="evenodd"
					d="M0.332717 6.69389C9.25943 -2.2313 23.7329 -2.2313 32.6581 6.69389C32.7643 6.80002 32.8486 6.92605 32.9061 7.06476C32.9635 7.20347 32.9931 7.35214 32.9931 7.50229C32.9931 7.65244 32.9635 7.80112 32.9061 7.93982C32.8486 8.07853 32.7643 8.20456 32.6581 8.31069L31.8505 9.11833C31.6362 9.33236 31.3457 9.45257 31.0429 9.45257C30.74 9.45257 30.4495 9.33236 30.2352 9.11833C22.6464 1.53109 10.3444 1.53109 2.75716 9.11833C2.54287 9.33236 2.25239 9.45257 1.94952 9.45257C1.64666 9.45257 1.35617 9.33236 1.14188 9.11833L0.334241 8.31069C0.120216 8.0964 0 7.80592 0 7.50305C0 7.20019 0.120216 6.9097 0.334241 6.69541L0.332717 6.69389ZM5.18161 11.5428C11.4294 5.295 21.5615 5.295 27.8108 11.5428C27.917 11.6489 28.0012 11.7749 28.0587 11.9136C28.1162 12.0524 28.1458 12.201 28.1458 12.3512C28.1458 12.5013 28.1162 12.65 28.0587 12.7887C28.0012 12.9274 27.917 13.0534 27.8108 13.1596L27.0031 13.9672C26.897 14.0737 26.7708 14.1581 26.632 14.2157C26.4931 14.2733 26.3443 14.303 26.194 14.303C26.0436 14.303 25.8948 14.2733 25.7559 14.2157C25.6171 14.1581 25.491 14.0737 25.3848 13.9672C23.0272 11.6097 19.8296 10.2852 16.4954 10.2852C13.1613 10.2852 9.9637 11.6097 7.60605 13.9672C7.39176 14.1812 7.10128 14.3015 6.79841 14.3015C6.49554 14.3015 6.20506 14.1812 5.99077 13.9672L5.18313 13.1596C4.9691 12.9453 4.84889 12.6548 4.84889 12.3519C4.84889 12.0491 4.9691 11.7586 5.18313 11.5443L5.18161 11.5428ZM10.064 16.3917C10.9131 15.5425 11.921 14.8689 13.0304 14.4093C14.1398 13.9497 15.3289 13.7132 16.5297 13.7132C17.7305 13.7132 18.9196 13.9497 20.029 14.4093C21.1384 14.8689 22.1464 15.5425 22.9954 16.3917C23.1016 16.4978 23.1859 16.6238 23.2433 16.7625C23.3008 16.9012 23.3304 17.0499 23.3304 17.2001C23.3304 17.3502 23.3008 17.4989 23.2433 17.6376C23.1859 17.7763 23.1016 17.9023 22.9954 18.0085L22.1878 18.8161C22.0816 18.9223 21.9556 19.0066 21.8169 19.064C21.6782 19.1215 21.5295 19.1511 21.3794 19.1511C21.2292 19.1511 21.0805 19.1215 20.9418 19.064C20.8031 19.0066 20.6771 18.9223 20.571 18.8161C20.0403 18.2853 19.4103 17.8643 18.7169 17.577C18.0235 17.2897 17.2803 17.1419 16.5297 17.1419C15.7792 17.1419 15.0359 17.2897 14.3425 17.577C13.6491 17.8643 13.0191 18.2853 12.4885 18.8161C12.2742 19.0301 11.9837 19.1504 11.6808 19.1504C11.378 19.1504 11.0875 19.0301 10.8732 18.8161L10.0655 18.0085C9.85152 17.7942 9.7313 17.5037 9.7313 17.2008C9.7313 16.898 9.85152 16.6075 10.0655 16.3932L10.064 16.3917ZM14.9129 21.2406C15.1252 21.0281 15.3772 20.8596 15.6546 20.7447C15.9321 20.6297 16.2294 20.5705 16.5297 20.5705C16.83 20.5705 17.1274 20.6297 17.4048 20.7447C17.6822 20.8596 17.9342 21.0281 18.1465 21.2406C18.2527 21.3467 18.337 21.4727 18.3944 21.6114C18.4519 21.7501 18.4815 21.8988 18.4815 22.049C18.4815 22.1991 18.4519 22.3478 18.3944 22.4865C18.337 22.6252 18.2527 22.7512 18.1465 22.8574L17.3389 23.665C17.2327 23.7712 17.1067 23.8555 16.968 23.9129C16.8293 23.9704 16.6806 24 16.5305 24C16.3803 24 16.2316 23.9704 16.0929 23.9129C15.9542 23.8555 15.8282 23.7712 15.7221 23.665L14.9144 22.8574C14.7004 22.6431 14.5802 22.3526 14.5802 22.0497C14.5802 21.7469 14.7004 21.4564 14.9144 21.2421L14.9129 21.2406Z"
					fill="white"
				/>
			) : (
				<>
					<path
						className={`pointer-events-none`}
						fillRule="evenodd"
						clipRule="evenodd"
						d="M32.6581 6.69389C23.7329 -2.2313 9.25943 -2.2313 0.332717 6.69389L0.334241 6.69541C0.120216 6.9097 0 7.20019 0 7.50305C0 7.80592 0.120216 8.0964 0.334241 8.31069L1.14188 9.11833C1.35617 9.33236 1.64666 9.45257 1.94952 9.45257C2.25239 9.45257 2.54287 9.33236 2.75716 9.11833C10.3444 1.53109 22.6464 1.53109 30.2352 9.11833C30.4495 9.33236 30.74 9.45257 31.0429 9.45257C31.3457 9.45257 31.6362 9.33236 31.8505 9.11833L32.6581 8.31069C32.7643 8.20456 32.8486 8.07853 32.9061 7.93982C32.9635 7.80112 32.9931 7.65244 32.9931 7.50229C32.9931 7.35214 32.9635 7.20347 32.9061 7.06476C32.8486 6.92605 32.7643 6.80003 32.6581 6.69389ZM24.5232 9.01114C18.3999 5.45691 10.4236 6.30079 5.18161 11.5428L5.18313 11.5443C4.9691 11.7586 4.84889 12.0491 4.84889 12.3519C4.84889 12.6548 4.9691 12.9453 5.18313 13.1596L5.99077 13.9672C6.20506 14.1812 6.49554 14.3015 6.79841 14.3015C7.10128 14.3015 7.39176 14.1812 7.60605 13.9672C9.9637 11.6097 13.1613 10.2852 16.4954 10.2852C17.5155 10.2852 18.5228 10.4092 19.4972 10.6488C20.9516 9.68859 22.6715 9.09807 24.5232 9.01114ZM15.1995 20.9975C15.4157 22.0636 15.8014 23.0682 16.3273 23.9818C16.2472 23.9673 16.1686 23.9443 16.0929 23.9129C15.9542 23.8555 15.8282 23.7712 15.7221 23.665L14.9144 22.8574C14.7004 22.6431 14.5802 22.3526 14.5802 22.0497C14.5802 21.7469 14.7004 21.4564 14.9144 21.2421L14.9129 21.2406C15.0018 21.1516 15.0977 21.0703 15.1995 20.9975ZM16.5102 13.7132C15.8366 14.7927 15.3631 16.0099 15.1417 17.313C14.8698 17.3811 14.6027 17.4692 14.3425 17.577C13.6491 17.8643 13.0191 18.2853 12.4885 18.8161C12.2742 19.0301 11.9837 19.1504 11.6808 19.1504C11.378 19.1504 11.0875 19.0301 10.8732 18.8161L10.0655 18.0085C9.85152 17.7942 9.7313 17.5037 9.7313 17.2008C9.7313 16.898 9.85152 16.6075 10.0655 16.3932L10.064 16.3917C10.9131 15.5425 11.921 14.8689 13.0304 14.4093C14.1338 13.9522 15.316 13.7157 16.5102 13.7132Z"
						fill="white"
					/>
					<path
						className={`pointer-events-none`}
						fillRule="evenodd"
						clipRule="evenodd"
						d="M21.2099 14.4482L29.5525 22.7908C30.4999 21.6554 30.9883 20.2067 30.9217 18.7295C30.8552 17.2523 30.2385 15.8534 29.1929 14.8078C28.1473 13.7622 26.7484 13.1456 25.2712 13.079C23.794 13.0125 22.3453 13.5009 21.2099 14.4482ZM28.7915 23.5518L20.4489 15.2092C19.5016 16.3446 19.0132 17.7933 19.0797 19.2705C19.1463 20.7477 19.763 22.1466 20.8086 23.1922C21.8542 24.2378 23.253 24.8544 24.7302 24.921C26.2074 24.9875 27.6561 24.4991 28.7915 23.5518ZM20.0505 14.0505C22.7837 11.3165 27.2156 11.3165 29.9495 14.0505C32.6835 16.7837 32.6835 21.2156 29.9495 23.9495C27.2163 26.6835 22.7844 26.6835 20.0505 23.9495C17.3165 21.2163 17.3165 16.7844 20.0505 14.0505Z"
						fill="white"
						stroke="white"
					/>
				</>
			)}
		</svg>
	);
};

export default function Wifi() {
	const [connection, setConnection] = useState(false);
	useEffect(() => {
		const getConnection = async () => {
			if ("onLine" in navigator) {
				setConnection(navigator.onLine);
			}
		};

		const int = setInterval(getConnection, 1000);
		getConnection();
		return () => clearInterval(int);
	}, []);
	return <WifiIcon connection={connection} />;
}

interface WispMenuProps {
	isOpen: boolean;
}

export function WispMenu({ isOpen }: WispMenuProps) {
	const [servers, setServers] = useState<Server[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const menuRef = useRef<HTMLDivElement>(null);
	const [isinDiag, setisinDiag] = useState(false);
	const [isUpdating, setUpdating] = useState(false);

	useEffect(() => {
		const fetchServers = async (): Promise<void> => {
			const exists = await fileExists("//apps/system/settings.tapp/wisp-servers.json");
			if (!exists) {
				await window.tb.fs.promises.mkdir("//apps/system/settings.tapp/", { recursive: true } as any);
				const stockDat: Server[] = [
					{ id: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`, name: "Backend" },
					{ id: "wss://wisp.terbiumon.top/wisp/", name: "TB Wisp Instance" },
				];
				await window.tb.fs.promises.writeFile("//apps/system/settings.tapp/wisp-servers.json", JSON.stringify(stockDat));
			}
			const data: Server[] = JSON.parse(await window.tb.fs.promises.readFile("//apps/system/settings.tapp/wisp-servers.json"));
			const settings = JSON.parse(await window.tb.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`));
			const servers = await Promise.all(
				data.map(async server => {
					const res = await ping(server.id);
					return {
						...server,
						latency: res.latency === "N/A" ? res.latency : `${res.latency}ms`,
						connected: server.id === settings["wispServer"] ? true : false,
						isOnline: res.latency !== "N/A",
					};
				}),
			);
			setServers(servers);
			setLoading(false);
		};
		if (isUpdating) fetchServers();
		window.addEventListener("update-wispsrvs", fetchServers);
		return () => window.removeEventListener("update-wispsrvs", fetchServers);
	}, [isUpdating, isOpen]);
	useEffect(() => {
		setUpdating(true);
	});
	useEffect(() => {
		const leave = (e: MouseEvent) => {
			const withinRadius = (e: MouseEvent) => {
				if (!menuRef.current) return false;
				const rect = menuRef.current.getBoundingClientRect();
				const xBound = e.clientX >= rect.left - 5 && e.clientX <= rect.right + 5;
				const yBound = e.clientY >= rect.top - 5 && e.clientY <= rect.bottom + 5;
				return xBound && yBound;
			};
			if (e.button === 0) {
				if (!menuRef.current?.contains(e.target as Node) && !withinRadius(e)) {
					setTimeout(() => {
						if (!isinDiag) {
							window.dispatchEvent(new Event("open-net"));
							setisinDiag(false);
							document.removeEventListener("mousedown", leave);
						}
					}, 150);
				}
			}
		};
		if (!isOpen) {
			document.removeEventListener("mousedown", leave);
		} else {
			document.addEventListener("mousedown", leave);
		}
		return () => document.removeEventListener("mousedown", leave);
	}, [isOpen, isinDiag]);
	return (
		<div
			className={`
            absolute z-100 top-[60px] right-1.5
            flex flex-col p-2 gap-2
            rounded-xl bg-[#2020208c] backdrop-blur-[8px] shadow-tb-border-shadow
            ${isOpen ? "duration-150" : "opacity-0 pointer-events-none -translate-y-6 duration-200"}
        `}
			id="wisp-selector"
			ref={menuRef}
		>
			<div
				className={`
                flex flex-col duration-700 gap-2
                ${isOpen ? "" : "opacity-0 -translate-y-2"}
            `}
			>
				<div
					className={`
                    flex flex-col gap-1 ${servers.length === 0 ? "justify-center items-center" : ""}
                `}
					key={servers.length.toString()}
				>
					{loading ? (
						<p>Loading...</p>
					) : // check if there are any servers
					servers.length === 0 ? (
						<span className="font-medium text-lg text-[#ffffffc8]">No servers found</span>
					) : (
						servers.map(server => (
							<div key={server.id}>
								{server.isOnline ? (
									<div
										key={server.id}
										className={`
                                                flex gap-6 items-center justify-between
                                                p-2 rounded-lg
                                                ${server.connected ? "bg-[#4acd609c] text-[#ffffffd1]" : "bg-[#ffffff18] cursor-pointer hover:bg-[#ffffff38]"}
                                                duration-150
                                            `}
										onClick={async () => {
											let settings = await window.tb.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8");
											let settdata = JSON.parse(settings);
											settdata.wispServer = server.id;
											window.tb.proxy.updateSWs();
											const updSet = JSON.stringify(settdata, null, 2);
											await window.tb.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, updSet);
											setServers(prevServers =>
												prevServers.map(server => ({
													...server,
													connected: server.name === server.id,
												})),
											);
											window.dispatchEvent(new Event("update-wispsrvs"));
											setUpdating(true);
										}}
									>
										<div className="flex gap-3 items-center pointer-events-none">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className={`
                                                        size-8
                                                    `}
											>
												<path
													fillRule="evenodd"
													d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.062 0 8.25 8.25 0 0 0-11.667 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.204 3.182a6 6 0 0 1 8.486 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0 3.75 3.75 0 0 0-5.304 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182a1.5 1.5 0 0 1 2.122 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0l-.53-.53a.75.75 0 0 1 0-1.06Z"
													clipRule="evenodd"
												/>
											</svg>
											<div className="flex flex-col">
												<h3 className="font-bold leading-tight">{server.name}</h3>
												<p className="font-medium text-xs leading-tight">{server.id}</p>
											</div>
										</div>
										<p className="text-sm p-2 bg-[#ffffff38] rounded-lg leading-none text-[#ffffffce] font-extrabold pointer-events-none">{server.latency}</p>
									</div>
								) : null}
							</div>
						))
					)}
				</div>
				<div className="flex gap-2 w-full justify-center items-center">
					<button
						className="p-3 px-4 rounded-md bg-[#ffffff18] shadow-tb-border-shadow leading-none font-medium hover:bg-[#ffffff28] duration-150 cursor-pointer"
						onClick={() => {
							setisinDiag(true);
							window.tb.dialog.Message({
								title: "Enter a name for the Wisp server",
								onOk: async (name: string) => {
									sessionStorage.setItem("wispSrv", name);
									(window as any).tb.dialog.Message({
										title: "Enter the socket URL for the Wisp server",
										onOk: async (url: string) => {
											const newServer: Server = { id: url, name };
											let data: Server[] = JSON.parse(await window.tb.fs.promises.readFile("//apps/system/settings.tapp/wisp-servers.json"));
											data.push(newServer);
											await window.tb.fs.promises.writeFile("//apps/system/settings.tapp/wisp-servers.json", JSON.stringify(data));
											window.dispatchEvent(new Event("update-wispsrvs"));
											setisinDiag(false);
											setLoading(true);
										},
									});
								},
							});
						}}
					>
						Add Network
					</button>
				</div>
			</div>
		</div>
	);
}

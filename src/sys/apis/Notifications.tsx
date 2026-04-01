import { NotificationProps } from "../types";
import { useState, useEffect } from "react";
import "../gui/styles/notification.css";

export let setNotifFn: (type: "message" | "toast" | "installing", props: NotificationProps) => number;
export let dismissNotifFn: (id: number) => void;
let notificationId = 0;
let notificationCount = 0;

export default function NotificationContainer() {
	const [notifications, setNotifications] = useState<{ id: number; type: "message" | "toast" | "installing"; props: NotificationProps }[]>([]);
	const remove = (id: number) => {
		setNotifications(prev => prev.filter(notif => notif.id !== id));
	};
	const setNotif = (type: "message" | "toast" | "installing", props: NotificationProps) => {
		const id = notificationId++;
		const newNotification = { id, type, props };
		setNotifications(prev => [...prev, newNotification]);
		return id;
	};
	/**
	 * @returns Components for COM
	 * @author XSTARS
	 */
	useEffect(() => {
		setNotifFn = setNotif;
		dismissNotifFn = remove;
	}, []);
	return (
		<div className="absolute grid grid-cols-1 h-max max-h-[calc(100%-calc(60px+1.5rem))] w-[380px] top-[60px] right-1.5 z-9999 gap-2">
			{notifications.map(({ id, type, props }) => {
				if (type === "message") {
					return <Message key={id} {...props} remove={() => remove(id)} />;
				} else if (type === "toast") {
					return <Toast key={id} {...props} remove={() => remove(id)} />;
				} else if (type === "installing") {
					return <Installing key={id} {...props} remove={() => remove(id)} />;
				}
			})}
		</div>
	);
}

export function Message({ iconSrc, application, message, txt, onOk, onCancel, time, remove }: NotificationProps & { remove: () => void }) {
	if (!message) throw new Error("message is required");
	const [inputValue, setInputValue] = useState(txt || "");
	const [elapsedTime, setElapsedTime] = useState<string>("Now");
	useEffect(() => {
		const startTime = Date.now();
		const int = setInterval(() => {
			const elapsed = Math.floor((Date.now() - startTime) / 60000);
			if (elapsed > 0) {
				setElapsedTime(`${elapsed}min ago`);
			} else if (elapsed > 60) {
				setElapsedTime(`${Math.floor(elapsed / 60)}h ago`);
			} else if (elapsed > 1440) {
				setElapsedTime(`${Math.floor(elapsed / 1440)}d ago`);
			} else if (elapsed > 10080) {
				setElapsedTime(`${Math.floor(elapsed / 10080)}w ago`);
			}
		}, 60000);
		const tID = setTimeout(() => {
			Cancel();
		}, time || 10000);
		return () => {
			clearInterval(int);
			clearTimeout(tID);
		};
	}, [time]);
	const OK = () => {
		setTimeout(() => {
			remove();
			if (onOk) onOk(inputValue);
		}, 200);
	};
	const Cancel = () => {
		setTimeout(() => {
			remove();
			notificationCount += 1;
			window.dispatchEvent(
				new CustomEvent("notification-count", {
					detail: { count: notificationCount },
				}),
			);
			SaveNotification({ iconSrc, application, message, onOk });
			if (onCancel) onCancel();
		}, 200);
	};
	const onDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			OK();
		}
	};
	return (
		<div className={`flex flex-col shadow-tb-border-shadow bg-[#00000088] rounded-lg backdrop-blur-lg fade-in`}>
			<div className="flex justify-between items-center p-2 bg-[#ffffff20] rounded-t-lg">
				<div className="flex gap-2 items-center">
					<img className="size-6" src={iconSrc || "/assets/img/logo.png"} alt={application} />
					<div>{application || "Unknown App"}</div>
				</div>
				<div className="font-semibold text-[#ffffffa0] text-sm">{elapsedTime}</div>
			</div>
			<div className="flex flex-col gap-2 p-2.5">
				<div className="text-lg font-semibold">{message}</div>
				<input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={onDown} className="w-full p-2 rounded-md leading-none text-lg bg-[#ffffff20] shadow-tb-border-shadow cursor-[var(--cursor-text)] focus-within:outline-hidden" />
				<div className="flex gap-2 justify-between">
					<button className="leading-none p-2.5 px-4 bg-[#ffffff20] shadow-tb-border rounded-md hover:bg-[#ffffff30] duration-150 cursor-pointer" onClick={Cancel}>
						Cancel
					</button>
					<button className="leading-none p-2.5 px-4 bg-[#53f67463] shadow-tb-border rounded-md hover:bg-[#53f67473] duration-150 cursor-pointer" onClick={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Toast({ iconSrc, application, message, time, onOk, onCancel, remove }: NotificationProps & { remove: () => void }) {
	const [elapsedTime, setElapsedTime] = useState<string>("Now");
	useEffect(() => {
		const startTime = Date.now();
		const int = setInterval(() => {
			const elapsed = Math.floor((Date.now() - startTime) / 60000);
			if (elapsed > 0) {
				setElapsedTime(`${elapsed}min ago`);
			} else if (elapsed > 60) {
				setElapsedTime(`${Math.floor(elapsed / 60)}h ago`);
			} else if (elapsed > 1440) {
				setElapsedTime(`${Math.floor(elapsed / 1440)}d ago`);
			} else if (elapsed > 10080) {
				setElapsedTime(`${Math.floor(elapsed / 10080)}w ago`);
			}
		}, 60000);
		const tID = setTimeout(() => {
			Cancel();
		}, time || 10000);
		return () => {
			clearInterval(int);
			clearTimeout(tID);
		};
	}, [time]);
	const Cancel = () => {
		setTimeout(() => {
			remove();
			notificationCount += 1;
			window.dispatchEvent(
				new CustomEvent("notification-count", {
					detail: { count: notificationCount },
				}),
			);
			SaveNotification({ iconSrc, application, message, onOk });
			if (onCancel) onCancel();
		}, 200);
	};
	const OK = () => {
		setTimeout(() => {
			remove();
			if (onOk) onOk();
		}, 200);
	};
	return (
		<div className={`flex flex-col shadow-tb-border-shadow bg-[#00000088] rounded-lg backdrop-blur-lg fade-in`}>
			<div className="flex justify-between items-center p-2 bg-[#ffffff20] rounded-t-lg">
				<div className="flex gap-2 items-center">
					<img className="size-6" src={iconSrc || "/assets/img/logo.png"} alt={application} />
					<div>{application || "Unkown App"}</div>
				</div>
				<div className="font-semibold text-[#ffffffa0] text-sm">{elapsedTime}</div>
			</div>
			<div className="flex flex-col gap-2 p-2.5">
				<div className="text-lg font-semibold">{message}</div>
				<div className="flex gap-2 justify-between">
					<button className="leading-none p-2.5 px-4 bg-[#ffffff20] shadow-tb-border rounded-md hover:bg-[#ffffff30] duration-150 cursor-pointer" onClick={Cancel}>
						Cancel
					</button>
					<button className="leading-none p-2.5 px-4 bg-[#53f67463] shadow-tb-border rounded-md hover:bg-[#53f67473] duration-150 cursor-pointer" onClick={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Installing({ iconSrc, application, message, time, onOk, remove }: NotificationProps & { remove: () => void }) {
	const [currentAnimation, setCurrentAnimation] = useState<number>(0);

	useEffect(() => {
		if (typeof time !== "number" || time <= 0) return;
		const tID = setTimeout(() => {
			OK();
		}, time);
		return () => {
			clearTimeout(tID);
		};
	}, [time]);

	const anim0 = `anim0 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`;
	const anim1 = `anim1 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite`;

	useEffect(() => {
		const int = setInterval(() => {
			setCurrentAnimation(prev => (prev === 0 ? 1 : 0));
		}, 2100);
		return () => clearInterval(int);
	}, []);

	const OK = () => {
		setTimeout(() => {
			remove();
			if (onOk) onOk();
		}, 200);
	};
	return (
		<div className={`flex flex-col shadow-tb-border-shadow bg-[#00000088] rounded-lg backdrop-blur-lg fade-in`}>
			<div className="flex items-center gap-2 p-2 bg-[#ffffff20] rounded-t-lg">
				<img src={iconSrc || "/assets/img/logo.png"} alt="Icon" style={{ width: "25px", height: "25px" }} />
				<div className="notification-application">{application || "com.tb.genericapp"}</div>
			</div>
			<div className="flex flex-col gap-2 p-2.5">
				<div className="text-lg font-semibold">{message}</div>
				<div className="relative flex w-full h-3 rounded-full bg-[#00000020] overflow-hidden">
					{currentAnimation === 0 ? <div className="absolute h-full bg-[#50bf66] rounded-full" style={{ animation: anim0 }}></div> : <div className="absolute h-full bg-[#50bf66] rounded-full" style={{ animation: anim1 }}></div>}
				</div>
				<div className="flex gap-2 justify-between">
					<button className="leading-none p-2.5 px-4 bg-[#53f67463] shadow-tb-border rounded-md hover:bg-[#53f67473] duration-150 cursor-pointer" style={{ position: "sticky", left: "100%" }} onClick={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export async function SaveNotification({ iconSrc, application, message, onOk }: NotificationProps) {
	const notifications = JSON.parse(sessionStorage.getItem("notifications") || "[]");
	if (onOk) {
		const notificationObject = {
			message: message,
			icon: iconSrc || "/assets/img/logo.png",
			application: application || "com.tb.genericapp",
			time: new Date().toISOString(),
			onOk: {
				code: await onOk.toString(),
			},
		};
		console.log(notificationObject);
		notifications.push(notificationObject);
		sessionStorage.setItem("notifications", JSON.stringify(notifications));
		window.dispatchEvent(new CustomEvent("notification-update"));
	} else {
		const notificationObject = {
			message: message,
			icon: iconSrc || "/assets/img/logo.png",
			application: application || "com.tb.genericapp",
			time: new Date().toISOString(),
		};
		notifications.push(notificationObject);
		sessionStorage.setItem("notifications", JSON.stringify(notifications));
		window.dispatchEvent(new CustomEvent("notification-update"));
	}
}

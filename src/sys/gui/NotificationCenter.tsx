import { useRef, useState, useEffect } from "react";
import "./styles/notification.css";

interface Notification {
	message: string;
	application: string;
	icon: string;
	onOk?: { code: string };
	time?: string;
}

export let totalNotifs: number;

export default function NotificationCenter() {
	const [notificationCount, setNotificationCount] = useState(() => {
		const savedCount = JSON.parse(sessionStorage.getItem("notifications") || "[]").length;
		return savedCount ? parseInt(savedCount) : 0;
	});
	const iconRef = useRef<HTMLImageElement>(null);
	const updateIcon = () => {
		if (iconRef.current) {
			iconRef.current.src = `/assets/img/notif_${notificationCount <= 9 ? notificationCount : "plus"}.svg`;
		}
	};

	useEffect(() => {
		const updateCount = (event: CustomEvent) => {
			setNotificationCount(event.detail.count);
		};
		window.addEventListener("notification-count", updateCount as EventListener);
		updateIcon();
		return () => {
			window.removeEventListener("notification-count", updateCount as EventListener);
		};
	}, [notificationCount]);
	useEffect(() => {
		totalNotifs = notificationCount;
	});
	return (
		<img
			alt="notifimg"
			ref={iconRef}
			src={`/assets/img/notif_${notificationCount > 9 ? "plus" : Math.max(0, Math.min(notificationCount, 9))}.svg`}
			className="tooltip_item w-6 h-6 cursor-pointer duration-150 select-none"
			onMouseUp={() => {
				iconRef.current?.classList.remove("scale-90");
				window.dispatchEvent(new Event("open-notif"));
			}}
			onMouseLeave={() => {
				iconRef.current?.classList.remove("scale-90");
			}}
			onMouseOver={() => {
				iconRef.current?.classList.add("scale-90");
			}}
			onMouseDown={() => {
				iconRef.current?.classList.add("scale-90");
			}}
		></img>
	);
}

interface INotificationProps {
	isOpen: boolean;
}

const NotificationMenu = ({ isOpen }: INotificationProps) => {
	const [notifications, setNotifications] = useState<Notification[]>(() => {
		const savedNotifs = sessionStorage.getItem("notifications");
		return savedNotifs ? JSON.parse(savedNotifs) : [];
	});

	const updateNotifications = () => {
		const notifs = JSON.parse(sessionStorage.getItem("notifications") || "[]");
		setNotifications(notifs);
	};

	window.addEventListener("notification-update", updateNotifications as EventListener);

	useEffect(() => {
		const leave = (e: MouseEvent) => {
			const withinRadius = (e: MouseEvent) => {
				if (!notificationCenterRef.current) return false;
				const rect = notificationCenterRef.current.getBoundingClientRect();
				const xBound = e.clientX >= rect.left - 5 && e.clientX <= rect.right + 5;
				const yBound = e.clientY >= rect.top - 5 && e.clientY <= rect.bottom + 5;
				return xBound && yBound;
			};
			if (e.button === 0) {
				if (!notificationCenterRef.current?.contains(e.target as Node) && !withinRadius(e)) {
					setTimeout(() => {
						window.dispatchEvent(new Event("open-notif"));
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
	}, [isOpen]);

	const notificationCenterRef = useRef<HTMLDivElement>(null);
	const dismiss = (index: number) => {
		const notifData = notifications.filter((_, i) => i !== index);
		setNotifications(notifData);
		if (totalNotifs > 0)
			window.dispatchEvent(
				new CustomEvent("notification-count", {
					detail: { count: (totalNotifs -= 1) },
				}),
			);
		sessionStorage.setItem("notifications", JSON.stringify(notifData));
	};

	return (
		<div
			ref={notificationCenterRef}
			className={`
            absolute top-15 right-1.5
            flex flex-col
            w-100 h-max max-h-[calc(100%-calc(60px+1.5rem))] rounded-xl p-2.5 gap-2.5
            bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-[100px] text-white z-999 overflow-y-auto
            ${isOpen ? "duration-200" : "opacity-0 pointer-events-none -translate-y-6 duration-300"}
        `}
		>
			<h1 className="text-2xl font-bold text-[#ffffffe6]">Notifications</h1>
			{notifications.length > 0 ? (
				<div
					className={`
                    flex flex-col gap-2.5
                    duration-700
                    ${isOpen ? "" : "opacity-0 -translate-y-2"}
                `}
				>
					{notifications.map((notification, index) => {
						var time = "Now";
						const currentTime = new Date().getTime();
						const timeDiff = notification.time ? currentTime - new Date(notification.time).getTime() : 0;
						if (timeDiff < 60000) {
							time = "Just now";
						} else if (timeDiff < 3600000) {
							time = `${Math.floor(timeDiff / 60000)}min ago`;
						} else if (timeDiff < 86400000) {
							time = `${Math.floor(timeDiff / 3600000)}h ago`;
						} else if (timeDiff < 604800000) {
							time = `${Math.floor(timeDiff / 86400000)}d ago`;
						} else {
							time = `${Math.floor(timeDiff / 604800000)}w ago`;
						}

						return (
							<div key={index} className="flex flex-col bg-[#ffffff18] shadow-tb-border-shadow rounded-lg overflow-hidden">
								<div className="flex justify-between items-center bg-[#ffffff20] p-2.5">
									<div className="flex gap-2 items-center">
										<img src={notification.icon} alt="Icon" style={{ width: "25px", height: "25px" }} />
										<div className="notification-application">{notification.application}</div>
									</div>
									{notification.time ? <div className="font-semibold text-[#ffffffa0] text-sm">{time}</div> : null}
								</div>
								<div className="flex flex-col gap-2 p-2.5">
									<div className="text-lg font-semibold">{notification.message}</div>
									<div className="flex gap-2 justify-between">
										<button className="leading-none p-2.5 cursor-pointer px-4 bg-[#ffffff20] shadow-tb-border rounded-md hover:bg-[#ffffff30] duration-150" onClick={() => dismiss(index)}>
											Dismiss
										</button>
										<button
											className="leading-none p-2.5 cursor-pointer px-4 bg-[#53f67463] shadow-tb-border rounded-md hover:bg-[#53f67473] duration-150"
											onClick={async () => {
												if (notification.onOk) {
													try {
														const onOk = new Function(`return ${notification.onOk.code}`)();
														await onOk();
													} catch (error) {
														console.error(error);
													}
												}
												dismiss(index);
											}}
										>
											Open
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div
					className={`
                    justify-center items-center flex h-full font-[700] text-[20px] duration-700
                    ${isOpen ? "" : "opacity-0 -translate-y-2"}
                `}
				>
					<div>No Notifications yet.</div>
				</div>
			)}
		</div>
	);
};

export { NotificationMenu };

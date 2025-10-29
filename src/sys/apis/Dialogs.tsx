import { dialogProps } from "../types";
import { useState, useEffect, useRef } from "react";
import "../gui/styles/dialog.css";
import "../gui/styles/cropper.css";
import Cropper from "cropperjs";
import Compressor from "compressorjs";

export type dialogType = "alert" | "message" | "select" | "auth" | "permissions" | "filebrowser" | "directorybrowser" | "savefile" | "cropper" | "webauth";

export let setDialogFn: (type: dialogType, props: dialogProps, options?: { sudo: boolean }) => void;
export let removeFn: () => void;

export default function DialogContainer() {
	const [dialogType, setdialogType] = useState<dialogType | null>(null);
	const [dialogProps, setdialogProps] = useState<dialogProps | {}>({});
	const [sudo, setSudo] = useState<boolean | null>(null);
	const remove = () => {
		setdialogType(null);
		setdialogProps({});
	};
	const setDialog = (type: dialogType, props: dialogProps, options?: { sudo: boolean }) => {
		setdialogType(type);
		setdialogProps(props);
		setSudo(options?.sudo || null);
	};
	/**
	 * @returns Components for COM
	 * @author XSTARS
	 */
	useEffect(() => {
		setDialogFn = setDialog;
		removeFn = remove;
	}, []);
	return (
		<>
			{dialogType === "alert" && <Alert {...(dialogProps as dialogProps)} />}
			{dialogType === "message" && <Message {...(dialogProps as dialogProps)} />}
			{dialogType === "select" && <Select {...(dialogProps as dialogProps)} />}
			{dialogType === "auth" && <Auth {...(dialogProps as dialogProps)} />}
			{dialogType === "permissions" && <Permissions {...(dialogProps as dialogProps)} />}
			{dialogType === "filebrowser" && <FileBrowser {...(dialogProps as dialogProps)} />}
			{dialogType === "directorybrowser" && <DirectoryBrowser {...(dialogProps as dialogProps)} />}
			{dialogType === "savefile" && <SaveFile {...(dialogProps as dialogProps)} />}
			{dialogType === "cropper" && <Crop {...(dialogProps as dialogProps)} />}
			{dialogType === "webauth" && <WebAuth {...(dialogProps as dialogProps)} />}
		</>
	);
}

const formatSize = (size: number) => {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
	if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
	return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export function Alert({ title, message, onOk }: dialogProps) {
	const container = useRef<HTMLDivElement>(null);
	const dialog = useRef<HTMLDivElement>(null);
	const [msg, setMsg] = useState<string | null>(null);
	const OK = () => {
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				container.current?.remove();
				if (onOk) onOk();
			}, 200);
		}
		removeFn();
	};
	useEffect(() => {
		document.addEventListener("mousedown", e => {
			if (container.current && e.target !== dialog.current && e.target === container.current) {
				if (onOk) onOk();
			}
		});
	});
	useEffect(() => {
		// @ts-expect-error
		if (message instanceof Error) {
			setMsg(message.message);
		} else if (typeof message === "object" && message !== null) {
			try {
				setMsg(JSON.stringify(message));
			} catch {
				setMsg(String(message));
			}
		} else {
			setMsg(String(message));
		}
	}, [message]);

	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				<div className="dialog-message">{msg}</div>
				<div className="flex justify-end">
					<button className="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Message({ title, defaultValue, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	const container = useRef<HTMLDivElement | null>(null);
	const dialog = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const OK = () => {
		const inpVAl = inputRef.current?.value;
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				container.current?.remove();
				if (onOk && inpVAl !== undefined) {
					onOk(inpVAl);
				}
			}, 200);
			removeFn();
		}
	};
	const Cancel = () => {
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				container.current?.remove();
				if (onCancel) {
					onCancel();
				}
			}, 200);
			removeFn();
		}
	};
	const onDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			OK();
		}
	};
	useEffect(() => {
		document.addEventListener("mousedown", e => {
			if (container.current && e.target !== dialog.current && e.target === container.current) {
				Cancel();
			}
		});
	});
	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				<input type="text" defaultValue={defaultValue} className="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150" style={{ width: "100%" }} ref={inputRef} onKeyDown={onDown} />
				<div className="flex justify-between">
					<button className="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<button className="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Select({ title, options, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	const container = useRef<HTMLDivElement | null>(null);
	const dialog = useRef<HTMLDivElement | null>(null);
	const OK = (value: string) => {
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				container.current?.remove();
				if (onOk) {
					onOk(value);
				}
			}, 200);
			removeFn();
		}
	};
	const Cancel = () => {
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				container.current?.remove();
				if (onCancel) {
					onCancel();
				}
			}, 200);
			removeFn();
		}
	};
	useEffect(() => {
		document.addEventListener("mousedown", e => {
			if (container.current && e.target !== dialog.current && e.target === container.current) {
				Cancel();
			}
		});
	});
	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				<div className="grid grid-cols-4 gap-2">
					{options &&
						options.map((option: { text: string; value: string }) => (
							<button key={option.value} className="py-1.5 px-2.5 rounded-md bg-[#ffffff10] hover:bg-[#ffffff28] shadow-tb-border-shadow duration-150 cursor-pointer" onMouseDown={() => OK(option.value)}>
								{option.text}
							</button>
						))}
				</div>
			</div>
		</div>
	);
}

export function Auth({ title, defaultUsername, onOk, onCancel, sudo }: dialogProps) {
	if (!title) throw new Error("title is required");
	const container = useRef<HTMLDivElement | null>(null);
	const dialog = useRef<HTMLDivElement | null>(null);
	const usernameRef = useRef<HTMLInputElement | null>(null);
	const passwordRef = useRef<HTMLInputElement | null>(null);
	const [sudoList, setSudoList] = useState<string[]>([]);
	const OK = () => {
		const username = usernameRef.current?.value;
		const password = passwordRef.current?.value;
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				if (container.current) {
					removeFn();
				}
				if (onOk && username && password) {
					onOk(username, password);
				}
			}, 200);
		}
	};
	const Cancel = () => {
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				if (container.current) {
					removeFn();
				}
				if (onCancel) {
					onCancel();
				}
			}, 200);
		}
	};
	const onDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			OK();
		}
	};
	useEffect(() => {
		document.addEventListener("mousedown", e => {
			if (container.current && e.target !== dialog.current && e.target === container.current) {
				Cancel();
			}
		});
	});
	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				<input
					type="text"
					disabled={true}
					defaultValue={sudo ? "sudo" : defaultUsername}
					placeholder="Username"
					className={`
                        ${sudo ? `p-2 pl-4 rounded-lg bg-[#ffffff08] outline-hidden shadow-tb-border-shadow` : `p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow`}
                    `}
					style={{ width: "100%" }}
					ref={usernameRef}
				/>
				<input type="password" placeholder="Password" className="p-2 pl-4 rounded-lg bg-[#ffffff20] cursor-text outline-hidden shadow-tb-border-shadow duration-150" style={{ width: "100%" }} ref={passwordRef} onKeyDown={onDown} />
				<div className="flex justify-between">
					<button className="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<button className="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Permissions({ title, message, onOk, onCancel }: dialogProps) {
	if (!message) throw new Error("message is required");
	const container = useRef<HTMLDivElement | null>(null);
	const dialog = useRef<HTMLDivElement | null>(null);
	const OK = () => {
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				container.current?.remove();
				if (onOk) {
					onOk();
				}
			}, 200);
			removeFn();
		}
	};
	const Cancel = () => {
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				container.current?.remove();
				if (onCancel) {
					onCancel();
				}
			}, 200);
			removeFn();
		}
	};
	useEffect(() => {
		document.addEventListener("mousedown", e => {
			if (container.current && e.target !== dialog.current && e.target === container.current) {
				Cancel();
			}
		});
	});
	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				<div className="dialog-message">{message}</div>
				<div className="flex justify-between">
					<button className="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<div className="dialog-action-buttons">
						<button className="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
							OK
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function FileBrowser({ title, filter, local, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
	const [currentDirectory, setCurrentDirectory] = useState<string>("storage devices");
	const [fileEntries, setFileEntries] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [showBackButton, setShowBackButton] = useState<boolean>(false);
	const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);
	const anura = window.parent.anura;
	useEffect(() => {
		const openDirectory = async (directory: string) => {
			setLoading(true);
			try {
				if (directory.startsWith("/mnt/")) {
					const serverName = directory.split("/")[2];
					const server = window.tb.vfs.servers.get(serverName);
					if (server && server.connected && server.connection?.client) {
						const client = server.connection.client;
						const path = directory.replace(`/mnt/${serverName}`, "") || "/";
						const entries = await client.getDirectoryContents(path);
						const entriesInfo = entries.map((entry: any) => ({
							entry: entry.basename,
							isDirectory: entry.type === "directory",
							type: "external",
							connected: true,
						}));
						setFileEntries(
							entriesInfo.filter((info: any) => {
								if (!filter || info.isDirectory || (filter !== "*.*" && info.entry.endsWith(filter))) {
									return true;
								}
								return false;
							}),
						);
						setShowBackButton(true);
						setLoading(false);
						return;
					}
				}
				const entries = await anura.fs.promises.readdir(directory);
				const entriesInfo = await Promise.all(
					entries.map(async entry => {
						const fileInfo = await anura.fs.promises.stat(`${directory}/${entry}`);
						const isDirectory = fileInfo.isDirectory();
						const type = "internal";
						if (!filter || isDirectory || (filter !== "*.*" && entry.endsWith(filter))) {
							return { entry, isDirectory, type };
						}
						return null;
					}),
				);
				setFileEntries(entriesInfo.filter(Boolean));
				setShowBackButton(true);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		if (currentDirectory === "storage devices") {
			navigator.storage.estimate().then(({ usage, quota }) => {
				setStorageInfo({ usage: usage as number, quota: quota as number });
			});
			setLoading(false);
			const entries = local
				? [
						{
							entry: "File System",
							type: "internal",
						},
					]
				: [
						{
							entry: "File System",
							type: "internal",
						},
						...Array.from(window.tb.vfs.servers.values()).map(server => ({
							entry: server.name,
							type: "external",
							connected: server.connected,
						})),
					];
			setFileEntries(entries);
			setShowBackButton(false);
		} else {
			openDirectory(currentDirectory);
		}
	}, [currentDirectory, filter, anura]);

	const entClick = (entry: string, isDirectory: boolean, type: string) => {
		if (currentDirectory === "storage devices") {
			if (type === "internal") {
				setCurrentDirectory("//");
			} else {
				window.tb.vfs.setServer(entry);
				setCurrentDirectory(`/mnt/${entry}`);
			}
		} else if (isDirectory) {
			setCurrentDirectory(`${currentDirectory}/${entry}`);
		} else {
			setSelectedEntry(`${currentDirectory}/${entry}`);
			const files = document.querySelectorAll(".file-item");
			files.forEach(file => {
				if (file.getAttribute("data-entry") !== `${entry}`) {
					file.classList.remove("bg-[#ffffff18]");
				}
			});
		}
	};
	const OK = () => {
		setTimeout(() => {
			removeFn();
			if (onOk) {
				onOk(selectedEntry);
			}
		}, 300);
	};
	const Cancel = () => {
		return new Promise(reject => {
			setTimeout(() => {
				reject("Canceled");
				removeFn();
				if (onCancel) {
					onCancel();
				}
			}, 300);
		});
	};
	const setPath = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			const value = (e.target as HTMLInputElement).value;
			if (value === "storage devices") {
				setCurrentDirectory("storage devices");
			} else {
				setCurrentDirectory(value);
			}
		}
	};

	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150">
			<div className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				{loading ? (
					<div className="font-medium text-lg">Loading...</div>
				) : (
					<div
						className={`
						overflow-y-auto min-h-[100px] max-h-[300px]
						${fileEntries.length === 0 ? " flex justify-center items-center" : "bg-[#ffffff10] shadow-tb-border-shadow rounded-lg"}
					`}
					>
						{fileEntries.length === 0 ? (
							<div className="font-extrabold text-xl select-none">No files found</div>
						) : (
							fileEntries.map(({ entry, isDirectory, type, connected }) => (
								<div
									key={entry}
									data-entry={entry}
									className="file-item flex flex-col gap-1 select-none p-1.5 first:rounded-t-lg last:rounded-b-lg duration-150"
									onMouseDown={e => {
										entClick(entry, isDirectory, type);
										const files = document.querySelectorAll(".file-item");
										files.forEach(file => {
											file.classList.remove("bg-[#ffffff18]");
										});
										e.currentTarget.classList.add("bg-[#ffffff18]");
									}}
								>
									<div className="flex gap-2 items-center">
										{currentDirectory === "storage devices" ? (
											type === "external" ? (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
													<path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z" />
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"
													/>
													<circle cx="18" cy="17.25" r="3" fill={connected ? "#5DD881" : "#FF4D4D"} />
												</svg>
											) : (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
													<path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z" />
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"
													/>
												</svg>
											)
										) : isDirectory ? (
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
												<path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
											</svg>
										) : (
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
												<path
													fillRule="evenodd"
													d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
													clipRule="evenodd"
												/>
												<path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
											</svg>
										)}
										<div className="font-semibold text-lg">{entry}</div>
										{currentDirectory === "storage devices" && entry === "File System" && storageInfo ? (
											<div className="text-xs text-[#ffffff88] ml-auto">
												{(() => {
													return `${formatSize(storageInfo.usage)} of ${formatSize(storageInfo.quota)}`;
												})()}
											</div>
										) : type === "external" && currentDirectory === "storage devices" ? (
											<div className="text-xs text-[#ffffff88] ml-auto">WebDav Device</div>
										) : null}
									</div>
								</div>
							))
						)}
					</div>
				)}
				<div className="flex justify-between items-center">
					<button className="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					{showBackButton && (
						<button
							className="dialog-button goBack-button cursor-pointer"
							onMouseDown={() => {
								if (currentDirectory === "//" || (currentDirectory.startsWith("/mnt/") && currentDirectory.split("/").length <= 3)) {
									setCurrentDirectory("storage devices");
								} else {
									const parts = currentDirectory.split("/");
									parts.pop();
									const inp = parts.join("/") || "storage devices";
									setCurrentDirectory(inp);
								}
							}}
						>
							Go Back
						</button>
					)}
					<input type="text" className="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150 mt-2" value={currentDirectory} placeholder="Path" onKeyDown={setPath} onChange={e => setCurrentDirectory(e.target.value)} />
					<button
						className={`${selectedEntry ? "flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" : "flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#ffffff10] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#ffffff18] duration-150"}`}
						onMouseDown={OK}
						disabled={!selectedEntry}
					>
						Select
					</button>
				</div>
			</div>
		</div>
	);
}

export function DirectoryBrowser({ title, defualtDir, local, onOk, onCancel }: dialogProps) {
	const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
	const [fileEntries, setFileEntries] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentDirectory, setCurrentDirectory] = useState<string>(defualtDir || "storage devices");
	const [showBackButton, setShowBackButton] = useState<boolean>(false);
	const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);
	const anura = window.parent.anura;
	const openDirectory = async (directory: string) => {
		setLoading(true);
		try {
			if (directory.startsWith("/mnt/")) {
				const serverName = directory.split("/")[2];
				const server = window.tb.vfs.servers.get(serverName);
				if (server && server.connected && server.connection?.client) {
					const client = server.connection.client;
					const path = directory.replace(`/mnt/${serverName}`, "") || "/";
					const entries = await client.getDirectoryContents(path);
					const entriesInfo = entries
						.filter((entry: any) => entry.type === "directory")
						.map((entry: any) => ({
							entry: entry.basename,
							isDirectory: true,
							type: "external",
							connected: true,
						}));
					setFileEntries(entriesInfo);
					setShowBackButton(true);
					setLoading(false);
					return;
				}
			}
			const entries = await anura.fs.promises.readdir(directory);
			const entriesInfo = await Promise.all(
				entries.map(async entry => {
					const fileInfo = await anura.fs.promises.stat(`${directory}/${entry}`);
					return { entry, isDirectory: fileInfo.isDirectory(), type: "internal" };
				}),
			);
			const directories = entriesInfo.filter(info => info.isDirectory);
			setFileEntries(directories);
			setShowBackButton(true);
			if (directory.startsWith("//")) {
				directory = directory.slice(1);
			}
			setCurrentDirectory(directory);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		if (currentDirectory === "storage devices") {
			navigator.storage.estimate().then(({ usage, quota }) => {
				setStorageInfo({ usage: usage as number, quota: quota as number });
			});
			const entries = local
				? [
						{
							entry: "File System",
							type: "internal",
						},
					]
				: [
						{
							entry: "File System",
							type: "internal",
						},
						...Array.from(window.tb.vfs.servers.values()).map(server => ({
							entry: server.name,
							type: "external",
							connected: server.connected,
						})),
					];
			setFileEntries(entries);
			setShowBackButton(false);
			setLoading(false);
		} else {
			openDirectory(currentDirectory);
		}
	}, [currentDirectory]);
	const Select = () => {
		if (selectedEntry) {
			setTimeout(() => {
				removeFn();
				if (onOk) {
					onOk(selectedEntry);
				}
			}, 300);
		}
	};
	const Cancel = () => {
		return new Promise(reject => {
			setTimeout(() => {
				reject("Canceled");
				removeFn();
				if (onCancel) {
					onCancel();
				}
			}, 300);
		});
	};
	const onChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			const value = (e.target as HTMLInputElement).value;
			if (value === "storage devices") {
				setCurrentDirectory("storage devices");
			} else {
				setCurrentDirectory(value);
			}
		}
	};
	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150">
			<div className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				{loading ? (
					<div>Loading...</div>
				) : (
					<div
						className={`
						overflow-y-auto min-h-[100px] max-h-[300px]
						${fileEntries.length === 0 ? " flex justify-center items-center" : "bg-[#ffffff10] shadow-tb-border-shadow rounded-lg"}
					`}
					>
						{fileEntries.length === 0 ? (
							<div className="font-extrabold text-xl select-none">No directories found</div>
						) : (
							fileEntries.map(({ entry, isDirectory, type, connected }) => (
								<div
									key={entry}
									data-entry={entry}
									className="file-item flex flex-col gap-1 select-none p-1.5 first:rounded-t-lg last:rounded-b-lg duration-150"
									onDoubleClick={() => {
										if (currentDirectory === "storage devices") {
											if (type === "internal") {
												setCurrentDirectory("//");
											} else {
												window.tb.vfs.setServer(entry);
												setCurrentDirectory(`/mnt/${entry}`);
											}
										} else {
											if (currentDirectory.endsWith("/")) {
												setCurrentDirectory(`${currentDirectory}${entry}`);
											} else {
												setCurrentDirectory(`${currentDirectory}/${entry}`);
											}
										}
									}}
									onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
										let path;
										if (currentDirectory === "storage devices") {
											if (type === "internal") {
												path = "//";
											} else {
												path = `/mnt/${entry}`;
											}
										} else {
											if (currentDirectory.endsWith("/")) {
												path = `${currentDirectory}${entry}`;
											} else {
												path = `${currentDirectory}/${entry}`;
											}
										}
										setSelectedEntry(path);
										const files = document.querySelectorAll(".file-item");
										files.forEach(file => {
											if (file.getAttribute("data-entry") !== `${entry}`) {
												file.classList.remove("bg-[#ffffff18]");
											}
										});
										e.currentTarget.classList.add("bg-[#ffffff18]");
									}}
								>
									<div className="flex gap-2 items-center">
										{currentDirectory === "storage devices" ? (
											type === "external" ? (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
													<path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z" />
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"
													/>
													<circle cx="18" cy="17.25" r="3" fill={connected ? "#5DD881" : "#FF4D4D"} />
												</svg>
											) : (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
													<path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z" />
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"
													/>
												</svg>
											)
										) : isDirectory ? (
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
												<path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
											</svg>
										) : (
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
												<path
													fillRule="evenodd"
													d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
													clipRule="evenodd"
												/>
												<path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
											</svg>
										)}
										<div className="font-semibold text-lg">{entry}</div>
										{currentDirectory === "storage devices" && entry === "File System" && storageInfo ? (
											<div className="text-xs text-[#ffffff88] ml-auto">
												{(() => {
													return `${formatSize(storageInfo.usage)} of ${formatSize(storageInfo.quota)}`;
												})()}
											</div>
										) : type === "external" && currentDirectory === "storage devices" ? (
											<div className="text-xs text-[#ffffff88] ml-auto">WebDav Device</div>
										) : null}
									</div>
								</div>
							))
						)}
					</div>
				)}
				<div className="flex justify-between items-center">
					<button className="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					{showBackButton && (
						<button
							className="dialog-button goBack-button cursor-pointer"
							onMouseDown={() => {
								if (currentDirectory === "//" || (currentDirectory.startsWith("/mnt/") && currentDirectory.split("/").length <= 3)) {
									setCurrentDirectory("storage devices");
								} else {
									const parts = currentDirectory.split("/");
									parts.pop();
									const inp = parts.join("/") || "storage devices";
									setCurrentDirectory(inp);
								}
							}}
						>
							Go Back
						</button>
					)}
					<input type="text" className="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150" value={currentDirectory} placeholder="Directory" onKeyDown={onChange} onChange={e => setCurrentDirectory(e.target.value)} />
					<button
						className={`
						${
							selectedEntry
								? "flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150"
								: "flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#ffffff10] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#ffffff18] duration-150"
						}
						`}
						onMouseDown={Select}
						disabled={!selectedEntry}
					>
						Select
					</button>
				</div>
			</div>
		</div>
	);
}

export function SaveFile({ title, defualtDir, filename, local, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
	const [fileEntries, setFileEntries] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentDirectory, setCurrentDirectory] = useState<string>(defualtDir || "storage devices");
	const [showBackButton, setShowBackButton] = useState<boolean>(false);
	const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);
	const fileInp = useRef<HTMLInputElement>(null);
	const anura = window.parent.anura;
	const openDirectory = async (directory: string) => {
		setLoading(true);
		try {
			if (directory.startsWith("/mnt/")) {
				const serverName = directory.split("/")[2];
				const server = window.tb.vfs.servers.get(serverName);
				if (server && server.connected && server.connection?.client) {
					const client = server.connection.client;
					const path = directory.replace(`/mnt/${serverName}`, "") || "/";
					const entries = await client.getDirectoryContents(path);
					const entriesInfo = entries
						.filter((entry: any) => entry.type === "directory")
						.map((entry: any) => ({
							entry: entry.basename,
							isDirectory: true,
							type: "external",
							connected: true,
						}));
					setFileEntries(entriesInfo);
					setShowBackButton(true);
					setLoading(false);
					return;
				}
			}
			const entries = await anura.fs.promises.readdir(directory);
			const entriesInfo = await Promise.all(
				entries.map(async entry => {
					const fileInfo = await anura.fs.promises.stat(`${directory}/${entry}`);
					return { entry, isDirectory: fileInfo.isDirectory(), type: "internal" };
				}),
			);
			const directories = entriesInfo.filter(info => info.isDirectory);
			setFileEntries(directories);
			setShowBackButton(true);
			setLoading(false);
		} catch (error) {
			console.error(error);
			setLoading(false);
		}
	};
	useEffect(() => {
		if (currentDirectory === "storage devices") {
			navigator.storage.estimate().then(({ usage, quota }) => {
				setStorageInfo({ usage: usage as number, quota: quota as number });
			});
			const entries = local
				? [
						{
							entry: "File System",
							type: "internal",
						},
					]
				: [
						{
							entry: "File System",
							type: "internal",
						},
						...Array.from(window.tb.vfs.servers.values()).map(server => ({
							entry: server.name,
							type: "external",
							connected: server.connected,
						})),
					];
			setFileEntries(entries);
			setShowBackButton(false);
			setLoading(false);
		} else {
			openDirectory(currentDirectory);
		}
	}, [currentDirectory]);
	const Select = (entry: string, isDirectory: boolean, type: string) => {
		let path;
		if (currentDirectory === "storage devices") {
			if (type === "internal") {
				path = "//";
			} else {
				window.tb.vfs.setServer(entry);
				path = `/mnt/${entry}`;
			}
			setCurrentDirectory(path);
			return;
		}
		if (isDirectory) {
			if (currentDirectory.endsWith("/")) {
				path = `${currentDirectory}${entry}`;
			} else {
				path = `${currentDirectory}/${entry}`;
			}
			setCurrentDirectory(path);
			if (fileInp.current) {
				fileInp.current.value = `${path}/${filename || "file.txt"}`;
			}
		} else {
			if (currentDirectory.endsWith("/")) {
				path = `${currentDirectory}${entry}`;
			} else {
				path = `${currentDirectory}/${entry}`;
			}
			setSelectedEntry(path);
			if (fileInp.current) {
				fileInp.current.value = `${path}`;
			}
		}
	};
	const onSave = () => {
		const fileName = fileInp.current?.value;
		removeFn();
		if (fileName) {
			setTimeout(() => {
				if (onOk) {
					onOk(fileName);
				}
			}, 300);
		}
	};
	const Cancel = () => {
		removeFn();
		if (onCancel) {
			onCancel();
		}
	};
	const onPathChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			const value = (e.target as HTMLInputElement).value;
			if (value === "storage devices") {
				setCurrentDirectory("storage devices");
			} else {
				setCurrentDirectory(value);
			}
		}
	};
	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150">
			<div className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				{loading ? (
					<div>Loading...</div>
				) : (
					<div
						className={`
						overflow-y-auto min-h-[100px] max-h-[300px]
						${fileEntries.length === 0 ? " flex justify-center items-center" : "bg-[#ffffff10] shadow-tb-border-shadow rounded-lg"}
					`}
					>
						{fileEntries.length === 0 ? (
							<div className="font-extrabold text-xl select-none">No directories found</div>
						) : (
							fileEntries.map(({ entry, isDirectory, type, connected }) => (
								<div key={entry} data-entry={entry} className="file-item flex gap-2 items-center select-none p-1.5 first:rounded-t-lg last:rounded-b-lg duration-150" onMouseDown={() => Select(entry, isDirectory, type)}>
									<div className="flex gap-2 items-center">
										{currentDirectory === "storage devices" ? (
											type === "external" ? (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
													<path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z" />
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"
													/>
													<circle cx="18" cy="17.25" r="3" fill={connected ? "#5DD881" : "#FF4D4D"} />
												</svg>
											) : (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
													<path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z" />
													<path
														fillRule="evenodd"
														clipRule="evenodd"
														d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"
													/>
												</svg>
											)
										) : isDirectory ? (
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
												<path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
											</svg>
										) : (
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 pointer-events-none">
												<path
													fillRule="evenodd"
													d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
													clipRule="evenodd"
												/>
												<path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
											</svg>
										)}
										<div className="font-semibold text-lg">{entry}</div>
										{currentDirectory === "storage devices" && entry === "File System" && storageInfo ? (
											<div className="text-xs text-[#ffffff88] ml-auto">
												{(() => {
													return `${formatSize(storageInfo.usage)} of ${formatSize(storageInfo.quota)}`;
												})()}
											</div>
										) : type === "external" && currentDirectory === "storage devices" ? (
											<div className="text-xs text-[#ffffff88] ml-auto">WebDav Device</div>
										) : null}
									</div>
								</div>
							))
						)}
					</div>
				)}
				<div className="flex justify-between items-center">
					<button className="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					{showBackButton && (
						<button
							className="dialog-button goBack-button cursor-pointer"
							onMouseDown={() => {
								if (currentDirectory === "//" || (currentDirectory.startsWith("/mnt/") && currentDirectory.split("/").length <= 3)) {
									setCurrentDirectory("storage devices");
								} else {
									const parts = currentDirectory.split("/");
									parts.pop();
									const inp = parts.join("/") || "storage devices";
									setCurrentDirectory(inp);
								}
							}}
						>
							Go Back
						</button>
					)}
					<input
						ref={fileInp}
						type="text"
						value={selectedEntry || `${currentDirectory}/${filename || "file.txt"}`}
						placeholder="Enter file name"
						className="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150"
						onKeyDown={e => {
							if (e.key === "Enter") {
								const inputPath = fileInp.current!.value;
								if (inputPath.endsWith("/")) {
									setCurrentDirectory(inputPath);
								} else {
									onSave();
								}
							}
						}}
						onChange={e => onPathChange(e as unknown as React.KeyboardEvent<HTMLInputElement>)}
					/>
					<button className="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={onSave}>
						Select
					</button>
				</div>
			</div>
		</div>
	);
}

export function Crop({ title, img, onOk, onCancel }: dialogProps) {
	const imgRef = useRef<HTMLImageElement>(null);
	const cropperRef = useRef<Cropper | null>(null);
	useEffect(() => {
		if (imgRef.current && img) {
			imgRef.current.src = img;
			cropperRef.current = new Cropper(imgRef.current, {
				aspectRatio: 1,
				viewMode: 1,
				cropBoxResizable: false,
				movable: true,
				rotatable: true,
				scalable: true,
				responsive: true,
			});
		}
		return () => {
			if (cropperRef.current) {
				cropperRef.current.destroy();
			}
		};
	}, [img]);
	const onSave = () => {
		if (!cropperRef.current) return;
		const canvas = cropperRef.current.getCroppedCanvas();
		canvas.toBlob((blob: any) => {
			new Compressor(blob as Blob, {
				quality: 0.5,
				success(result) {
					const reader = new FileReader();
					reader.readAsDataURL(result);
					reader.onload = () => {
						removeFn();
						setTimeout(() => {
							if (onOk) {
								onOk(reader.result);
							}
						}, 300);
					};
				},
			});
		});
	};
	const Cancel = () => {
		removeFn();
		if (onCancel) {
			onCancel();
		}
	};
	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150">
			<div className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				<img ref={imgRef} className="w-full h-24"></img>
				<div className="flex justify-between">
					<button className="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<button className="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={onSave}>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

export function WebAuth({ title, defaultUsername, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	const container = useRef<HTMLDivElement | null>(null);
	const dialog = useRef<HTMLDivElement | null>(null);
	const usernameRef = useRef<HTMLInputElement | null>(null);
	const passwordRef = useRef<HTMLInputElement | null>(null);
	const OK = () => {
		const username = usernameRef.current?.value;
		const password = passwordRef.current?.value;
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				if (container.current) {
					removeFn();
				}
				if (onOk && username && password) {
					onOk(username, password);
				}
			}, 200);
		}
	};
	const Cancel = () => {
		if (container.current) {
			container.current.classList.add("fade-out");
			setTimeout(() => {
				if (container.current) {
					removeFn();
				}
				if (onCancel) {
					onCancel();
				}
			}, 200);
		}
	};
	const onDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			OK();
		}
	};
	useEffect(() => {
		document.addEventListener("mousedown", e => {
			if (container.current && e.target !== dialog.current && e.target === container.current) {
				Cancel();
			}
		});
	});
	return (
		<div className="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} className="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div className="font-extrabold text-xl leading-none select-none">{title}</div>
				<input type="text" defaultValue={defaultUsername} placeholder="Username" className="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150" style={{ width: "100%" }} ref={usernameRef} />
				<input type="password" placeholder="Password" className="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150" style={{ width: "100%" }} ref={passwordRef} onKeyDown={onDown} />
				<div className="flex justify-between">
					<button className="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<button className="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

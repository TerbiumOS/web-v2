import { useEffect, useState, useRef } from "react";
import "./sys/gui/styles/login.css";
import { GetTime, GetDate } from "./sys/apis/Date";
import pwd from "./sys/apis/Crypto";
import DialogContainer, { setDialogFn } from "./sys/apis/Dialogs";
import { User } from "./sys/types";
const pw = new pwd();

export default function Login() {
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	const [time, setTime] = useState(GetTime());
	const [date, setDate] = useState(GetDate());
	const [hasPw, setHasPw] = useState(false);
	const [accounts, setAccounts] = useState([]);
	const [selectedUser, setSelectedUser] = useState<string | any>(sessionStorage.getItem("currAcc") || "/home/user/");
	const [profilePictures, setProfilePictures] = useState<{ [key: string]: string | null }>({});
	const [wallpaper, setWallpaper] = useState<string | null>(null);
	const [changingpw, setChangepw] = useState(false);
	const passwordRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		const intervalId = setInterval(() => {
			setTime(GetTime());
			setDate(GetDate());
		}, 1000);
		return () => clearInterval(intervalId);
	}, []);
	useEffect(() => {
		const FS = async () => {
			const entries = await window.tb.fs.promises.readdir("/home/");
			const dirEntries = await Promise.all(
				entries.map(async entry => {
					const stat = await window.tb.fs.promises.stat(`/home/${entry}`);
					if (stat && stat.isDirectory()) {
						try {
							await window.tb.fs.promises.access(`/home/${entry}/user.json`);
							return entry;
						} catch (error) {
							return null;
						}
					}
				}),
			);
			const directories = dirEntries.filter(entry => entry !== null);
			// @ts-expect-error
			setAccounts(directories);
		};
		FS();
	}, []);
	useEffect(() => {
		const getDefUsr = async () => {
			const data = await window.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8");
			const res = JSON.parse(data);
			setWallpaper(JSON.parse(await window.tb.fs.promises.readFile(`/home/${res.defaultUser}/settings.json`)).wallpaper);
			setSelectedUser(res.defaultUser);
		};
		getDefUsr();
	}, []);

	useEffect(() => {
		const getUsr = async () => {
			const pictures: { [key: string]: string | null } = {};
			for (const account of accounts) {
				try {
					const res = JSON.parse(await window.tb.fs.promises.readFile(`/home/${account}/user.json`, "utf8"));
					pictures[account] = res.pfp || null;
				} catch (error) {
					console.error(`Error reading user data for ${account}:`, error);
					pictures[account] = null;
				}
			}
			if (selectedUser && selectedUser !== "/home/user/") {
				try {
					const res = JSON.parse(await window.tb.fs.promises.readFile(`/home/${selectedUser}/user.json`, "utf8"));
					setHasPw(res.password !== false);
				} catch (error) {
					console.error("Error reading user data:", error);
				}
			}
			setProfilePictures(pictures);
		};
		if (accounts.length > 0) {
			getUsr();
		}
	}, [accounts, selectedUser]);
	const login = async () => {
		// @ts-expect-error
		const passVal = passwordRef.current.value;
		if (passVal !== "") {
			const data = await window.tb.fs.promises.readFile(`/home/${selectedUser}/user.json`, "utf8");
			const res = JSON.parse(data);
			const user_pass = res.password.toString();
			const pass = pw.harden(passVal.toString());
			if (user_pass === pass) {
				sessionStorage.setItem("logged-in", "true");
				sessionStorage.setItem("currAcc", selectedUser);
				window.location.reload();
			} else {
				Err();
			}
		}
	};
	const Err = () => {
		if (passwordRef.current) {
			passwordRef.current.classList.add("ring-[#ff7e7e5a]", "ring-[2px]", "border-[#ff7e7ed5]", "placeholder-[#ff7e7e6b]");
			passwordRef.current.value = "";
			passwordRef.current.placeholder = "Incorrect Password";
			passwordRef.current.addEventListener("keydown", () => {
				if (passwordRef.current) {
					passwordRef.current.classList.remove("ring-[#ff7e7e5a]", "ring-[2px]", "border-[#ff7e7ed5]", "placeholder-[#ff7e7e6b]");
					passwordRef.current.placeholder = "Password";
				}
			});
		}
	};

	useEffect(() => {
		const keyCheck = async (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsLoggingIn(false);
			}
			if ((!isLoggingIn && e.key !== "Escape") || e.key.match(/^[a-zA-Z0-9]$/)) {
				const user = JSON.parse(await window.tb.fs.promises.readFile(`/home/${selectedUser}/user.json`, "utf8"));
				if (user.password !== false) {
					setIsLoggingIn(true);
					setTimeout(() => {
						if (passwordRef.current && !changingpw) {
							passwordRef.current.focus();
							if (e.key.match(/^[a-zA-Z0-9]$/) && passwordRef.current.value.length === 0) {
								passwordRef.current.value = e.key;
							}
						}
					}, 200);
				}
			}
		};
		window.addEventListener("keydown", keyCheck);

		return () => {
			window.removeEventListener("keydown", keyCheck);
		};
	}, [isLoggingIn, selectedUser, changingpw]);

	return (
		<>
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `url("${wallpaper?.includes("/system/etc/") ? `/fs/${wallpaper}` : wallpaper || ""}")`,
					backgroundSize: "cover",
				}}
			></div>
			<div
				className={`login_container relative flex flex-col justify-center items-center size-full gap-5`}
				onMouseDown={() => {
					if (!isLoggingIn) {
						const user = JSON.parse(localStorage.getItem("setup") || "{}");
						if (user.password !== false) {
							setIsLoggingIn(true);
							setTimeout(() => {
								if (passwordRef.current && !changingpw) {
									passwordRef.current.focus();
								}
							}, 200);
						}
					}
				}}
			>
				{accounts.length > 1 ? (
					<div
						className={`
                            absolute flex gap-4 top-5 right-5 items-center z-10 duration-150
                            ${isLoggingIn ? "opacity-100" : "opacity-0 pointer-events-none translate-y-7"}
                        `}
					>
						{accounts.map((account, i) => (
							<div
								className={`
                                        size-14 bg-[#00000028] rounded-full duration-150
                                        ${selectedUser === account ? "shadow-[inset_0_0_0_2px_#7e91ff] scale-[1.2]" : "hover:scale-[1.1]"}
                                    `}
								key={i}
								style={{ backgroundImage: `url("${profilePictures[account] || ""}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
								onMouseDown={async () => {
									setSelectedUser(account);
									setWallpaper(JSON.parse(await window.tb.fs.promises.readFile(`/home/${account}/settings.json`)).wallpaper);
								}}
							></div>
						))}
					</div>
				) : null}
				<div
					className={`
                    flex flex-col justify-center items-center gap-5 size-full duration-150
                    ${isLoggingIn ? "opacity-0 pointer-events-none" : "opacity-100"}
                `}
				>
					<div className="date_time text-[#ffffffcb] font-extrabold flex flex-col justify-center items-center [text-shadow:0_0_16px_#00000038]">
						<div className="time text-7xl">{time}</div>
						<div className="date text-2xl">{date}</div>
					</div>
					<h1 className="text-[#ffffffcb] text-xl font-bold">Press any key to login</h1>
				</div>
				<DialogContainer />
				<div
					className={`
                    absolute
                    flex flex-col justify-center items-center gap-5 size-full backdrop-blur-lg duration-150 ${wallpaper ? "bg-[#0e0e0e99]" : "bg-[#0e0e0e]"}
                    ${isLoggingIn ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
				>
					<div
						className={`
                        flex flex-col justify-center items-center gap-5 size-full duration-150
                        ${isLoggingIn ? "" : "translate-y-6"}
                    `}
					>
						<div className="date_time text-[#ffffff87] font-extrabold flex flex-col justify-center items-center">
							<div className="time text-6xl">{time}</div>
							<div className="date text-lg">{date}</div>
						</div>
						<div className="user flex flex-row gap-5">
							<div className="user flex flex-col justify-center items-center gap-[10px]">
								<div className="relative flex size-[120px]">
									{accounts.length > 1 ? (
										accounts.map((account, i) => (
											<div
												className={`
                                                    absolute
                                                    flex justify-center items-center border-[1px] border-[#ffffff10] rounded-full bg-[center] size-[120px] duration-150
                                                    ${selectedUser === account ? "" : "scale-[0.85] opacity-0"}
                                                `}
												key={i}
												style={{ backgroundImage: `url("${profilePictures[account] || ""}")`, backgroundSize: "102%", backgroundRepeat: "no-repeat" }}
											>
												<div
													className="text-xl font-bold"
													style={{
														textShadow: "0 0 16px #000000",
														color: "#ffffff",
													}}
												>
													{account}
												</div>
											</div>
										))
									) : (
										<div className="flex justify-center items-center border-[1px] border-[#ffffff10] rounded-full bg-[center] w-[120px] h-[120px]" style={{ backgroundImage: `url("${profilePictures[selectedUser] || ""}")`, backgroundSize: "102%", backgroundRepeat: "no-repeat" }}>
											<div
												className="text-xl font-bold"
												style={{
													textShadow: "0 0 16px #000000",
													color: "#ffffff",
												}}
											>
												{selectedUser}
											</div>
										</div>
									)}
								</div>
								<div className="pass_container flex gap-[6px] justify-center items-center">
									<div className="relative flex flex-row justify-center">
										<div
											className={`
                                            flex flex-col items-center gap-1.5 duration-150
                                            ${hasPw ? "opacity-100" : "opacity-0 pointer-events-none"}
                                        `}
										>
											<div className="flex">
												<input
													type="password"
													className="pass cursor-[var(--cursor-text)] bg-[#ffffff10] border-[1px] border-[#ffffff10] rounded-[6px] px-[8px] py-[6px] text-[#ffffff] font-[18px] placeholder-[#ffffff38] placeholder-opacity-50 transition duration-150 ring-0 ring-[transparent] focus:outline-hidden focus:ring-[2.5px] focus:ring-[#7e91ff5a] focus:border-[#7e91ffd5] focus:placeholder-[#ffffff6b]"
													autoComplete="off"
													placeholder="Password"
													ref={passwordRef}
													onKeyDown={e => {
														if (e.key === "Enter") login();
													}}
												/>
												<button
													className="pass_button ml-2 cursor-pointer bg-[#ffffff10] border-[1px] border-[#ffffff10] rounded-[6px] px-[8px] py-[6px] stroke-[#ffffff] stroke-width-[2px] text-[#ffffff] font-[18px] transition duration-150 ring-0 ring-[transparent] focus:outline-hidden focus:ring-[2.5px] focus:ring-[#7e91ff5a] focus:border-[#7e91ffd5]"
													onMouseDown={login}
												>
													<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
														<path fillRule="evenodd" d="M3.75 12a.75.75 0 01.75-.75h13.19l-5.47-5.47a.75.75 0 011.06-1.06l6.75 6.75a.75.75 0 010 1.06l-6.75 6.75a.75.75 0 11-1.06-1.06l5.47-5.47H4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
													</svg>
												</button>
											</div>
											{hasPw && (
												<div
													className="forgot cursor-pointer text-[#ffffff38] text-[16px] font-[700] transition duration-150 hover:text-[#ffffff87] focus:outline-hidden focus:text-[#ffffff87]"
													onMouseDown={async () => {
														const changepw = async () => {
															setChangepw(true);
															let settings: User = JSON.parse(await window.tb.fs.promises.readFile(`/home/${selectedUser}/user.json`, "utf8"));
															if (settings.securityQuestion) {
																setDialogFn("message", {
																	title: `${settings.securityQuestion.question}`,
																	onOk: (val: string) => {
																		if (pw.harden(val) === settings.securityQuestion!.answer) {
																			setDialogFn("message", {
																				title: `Enter a new Password for the account: ${selectedUser}`,
																				onOk: (val: string) => {
																					settings.password = pw.harden(val);
																					window.tb.fs.promises.writeFile(`/home/${selectedUser}/user.json`, JSON.stringify(settings, null, 4));
																					setChangepw(false);
																					sessionStorage.setItem("logged-in", "true");
																					sessionStorage.setItem("currAcc", selectedUser);
																					window.location.reload();
																				},
																			});
																		} else {
																			setDialogFn("alert", {
																				title: `Incorrect answer to the security question`,
																				onOk: () => {
																					changepw();
																				},
																			});
																		}
																	},
																});
															} else {
																setDialogFn("message", {
																	title: `Enter a new Password for the account: ${selectedUser}`,
																	onOk: (val: string) => {
																		settings.password = pw.harden(val);
																		window.tb.fs.promises.writeFile(`/home/${selectedUser}/user.json`, JSON.stringify(settings, null, 4));
																		setChangepw(false);
																		sessionStorage.setItem("logged-in", "true");
																		sessionStorage.setItem("currAcc", selectedUser);
																		window.location.reload();
																	},
																});
															}
														};
														changepw();
													}}
												>
													Forgot Password?
												</div>
											)}
										</div>
										<button
											className={`
                                            absolute pass_button ml-2 cursor-pointer bg-[#ffffff10] border-[1px] border-[#ffffff10] rounded-[6px] px-[8px] py-[6px] stroke-[#ffffff] stroke-width-[2px] text-[#ffffff] font-[18px] transition duration-150 ring-0 ring-[transparent] focus:outline-hidden focus:ring-[2.5px] focus:ring-[#7e91ff5a] focus:border-[#7e91ffd5]
                                            ${hasPw ? "opacity-0 pointer-events-none" : "opacity-100"}
                                        `}
											onMouseDown={() => {
												sessionStorage.setItem("logged-in", "true");
												sessionStorage.setItem("currAcc", selectedUser);
												window.location.reload();
											}}
										>
											Login
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

const tb = parent.window.tb;
const currentAccountsEl = document.querySelector(".current-accounts");

const getAccounts = async () => {
	const entries = await tb.fs.promises.readdir("/home/");
	const accounts = await Promise.all(
		entries.map(async entry => {
			try {
				const account = JSON.parse(await tb.fs.promises.readFile(`/home/${entry}/user.json`, "utf8"));
				return {
					name: entry,
					id: account["id"],
					username: account["username"],
					perm: account["perm"],
					pfp: account["pfp"],
				};
			} catch (e) {
				return null;
			}
		}),
	);

	return accounts.filter(account => account !== null);
};

const deleteAccount = async id => {
	const sudoUsers = JSON.parse(await tb.fs.promises.readFile("/system/etc/terbium/sudousers.json", "utf8"));
	let sudoWithPassword = null;
	for (const sudoUser of sudoUsers) {
		const sudoUserData = JSON.parse(await tb.fs.promises.readFile(`/home/${sudoUser}/user.json`, "utf8"));
		if (sudoUserData.password !== false) {
			sudoWithPassword = sudoUser;
			break;
		}
	}
	if (!sudoUsers.includes(sessionStorage.getItem("currAcc"))) {
		if (!sudoWithPassword) {
			tb.system.users.remove(id);
			document.getElementById(id).remove();
			return;
		}
		tb.dialog.Permissions({
			title: "Permission Denied",
			message: "You do not have permission to delete accounts, would you like to request permission from sudo?",
			onOk: async () => {
				tb.dialog.Auth({
					title: "Request Permission",
					defaultUsername: sudoUsers[0],
					onOk: async (username, password) => {
						const pass = await tb.crypto(password);
						if (pass === JSON.parse(await tb.fs.promises.readFile(`/home/${sudoUsers[0]}/user.json`, "utf8")).password) {
							tb.system.users.remove(id);
							document.getElementById(id).remove();
						} else {
							tb.dialog.Alert({
								title: "Incorrect Password",
								message: "The password you entered is incorrect.",
							});
						}
					},
				});
			},
		});
	} else {
		const pw = JSON.parse(await tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8")).password;
		if (pw === false) {
			await tb.system.users.remove(id);
			document.getElementById(id).remove();
		} else {
			await tb.dialog.Auth({
				title: "Authenticate to Delete Account",
				defaultUsername: sessionStorage.getItem("currAcc"),
				onOk: async (username, password) => {
					const pass = await tb.crypto(password);
					if (pass === pw) {
						await tb.system.users.remove(id);
						document.getElementById(id).remove();
					} else {
						tb.dialog.Alert({
							title: "Incorrect Password",
							message: "The password you entered is incorrect.",
						});
					}
				},
			});
		}
	}
};

const changePerm = async () => {
	const data = JSON.parse(await tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"));
	if (data["password"] === false) {
		await tb.dialog.Select({
			title: "Enter the permission level you wish to set (Ex: Admin, User, Group, Public)",
			options: [
				{
					text: "Admin",
					value: "admin",
				},
				{
					text: "User",
					value: "user",
				},
				{
					text: "Group",
					value: "group",
				},
				{
					text: "Public",
					value: "public",
				},
			],
			onOk: async perm => {
				if (perm === data["perm"]) return;
				data["perm"] = perm;
				permEl.innerHTML = perm.charAt(0).toUpperCase() + perm.slice(1);
				await tb.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(data));
			},
		});
	} else {
		await tb.dialog.Auth({
			sudo: true,
			title: "Authenticate to change your permissions",
			defaultUsername: sessionStorage.getItem("currAcc"),
			onOk: async (username, password) => {
				const pass = await tb.crypto(password);
				if (pass === data["password"]) {
					await tb.dialog.Select({
						title: "Enter the permission level you wish to set (Ex: Admin, User, Group, Public)",
						options: [
							{
								text: "Admin",
								value: "admin",
							},
							{
								text: "User",
								value: "user",
							},
							{
								text: "Group",
								value: "group",
							},
							{
								text: "Public",
								value: "public",
							},
						],
						onOk: async perm => {
							if (perm === data["perm"]) return;
							data["perm"] = perm;
							permEl.innerHTML = perm.charAt(0).toUpperCase() + perm.slice(1);
							await tb.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(data));
						},
					});
				} else {
					throw new Error("Incorrect Password");
				}
			},
		});
	}
};

const changePfp = async id => {
	const data = JSON.parse(await tb.fs.promises.readFile(`/home/${id.id}/user.json`, "utf8"));
	const pfpInp = document.createElement("input");
	pfpInp.type = "file";
	pfpInp.accept = "image/*";
	pfpInp.click();
	pfpInp.onchange = async e => {
		if (e.target.files.length !== 0) {
			const file = e.target.files[0];
			const reader = new FileReader();
			reader.onload = async e => {
				await tb.dialog.Cropper({
					title: "Crop Profile Picture",
					img: e.target.result,
					onOk: async img => {
						data["pfp"] = img;
						await tb.fs.promises.writeFile(`/home/${id.id}/user.json`, JSON.stringify(data));
						parent.window.dispatchEvent(new Event("accUpd"));
						renderAccounts();
					},
				});
			};
			reader.readAsDataURL(file);
		}
	};
};

const renderAccounts = async () => {
	const accounts = await getAccounts();
	currentAccountsEl.innerHTML = accounts
		.map(
			account => `
        <div id="${account.id}"" class="relative p-3 rounded-lg w-max min-w-44 bg-[#ffffff10] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38]">
            <div class="flex gap-2 items-center">
                <div class="group relative size-10 rounded-full">
                    <img class="object-cover size-10 rounded-full bg-[#ffffff20]" src="${account.pfp}" />
                    <div class="absolute flex justify-center items-center inset-0 bg-[#ffffff10] rounded-full p-1.5 backdrop-blur cursor-pointer opacity-0 group-hover:opacity-100 duration-150" onmousedown="changePfp(${account.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-3 pointer-events-none">
                            <path fill-rule="evenodd" d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 0 0-3.471 2.987 10.04 10.04 0 0 1 4.815 4.815 18.748 18.748 0 0 0 2.987-3.472l3.386-5.079A1.902 1.902 0 0 0 20.599 1.5Zm-8.3 14.025a18.76 18.76 0 0 0 1.896-1.207 8.026 8.026 0 0 0-4.513-4.513A18.75 18.75 0 0 0 8.475 11.7l-.278.5a5.26 5.26 0 0 1 3.601 3.602l.502-.278ZM6.75 13.5A3.75 3.75 0 0 0 3 17.25a1.5 1.5 0 0 1-1.601 1.497.75.75 0 0 0-.7 1.123 5.25 5.25 0 0 0 9.8-2.62 3.75 3.75 0 0 0-3.75-3.75Z" clip-rule="evenodd" />
                        </svg>
                    </div>
                </div>
                <div class="flex flex-col">
                    <input class="font-black text-lg text-white leading-none bg-transparent p-0 rounded-none focus-within:outline-none w-28" value="${account.username}" />
                    <span class="w-max bg-[#ffffff28] py-1 px-1.5 rounded-md font-bold text-[#ffffff68] text-xs leading-none mt-1.5 select-none" onClick="changePerm()">${account.perm.charAt(0).toUpperCase() + account.perm.slice(1)}</span>
                </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e74949" class="absolute top-1 right-1 size-4 cursor-pointer" onmousedown="deleteAccount('${account.id}')">
                <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" />
            </svg>
        </div>
    `,
		)
		.join("");
};

renderAccounts();

const createAccount = async () => {
	const askNewAccountDetails = async () => {
		const makeAccount = async () => {
			await tb.dialog.Message({
				title: "Create Username",
				onOk: async username => {
					const data = {};
					data["id"] = username;
					data["username"] = username;
					await tb.dialog.Message({
						title: "Create Password",
						onOk: async password => {
							if (password !== "") {
								data["password"] = await tb.crypto(password);
							} else {
								data["password"] = false;
							}
							await tb.dialog.Select({
								title: "Do you want to set up a security question?",
								options: [
									{
										text: "Yes",
										value: "yes",
									},
									{
										text: "No",
										value: "no",
									},
								],
								onOk: async securityChoice => {
									if (securityChoice === "yes") {
										await tb.dialog.Message({
											title: "Set Security Question",
											onOk: async question => {
												await tb.dialog.Message({
													title: "Set Security Answer",
													onOk: async answer => {
														data["securityQuestion"] = {
															question: question,
															answer: await tb.crypto(answer),
														};
														askProfilePicture(data);
													},
												});
											},
										});
									} else {
										askProfilePicture(data);
									}
								},
							});
						},
					});
				},
			});
		};
		const ping = await parent.tb.libcurl.fetch("https://auth.terbiumon.top/ping");
		if (ping.ok) {
			await tb.dialog.Select({
				title: "Select Account Type",
				options: [
					{
						text: "Local Account",
						value: "user",
					},
					{
						text: "Terbium Cloud Account",
						value: "tacc",
					},
				],
				onOk: async accountType => {
					if (accountType === "user") {
						makeAccount();
					} else {
						const run = async () => {
							try {
								const resp = await window.parent.tb.tauth.signIn();
								const userDataConv = {
									id: resp.data.user.id,
									username: resp.data.user.name,
									email: resp.data.user.email,
									pfp: resp.data.user.image,
									password: await tb.crypto(resp.data.user.password),
									perm: "user",
								};
								await tb.system.users.add(userDataConv);
								renderAccounts();
							} catch (e) {
								run();
							}
						};
						run();
					}
				},
			});
		} else {
			makeAccount();
		}
	};

	const askProfilePicture = async data => {
		await tb.dialog.Select({
			title: "Do you want to set a profile picture?",
			options: [
				{
					text: "Yes",
					value: "yes",
				},
				{
					text: "No",
					value: "no",
				},
			],
			onOk: async perm => {
				if (perm === "yes") {
					const pfpInp = document.createElement("input");
					pfpInp.type = "file";
					pfpInp.accept = "image/*";
					pfpInp.click();
					pfpInp.onchange = async e => {
						if (e.target.files.length === 0) {
							const randomColorStr = ["blue", "green", "orange", "pink", "purple", "red", "yellow"][Math.floor(Math.random() * 7)];
							data["pfp"] = `/assets/img/default - ${randomColorStr}.png`;
							data["perm"] = "user";
							await tb.system.users.add(data);
							renderAccounts();
						} else {
							const file = e.target.files[0];
							const reader = new FileReader();
							reader.onload = async e => {
								await tb.dialog.Cropper({
									title: "Crop Profile Picture",
									img: e.target.result,
									onOk: async img => {
										data["pfp"] = img;
										data["perm"] = "user";
										await tb.system.users.add(data);
										renderAccounts();
									},
								});
							};
							reader.readAsDataURL(file);
						}
					};
				} else {
					const randomColorStr = ["blue", "green", "orange", "pink", "purple", "red", "yellow"][Math.floor(Math.random() * 7)];
					data["pfp"] = `/assets/img/default - ${randomColorStr}.png`;
					data["perm"] = "user";
					await tb.system.users.add(data);
					renderAccounts();
				}
			},
		});
	};

	const sudoUsers = JSON.parse(await tb.fs.promises.readFile("/system/etc/terbium/sudousers.json", "utf8"));
	let sudoWithPassword = null;
	for (const sudoUser of sudoUsers) {
		const sudoUserData = JSON.parse(await tb.fs.promises.readFile(`/home/${sudoUser}/user.json`, "utf8"));
		if (sudoUserData.password !== false) {
			sudoWithPassword = sudoUser;
			break;
		}
	}
	if (!sudoUsers.includes(sessionStorage.getItem("currAcc"))) {
		if (!sudoWithPassword) {
			askNewAccountDetails();
			return;
		}
		tb.dialog.Permissions({
			title: "Permission Denied",
			message: "You do not have permission to create accounts, would you like to request permission from sudo?",
			onOk: async () => {
				tb.dialog.Auth({
					title: "Request Permission",
					defaultUsername: sudoWithPassword,
					onOk: async (username, password) => {
						const pass = await tb.crypto(password);
						if (pass === JSON.parse(await tb.fs.promises.readFile(`/home/${sudoWithPassword}/user.json`, "utf8")).password) {
							askNewAccountDetails();
						} else {
							tb.dialog.Alert({
								title: "Incorrect Password",
								message: "The password you entered is incorrect.",
							});
						}
					},
				});
			},
		});
	} else {
		const user = JSON.parse(await tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"));
		if (user["password"] === false) {
			askNewAccountDetails();
		} else {
			await tb.dialog.Auth({
				title: "Authenticate to Create Account",
				defaultUsername: sessionStorage.getItem("currAcc"),
				onOk: async (username, password) => {
					const pass = await tb.crypto(password);
					if (pass === JSON.parse(await tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8")).password) {
						askNewAccountDetails();
					} else {
						tb.dialog.Alert({
							title: "Incorrect Password",
							message: "The password you entered is incorrect.",
						});
					}
				},
			});
		}
	}

	renderAccounts();
};

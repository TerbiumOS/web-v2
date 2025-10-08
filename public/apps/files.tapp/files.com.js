const tb = parent.window.tb;
const tb_island = tb.window.island;
const tb_window = tb.window;
const tb_context_menu = tb.context_menu;
const tb_dialog = tb.dialog;

const appIsland = window.parent.document.querySelector(".app_island");

tb_island.addControl({
	text: "File",
	appname: "Files",
	id: "files_file",
	click: () => {
		let isTrash = document.querySelector(".exp").getAttribute("path") === "/home/trash" ? true : false;
		tb.contextmenu.create({
			x: 6,
			y: appIsland.clientHeight + 12,
			options: [
				isTrash
					? null
					: {
							text: "New File",
							click: async () => {
								try {
									const response = await tb.dialog.Message({
										title: "Enter a name for the new file",
										defaultValue: "",
										onOk: async fileName => {
											const path = document.querySelector(".exp").getAttribute("path");
											const createFile = async (path, fileName) => {
												await window.parent.tb.fs.exists(`${path}/${fileName}`, async exists => {
													if (exists) {
														const ask = await tb.dialog.Message({
															title: `This file already exists. Enter a new name for ${fileName}`,
															defaultValue: "",
														});
														if (ask !== undefined && ask !== "") {
															await createFile(path, ask);
														}
													} else {
														let sh = tb.sh;
														await sh.touch(`${path}/${fileName}`, "");
														openPath(path);
													}
												});
											};
											await createFile(path, fileName);
										},
									});
								} catch (error) {
									console.error(error);
								}
							},
						},
				isTrash
					? null
					: {
							text: "New Folder",
							click: async () => {
								const response = await tb.dialog.Message({
									title: "Enter a name for the new folder",
									defaultValue: "",
									onOk: async response => {
										const path = document.querySelector(".exp").getAttribute("path");
										const createUniqueFolder = async (path, folderName, number = null) => {
											const folderPath = `${path}/${folderName}${number !== null ? ` (${number})` : ""}`;
											try {
												await window.parent.tb.fs.promises.access(folderPath);
												return createUniqueFolder(path, folderName, number + 1);
											} catch (error) {
												await window.parent.tb.fs.promises.mkdir(folderPath);
											}
										};
										await createUniqueFolder(path, response);
										openPath(path);
									},
								});
							},
						},
				isTrash
					? null
					: {
							text: "Upload from Computer",
							click: () => {
								const fauxput = document.createElement("input");
								fauxput.type = "file";
								fauxput.multiple = true;
								fauxput.onchange = async e => {
									for (const file of e.target.files) {
										const content = await file.arrayBuffer();
										const path = document.querySelector(".exp").getAttribute("path");
										const filePath = `${path}/${file.name}`;
										try {
											await window.parent.tb.fs.promises.access(filePath);
											await tb.dialog.Message({
												title: `File "${file.name}" already exists`,
												defaultValue: file.name,
												onOk: async newFileName => {
													if (newFileName !== null && newFileName !== "") {
														await window.parent.tb.fs.promises.writeFile(`${path}/${newFileName}`, Filer.Buffer.from(content), "arraybuffer");
													}
												},
											});
										} catch (error) {
											await window.parent.tb.fs.promises.writeFile(filePath, Filer.Buffer.from(content), "arraybuffer");
										}
									}
									openPath(document.querySelector(".nav-input.dir").value);
								};
								fauxput.click();
							},
						},
			],
		});
	},
});

tb_island.addControl({
	text: "View",
	appname: "Files",
	id: "files_view",
	click: () => {
		const options = [
			// {
			//     text: "Settings",
			//     click: () => {
			//         window.tb.window.create({
			//             title: `Settings`,
			//             icon: "/apps/files.tapp/icon.svg",
			//             src: "/apps/files.tapp/settings.tapp/index.html",
			//             controls: ["minimize", "close"]
			//         })
			//     }
			// },
			{
				text: "Go To",
				click: async () => {
					const response = await tb.dialog.Message({
						title: "Enter a name for the new folder",
						defaultValue: "",
						onOk: async response => {
							await window.parent.tb.fs.exists(response, async exists => {
								if (exists) openPath(response);
								else {
									tb.dialog.Alert({
										title: "Error",
										message: `Cannot find ${response}. Check your spelling and try again.`,
									});
								}
							});
						},
					});
				},
			},
		];
		tb.contextmenu.create({
			x: 6,
			y: appIsland.clientHeight + 12,
			options: options,
		});
	},
});

tb_island.addControl({
	text: "Network Storage",
	appname: "Files",
	id: "files_net",
	click: () => {
		const options = [
			{
				text: "Map Dav Drive",
				click: async () => {
					await tb.dialog.Message({
						title: "Enter a name for the Dav Drive",
						defaultValue: "",
						onOk: async res1 => {
							await tb.dialog.Message({
								title: "Enter the URL for the Dav Drive",
								defaultValue: "",
								onOk: async res2 => {
									await tb.dialog.WebAuth({
										title: "Enter the credentials for the Dav Drive",
										onOk: async (username, password) => {
											const davjson = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${await tb.user.username()}/files/davs.json`, "utf8"));
											davjson.push({
												name: res1,
												url: res2,
												username: username,
												password: password,
											});
											await window.parent.tb.fs.promises.writeFile(`/apps/user/${await tb.user.username()}/files/davs.json`, JSON.stringify(davjson, null, 2));
											const config = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${await tb.user.username()}/files/config.json`, "utf8"));
											config.drives[res1] = `/mnt/${res1}/`;
											await window.parent.tb.fs.promises.writeFile(`/apps/user/${await tb.user.username()}/files/config.json`, JSON.stringify(config, null, 2));
											await tb.notification.Toast({
												application: "System",
												iconSrc: "/fs/apps/system/about.tapp/icon.svg",
												message: "New Dav Device has been added",
											});
											openPath(document.querySelector(".nav-input.dir").value);
											window.dispatchEvent(new Event("updcfg"));
										},
									});
								},
							});
						},
					});
				},
			},
			{
				text: "UnMap Dav Drive",
				click: async () => {
					await tb.dialog.Message({
						title: "Enter the name of the Dav Drive to remove",
						defaultValue: "",
						onOk: async response => {
							const davjson = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${await tb.user.username()}/files/davs.json`, "utf8"));
							const index = davjson.findIndex(entry => entry.name.toLowerCase() === response.toLowerCase());
							if (index !== -1) {
								davjson.splice(index, 1);
								await window.parent.tb.fs.promises.writeFile(`/apps/user/${await tb.user.username()}/files/davs.json`, JSON.stringify(davjson, null, 2));
								const config = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${await tb.user.username()}/files/config.json`, "utf8"));
								delete config.drives[response.toLowerCase()];
								await window.parent.tb.fs.promises.writeFile(`/apps/user/${await tb.user.username()}/files/config.json`, JSON.stringify(config, null, 2));
								await tb.notification.Toast({
									application: "System",
									iconSrc: "/fs/apps/system/about.tapp/icon.svg",
									message: "Dav Drive has been removed",
								});
								openPath(document.querySelector(".nav-input.dir").value);
								window.dispatchEvent(new Event("updcfg"));
							} else {
								await tb.notification.Toast({
									application: "System",
									iconSrc: "/fs/apps/system/about.tapp/icon.svg",
									message: "Dav Drive not found",
								});
							}
						},
					});
				},
			},
		];
		tb.contextmenu.create({
			x: 6,
			y: appIsland.clientHeight + 12,
			options: options,
		});
	},
});

tb_island.addControl({
	text: "Empty Trash",
	appname: "Files",
	id: "files-et",
	click: () => {
		emptyTrash();
	},
});

parent.document.querySelector(`[control-id="files-et"]`)?.classList.add("hidden");

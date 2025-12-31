const Filer = window.Filer;
const tb = parent.window.tb;
const tb_window = tb.window;
const tb_desktop = tb.desktop;
const tb_preferences = tb.desktop.preferences;
const tb_island = tb.window.island;
const tb_context_menu = tb.context_menu;
const tb_dialog = tb.dialog;
const tb_wallpaper = parent.window.tb.desktop.wallpaper;
const parent_body = parent.document.body;
setInterval(() => {
	if (parent_body.getAttribute("theme")) document.body.setAttribute("theme", parent_body.getAttribute("theme"));
});

const cat_options = document.querySelectorAll(".cat-option");
cat_options.forEach(option => {
	function mouseleave() {
		let tooltip = option.querySelector(".cat-tooltip");
		tooltip.classList.add("hidden");
		option.removeEventListener("mouseleave", mouseleave);
		option.addEventListener("mouseover", mouseover);
	}
	function mouseover() {
		setTimeout(() => {
			if (option.matches(":hover")) {
				if (option.offsetWidth === 36) {
					let tooltip = option.querySelector(".cat-tooltip");
					tooltip.classList.remove("hidden");
					document.querySelectorAll(".cat-tooltip").forEach(tooltip => {
						if (tooltip !== option.querySelector(".cat-tooltip")) tooltip.classList.add("hidden");
					});
					option.addEventListener("mouseleave", mouseleave);
				}
			}
		}, 1000);
	}
	option.addEventListener("click", e => {
		const cat = option.getAttribute("data-category");
		const current_cat = document.querySelector('.settings-category[data-visible="true"]').getAttribute("category");
		if (cat === current_cat) return;
		document.querySelectorAll(".settings-category").forEach(category => {
			category.dataset.visible = "false";
			category.classList.add("opacity-0", "pointer-events-none", "translate-y-6");
		});
		document.querySelectorAll(".cat-option").forEach(opt => opt.classList.remove("selected"));
		const view = document.querySelector(`.settings-category[category="${cat}"]`);
		if (view === null) return;
		view.dataset.visible = "true";
		view.classList.remove("opacity-0", "pointer-events-none", "translate-y-6");
		option.classList.add("selected");
	});
	option.addEventListener("mouseover", mouseover);
});

const wallpaper_options = document.querySelectorAll(".wallpaper-option");
wallpaper_options.forEach(option => {
	option.addEventListener("click", async e => {
		const parent_origin = parent.parent.window.location.origin;
		const wallpaper = option.src.toString().split(parent_origin)[1];
		const color = option.getAttribute("color-type");
		let data = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
		data["wallpaper"] = wallpaper;
		tb_wallpaper.set(wallpaper);
		const fillMode = parent.window.tb.desktop.wallpaper.fillMode();
		if (fillMode === null) parent.window.tb.desktop.wallpaper.cover();
		if (color !== parent.window.tb.desktop.preferences.theme()) {
			// parent.window.tb.desktop.preferences.setTheme(`${color`)
			document.body.setAttribute("theme", color);
		}
	});
});

window.parent.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	const fillMode = data["wallpaperMode"];
	const showSeconds = data["times"]["showSeconds"];
	const twentyFourHour = data["times"]["format"];
	let fillModeCapitalized = fillMode.charAt(0).toUpperCase() + fillMode.slice(1);
	document.querySelector(`[action-for="wallpaper-fill"]`).querySelector(".select-title .text").innerText = fillModeCapitalized;
	document.querySelector(`[action-for="proxy"]`).querySelector(".select-title .text").innerText = data["proxy"];
	document.querySelector(`[action-for="transports"]`).querySelector(".select-title .text").innerText = data["transport"];
	document.querySelector(`[action-for="show-seconds"]`).querySelector(".select-title .text").innerText = showSeconds ? "Yes" : "No";
	document.querySelector(`[action-for="24h-12h"]`).querySelector(".select-title .text").innerText = twentyFourHour === "24h" ? "Yes" : "No";
	document.querySelector(`[action-for="wmx"]`).querySelector(".select-title .text").innerText = data["window"]["alwaysMaximized"] ? "Yes" : "No";
	document.querySelector(`[action-for="wfs"]`).querySelector(".select-title .text").innerText = data["window"]["alwaysFullscreen"] ? "Yes" : "No";
});

window.parent.tb.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	const cords = data["location"];
	document.querySelector(`.cords`).innerText = `${cords}`;
	const tempunit = data["weather"]["unit"];
	document.querySelector(`[action-for="temperature-unit"]`).querySelector(".select-title .text").innerText = tempunit;
});

const customWallpaper = () => {
	window.parent.tb.dialog.Select({
		title: "Where do you want to load the wallpaper from?",
		options: [
			{
				text: "System Storage",
				value: "sys",
			},
			{
				text: "Terbium File System",
				value: "fs",
			},
			{
				text: "Internet Url",
				value: "url",
			},
		],
		onOk: async perm => {
			switch (perm) {
				case "sys":
					const input = document.createElement("input");
					input.type = "file";
					input.setAttribute("accept", "image/*");
					input.click();
					input.addEventListener("change", async e => {
						const file = input.files[0];
						const buffer = await file.arrayBuffer();
						const reader = new FileReader();
						reader.readAsDataURL(file);
						reader.onload = async () => {
							const imgdata = reader.result;
							const path = "/system/etc/terbium/wallpapers/" + file.name;

							tb_wallpaper.set(path);
							const img_container = document.createElement("div");
							img_container.classList.add("wallpaper-container");
							const wimg = document.createElement("img");
							wimg.src = imgdata;
							wimg.classList.add("wallpaper-option");

							const delete_button = document.createElement("img");
							delete_button.src = "/fs/apps/system/settings.tapp/delete.svg";
							delete_button.classList.add("delete-wallpaper");
							delete_button.addEventListener("click", async e => {
								let data = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
								if (data["wallpaper"] === path) {
									tb_wallpaper.set("/assets/wallpapers/1.png");
								}
								await window.parent.tb.fs.promises.unlink(path);
								img_container.remove();
							});
							wimg.addEventListener("click", async e => {
								tb_wallpaper.set(path);
							});
							await window.parent.tb.fs.promises.writeFile(path, window.parent.tb.buffer.from(buffer), "arraybuffer");
							tb_wallpaper.set(path);
							img_container.append(wimg);
							img_container.append(delete_button);
							document.querySelector(".custom-wallpaper").remove();
							document.querySelector(".wallpapers").append(img_container);
							appendCustomWallpaper();
						};
					});
					break;
				case "fs":
					tb.dialog.FileBrowser({
						title: "Select a wallpaper from the file system",
						local: true,
						onOk: async filePath => {
							const imgdata = await window.parent.tb.fs.promises.readFile(filePath, "arraybuffer");
							await window.parent.tb.fs.promises.writeFile("/system/etc/terbium/wallpapers/" + filePath.split("/").pop(), imgdata, "arraybuffer");
							tb.desktop.wallpaper.set("/system/etc/terbium/wallpapers/" + filePath.split("/").pop());
							document.querySelector(".wallpapers").innerHTML = `
								<img src="/assets/wallpapers/1.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/2.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/3.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/4.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/5.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/6.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/7.png" class="wallpaper-option"></img>
							`;
							const wallpaper_options = document.querySelectorAll(".wallpaper-option");
							wallpaper_options.forEach(option => {
								option.addEventListener("click", async e => {
									const parent_origin = parent.parent.window.location.origin;
									const wallpaper = option.src.toString().split(parent_origin)[1];
									const color = option.getAttribute("color-type");
									let data = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
									data["wallpaper"] = wallpaper;
									tb_wallpaper.set(wallpaper);
									const fillMode = parent.window.tb.desktop.wallpaper.fillMode();
									if (fillMode === null) parent.window.tb.desktop.wallpaper.cover();
									if (color !== parent.window.tb.desktop.preferences.theme()) {
										// parent.window.tb.desktop.preferences.setTheme(`${color`)
										document.body.setAttribute("theme", color);
									}
								});
							});
							getWallpapers();
						},
					});
					break;
				case "url":
					tb.dialog.Message({
						title: "Enter a URL of the wallpaper",
						onOk: async value => {
							await window.parent.tb.system.download(value, `/system/etc/terbium/wallpapers/${value.split("/").pop()}`);
							tb.desktop.wallpaper.set("/system/etc/terbium/wallpapers/" + value.split("/").pop());
							document.querySelector(".wallpapers").innerHTML = `
								<img src="/assets/wallpapers/1.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/2.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/3.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/4.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/5.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/6.png" class="wallpaper-option"></img>
								<img src="/assets/wallpapers/7.png" class="wallpaper-option"></img>
							`;
							const wallpaper_options = document.querySelectorAll(".wallpaper-option");
							wallpaper_options.forEach(option => {
								option.addEventListener("click", async e => {
									const parent_origin = parent.parent.window.location.origin;
									const wallpaper = option.src.toString().split(parent_origin)[1];
									const color = option.getAttribute("color-type");
									let data = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
									data["wallpaper"] = wallpaper;
									tb_wallpaper.set(wallpaper);
									const fillMode = parent.window.tb.desktop.wallpaper.fillMode();
									if (fillMode === null) parent.window.tb.desktop.wallpaper.cover();
									if (color !== parent.window.tb.desktop.preferences.theme()) {
										// parent.window.tb.desktop.preferences.setTheme(`${color`)
										document.body.setAttribute("theme", color);
									}
								});
							});
							getWallpapers();
						},
					});
					break;
			}
		},
	});
};

const appendCustomWallpaper = () => {
	if (document.querySelector(".custom-wallpaper")) {
		console.log(document.querySelector(".custom-wallpaper"));
	}

	const newButton = `
        <button class="wallpaper-option flex justify-center items-center bg-[#ffffff10] hover:bg-[#ffffff20] duration-150 custom-wallpaper" style="box-shadow: inset 0 0 0 0.5px #ffffff38;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-8 pointer-events-none">
                <path style="stroke: currentColor; stroke-width: 1;" fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
            </svg>
        </button>
    `;

	const wallpaperContainer = document.querySelector(".wallpapers");
	wallpaperContainer.insertAdjacentHTML("beforeend", newButton);
	const customWallpaperBtn = document.querySelector(".custom-wallpaper");
	customWallpaperBtn.addEventListener("click", e => {
		customWallpaper();
	});
};

async function getWispSrvs() {
	const fileExists = await window.parent.tb.fs.promises
		.stat("//apps/system/settings.tapp/wisp-servers.json")
		.then(() => true)
		.catch(() => false);
	if (!fileExists) {
		await window.parent.tb.fs.promises.mkdir("//apps/settings.tapp/", { recursive: true });
		const stockDat = [
			{ id: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`, name: "Backend" },
			{ id: "wss://wisp.terbiumon.top/wisp/", name: "TB Wisp Instance" },
		];
		await window.parent.tb.fs.promises.writeFile("//apps/system/settings.tapp/wisp-servers.json", JSON.stringify(stockDat));
	}
	const main = document.getElementById("wispSrvs");
	window.parent.window.dispatchEvent(new Event("update-wispsrvs"));
	const makeCard = async (name, id) => {
		let settings = await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8");
		let settdata = JSON.parse(settings);

		const card = document.createElement("div");
		card.classList.add("flex", "justify-between", "w-full", "p-1.5", "rounded-lg", "duration-150", `srv-${id.replace(/\s/g, "-")}`);
		if (name === settdata.wispServer) {
			card.classList.add("bg-[#4acd609c]");
		} else {
			card.classList.add("bg-[#ffffff18]", "hover:bg-[#ffffff38]", "cursor-pointer");
		}

		const html = `
            <div class="flex gap-6 items-center justify-between text-[#ffffffd1] w-full pointer-events-none">
                <div class="flex gap-3 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-8">
                        <path fill-rule="evenodd" d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.062 0 8.25 8.25 0 0 0-11.667 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.204 3.182a6 6 0 0 1 8.486 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0 3.75 3.75 0 0 0-5.304 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182a1.5 1.5 0 0 1 2.122 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0l-.53-.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                    </svg>
                    <div class="flex flex-col">
                        <h3 class="font-bold leading-tight">${id}</h3>
                        <span class="text-xs leading-tight">${name}</span>
                    </div>
                </div>
                <p latency-${id.replace(/\s/g, "-")} class="text-sm p-2 bg-[#ffffff38] rounded-lg leading-none text-[#ffffffce] font-extrabold ">Pinging...</p>
            </div>
        `;

		card.innerHTML = html;
		setTimeout(async () => {
			const res = await ping(name);
			document.querySelector(`[latency-${id.replace(/\s/g, "-")}]`).innerHTML = res.latency + "ms";
		}, 1750);

		card.addEventListener("click", async () => {
			settdata.wispServer = name;
			const updSet = JSON.stringify(settdata, null, 2);
			await window.parent.tb.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, updSet);
			window.parent.tb.proxy.updateSWs();
			window.parent.window.dispatchEvent(new Event("update-wispsrvs"));
		});

		main.appendChild(card);
	};
	const data = JSON.parse(await window.parent.tb.fs.promises.readFile("//apps/system/settings.tapp/wisp-servers.json"));
	data.forEach(item => {
		makeCard(item.id, item.name);
	});
	const ping = id => {
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
	};
	const addWispbtn = document.getElementById("addWisp");
	addWispbtn.addEventListener("click", () => {
		window.parent.tb.dialog.Message({
			title: "Enter a name for the Wisp server",
			onOk: async val => {
				sessionStorage.setItem("wispSrv", val);
				window.parent.tb.dialog.Message({
					title: "Enter the socket URL for the Wisp server",
					onOk: async val => {
						const ent = { id: val, name: sessionStorage.getItem("wispSrv") };
						let data = JSON.parse(await window.parent.tb.fs.promises.readFile("//apps/system/settings.tapp/wisp-servers.json"));
						data.push(ent);
						window.parent.tb.fs.promises.writeFile("//apps/system/settings.tapp/wisp-servers.json", JSON.stringify(data));
						makeCard(val, sessionStorage.getItem("wispSrv"));
					},
				});
			},
		});
	});
	const rmWispbtn = document.getElementById("rmWisp");
	rmWispbtn.addEventListener("click", async () => {
		let data = JSON.parse(await window.parent.tb.fs.promises.readFile("//apps/system/settings.tapp/wisp-servers.json"));
		const servers = data.map(item => ({
			text: item.name,
			value: item.name,
		}));
		window.parent.tb.dialog.Select({
			title: "Select the Wisp server to remove",
			options: servers,
			onOk: async selectedName => {
				data = data.filter(item => item.name !== selectedName);
				await window.parent.tb.fs.promises.writeFile("//apps/system/settings.tapp/wisp-servers.json", JSON.stringify(data));
				document.querySelector(`.srv-${selectedName.replace(/\s/g, "-")}`).remove();
				window.parent.window.dispatchEvent(new Event("update-wispsrvs"));
			},
		});
	});
}
getWispSrvs();

async function updateTransport(transport) {
	const st = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
	st["transport"] = transport;
	await window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(st), "utf8");
}

const accentPreview = document.querySelector(".accent-preview");
const accentMousedown = async () => {
	const defaultAccent = "#32ae62";
	accentPreview.classList.remove("group", "cursor-pointer");
	accentPreview.style.setProperty("--accent", defaultAccent);
	let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
	settings["accent"] = defaultAccent;
	window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(settings));
	accentPreview.removeEventListener("mousedown", accentMousedown);
};

const getAccent = async () => {
	const settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
	var accentColor = settings["accent"];
	const defaultAccent = "#32ae62";
	if (accentColor !== defaultAccent) {
		accentPreview.classList.add("group", "cursor-pointer");
		accentPreview.addEventListener("mousedown", accentMousedown);
	}
	if (accentColor) {
		accentPreview.style.setProperty("--accent", accentColor);
	} else {
		accentPreview.style.setProperty("--accent", "#32ae62");
	}
};
getAccent();

const custom_accent = document.querySelector(".custom-accent");
custom_accent.addEventListener("click", e => {
	const color_picker = document.createElement("input");
	color_picker.type = "color";
	color_picker.click();
	color_picker.addEventListener("change", async e => {
		let color = color_picker.value;
		if (color.charAt(0) !== "#") {
			const rgb = color.match(/\d+/g);
			const r = rgb[0];
			const g = rgb[1];
			const b = rgb[2];
			color = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
			let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
			settings["accent"] = color;
			window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(settings));
		} else {
			let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
			settings["accent"] = color;
			window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(settings));
		}
		accentPreview.style.setProperty("--accent", color);
		accentPreview.classList.add("group", "cursor-pointer");
		accentPreview.addEventListener("mousedown", accentMousedown);
		window.parent.window.dispatchEvent(new Event("upd-accent"));
	});
});

const getWallpapers = async () => {
	const files = await window.parent.tb.fs.promises.readdir("/system/etc/terbium/wallpapers");
	for (const file of files) {
		const path = "/system/etc/terbium/wallpapers/" + file;
		const data = URL.createObjectURL(new Blob([await window.parent.tb.fs.promises.readFile(path, "utf8")]));
		const img_container = document.createElement("div");
		img_container.classList.add("wallpaper-container");
		const img = document.createElement("img");
		img.src = `/fs/${path}`;
		img.classList.add("wallpaper-option");
		const delete_button = document.createElement("img");
		delete_button.src = "/fs/apps/system/settings.tapp/delete.svg";
		delete_button.classList.add("delete-wallpaper");
		delete_button.addEventListener("click", e => {
			window.parent.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
				if (err) return console.log(err);
				data = JSON.parse(data);
				if (data["wallpaper"] === path) {
					tb_wallpaper.set("/assets/wallpapers/1.png");
				}
			});
			window.parent.tb.fs.unlink(path, err => {
				if (err) return console.log(err);
				img_container.remove();
			});
		});
		img_container.append(img);
		img_container.append(delete_button);
		document.querySelector(".wallpapers").append(img_container);
		img.addEventListener("click", e => {
			tb_wallpaper.set(path);
		});
	}
	appendCustomWallpaper();
};
getWallpapers();

const pfpEl = document.querySelector(".pfp");
window.parent.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	pfpEl.src = data["pfp"];
});

pfpEl.addEventListener("click", async e => {
	const uploader = document.createElement("input");
	uploader.type = "file";
	uploader.accept = "img/*";
	uploader.onchange = () => {
		const files = uploader.files;
		const file = files[0];
		const reader = new FileReader();
		reader.onload = () => {
			tb.dialog.Cropper({
				title: "Resize your Profile picture",
				img: reader.result,
				onOk: async img => {
					if (await window.parent.tb.tauth.isTACC()) {
						tb.dialog.Select({
							title: "Do you want to upload this profile picture to your Terbium Account?",
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
							onOk: async choice => {
								if (choice === "yes") {
									await window.parent.tb.tauth.updateInfo({
										pfp: img,
									});
								} else {
									return;
								}
							},
						});
					}
					const uSettings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"));
					uSettings["pfp"] = img;
					pfpEl.src = img;
					await window.parent.tb.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(uSettings));
					window.parent.dispatchEvent(new Event("accUpd"));
				},
			});
		};
		reader.readAsDataURL(file);
	};
	uploader.click();
});

const usernameEl = document.querySelector(".username");
usernameEl.addEventListener("input", async e => {
	usernameEl.addEventListener("blur", async () => {
		if (usernameEl.value !== JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"))["username"]) {
			await window.parent.tb.system.users.renameUser(sessionStorage.getItem("currAcc"), usernameEl.value);
		}
	});
});

const permEl = document.querySelector(".perm");
permEl.addEventListener("click", async () => {
	const data = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"));
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
				await window.parent.tb.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(data));
			},
		});
	} else {
		await tb.dialog.Auth({
			sudo: true,
			title: "Authenticate to change your permissions",
			defaultUsername: sessionStorage.getItem("currAcc"),
			onOk: async (_username, password) => {
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
							await window.parent.tb.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(data));
						},
					});
				} else {
					throw new Error("Incorrect Password");
				}
			},
		});
	}
});

const actype = document.querySelector(".actype");
actype.addEventListener("click", async () => {
	await tb.dialog.Select({
		title: "Select Option",
		options: [
			{
				text: "Link Terbium Cloud™ Account",
				value: "cloud",
			},
			{
				text: "Convert to Local Account",
				value: "local",
			},
		],
		onOk: async choice => {
			switch (choice) {
				case "cloud":
					const res = await window.parent.tb.tauth.signIn();
					actype.innerHTML = "Terbium Cloud\u2122 Account";
					await window.parent.tb.tauth.sync.retrieve();
					const userinfo = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"));
					userinfo["password"] = await window.parent.tb.crypto(res.data.user.password);
					userinfo["perm"] = "admin";
					await window.parent.tb.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(userinfo));
					await window.parent.tb.system.users.renameUser(sessionStorage.getItem("currAcc"), res.data.user.name);
					break;
				case "local":
					window.parent.tb.dialog.Select({
						title: "Save current settings to cloud before converting to local?",
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
						onOk: async val => {
							if (val === "yes") {
								await window.parent.tb.tauth.sync.upload();
							} else {
								return;
							}
						},
					});
					await window.parent.tb.tauth.signOut();
					actype.innerHTML = "Local Account";
					break;
			}
		},
	});
});

window.parent.tb.fs.readFile(`/system/etc/terbium/taccs.json`, "utf8", (err, data) => {
	if (err) actype.innerHTML = "Local Account";
	const entries = JSON.parse(data);
	const act = sessionStorage.getItem("currAcc");
	try {
		let isCloud = false;
		if (Array.isArray(entries)) {
			isCloud = entries.some(e => e && e.username === act);
		} else if (entries && typeof entries === "object") {
			isCloud = Object.values(entries).some(e => e && e.username === act);
		}
		actype.innerHTML = isCloud ? "Terbium Cloud\u2122 Account" : "Local Account";
	} catch (e) {
		actype.innerHTML = "Local Account";
	}
});

window.parent.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	usernameEl.value = data["username"];
	permEl.innerHTML = data["perm"].charAt(0).toUpperCase() + data["perm"].slice(1);
});

const hostnameEl = document.querySelector(".hostname");
hostnameEl.addEventListener("input", async e => {
	hostnameEl.addEventListener("blur", async () => {
		if (hostnameEl.value !== JSON.parse(await window.parent.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["host-name"]) {
			window.parent.tb.fs.readFile("/system/etc/terbium/settings.json", "utf8", async (err, data) => {
				if (err) return console.log(err);
				data = JSON.parse(data);
				data["host-name"] = hostnameEl.value;
				await window.parent.tb.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(data));
			});
		}
	});
});

window.parent.tb.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	hostnameEl.value = data["host-name"];
});

const cords = document.querySelector(".cords");
const saveCity = document.querySelector(".save-city");
saveCity.addEventListener("click", e => {
	window.parent.tb.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
		if (err) return console.log(err);
		data = JSON.parse(data);
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				function (position) {
					const latitude = position.coords.latitude;
					const longitude = position.coords.longitude;
					console.log(`${latitude},${longitude}`);
					data["location"] = `${latitude},${longitude}`;
					window.parent.dispatchEvent(new Event("updWeather"));
					window.parent.tb.fs.writeFile("/system/etc/terbium/settings.json", JSON.stringify(data), err => {
						if (err) return console.log(err);
					});
				},
				function (error) {
					console.error(`Error Occured: ${error.code}`);
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0,
				},
			);
		}
	});
});

const accountsButton = document.querySelector(".accounts");
accountsButton.addEventListener("mousedown", e => {
	tb_window.create({
		title: "Accounts",
		src: "/fs/apps/system/settings.tapp/accounts/index.html",
		icon: "/fs/apps/system/settings.tapp/accounts/icon.svg",
		size: {
			width: 400,
			height: 500,
		},
	});
});

const batteryPercentage = document.querySelector(".battery-percentage");
(async () => {
	let showBatteryPercentage = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"))["battery-percent"];
	const realCheckbox = batteryPercentage.querySelector("input[type='checkbox']");
	if (showBatteryPercentage) {
		realCheckbox.checked = true;
		const checkIcon = batteryPercentage.querySelector(".checkIcon");
		checkIcon.classList.remove("opacity-0", "scale-85");
	} else {
		realCheckbox.checked = false;
		const checkIcon = batteryPercentage.querySelector(".checkIcon");
		checkIcon.classList.add("opacity-0", "scale-85");
	}
})();

batteryPercentage.addEventListener("mousedown", async e => {
	let data = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
	const realCheckbox = batteryPercentage.querySelector("input[type='checkbox']");
	realCheckbox.checked = !realCheckbox.checked;
	const checkIcon = batteryPercentage.querySelector(".checkIcon");
	if (realCheckbox.checked) {
		checkIcon.classList.remove("opacity-0", "scale-85");
		tb.battery.showPercentage();
	} else {
		checkIcon.classList.add("opacity-0", "scale-85");
		tb.battery.hidePercentage();
	}
	data["battery-percent"] = realCheckbox.checked;
	window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(data));
});

const getBat = async () => {
	const battery = await window.parent.tb.battery.canUse();
	if (!battery) {
		document.querySelector(".battery").remove();
	}
};
getBat();

const showCords = document.querySelector(".showCords");
showCords.addEventListener("mousedown", async e => {
	showCords.classList.add("opacity-0", "pointer-events-none");
	cords.classList.remove("opacity-0");
	const mouseup = () => {
		showCords.classList.remove("opacity-0", "pointer-events-none");
		cords.classList.add("opacity-0");
		document.removeEventListener("mouseup", mouseup);
	};
	document.addEventListener("mouseup", mouseup);
});

async function exportSettings() {
	let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
	let data = JSON.stringify(settings);
	let blob = new Blob([data], { type: "application/json" });
	let url = URL.createObjectURL(blob);
	let a = document.createElement("a");
	a.href = url;
	a.download = "settings.json";
	a.click();
}

const range = document.getElementById("blurRange");
const pct = document.getElementById("blurPercent");
async function render(initial) {
	const settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
	const v = initial ? settings.window.blurlevel : Number(range.value);
	if (initial) range.value = v;
	const mapped = Math.round((v / 50) * 100);
	pct.textContent = mapped + "%";
	const fill = (v / 50) * 100;
	range.style.background = `linear-gradient(90deg,#60a5fa ${fill}%, rgba(255,255,255,0.12) ${fill}%)`;
	range.dataset.mappedPercent = mapped;
	if (initial) return;
	settings.window.blurlevel = v;
	window.parent.tb.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings, null, 4), "utf8");
	window.parent.dispatchEvent(new Event("upd-accent"));
}

render(true);
range.addEventListener("input", () => render(false));

const winAccent = document.querySelector(".winaccent-preview");
const winAccentPrev = async () => {
	const defaultAccent = "#ffffff";
	accentPreview.classList.remove("group", "cursor-pointer");
	accentPreview.style.setProperty("--accent", defaultAccent);
	let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
	settings.window.winAccent = defaultAccent;
	window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(settings));
	winAccent.removeEventListener("mousedown", winAccentPrev);
	window.parent.dispatchEvent(new Event("upd-accent"));
};
winAccentPrev();

const custom_waccent = document.querySelector(".custom-waccent");
custom_waccent.addEventListener("click", e => {
	const color_picker = document.createElement("input");
	color_picker.type = "color";
	color_picker.click();
	color_picker.addEventListener("change", async e => {
		let color = color_picker.value;
		if (color.charAt(0) !== "#") {
			const rgb = color.match(/\d+/g);
			const r = rgb[0];
			const g = rgb[1];
			const b = rgb[2];
			color = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
			let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
			settings["window"]["winAccent"] = color;
			window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(settings));
			window.parent.dispatchEvent(new Event("upd-accent"));
		} else {
			let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
			settings["window"]["winAccent"] = color;
			window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(settings));
			window.parent.dispatchEvent(new Event("upd-accent"));
		}
		winAccent.style.setProperty("--accent", color);
		winAccent.classList.add("group", "cursor-pointer");
		winAccent.addEventListener("mousedown", winAccentPrev);
	});
});

async function convertTBSIF() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".tbs";
	input.onchange = async () => {
		let file = input.files[0];
		let reader = new FileReader();
		reader.onload = async () => {
			let tbs_config = reader.result;
			let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
			let syssettings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.parent.tb.user.username()}/settings.json`, "utf8"));
			if (tbs_config.theme && tbs_config.theme !== "default") {
				syssettings.theme = tbs_config.theme;
			}
			if (tbs_config.wallpaper && tbs_config.wallpaper !== "default" && settings.wallpaper !== "/assets/wallpapers/1.png") {
				settings.wallpaper = tbs_config.wallpaper;
			}
			if (tbs_config.wallpaperFill && tbs_config.wallpaperFill !== "default") {
				settings.wallpaperMode = tbs_config.wallpaperFill === "contain" ? "cover" : "contain";
			}
			if (tbs_config.shadow === "yes") {
				settings["system-blur"] = true;
			}
			await window.parent.tb.fs.promises.writeFile(`/home/${await window.parent.tb.user.username()}/settings.json`, JSON.stringify(settings, null, 2), "utf8");
			await window.parent.tb.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(syssettings, null, 2), "utf8");
			parent.window.location.reload();
		};
		reader.readAsText(file);
	};
	input.click();
}

const animationCheckbox = document.querySelector(".eruda-check");
const eruda = () => {
	const realCheckbox = animationCheckbox.querySelector("input[type='checkbox']");
	const checkIcon = animationCheckbox.querySelector(".checkIcon");
	const setState = enabled => {
		realCheckbox.checked = enabled;
		if (enabled) {
			checkIcon.classList.remove("opacity-0", "scale-85");
			localStorage.setItem("eruda", "true");
		} else {
			checkIcon.classList.add("opacity-0", "scale-85");
			localStorage.removeItem("eruda");
		}
	};
	setState(localStorage.getItem("eruda") === "true");
	animationCheckbox.addEventListener("mousedown", () => {
		setState(!realCheckbox.checked);
	});
};
eruda();

const windowOptimizationsCheckbox = document.querySelector(".window-optimizations-check");
const setupWindowOptimizations = async () => {
	const realCheckbox = windowOptimizationsCheckbox.querySelector("input[type='checkbox']");
	const checkIcon = windowOptimizationsCheckbox.querySelector(".checkIcon");

	const setState = async enabled => {
		realCheckbox.checked = enabled;
		if (enabled) {
			checkIcon.classList.remove("opacity-0", "scale-85");
		} else {
			checkIcon.classList.add("opacity-0", "scale-85");
		}

		let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
		settings.windowOptimizations = enabled;
		await window.parent.tb.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings, null, 2), "utf8");
	};

	try {
		let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
		setState(settings.windowOptimizations ?? true);
	} catch (err) {
		console.error("Failed to load window optimization settings:", err);
		setState(true);
	}

	windowOptimizationsCheckbox.addEventListener("mousedown", async () => {
		await setState(!realCheckbox.checked);
	});
};
setupWindowOptimizations();

const fpsCounterCheckbox = document.querySelector(".fps-counter-check");
const setupFPSCounter = async () => {
	const realCheckbox = fpsCounterCheckbox.querySelector("input[type='checkbox']");
	const checkIcon = fpsCounterCheckbox.querySelector(".checkIcon");

	const setState = async enabled => {
		realCheckbox.checked = enabled;
		if (enabled) {
			checkIcon.classList.remove("opacity-0", "scale-85");
		} else {
			checkIcon.classList.add("opacity-0", "scale-85");
		}

		let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
		settings.showFPS = enabled;
		await window.parent.tb.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings, null, 2), "utf8");

		window.parent.dispatchEvent(new CustomEvent("settings-changed", { detail: { showFPS: enabled } }));
	};

	try {
		let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
		setState(settings.showFPS ?? false);
	} catch (err) {
		console.error("Failed to load FPS counter settings:", err);
		setState(false);
	}

	fpsCounterCheckbox.addEventListener("mousedown", async () => {
		await setState(!realCheckbox.checked);
	});
};
setupFPSCounter();

const realCheckbox = animationCheckbox.querySelector("input[type='checkbox']");
realCheckbox.checked = !realCheckbox.checked;
const checkIcon = animationCheckbox.querySelector(".checkIcon");
if (realCheckbox.checked) {
	checkIcon.classList.remove("opacity-0", "scale-85");
} else {
	checkIcon.classList.add("opacity-0", "scale-85");
}

const Filer = window.Filer;

const user = sessionStorage.getItem("currAcc");
window.addEventListener("load", event => {
	const dirInput = document.querySelector(".nav-input.dir");
	if (sessionStorage.getItem("ldir")) {
		dirInput.value = sessionStorage.getItem("ldir");
		openPath(sessionStorage.getItem("ldir"));
		sessionStorage.removeItem("ldir");
	} else {
		dirInput.value = `/home/${user}`;
		openPath(`/home/${user}`);
	}
	let currentDir = "/home";
	dirInput.addEventListener("keydown", e => {
		if (e.key === "Enter") {
			if (e.target.value === "") {
				dirInput.value = currentDir;
				return;
			}
			if (e.target.value !== currentDir) {
				openPath(e.target.value);
				currentDir = e.target.value;
			}
		}
	});
});

const back = async () => {
	const dirInput = document.querySelector(".nav-input.dir");
	sessionStorage.setItem("lastDir", dirInput.value);
	if (dirInput.value === "/home") {
		openPath("//");
	} else {
		const input = dirInput.value.trim();
		const parts = input.split("/");
		parts.pop();
		const inp = parts.join("/") + "/";
		openPath(inp);
	}
};

const forward = async () => {
	const dir = sessionStorage.getItem("lastDir");
	openPath(dir);
};

document.getElementById("back").addEventListener("click", back);
document.getElementById("forward").addEventListener("click", forward);
document.getElementById("reload").addEventListener("click", () => {
	openPath(document.querySelector(".nav-input.dir").value);
});

const emptyTrash = async () => {
	await window.parent.tb.fs.promises.readdir("/system/trash").then(async files => {
		if (files.length > 0) {
			for (let file of files) {
				const filePath = `/system/trash/${file}`;
				window.parent.tb.fs.promises.stat(filePath, async (err, stats) => {
					if (err) {
						console.error(err);
						return;
					}
					if (stats.isFile()) {
						window.parent.tb.fs.promises.unlink(filePath);
					} else if (stats.isDirectory()) {
						await window.parent.tb.sh.promises.rm(filePath, { recursive: true });
					}
					if (document.querySelector(".exp").getAttribute("path") === "/system/trash") {
						document.querySelectorAll(".exp .path-item").forEach(item => {
							item.remove();
						});
					}
				});
			}
		}
	});
};

const createCollapsible = async (title, id, opened, children) => {
	const collapsible = document.createElement("div");
	collapsible.classList.add("collapsible-path");
	collapsible.id = id;
	const collapsibleTitleContainer = document.createElement("div");
	collapsibleTitleContainer.classList.add("title");
	const pathTitle = document.createElement("h2");
	pathTitle.textContent = title;
	const collaspeIcon = document.createElement("div");
	collaspeIcon.classList.add("collapsible-icon");
	collaspeIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-button collapse-button">
            <path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clip-rule="evenodd" />
        </svg>
    `;
	collapsibleTitleContainer.appendChild(pathTitle);
	collapsibleTitleContainer.appendChild(collaspeIcon);
	collapsible.appendChild(collapsibleTitleContainer);

	const paths = document.createElement("div");
	paths.classList.add("paths");
	if (opened) {
		paths.classList.remove("collapsed");
		collaspeIcon.querySelector("svg").classList.remove("collapsed");
	} else if (opened === undefined || opened === false) {
		paths.classList.add("collapsed");
		collaspeIcon.querySelector("svg").classList.add("collapsed");
	}
	for (let title in children) {
		const path = document.createElement("div");
		path.classList.add("path-item");
		if (title.toLocaleLowerCase().endsWith(".tapp")) {
			try {
				const data = await window.parent.tb.fs.promises.readFile(`${path}/icon.svg`, "utf8");
				path.innerHTML = data;
			} catch {
				icon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd" />
                        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                    </svg>
                `;
			}
		} else {
			switch (title.toLowerCase()) {
				case "desktop":
					path.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clip-rule="evenodd" />
                        </svg>
                    `;
					path.setAttribute("system-folder", "true");
					path.setAttribute("oneclick", "true");
					break;
				case "documents":
					path.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd" />
                            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                        </svg>
                    `;
					path.setAttribute("system-folder", "true");
					path.setAttribute("oneclick", "true");
					break;
				case "images":
					path.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clip-rule="evenodd" />
                        </svg>
                    `;
					path.setAttribute("system-folder", "true");
					path.setAttribute("oneclick", "true");
					break;
				case "videos":
					path.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zm1.5 0v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5A.375.375 0 003 5.625zm16.125-.375a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 7.125v-1.5a.375.375 0 00-.375-.375h-1.5zM21 9.375A.375.375 0 0020.625 9h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zM4.875 18.75a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5zM3.375 15h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375zm0-3.75h1.5a.375.375 0 00.375-.375v-1.5A.375.375 0 004.875 9h-1.5A.375.375 0 003 9.375v1.5c0 .207.168.375.375.375zm4.125 0a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9z" clip-rule="evenodd" />
                        </svg>
                    `;
					path.setAttribute("system-folder", "true");
					path.setAttribute("oneclick", "true");
					break;
				case "music":
					path.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" clip-rule="evenodd" />
                        </svg>
                    `;
					path.setAttribute("system-folder", "true");
					path.setAttribute("oneclick", "true");
					break;
				case "trash":
					path.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                        </svg>
                    `;
					path.setAttribute("system-folder", "true");
					path.setAttribute("oneclick", "true");
					break;
				case "file system":
					path.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4.08 5.227A3 3 0 016.979 3H17.02a3 3 0 012.9 2.227l2.113 7.926A5.228 5.228 0 0018.75 12H5.25a5.228 5.228 0 00-3.284 1.153L4.08 5.227z" />
                            <path fill-rule="evenodd" d="M5.25 13.5a3.75 3.75 0 100 7.5h13.5a3.75 3.75 0 100-7.5H5.25zm10.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5zm3.75-.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clip-rule="evenodd" />
                        </svg>
                    `;
					path.setAttribute("system-folder", "true");
					path.setAttribute("oneclick", "true");
					break;
				default:
					path.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z"></path>
                        </svg>
                    `;
					path.setAttribute("system-folder", "true");
					path.setAttribute("oneclick", "true");
					path.id = `f-${title.toLowerCase()}`;
					break;
			}
		}
		const pathTitle = document.createElement("span");
		pathTitle.textContent = title;
		path.appendChild(pathTitle);
		paths.appendChild(path);
		function click() {
			openPath(children[title]);
		}
		path.getAttribute("oneclick") === "true" ? path.addEventListener("click", e => click()) : path.addEventListener("dblclick", e => click());
	}
	collapsible.appendChild(paths);
	collapsibleTitleContainer.addEventListener("click", async e => {
		const icon = collapsible.querySelector(".collapsible-icon svg");
		const paths = collapsible.querySelector(".paths");
		let qcdata = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/config.json`, "utf8"));
		if (qcdata["open-collapsibles"]) {
			if (qcdata["open-collapsibles"][id]) {
				if (qcdata["open-collapsibles"][id] === true) {
					qcdata["open-collapsibles"][id] = false;
				} else if (qcdata["open-collapsibles"]["quick-center"] === false) {
					qcdata["open-collapsibles"][id] = true;
				}
			} else {
				if (collapsible.classList.contains("collapsed")) {
					qcdata["open-collapsibles"][id] = false;
				} else {
					qcdata["open-collapsibles"][id] = true;
				}
			}
			await window.parent.tb.fs.promises.writeFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/config.json`, JSON.stringify(qcdata));
		}
		if (icon.classList.contains("collapsed")) {
			icon.classList.remove("collapsed");
			paths.classList.remove("collapsed");
			collapsible.classList.remove("collapsed");
		} else {
			icon.classList.add("collapsed");
			paths.classList.add("collapsed");
			collapsible.classList.add("collapsed");
		}
	});
	document.querySelector(".sidebar").appendChild(collapsible);
	return true;
};

const createStorageDeviceCard = (type, davInfo) => {
	const item = document.createElement("div");
	item.classList.add("sd-item");
	const icon = document.createElement("div");
	icon.classList.add("icon");
	icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.08 5.227A3 3 0 016.979 3H17.02a3 3 0 012.9 2.227l2.113 7.926A5.228 5.228 0 0018.75 12H5.25a5.228 5.228 0 00-3.284 1.153L4.08 5.227z" />
            <path fill-rule="evenodd" d="M5.25 13.5a3.75 3.75 0 100 7.5h13.5a3.75 3.75 0 100-7.5H5.25zm10.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5zm3.75-.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clip-rule="evenodd" />
        </svg>
    `;
	item.appendChild(icon);
	const info = document.createElement("div");
	info.classList.add("info");
	const title = document.createElement("span");
	title.classList.add("title");
	info.appendChild(title);
	const percentContainer = document.createElement("span");
	percentContainer.classList.add("percent-container");
	const percent = document.createElement("span");
	percent.classList.add("percent");
	percent.style.width = "100%";
	percentContainer.appendChild(percent);
	info.appendChild(percentContainer);
	const size = document.createElement("div");
	size.classList.add("size");
	info.appendChild(size);
	item.addEventListener("dblclick", () => {
		switch (type) {
			case "local":
				openPath("local storage");
				break;
			case "fs":
				openPath("//");
				break;
			case "dav":
				openPath(`/mnt/${davInfo.name}/`);
				break;
		}
	});

	switch (type) {
		case "local":
			title.textContent = "Local Storage";
			const maxStorage = 10 * 1024 * 1024;
			const warningThreshold = 90;
			const usedSize = Object.keys(localStorage).reduce((total, key) => {
				const item = localStorage.getItem(key);
				const itemSize = JSON.stringify(item).length * 2;
				const keySize = key.length * 2;
				total += itemSize + keySize;
				return total;
			}, 0);

			const usedPercentage = (usedSize / maxStorage) * 100;
			let formattedSize;
			if (usedSize >= 1024 * 1024 * 1024) {
				formattedSize = `${(usedSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
			} else {
				formattedSize = `${(usedSize / (1024 * 1024)).toFixed(2)} MB`;
			}

			size.textContent = `${formattedSize} of ${maxStorage / (1024 * 1024)} MB`;
			const minWidth = 8;
			const maxWidth = 165;
			const calculatedWidth = (Math.min(usedPercentage, 100) * (maxWidth - minWidth)) / 100 + minWidth;
			percent.style.width = `${Math.min(calculatedWidth, 160)}px`;

			if (usedPercentage >= warningThreshold) {
				percent.style.backgroundColor = "#D8645D";
			} else {
				percent.style.backgroundColor = "#5D78D8";
			}
			break;
		case "fs":
			title.textContent = "File System";
			if ("navigator" in window && "storage" in navigator) {
				navigator.storage.estimate().then(estimate => {
					const totalSize = estimate.quota;
					const usedSize = estimate.usage;
					const usedPercentage = (usedSize / totalSize) * 100;
					let formattedUsedSize, formattedTotalSize;
					if (usedSize >= 1024 * 1024 * 1024) {
						formattedUsedSize = `${(usedSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
					} else {
						formattedUsedSize = `${(usedSize / (1024 * 1024)).toFixed(2)} MB`;
					}
					if (totalSize >= 1024 * 1024 * 1024) {
						formattedTotalSize = `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
					} else {
						formattedTotalSize = `${Math.round((totalSize / (1024 * 1024)).toFixed(2))} MB`;
					}
					size.textContent = `${formattedUsedSize} of ${formattedTotalSize}`;
					const minWidth = 8;
					const maxWidth = 165;
					const calculatedWidth = (Math.min(usedPercentage, 100) * (maxWidth - minWidth)) / 100 + minWidth;
					percent.style.width = `${calculatedWidth}px`;
					if (usedPercentage >= 90) {
						percent.style.backgroundColor = "#D8645D";
					} else {
						percent.style.backgroundColor = "#5D78D8";
					}
				});
			}
			break;
		case "dav":
			title.textContent = davInfo.name || "Dav Drive";
			const displayText = davInfo.url || "http://localhost:3001/dav/";
			size.textContent = displayText.length > 18 ? displayText.slice(0, 18) + "..." : displayText;
			item.id = `f-${davInfo.name.toLocaleLowerCase()}`;
			percent.style.width = "100%";
			const test = async () => {
				const servers = window.parent.tb.vfs.servers;
				if (servers.has(davInfo.name) && servers.get(davInfo.name).connected === true) {
					const icn = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"/>
                            <circle cx="18" cy="17.25" r="3" fill="#5DD881"/>
                        </svg>
                    `;
					document.getElementById(`f-${davInfo.name.toLocaleLowerCase()}`).innerHTML = `
                        ${icn}
                        <span>${davInfo.name}</span>
                    `;
					icon.innerHTML = icn;
					percent.style.backgroundColor = "#5DD881";
				} else {
					const icn = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"/>
                            <circle cx="18" cy="17.25" r="3" fill="#D8645D"/>
                        </svg>
                    `;
					document.getElementById(`f-${davInfo.name.toLocaleLowerCase()}`).innerHTML = `
                        ${icn}
                        <span>${davInfo.name}</span>
                    `;
					icon.innerHTML = icn;
					percent.style.backgroundColor = "#D8645D";
				}
			};
			test();
			break;
	}

	item.appendChild(info);
	return item;
};

const showStorageDevices = () => {
	const exp = document.querySelector(".exp");
	exp.innerHTML = "";
	let fscard = createStorageDeviceCard("fs");
	let lscard = createStorageDeviceCard("local");
	const sd_items = document.createElement("div");
	sd_items.classList.add("sd-items");
	sd_items.appendChild(fscard);
	sd_items.appendChild(lscard);
	const getdav = async () => {
		const davInstances = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
		for (const dav of davInstances) {
			let si = createStorageDeviceCard("dav", { name: dav.name, url: dav.url, user: dav.username, pass: dav.password });
			sd_items.appendChild(si);
		}
	};
	getdav();
	exp.appendChild(sd_items);
	document.querySelector(".drive-modal").style.display = "none";
	const dirInput = document.querySelector(".nav-input.dir");
	dirInput.value = "storage devices";
};

const showLS = async () => {
	const keys = Object.keys(localStorage);
	const exp = document.querySelector(".exp");
	exp.innerHTML = "";
	const dirInput = document.querySelector(".nav-input.dir");
	dirInput.value = "local storage";
	keys.forEach(key => {
		const pathItem = document.createElement("div");
		pathItem.classList.add("path-item", "ls-item");
		const icon = document.createElement("div");
		icon.classList.add("icon");
		icon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clip-rule="evenodd" />
                <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
            </svg>
        `;
		pathItem.appendChild(icon);
		const title = document.createElement("span");
		title.classList.add("title");
		title.textContent = key;
		pathItem.appendChild(title);
		pathItem.setAttribute("path", `local storage/${key}`);
		exp.appendChild(pathItem);
		pathItem.addEventListener("dblclick", e => {
			let lsitem = localStorage.getItem(key);
			tb.dialog.Message({
				title: `Change the key for ${key}`,
				defaultValue: lsitem,
				onOk: async newKey => {
					if (newKey !== null && newKey !== "" && newKey !== lsitem) {
						localStorage.setItem(key, newKey);
					}
				},
			});
		});
	});
};

const useDavClient = async path => {
	const client = window.parent.tb.vfs.currentServer.connection.client;
	let filePath;
	if (path.startsWith("http")) {
		const match = path.match(/^https?:\/\/[^\/]+\/dav\/([^\/]+\/)?(.+)$/);
		filePath = match ? "/" + match[2] : path;
	} else {
		filePath = path.replace(davUrl, "/");
	}
	let mntPath;
	if (path.startsWith("/mnt/")) {
		mntPath = path;
	} else {
		mntPath = window.parent.tb.fs.normalizePath(`/mnt/${window.parent.tb.vfs.currentServer.name}/${filePath}`);
	}
	return { client, filePath, mntPath };
};

const getItemDetails = async path => {
	if (path.includes("http")) {
		const { client, filePath, mntPath } = await useDavClient(path);
		const stats = await client.stat(filePath, { depth: 1 });
		let message = JSON.stringify({
			type: "item-details",
			path: mntPath,
			details: {
				name: stats.basename,
				type: stats.mime,
				size: stats.size,
				created: null,
				modified: stats.lastmod,
				accessed: null,
				owner: "WebDav",
				mode: null,
				version: stats.etag,
			},
		});

		parent.window.tb.window.create({
			title: `Properties`,
			icon: "/fs/apps/system/files.tapp/icon.svg",
			src: "/fs/apps/system/files.tapp/properties/index.html",
			size: {
				width: 350,
				height: 275,
			},
			controls: ["minimize", "close"],
			message: message,
		});
	} else {
		window.parent.tb.fs.stat(path, (err, stats) => {
			if (err) return console.error(err);
			let name = stats.name;
			let type = stats.isFile() ? "File" : stats.isDirectory() ? "Folder" : "Symbolic Link";
			let size = stats.size;
			let created = stats.ctime;
			let modified = stats.mtime;
			let accessed = stats.atime;
			let owner = stats.uid;
			let mode = stats.mode;
			let version = stats.version;

			let message = JSON.stringify({
				type: "item-details",
				path: path,
				details: {
					name: name,
					type: type,
					size: size,
					created: created,
					modified: modified,
					accessed: accessed,
					owner: owner,
					mode: mode,
					version: version,
				},
			});

			parent.window.tb.window.create({
				title: `Properties`,
				icon: "/fs/apps/system/files.tapp/icon.svg",
				src: "/fs/apps/system/files.tapp/properties/index.html",
				size: {
					width: 350,
					height: 275,
				},
				controls: ["minimize", "close"],
				message: message,
			});
		});
	}
};

let copied = null;
let cut = null;

const cm = async e => {
	e.preventDefault();
	if (document.querySelector(".context-menu")) document.querySelector(".context-menu").remove();
	const context = document.createElement("div");
	context.classList.add("context-menu");

	context.classList.add("fade-in");
	setTimeout(() => {
		context.classList.remove("fade-in");
	}, 200);
	let options = [];
	let isTrash = document.querySelector(".exp").getAttribute("path") === "/system/trash" ? true : false;
	if (e.target.getAttribute("type") === "file") {
		options = [
			{
				text: "Open",
				click: async () => {
					let ext = e.target.getAttribute("name");
					if (ext.length > 2) {
						ext = ext.slice(-2).join(".");
					} else {
						ext = ext.slice(-1).join(".");
					}
					const data = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
					if (data["image"].includes(ext)) {
						parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "image");
					} else if (data["video"].includes(ext)) {
						parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "video");
					} else if (data["audio"].includes(ext)) {
						parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "audio");
					} else if (data["pdf"].includes(ext)) {
						parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "pdf");
					} else if (ext.toLowerCase() === "tapp.zip") {
						try {
							const path = e.target.getAttribute("path");
							await window.parent.tb.dialog.Permissions({
								title: "Install application",
								message: `Would you like to install the application: ${path}?`,
								onOk: async () => {
									const appPath = `/fs/${path}`.replace("//", "/");
									const appName =
										path
											.replace(`/home/${window.parent.sessionStorage.getItem("currAcc")}/`, "")
											.replace(/\//g, ".")
											.replace(/\.zip$/, "") + "";
									window.parent.tb.notification.Installing({
										message: `Installing ${appName}...`,
										application: "Files",
										iconSrc: "/fs/apps/system/files.tapp/icon.svg",
										time: 500,
									});
									try {
										const zipFilePath = e.target.getAttribute("path");
										const targetDirectory = `/apps/user/${window.parent.sessionStorage.getItem("currAcc")}/${appName}`;
										await unzip(zipFilePath, targetDirectory, true);
										console.log("Done!");
										const appConf = await window.parent.tb.fs.promises.readFile(`/apps/user/${window.parent.sessionStorage.getItem("currAcc")}/${appName}/.tbconfig`, "utf8");
										const appData = JSON.parse(appConf);
										console.log(appData);
										await window.parent.tb.launcher.addApp({
											name: appData.title,
											icon: appData.icon.includes("http") ? appData.icon : `/fs/apps/user/${window.parent.sessionStorage.getItem("currAcc")}/${appName}/${appData.icon}`,
											title:
												typeof appData.wmArgs.title === "object"
													? {
															text: appData.wmArgs.title.text,
															weight: appData.wmArgs.title.weight,
															html: appData.wmArgs.title.html,
														}
													: appData.wmArgs.title,
											src: `/fs/apps/user/${window.parent.sessionStorage.getItem("currAcc")}/${appName}/${appData.wmArgs.src}`,
											size: {
												width: appData.wmArgs.size.width,
												height: appData.wmArgs.size.height,
											},
											single: appData.wmArgs.single,
											resizable: appData.wmArgs.resizable,
											controls: appData.wmArgs.controls,
											message: appData.wmArgs.message,
											snapable: appData.wmArgs.snapable,
											user: window.parent.sessionStorage.getItem("currAcc"),
										});
										try {
											let apps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
											apps.push({
												name: appName,
												user: await window.parent.tb.user.username(),
												config: `/apps/system/${appName}.tapp/.tbconfig`,
											});
											await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(apps));
										} catch {
											await window.parent.tb.fs.promises.writeFile(
												`/apps/installed.json`,
												JSON.stringify([
													{
														name: appName,
														user: await window.parent.tb.user.username(),
														config: `/apps/system/${appName}.tapp/.tbconfig`,
													},
												]),
											);
										}
										window.parent.tb.notification.Toast({
											message: `${appName} has been installed!`,
											application: "Files",
											iconSrc: "/fs/apps/system/files.tapp/icon.svg",
											time: 5000,
										});
									} catch (e) {
										console.error("Error installing the app:", e);
										window.parent.tb.notification.Toast({
											message: `Failed to install ${appName}. Check the console for details.`,
											application: "Files",
											iconSrc: "/fs/apps/system/files.tapp/icon.svg",
											time: 5000,
										});
									}
								},
							});
						} catch (e) {
							window.parent.tb.dialog.Alert({
								title: "Unexpected Error",
								message: `❌ An Unexpected error occurred when trying to install the app: ${path} Error: ${e}`,
							});
						}
					} else if (data["extractables"].includes(ext) || ext.toLowerCase() === "app.zip" || ext.toLowerCase() === "lib.zip") {
						const zipFilePath = e.target.getAttribute("path");
						const path = item.getAttribute("path").replace(".zip", "");
						const targetDirectory = `${path}`;
						await unzip(zipFilePath, targetDirectory);
						openPath(document.querySelector(".nav-input.dir").value);
					} else if (data["text"].includes(ext)) {
						parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "text");
					} else {
						let handlers = JSON.parse(await window.parent.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["fileAssociatedApps"];
						handlers = Object.entries(handlers).filter(([type, app]) => {
							return !(type === "text" && app === "text-editor") && !(type === "image" && app === "media-viewer") && !(type === "video" && app === "media-viewer") && !(type === "audio" && app === "media-viewer");
						});
						let hands = [];
						for (const [type, app] of handlers) {
							hands.push({ text: app, value: type });
						}
						await tb.dialog.Select({
							title: `Select a application to open: ${e.target.getAttribute("path").split("/").pop()}`,
							options: [
								{
									text: "Text Editor",
									value: "text",
								},
								{
									text: "Media Viewer",
									value: "media",
								},
								{
									text: "Webview",
									value: "webview",
								},
								...hands,
								{
									text: "Other",
									value: "other",
								},
							],
							onOk: async val => {
								switch (val) {
									case "text":
										parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "text");
										break;
									case "media":
										const ext = e.target.getAttribute("name").split(".").pop();
										if (data["image"].includes(ext)) {
											parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "image");
										} else if (data["video"].includes(ext)) {
											parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "video");
										} else if (data["audio"].includes(ext)) {
											parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "audio");
										} else if (data["pdf"].includes(ext)) {
											parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "pdf");
										}
										break;
									case "webview":
										parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "webpage");
										break;
									case "other":
										parent.window.tb.dialog.DirectoryBrowser({
											title: "Select a application",
											filter: ".tapp",
											onOk: async val => {
												const app = JSON.parse(await window.parent.tb.fs.promises.readFile(`${val}/.tbconfig`, "utf8"));
												window.parent.tb.window.create({ ...app.wmArgs, message: { type: "process", path: item.item } });
											},
										});
										break;
									default:
										if (hands.length === 0) {
											parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "text");
										} else {
											parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), val);
										}
										break;
								}
							},
						});
					}
				},
			},
			{
				text: "Open With",
				click: async () => {
					let handlers = JSON.parse(await window.parent.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["fileAssociatedApps"];
					handlers = Object.entries(handlers).filter(([type, app]) => {
						return !(type === "text" && app === "text-editor") && !(type === "image" && app === "media-viewer") && !(type === "video" && app === "media-viewer") && !(type === "audio" && app === "media-viewer");
					});
					let hands = [];
					for (const [type, app] of handlers) {
						hands.push({ text: app, value: type });
					}
					const data = JSON.parse(await window.parent.window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
					await tb.dialog.Select({
						title: `Select a application to open: ${e.target.getAttribute("path").split("/").pop()}`,
						options: [
							{
								text: "Text Editor",
								value: "text",
							},
							{
								text: "Media Viewer",
								value: "media",
							},
							{
								text: "Webview",
								value: "webview",
							},
							...hands,
							{
								text: "Other",
								value: "other",
							},
						],
						onOk: async val => {
							switch (val) {
								case "text":
									parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "text");
									break;
								case "media":
									const ext = e.target.getAttribute("name").split(".").pop();
									if (data["image"].includes(ext)) {
										parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "image");
									} else if (data["video"].includes(ext)) {
										parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "video");
									} else if (data["audio"].includes(ext)) {
										parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "audio");
									} else if (data["pdf"].includes(ext)) {
										parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "pdf");
									}
									break;
								case "webview":
									parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "webpage");
									break;
								case "other":
									parent.window.tb.dialog.DirectoryBrowser({
										title: "Select a application",
										filter: ".tapp",
										onOk: async val => {
											const app = JSON.parse(await window.parent.tb.fs.promises.readFile(`${val}/.tbconfig`, "utf8"));
											window.parent.tb.window.create({ ...app.wmArgs, message: { type: "process", path: item.item } });
										},
									});
									break;
								default:
									if (hands.length === 0) {
										parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), "text");
									} else {
										parent.window.tb.file.handler.openFile(e.target.getAttribute("path"), val);
									}
									break;
							}
						},
					});
				},
			},
			{
				text: "Rename",
				click: async () => {
					try {
						const path = e.target.getAttribute("path");
						const currentFileName = e.target.querySelector(".title").textContent;
						await tb.dialog.Message({
							title: `Enter a new name for ${currentFileName}`,
							defaultValue: currentFileName,
							onOk: async newFileName => {
								if (newFileName === currentFileName) {
									return;
								}
								if (path.includes("http")) {
									const { client, filePath } = await useDavClient(path);
									await client.moveFile(filePath, `${path}/${newFileName}`);
									openPath(document.querySelector(".nav-input.dir").value);
								} else {
									try {
										await window.parent.tb.fs.promises.rename(path, `${e.target.getAttribute("parent-path")}/${newFileName}`);
										const type = e.target.classList.contains("file-item") ? "file" : "folder";
										document.querySelector(`[path="${path}"]`).remove();
										const item = document.createElement("div");
										item.classList.add(`${type}-item`, "path-item");
										const icon = document.createElement("div");
										icon.classList.add("icon");
										let ext = newFileName.split(".").pop();
										const data = await fetch(`/fs//system/etc/terbium/file-icons.json`).then(res => res.json());
										let iconName = data["ext-to-name"][ext];
										let iconPath = data["name-to-path"][iconName];
										let unknown = data["name-to-path"]["Unknown"];
										if (iconPath) {
											icon.innerHTML = iconPath;
										} else {
											icon.innerHTML = unknown;
										}
										item.appendChild(icon);
										const itemTitle = document.createElement("span");
										itemTitle.classList.add("title");
										itemTitle.textContent = newFileName;
										item.appendChild(itemTitle);
										item.setAttribute("path", `${e.target.getAttribute("parent-path")}/${newFileName}`);
										item.setAttribute("name", newFileName);
										let pbs = path.split("/");
										pbs.pop();
										pbs = pbs.join("/");
										item.setAttribute("parent-path", pbs);
										document.querySelector(".exp").appendChild(item);
									} catch (error) {
										console.log(error);
										const ask = await tb.dialog.Message({
											title: `This file already exists. Enter a new name for ${newFileName}`,
											defaultValue: newFileName,
										});
										if (ask !== undefined && ask !== "") {
											await rename(path, ask);
										}
									}
								}
							},
						});
					} catch (error) {
						console.error(error);
					}
				},
			},
			{
				text: "Copy",
				click: async () => {
					copied = { path: e.target.getAttribute("path"), name: e.target.getAttribute("name") };
				},
			},
			{
				text: "Cut",
				click: async () => {
					copied = { path: e.target.getAttribute("path"), name: e.target.getAttribute("name") };
					e.target.classList.add("opacity-50");
					cut = true;
				},
			},
			{
				text: isTrash ? "Delete" : e.target.getAttribute("path").includes("http") ? "Delete File" : "Move To Trash",
				click: async () => {
					const path = e.target.getAttribute("path");
					if (path.includes("http")) {
						const { client, filePath } = await useDavClient(path);
						client.deleteFile(filePath);
						document.querySelector(".exp").removeChild(e.target);
					} else {
						if (document.querySelector(".exp").getAttribute("path") === "/system/trash") {
							await window.parent.tb.fs.promises.unlink(path);
							document.querySelector(".exp").removeChild(e.target);
						} else {
							let data = await window.parent.tb.fs.promises.readFile(path, "utf8");
							await window.parent.tb.fs.promises.writeFile(`/system/trash/${e.target.getAttribute("name")}`, data);
							await window.parent.tb.fs.promises.unlink(path);
							document.querySelector(".exp").removeChild(e.target);
						}
					}
				},
			},
			{
				text: "Download to Computer",
				click: async () => {
					const path = e.target.getAttribute("path");
					const name = e.target.getAttribute("name");
					const lk = document.createElement("a");
					lk.download = name;
					if (path.includes("http")) {
						const { client, filePath } = await useDavClient(path);
						const blob = await client.getFileContents(filePath);
						const stats = await client.stat(filePath);
						const fileBlob = new Blob([blob], { type: stats.mime });
						const url = URL.createObjectURL(fileBlob);
						lk.href = url;
						lk.click();
						URL.revokeObjectURL(url);
					} else {
						fetch(`${window.location.origin}/fs/${path}`)
							.then(response => response.blob())
							.then(blob => {
								const extension = path.split(".").pop().toLowerCase();
								let mimeType;
								switch (extension) {
									case "txt":
										mimeType = "text/plain";
										break;
									case "html":
										mimeType = "text/html";
										break;
									case "jpg":
									case "jpeg":
										mimeType = "image/jpeg";
										break;
									case "png":
										mimeType = "image/png";
										break;
									case "mp4":
										mimeType = "video/mp4";
										break;
									case "mp3":
										mimeType = "audio/mp3";
										break;
									default:
										mimeType = "application/octet-stream";
								}
								const fileBlob = new Blob([blob], { type: mimeType });
								const url = URL.createObjectURL(fileBlob);
								lk.href = url;
								lk.click();
								URL.revokeObjectURL(url);
							})
							.catch(error => {
								console.error(error);
							});
					}
				},
			},
			{
				text: "Properties",
				click: () => {
					getItemDetails(e.target.getAttribute("path"));
				},
			},
		];
	} else if (e.target.getAttribute("type") === "folder") {
		options = [
			{
				text: "Open",
				click: () => {
					openPath(e.target.getAttribute("path"));
				},
			},
			e.target.getAttribute("path") === "/system/trash" || isTrash
				? null
				: {
						text: "New File",
						click: () => {},
					},
			e.target.getAttribute("path") === "/system/trash" || isTrash
				? null
				: {
						text: "New Folder",
						click: async () => {
							await tb.dialog.Message({
								title: "Enter a name for the new folder",
								defaultValue: "",
								onOk: async response => {
									const path = document.querySelector(".exp").getAttribute("path");
									const createUniqueFolder = async (path, folderName, number = null) => {
										const folderPath = `${path}/${folderName}${number !== null ? ` (${number})` : ""}`;
										const exists = await window.parent.tb.fs.promises.exists(folderPath);
										if (exists) {
											return createUniqueFolder(path, folderName, number !== null ? number + 1 : 2);
										} else {
											await window.parent.tb.fs.promises.mkdir(folderPath);
										}
									};
									await createUniqueFolder(path, response);
									openPath(path);
								},
							});
						},
					},
			/* To be finished soon
            e.target.getAttribute("path") === "/system/trash" || isTrash ? null : {
                text: "ZIP Folder",
                click: async () => {
                    self.t = e
                    let zip = {};
                    async function addzip(inp, basePath = '') {
                        const files = await window.parent.tb.fs.promises.readdir(inp);
                        for (const file of files) {
                            const fullPath = `${inp}/${file}`;
                            const stats = await window.parent.tb.fs.promises.stat(fullPath);
                            const zipPath = `${basePath}${file}`;
                            if (stats.isDirectory()) {
                                await addzip(fullPath, `${zipPath}/`);
                            } else {
                                const fileData = await window.parent.tb.fs.promises.readFile(fullPath);
                                zip[zipPath] = new Uint8Array(fileData);
                            }
                        }
                    }
                    await addzip(e.target.getAttribute("path"));
                    await tb.dialog.Select({
                        title: "Where do you want to save the ZIP?",
                        options: [{
                            text: "File System",
                            value: "fs"
                        }, {
                            text: "Computer",
                            value: "pc"
                        }],
                        onOk: async (perm) => {
                            const zipped = window.parent.tb.fflate.zipSync(zip);
                            if (perm === "fs") {
                                await tb.dialog.SaveFile({
                                    title: "Enter a name for the ZIP file",
                                    defualtDir: `/home/${window.parent.sessionStorage.getItem("currAcc")}/`,
                                    filename: `${e.target.getAttribute("name")}.zip`,
                                    onOk: async (value) => {
                                        const zipBlob = new Blob([zipped.buffer], { type: 'application/zip' });
                                        const ab = await zipBlob.arrayBuffer();
                                        await window.parent.tb.fs.promises.writeFile(value, new Uint8Array(ab));
                                        window.parent.tb.notification.Toast({
                                            message: `ZIP file created at ${value}`,
                                            application: "Files",
                                            iconSrc: "/fs/apps/system/files.tapp/icon.svg",
                                            time: 5000,
                                        });
                                    },
                                });
                            } else if (perm === "pc") {
                                const zipBlob = new Blob([zipped.buffer], { type: 'application/zip' });
                                const url = URL.createObjectURL(zipBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${e.target.getAttribute("name")}.zip`;
                                link.click();
                                setTimeout(() => URL.revokeObjectURL(url), 1000);
                            }
                        }
                    });
                }
            },*/
			e.target.getAttribute("path") === "/system/trash" || isTrash || e.target.getAttribute("system-folder") === "true"
				? null
				: {
						text: "Rename",
						click: async () => {
							let path = e.target.getAttribute("path");
							tb.dialog.Message({
								title: `Enter a new name for folder ${e.target.querySelector(".title").textContent}`,
								defaultValue: e.target.getAttribute("name"),
								onOk: async newName => {
									if (newName !== null && newName !== "" && newName !== e.target.querySelector(".title").textContent) {
										const rename = async (path, fileName) => {
											try {
												await window.parent.tb.fs.promises.rename(path, `${e.target.getAttribute("parent-path")}/${fileName}`);
												const type = e.target.classList.contains("file-item") ? "file" : "folder";
												document.querySelector(`[path="${path}"]`).remove();
												const item = document.createElement("div");
												item.classList.add(`${type}-item`, "path-item");
												const icon = document.createElement("div");
												icon.classList.add("icon");
												switch (type) {
													case "file":
														icon.innerHTML = `
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                                                        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                                                    </svg>
                                                `;
														break;
													case "folder":
														icon.innerHTML = `
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
                                                    </svg>
                                                `;
														item.addEventListener("dblclick", e => {
															openPath(e.target.getAttribute("path"));
														});
														break;
												}
												item.appendChild(icon);
												const itemTitle = document.createElement("span");
												itemTitle.classList.add("title");
												itemTitle.textContent = fileName;
												item.appendChild(itemTitle);
												item.setAttribute("path", `${e.target.getAttribute("parent-path")}/${fileName}`);
												let pbs = path.split("/");
												pbs.pop();
												pbs = pbs.join("/");
												item.setAttribute("parent-path", pbs);
												document.querySelector(".exp").appendChild(item);
											} catch (error) {
												console.log(error);
												tb.dialog.Message({
													title: `Enter a new name for ${fileName}`,
													defaultValue: fileName,
													onOk: async ask => {
														if (ask !== null && ask !== "") {
															await rename(path, ask);
														}
													},
												});
											}
										};
										await rename(path, newName);
									}
								},
							});
						},
					},
			// isTrash ? {
			//     text: "Restore",
			//     click: async () => {}
			// } : null,
			e.target.getAttribute("path") === "/system/trash" || e.target.getAttribute("system-folder") === "true"
				? null
				: {
						text: isTrash ? "Delete" : "Move To Trash",
						click: async () => {
							const path = e.target.getAttribute("path");
							if (document.querySelector(".exp").getAttribute("path") === "/system/trash") {
								await window.parent.tb.fs.promises.readdir(path, async (err, files) => {
									if (err) {
										console.error(err);
										return;
									}
									if (files.length > 0) {
										for (const file of files) {
											const filePath = `${path}/${file}`;
											await window.parent.tb.fs.unlink(filePath);
										}
										await window.parent.tb.fs.promises.rmdir(path);
										document.querySelector(".exp").removeChild(e.target);
									} else {
										await window.parent.tb.fs.promises.rmdir(path);
										document.querySelector(".exp").removeChild(e.target);
									}
								});
							} else {
								await window.parent.tb.fs.promises.readdir(path, async (err, files) => {
									if (err) {
										console.error(err);
										return;
									}
									if (files.length > 0) {
										await window.parent.tb.fs.promises.mkdir("/system/trash/" + path.split("/").pop());
										for (const file of files) {
											const filePath = `${path}/${file}`;
											let data = await window.parent.tb.fs.readFile(filePath, "utf8");
											await window.parent.tb.fs.promises.writeFile(`/system/trash/${path.split("/").pop()}/${file}`, data);
											await window.parent.tb.fs.promises.unlink(filePath);
										}
										await window.parent.tb.fs.promises.rmdir(path);
										document.querySelector(".exp").removeChild(e.target);
									} else {
										await window.parent.tb.fs.promises.rmdir(path);
										await window.parent.tb.fs.promises.mkdir("/system/trash/" + path.split("/").pop());
										document.querySelector(".exp").removeChild(e.target);
									}
								});
							}
						},
					},
			// e.target.getAttribute("path") === "/system/trash" ? {
			//     text: "Restore All",
			//     click: () => {}
			// } : null,
			e.target.getAttribute("path") === "/system/trash"
				? {
						text: "Empty Trash",
						click: async () => emptyTrash(),
					}
				: null,
			// {
			//     text: "Properties",
			//     click: () => {}
			// }
		];
	} else {
		options = [
			isTrash
				? null
				: {
						text: "New File",
						click: async () => {
							try {
								await tb.dialog.Message({
									title: "Enter a name for the new file",
									defaultValue: "",
									onOk: async fileName => {
										const path = document.querySelector(".exp").getAttribute("path");
										const createFile = async (path, fileName) => {
											if (e.target.getAttribute("path").includes("http")) {
												const { client, filePath } = await useDavClient(path);
												const exists = await client.exists(`${filePath}/${fileName}`);
												if (exists) {
													const ask = await tb.dialog.Message({
														title: `This file already exists. Enter a new name for ${fileName}`,
														defaultValue: "",
													});
													if (ask !== undefined && ask !== "") {
														await createFile(path, ask);
													}
												} else {
													client.putFileContents(`${filePath}/${fileName}`, "");
													createPath(fileName, `${filePath}/${fileName}`, "file");
												}
											} else {
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
														let sh = window.parent.tb.sh;
														await sh.touch(`${path}/${fileName}`, "");
														createPath(fileName, `${path}/${fileName}`, "file");
													}
												});
											}
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
							await tb.dialog.Message({
								title: "Enter a name for the new folder",
								defaultValue: "",
								onOk: async response => {
									const path = document.querySelector(".exp").getAttribute("path");
									if (path.includes("http")) {
										const { client, filePath } = await useDavClient(path);
										const exists = await client.exists(`${filePath}/${response}`);
										if (exists) {
											const ask = await tb.dialog.Message({
												title: `This folder already exists. Enter a new name for ${response}`,
												defaultValue: "",
											});
											if (ask !== undefined && ask !== "") {
												await createFile(path, ask);
											}
										} else {
											client.createDirectory(`${filePath}/${response}`);
										}
									} else {
										const createUniqueFolder = async (path, folderName, number = null) => {
											const folderPath = `${path}/${folderName}${number !== null ? ` (${number})` : ""}`;
											const exists = await window.parent.tb.fs.promises.exists(folderPath);
											if (exists) {
												return createUniqueFolder(path, folderName, number !== null ? number + 1 : 2);
											} else {
												await window.parent.tb.fs.promises.mkdir(folderPath);
											}
										};
										await createUniqueFolder(path, response);
									}
									createPath(response, `${path}/${response}`, "folder");
								},
							});
						},
					},
			isTrash
				? null
				: copied || cut
					? {
							text: "Paste",
							click: async () => {
								await window.parent.tb.fs.promises.writeFile(`${document.querySelector(".exp").getAttribute("path")}/${copied.name}`, await window.parent.tb.fs.promises.readFile(copied.path, "utf8"));
								if (cut) {
									await window.parent.tb.fs.promises.unlink(copied.path);
									cut = false;
								}
								copied = null;
								openPath(`${document.querySelector(".exp").getAttribute("path")}`);
							},
						}
					: null,
			isTrash
				? null
				: {
						text: "Upload from Computer",
						click: () => {
							const fauxput = document.createElement("input");
							fauxput.type = "file";
							fauxput.multiple = true;
							fauxput.onchange = async e => {
								const path = document.querySelector(".exp").getAttribute("path");
								if (path.includes("http")) {
									for (const file of e.target.files) {
										const content = await file.arrayBuffer();
										const { client, filePath } = await useDavClient(path);
										const exists = await client.exists(`${filePath}/${file.name}`);
										if (exists) {
											await tb.dialog.Message({
												title: `File "${file.name}" already exists`,
												defaultValue: file.name,
												onOk: async newFileName => {
													if (newFileName !== null && newFileName !== "") {
														client.putFileContents(`${filePath}/${newFileName}`, window.parent.tb.buffer.from(content));
													}
												},
											});
										} else {
											client.putFileContents(`${filePath}/${file.name}`, window.parent.tb.buffer.from(content));
										}
									}
								} else {
									for (const file of e.target.files) {
										const content = await file.arrayBuffer();
										const filePath = `${path}/${file.name}`;
										const exists = await window.parent.tb.fs.promises.exists(filePath);
										if (exists) {
											await tb.dialog.Message({
												title: `File "${file.name}" already exists`,
												defaultValue: file.name,
												onOk: async newFileName => {
													if (newFileName !== null && newFileName !== "") {
														await window.parent.tb.fs.promises.writeFile(`${path}/${newFileName}`, window.parent.tb.buffer.from(content), "arraybuffer");
													}
												},
											});
										} else {
											await window.parent.tb.fs.promises.writeFile(filePath, window.parent.tb.buffer.from(content), "arraybuffer");
										}
									}
								}
								openPath(document.querySelector(".nav-input.dir").value);
							};
							fauxput.click();
						},
					},
			isTrash
				? null
				: !showHidden
					? {
							text: "Show hidden files",
							click: async () => {
								const config = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${user}/files/config.json`, "utf8"));
								config["show-hidden-files"] = true;
								await window.parent.tb.fs.promises.writeFile(`/apps/user/${user}/files/config.json`, JSON.stringify(config));
								openPath(document.querySelector(".nav-input.dir").value);
							},
						}
					: {
							text: "Hide hidden files",
							click: async () => {
								const config = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${user}/files/config.json`, "utf8"));
								config["show-hidden-files"] = false;
								await window.parent.tb.fs.promises.writeFile(`/apps/user/${user}/files/config.json`, JSON.stringify(config));
								openPath(document.querySelector(".nav-input.dir").value);
							},
						},
			// isTrash ? null : {
			//     text: "Paste",
			//     click: () => {}
			// },
			isTrash
				? {
						text: "Restore All",
						click: () => {},
					}
				: null,
			isTrash
				? {
						text: "Empty Trash",
						click: async () => emptyTrash(),
					}
				: null,
			// {
			//     text: "Properties",
			//     click: () => {}
			// },
		];
	}
	for (let option of options) {
		if (option === null) continue;
		const optionEl = document.createElement("div");
		optionEl.classList.add("context-menu-button");
		optionEl.textContent = option.text;
		optionEl.addEventListener("click", option.click);
		context.appendChild(optionEl);
	}
	document.body.appendChild(context);
	if (e.clientX + context.offsetWidth > window.innerWidth) {
		context.style.left = `${e.clientX - context.offsetWidth}px`;
	} else {
		context.style.left = `${e.clientX}px`;
	}
	if (e.clientY + context.offsetHeight > window.innerHeight) {
		context.style.top = `${e.clientY - context.offsetHeight}px`;
	} else {
		context.style.top = `${e.clientY}px`;
	}
	window.addEventListener("click", e => {
		if (e.button === 0) {
			if (!e.target.classList.contains("context-menu")) {
				if (document.querySelector(".context-menu")) document.querySelector(".context-menu").remove();
			}
		}
	});
};
window.addEventListener("contextmenu", cm);
window.addEventListener("touchhold", cm);

let showHidden = false;

const createPath = async (title, path, type) => {
	const config = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${user}/files/config.json`, "utf8"));
	if (config["show-hidden-files"] === false && title.startsWith(".")) return;

	showHidden = config["show-hidden-files"];
	let item = document.createElement("div");
	item.classList.add("path-item");
	item.setAttribute("path", path);
	item.setAttribute("name", title);
	item.setAttribute("type", type);
	let pbs = path.split("/");
	pbs.pop();
	pbs = pbs.join("/");
	item.setAttribute("parent-path", pbs);
	const icon = document.createElement("div");
	icon.classList.add("icon");
	let itemTitle = document.createElement("span");
	itemTitle.classList.add("title");
	itemTitle.textContent = title;
	if (type === "file") {
		item.classList.add("file-item");
		let ext = path.split(".").pop();
		const data = JSON.parse(await window.parent.window.parent.tb.fs.promises.readFile("/system/etc/terbium/file-icons.json"));
		let iconName = data["ext-to-name"][ext];
		let iconPath = data["name-to-path"][iconName];
		let unknown = data["name-to-path"]["Unknown"];
		if (iconPath) {
			const imgData = await window.parent.tb.fs.promises.readFile(iconPath, "utf8");
			icon.innerHTML = imgData;
		} else {
			const imgData = await window.parent.tb.fs.promises.readFile(unknown, "utf8");
			icon.innerHTML = imgData;
		}
		if (copied && copied.name === item.getAttribute("name").toLowerCase() && cut) {
			item.classList.add("opacity-50");
		}
		item.ondblclick = async e => {
			let ext = path.split(".");
			if (ext.length > 2) {
				ext = ext.slice(-2).join(".");
			} else {
				ext = ext.slice(-1).join(".");
			}
			const data = JSON.parse(await window.parent.window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
			if (data["image"].includes(ext)) {
				parent.window.tb.file.handler.openFile(item.getAttribute("path"), "image");
			} else if (data["video"].includes(ext)) {
				parent.window.tb.file.handler.openFile(item.getAttribute("path"), "video");
			} else if (data["audio"].includes(ext)) {
				parent.window.tb.file.handler.openFile(item.getAttribute("path"), "audio");
			} else if (data["pdf"].includes(ext)) {
				parent.window.tb.file.handler.openFile(item.getAttribute("path"), "pdf");
			} else if (ext.toLowerCase() === "tapp.zip") {
				try {
					const path = e.target.getAttribute("path");
					await window.parent.tb.dialog.Permissions({
						title: "Install application",
						message: `Would you like to install the application: ${path}?`,
						onOk: async () => {
							const appPath = `/fs/${path}`.replace("//", "/");
							const appName =
								path
									.replace(`/home/${window.parent.sessionStorage.getItem("currAcc")}/`, "")
									.replace(/\//g, ".")
									.replace(/\.zip$/, "") + "";
							window.parent.tb.notification.Installing({
								message: `Installing ${appName}...`,
								application: "Files",
								iconSrc: "/fs/apps/system/files.tapp/icon.svg",
								time: 500,
							});
							try {
								const zipFilePath = e.target.getAttribute("path");
								const targetDirectory = `/apps/user/${window.parent.sessionStorage.getItem("currAcc")}/${appName}`;
								await unzip(zipFilePath, targetDirectory, true);
								console.log("Done!");
								const appConf = await window.parent.tb.fs.promises.readFile(`/apps/user/${window.parent.sessionStorage.getItem("currAcc")}/${appName}/.tbconfig`, "utf8");
								const appData = JSON.parse(appConf);
								console.log(appData);
								await window.parent.tb.launcher.addApp({
									name: appData.title,
									icon: appData.icon.includes("http") ? appData.icon : `/fs/apps/user/${window.parent.sessionStorage.getItem("currAcc")}/${appName}/${appData.icon}`,
									title:
										typeof appData.wmArgs.title === "object"
											? {
													text: appData.wmArgs.title.text,
													weight: appData.wmArgs.title.weight,
													html: appData.wmArgs.title.html,
												}
											: appData.wmArgs.title,
									src: `/fs/apps/user/${window.parent.sessionStorage.getItem("currAcc")}/${appName}/${appData.wmArgs.src}`,
									size: {
										width: appData.wmArgs.size.width,
										height: appData.wmArgs.size.height,
									},
									single: appData.wmArgs.single,
									resizable: appData.wmArgs.resizable,
									controls: appData.wmArgs.controls,
									message: appData.wmArgs.message,
									snapable: appData.wmArgs.snapable,
									user: window.parent.sessionStorage.getItem("currAcc"),
								});
								try {
									let apps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
									apps.push({
										name: appName,
										user: await window.parent.tb.user.username(),
										config: `/apps/user/${await window.parent.tb.user.username()}/${appName}/.tbconfig`,
									});
									await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(apps));
								} catch {
									await window.parent.tb.fs.promises.writeFile(
										`/apps/installed.json`,
										JSON.stringify([
											{
												name: appName,
												user: await window.parent.tb.user.username(),
												config: `/apps/user/${await window.parent.tb.user.username()}/${appName}/.tbconfig`,
											},
										]),
									);
								}
								window.parent.tb.notification.Toast({
									message: `${appName} has been installed!`,
									application: "Files",
									iconSrc: "/fs/apps/system/files.tapp/icon.svg",
									time: 5000,
								});
							} catch (e) {
								console.error("Error installing the app:", e);
								window.parent.tb.notification.Toast({
									message: `Failed to install ${appName}. Check the console for details.`,
									application: "Files",
									iconSrc: "/fs/apps/system/files.tapp/icon.svg",
									time: 5000,
								});
							}
						},
					});
				} catch (e) {
					window.parent.tb.dialog.Alert({
						title: "Unexpected Error",
						message: `❌ An Unexpected error occurred when trying to install the app: ${path} Error: ${e}`,
					});
				}
			} else if (data["extractables"].includes(ext) || ext.toLowerCase() === "app.zip" || ext.toLowerCase() === "lib.zip") {
				const zipFilePath = e.target.getAttribute("path");
				const path = item.getAttribute("path").replace(".zip", "");
				const targetDirectory = `${path}`;
				await unzip(zipFilePath, targetDirectory);
				openPath(document.querySelector(".nav-input.dir").value);
			} else if (data["text"].includes(ext)) {
				parent.window.tb.file.handler.openFile(item.getAttribute("path"), "text");
			} else {
				let handlers = JSON.parse(await window.parent.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["fileAssociatedApps"];
				handlers = Object.entries(handlers).filter(([type, app]) => {
					return !(type === "text" && app === "text-editor") && !(type === "image" && app === "media-viewer") && !(type === "video" && app === "media-viewer") && !(type === "audio" && app === "media-viewer");
				});
				let hands = [];
				for (const [type, app] of handlers) {
					hands.push({ text: app, value: type });
				}
				await tb.dialog.Select({
					title: `Select a application to open: ${item.getAttribute("path").split("/").pop()}`,
					options: [
						{
							text: "Text Editor",
							value: "text",
						},
						{
							text: "Media Viewer",
							value: "media",
						},
						{
							text: "Webview",
							value: "webview",
						},
						...hands,
						{
							text: "Other",
							value: "other",
						},
					],
					onOk: async val => {
						switch (val) {
							case "text":
								parent.window.tb.file.handler.openFile(item.getAttribute("path"), "text");
								break;
							case "media":
								const ext = e.target.getAttribute("name").split(".").pop();
								if (data["image"].includes(ext)) {
									parent.window.tb.file.handler.openFile(item.getAttribute("path"), "image");
								} else if (data["video"].includes(ext)) {
									parent.window.tb.file.handler.openFile(item.getAttribute("path"), "video");
								} else if (data["audio"].includes(ext)) {
									parent.window.tb.file.handler.openFile(item.getAttribute("path"), "audio");
								} else if (data["pdf"].includes(ext)) {
									parent.window.tb.file.handler.openFile(item.getAttribute("path"), "pdf");
								}
								break;
							case "webview":
								parent.window.tb.file.handler.openFile(item.getAttribute("path"), "webpage");
								break;
							case "other":
								parent.window.tb.dialog.DirectoryBrowser({
									title: "Select a application",
									filter: ".tapp",
									onOk: async val => {
										const app = JSON.parse(await window.parent.tb.fs.promises.readFile(`${val}/.tbconfig`, "utf8"));
										window.parent.tb.window.create({ ...app.wmArgs, message: { type: "process", path: item.item } });
									},
								});
								break;
							default:
								if (hands.length === 0) {
									parent.window.tb.file.handler.openFile(item.getAttribute("path"), "text");
								} else {
									parent.window.tb.file.handler.openFile(item.getAttribute("path"), val);
								}
								break;
						}
					},
				});
			}
		};
	} else if (type === "folder") {
		if (title.toLocaleLowerCase().endsWith(".tapp")) {
			try {
				if (await window.parent.tb.vfs.whatFS(path).promises.exists(`${path}/.tbconfig`)) {
					const appData = JSON.parse(await window.parent.tb.vfs.whatFS(path).promises.readFile(`${path}/.tbconfig`, "utf8"));
					const iconPath = appData.icon.includes("http") ? appData.icon : `${path}/${appData.icon}`;
					if (iconPath.startsWith("http")) {
						icon.innerHTML = `<img src="${iconPath}" alt="${appData.title || ""}" />`;
					} else if (iconPath.toLowerCase().endsWith(".svg")) {
						const imgData = await window.parent.tb.vfs.whatFS(path).promises.readFile(iconPath, "utf8");
						icon.innerHTML = imgData;
					} else {
						const bin = await window.parent.tb.vfs.whatFS(path).promises.readFile(iconPath);
						const b64 = window.parent.tb.buffer.from(bin).toString("base64");
						let mime = "application/octet-stream";
						if (iconPath.toLowerCase().endsWith(".png")) mime = "image/png";
						else if (iconPath.toLowerCase().endsWith(".jpg") || iconPath.toLowerCase().endsWith(".jpeg")) mime = "image/jpeg";
						else if (iconPath.toLowerCase().endsWith(".webp")) mime = "image/webp";
						icon.innerHTML = `<img src="data:${mime};base64,${b64}" alt="${appData.title || ""}" />`;
					}
				} else if (await window.parent.tb.vfs.whatFS(path).promises.exists(`${path}/index.json`)) {
					const appData = JSON.parse(await window.parent.tb.vfs.whatFS(path).promises.readFile(`${path}/index.json`, "utf8"));
					const iconPath = appData.config.icon.includes("http") ? appData.config.icon : `${appData.config.icon.replace("/fs/", "/")}`;
					const imgData = await window.parent.tb.vfs.whatFS(path).promises.readFile(iconPath, "utf8");
					icon.innerHTML = imgData;
				} else {
					const data = await window.parent.tb.vfs.whatFS(path).promises.readFile(`${path}/icon.svg`, "utf8");
					icon.innerHTML = data;
				}
			} catch {
				icon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd" />
                        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                    </svg>
                `;
			}
		} else if (title.toLocaleLowerCase().endsWith(".app")) {
			try {
				if (await window.parent.tb.vfs.whatFS(path).promises.exists(`${path}/manifest.json`)) {
					const appData = JSON.parse(await window.parent.tb.vfs.whatFS(path).promises.readFile(`${path}/manifest.json`, "utf8"));
					const iconPath = appData.icon.includes("http") ? appData.icon : `${path}/${appData.icon}`;
					const imgData = await window.parent.tb.vfs.whatFS(path).promises.readFile(iconPath, "utf8");
					icon.innerHTML = imgData;
				}
			} catch {
				icon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd" />
                        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                    </svg>
                `;
			}
		} else {
			switch (title.toLowerCase()) {
				case "desktop":
					icon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                            <path fill-rule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clip-rule="evenodd" />
                        </svg>
                    `;
					break;
				case "documents":
					icon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                            <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd" />
                            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                        </svg>
                    `;
					break;
				case "images":
					icon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clip-rule="evenodd" />
                        </svg>
                    `;
					break;
				case "videos":
					icon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zm1.5 0v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5A.375.375 0 003 5.625zm16.125-.375a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 7.125v-1.5a.375.375 0 00-.375-.375h-1.5zM21 9.375A.375.375 0 0020.625 9h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zM4.875 18.75a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5zM3.375 15h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375zm0-3.75h1.5a.375.375 0 00.375-.375v-1.5A.375.375 0 004.875 9h-1.5A.375.375 0 003 9.375v1.5c0 .207.168.375.375.375zm4.125 0a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9z" clip-rule="evenodd" />
                        </svg>
                    `;
					break;
				case "music":
					icon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" clip-rule="evenodd" />
                        </svg>
                    `;
					break;
				case "trash":
					icon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                        </svg>
                    `;
					break;
				default:
					icon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
                        </svg>
                    `;
					break;
			}
		}
		switch (pbs) {
			case "/home":
				switch (title.toLowerCase()) {
					case "documents":
						title = "Documents";
						item.setAttribute("system-folder", "true");
						break;
					case "images":
						title = "Images";
						item.setAttribute("system-folder", "true");
						break;
					case "videos":
						title = "Videos";
						item.setAttribute("system-folder", "true");
						break;
					case "music":
						title = "Music";
						item.setAttribute("system-folder", "true");
						break;
					case "trash":
						title = "Trash";
						item.setAttribute("system-folder", "true");
						break;
				}
		}
		item.addEventListener("dblclick", e => {
			openPath(path);
			const dirInput = document.querySelector(".nav-input.dir");
			dirInput.value = path;
		});
	}
	item.appendChild(icon);
	item.appendChild(itemTitle);
	document.querySelector(".exp").appendChild(item);
};

const openPath = async (path, override = false) => {
	if (path === "/system/trash") {
		if (parent.document.querySelector(`[control-id="files-et"]`)) {
			parent.document.querySelector(`[control-id="files-et"]`).classList.remove("hidden");
		}
	} else if (path === "cmd") {
		const path = document.querySelector(".exp").getAttribute("path");
		let message = JSON.stringify({
			type: "open-path",
			path: path,
		});
		document.querySelector(".nav-input.dir").value = path;
		parent.window.tb.window.create({
			title: "Terminal",
			icon: "/fs/apps/system/terminal.tapp/icon.svg",
			src: "/fs/apps/system/terminal.tapp/index.html",
			size: {
				width: 438,
				height: 326,
			},
			single: true,
			message: message,
		});
		return;
	} else {
		if (parent.document.querySelector(`[control-id="files-et"]`)) {
			parent.document.querySelector(`[control-id="files-et"]`).classList.add("hidden");
		}
	}
	if (path === "storage devices") {
		showStorageDevices();
		return;
	}
	if (path === "local storage") {
		showLS();
		const modal = document.querySelector(".drive-modal");
		modal.style.display = "flex";
		modal.innerHTML = `
			<svg style="width: 22px; height: fit-content;" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.08 5.227A3 3 0 016.979 3H17.02a3 3 0 012.9 2.227l2.113 7.926A5.228 5.228 0 0018.75 12H5.25a5.228 5.228 0 00-3.284 1.153L4.08 5.227z"></path>
                <path fill-rule="evenodd" d="M5.25 13.5a3.75 3.75 0 100 7.5h13.5a3.75 3.75 0 100-7.5H5.25zm10.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5zm3.75-.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clip-rule="evenodd"></path>
            </svg>
			<span>LFS</span>
		`;
		return;
	}
	if (path.includes("mnt")) {
		window.parent.tb.vfs.setServer(path.split("/")[2]);
		let davConfig = window.parent.tb.vfs.currentServer;
		console.log("Loading webdav: " + davConfig.url + path.split("/")[2]);
		let relPath = path.replace(`/mnt/${davConfig.name}/`, "/");
		console.log(relPath);
		const exp = document.querySelector(".exp");
		exp.innerHTML = "";
		exp.setAttribute("path", davConfig.url + relPath);
		const dirInput = document.querySelector(".nav-input.dir");
		dirInput.value = path;
		exp.innerHTML = `<div style="padding:1em;">Loading WebDAV...</div>`;
		const modal = document.querySelector(".drive-modal");
		try {
			const client = window.parent.tb.vfs.currentServer.connection.client;
			const contents = await client.getDirectoryContents(relPath);
			exp.innerHTML = "";
			document.getElementById(`f-${davConfig.name.toLocaleLowerCase()}`).innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"/>
                    <circle cx="18" cy="17.25" r="3" fill="#5DD881"/>
                </svg>
                <span>${davConfig.name}</span>
            `;
			modal.style.display = "flex";
			modal.innerHTML = `
				<svg style="width: 22px; height: fit-content;" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"/>
                    <circle cx="18" cy="17.25" r="3" fill="#5DD881"/>
                </svg>
				<span>WebDav</span>
			`;
			for (const item of contents) {
				const name = item.basename;
				const itemPath = `${davConfig.url}${relPath}/${name}`;
				if (item.type === "directory" && item.filename === path.replace(`/mnt/${davConfig.name}/`, "")) continue;
				const type = item.type === "directory" ? "folder" : "file";
				const el = document.createElement("div");
				el.classList.add("path-item", type === "folder" ? "folder-item" : "file-item");
				el.setAttribute("path", itemPath);
				el.setAttribute("name", name);
				el.setAttribute("type", type);
				const icon = document.createElement("div");
				icon.classList.add("icon");
				if (type === "folder") {
					icon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
                        </svg>
                    `;
				} else {
					const data = JSON.parse(await window.parent.window.parent.tb.fs.promises.readFile("/system/etc/terbium/file-icons.json"));
					const ext = itemPath.split(".").pop();
					const iconName = data["ext-to-name"][ext];
					let iconPath = data["name-to-path"][iconName];
					let unknown = data["name-to-path"]["Unknown"];
					if (iconPath) {
						icon.innerHTML = await window.parent.window.parent.tb.fs.promises.readFile(iconPath, "utf8");
					} else {
						icon.innerHTML = await window.parent.window.parent.tb.fs.promises.readFile(unknown, "utf8");
					}
				}
				el.appendChild(icon);
				const itemTitle = document.createElement("span");
				itemTitle.classList.add("title");
				itemTitle.textContent = name;
				el.appendChild(itemTitle);
				if (type === "folder") {
					el.addEventListener("dblclick", () => openPath(itemPath.replace(davConfig.url, `/mnt/${davConfig.name}`)));
				} else {
					el.addEventListener("dblclick", async () => {
						let handlers = JSON.parse(await window.parent.tb.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["fileAssociatedApps"];
						handlers = Object.entries(handlers).filter(([type, app]) => {
							return !(type === "text" && app === "text-editor") && !(type === "image" && app === "media-viewer") && !(type === "video" && app === "media-viewer") && !(type === "audio" && app === "media-viewer");
						});
						let hands = [];
						for (const [type, app] of handlers) {
							hands.push({ text: app, value: type });
						}
						const data = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
						await tb.dialog.Select({
							title: `Select a application to open: ${itemPath.split("/").pop()}`,
							options: [
								{
									text: "Text Editor",
									value: "text",
								},
								{
									text: "Media Viewer",
									value: "media",
								},
								...hands,
								{
									text: "Other",
									value: "other",
								},
							],
							onOk: async val => {
								switch (val) {
									case "text":
										parent.window.tb.file.handler.openFile(itemPath, "text");
										break;
									case "media":
										const ext = itemPath.split(".").pop();
										if (data["image"].includes(ext)) {
											parent.window.tb.file.handler.openFile(itemPath, "image");
										} else if (data["video"].includes(ext)) {
											parent.window.tb.file.handler.openFile(itemPath, "video");
										} else if (data["audio"].includes(ext)) {
											parent.window.tb.file.handler.openFile(itemPath, "audio");
										} else if (data["pdf"].includes(ext)) {
											parent.window.tb.file.handler.openFile(itemPath, "pdf");
										}
										break;
									case "webview":
										parent.window.tb.file.handler.openFile(itemPath, "webpage");
										break;
									case "other":
										parent.window.tb.dialog.DirectoryBrowser({
											title: "Select a application",
											filter: ".tapp",
											onOk: async val => {
												const app = JSON.parse(await window.parent.tb.fs.promises.readFile(`${val}/.tbconfig`, "utf8"));
												window.parent.tb.window.create({ ...app.wmArgs, message: { type: "process", path: item.item } });
											},
										});
										break;
									default:
										if (hands.length === 0) {
											parent.window.tb.file.handler.openFile(itemPath, "text");
										} else {
											parent.window.tb.file.handler.openFile(itemPath, val);
										}
										break;
								}
							},
						});
					});
				}
				exp.appendChild(el);
			}
		} catch (e) {
			console.error(e);
			exp.innerHTML = `<h1 style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; display: flex; align-items: center; justify-content: center; height: 100%;">Failed to load WebDAV: ${e}</h1>`;
			document.getElementById(`f-${davConfig.name.toLocaleLowerCase()}`).innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"/>
                    <circle cx="18" cy="17.25" r="3" fill="#D8645D"/>
                </svg>
                <span>${davConfig.name}</span>
            `;
			modal.style.display = "flex";
			modal.innerHTML = `
				<svg style="width: 22px; height: fit-content;" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25ZM15.75 18C15.9489 18 16.1397 17.921 16.2803 17.7803C16.421 17.6397 16.5 17.4489 16.5 17.25C16.5 17.0511 16.421 16.8603 16.2803 16.7197C16.1397 16.579 15.9489 16.5 15.75 16.5C15.5511 16.5 15.3603 16.579 15.2197 16.7197C15.079 16.8603 15 17.0511 15 17.25C15 17.4489 15.079 17.6397 15.2197 17.7803C15.3603 17.921 15.5511 18 15.75 18ZM19.5 17.25C19.5 17.4489 19.421 17.6397 19.2803 17.7803C19.1397 17.921 18.9489 18 18.75 18C18.5511 18 18.3603 17.921 18.2197 17.7803C18.079 17.6397 18 17.4489 18 17.25C18 17.0511 18.079 16.8603 18.2197 16.7197C18.3603 16.579 18.5511 16.5 18.75 16.5C18.9489 16.5 19.1397 16.579 19.2803 16.7197C19.421 16.8603 19.5 17.0511 19.5 17.25Z"/>
                    <circle cx="18" cy="17.25" r="3" fill="#D8645D"/>
                </svg>
				<span>WebDav</span>
			`;
		}
		const search = document.querySelector(".nav-input.search");
		search.setAttribute("placeholder", `Search ${path.split("/").pop()}`);
		return;
	} else {
		document.querySelector(".drive-modal").style.display = "none";
	}
	if (path.split("/").pop() === "") {
		path = path.substring(0, path.length - 1);
	}
	await window.parent.tb.fs.exists(path, async exists => {
		if (!exists) {
			console.error("Path does not exist");
			return;
		}
	});
	const dirInput = document.querySelector(".nav-input.dir");
	dirInput.value = path;
	const exp = document.querySelector(".exp");
	exp.innerHTML = "";
	exp.setAttribute("path", path);
	if (path.toLowerCase().endsWith(".app") && override !== true) {
		tb.dialog.Select({
			title: `Sideload App`,
			message: `Do you want to sideload the anura app found at ${path}?`,
			options: [
				{ text: "Yes", value: "yes" },
				{ text: "View Source", value: "source" },
				{ text: "No", value: "no" },
			],
			onOk: async val => {
				if (val === "yes") {
					sideloadApp(path);
				} else if (val === "source") {
					openPath(path, true);
				} else {
					openPath("/home/" + user);
				}
			},
		});
		const sideloadApp = async path => {
			try {
				const anura = window.parent.anura;
				const appPath = `/fs${path}`.replace("//", "/");
				await anura.registerExternalApp(appPath);
			} catch (e) {
				window.parent.tb.dialog.Alert({
					title: "Unexpected Error",
					message: `❌ An Unexpected error occurred when trying to sideload the anura app: ${path} Error: ${e}`,
				});
			}
			openPath(document.getElementById(".nav-input"));
		};
	} else {
		window.parent.tb.fs.readdir(path, async (err, files) => {
			if (err) return console.error(err);
			for (let file of files) {
				await window.parent.tb.fs.stat(path + "/" + file, (err, stats) => {
					if (err) return console.error(err);
					if (stats.isDirectory()) {
						createPath(file, path + "/" + file, "folder");
					} else if (stats.isFile()) {
						createPath(file, path + "/" + file, "file");
					}
				});
			}
		});
	}
	const search = document.querySelector(".nav-input.search");
	search.setAttribute("placeholder", `Search ${path.split("/").pop()}`);
};
// For use elsewhere like the app island
self.openPath = openPath;
self.emptyTrash = emptyTrash;

async function unzip(path, target, app) {
	const response = await fetch("/fs/" + path);
	if (!app) {
		window.parent.tb.notification.Installing({
			message: `Unzipping...`,
			application: "Files",
			iconSrc: "/fs/apps/system/files.tapp/icon.svg",
			time: 500,
		});
	}
	const zipFileContent = await response.arrayBuffer();
	if (!(await dirExists(target))) {
		await window.parent.tb.fs.promises.mkdir(target, { recursive: true });
	}
	const compressedFiles = window.parent.tb.fflate.unzipSync(new Uint8Array(zipFileContent));
	for (const [relativePath, content] of Object.entries(compressedFiles)) {
		const fullPath = `${target}/${relativePath}`;
		const pathParts = fullPath.split("/");
		let currentPath = "";
		for (let i = 0; i < pathParts.length; i++) {
			currentPath += pathParts[i] + "/";
			if (i === pathParts.length - 1 && !relativePath.endsWith("/")) {
				try {
					console.log(`touch ${currentPath.slice(0, -1)}`);
					await window.parent.tb.fs.promises.writeFile(currentPath.slice(0, -1), window.parent.tb.buffer.from(content), "arraybuffer");
				} catch {
					console.log(`Cant make ${currentPath.slice(0, -1)}`);
				}
			} else if (!(await dirExists(currentPath))) {
				try {
					console.log(`mkdir ${currentPath}`);
					await window.parent.tb.fs.promises.mkdir(currentPath);
				} catch {
					console.log(`Cant make ${currentPath}`);
				}
			}
		}
		if (relativePath.endsWith("/")) {
			try {
				console.log(`mkdir fp ${fullPath}`);
				await window.parent.tb.fs.promises.mkdir(fullPath);
			} catch {
				console.log(`Cant make ${fullPath}`);
			}
		}
	}
	if (!app) {
		window.parent.tb.notification.Toast({
			message: `Finished unzipping ${path}`,
			application: "Files",
			iconSrc: "/fs/apps/system/files.tapp/icon.svg",
			time: 500,
		});
	}
	return "Done!";
}

const dirExists = async path => {
	return new Promise(resolve => {
		window.parent.tb.fs.stat(path, (err, stats) => {
			if (err) {
				if (err.code === "ENOENT") {
					resolve(false);
				} else {
					console.error(err);
					resolve(false);
				}
			} else {
				const exists = stats.type === "DIRECTORY";
				resolve(exists);
			}
		});
	});
};

const clearSearchButton = document.querySelector(".clear-search");
const search = document.querySelector(".nav-input.search");
search.addEventListener("input", e => {
	const exp = document.querySelector(".exp");
	let path = exp.getAttribute("path");
	if (search.value === "") {
		openPath(path);
		clearSearchButton.classList.add("opacity-0", "pointer-events-none");
		return;
	}
	exp.innerHTML = "";
	exp.setAttribute("path", path);
	window.parent.tb.fs.readdir(path, async (err, files) => {
		if (err) {
			console.error(err);
			return;
		}
		for (let file of files) {
			await window.parent.tb.fs.stat(path + "/" + file, (err, stats) => {
				if (err) {
					console.error(err);
					return;
				}
				if (clearSearchButton.classList.contains("opacity-0")) {
					clearSearchButton.classList.remove("opacity-0", "pointer-events-none");
				}
				if (stats.isDirectory()) {
					if (file.toLowerCase().includes(search.value.toLowerCase())) {
						createPath(file, path + "/" + file, "folder");
					}
				} else if (stats.isFile()) {
					if (file.toLowerCase().includes(search.value.toLowerCase())) {
						createPath(file, path + "/" + file, "file");
					}
				}
			});
		}
	});
});

const cfgload = async () => {
	const search = document.querySelector(".nav-input.search");
	document.querySelector(".sidebar").innerHTML = "";
	if (search.value !== "") {
		search.value = "";
	}
	const topbarheight = document.querySelector(".topbar").offsetHeight;
	document.querySelector("main").style.setProperty("--topbar-height", `${topbarheight}px`);
	let config = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/config.json`, "utf8"));
	if (config["quick-center"] === true) {
		await createCollapsible("Quick Center", "quick-center", config["open-collapsibles"]["quick-center"], JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/quick-center.json`, "utf8"))["paths"]);
	}
	if (config["drives"]) {
		await createCollapsible("Drives", "drives", config["open-collapsibles"]["drives"], config["drives"]);
	}
	if (config["storage"]) {
		const storageDevices = document.createElement("div");
		storageDevices.classList.add("absolute-path-item");
		const icon = document.createElement("div");
		icon.classList.add("icon");
		icon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.507 4.048A3 3 0 017.785 3h8.43a3 3 0 012.278 1.048l1.722 2.008A4.533 4.533 0 0019.5 6h-15c-.243 0-.482.02-.715.056l1.722-2.008z" />
                <path fill-rule="evenodd" d="M1.5 10.5a3 3 0 013-3h15a3 3 0 110 6h-15a3 3 0 01-3-3zm15 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm2.25.75a.75.75 0 100-1.5.75.75 0 000 1.5zM4.5 15a3 3 0 100 6h15a3 3 0 100-6h-15zm11.25 3.75a.75.75 0 100-1.5.75.75 0 000 1.5zM19.5 18a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clip-rule="evenodd" />
            </svg>
        `;
		storageDevices.appendChild(icon);
		const itemTitle = document.createElement("span");
		itemTitle.classList.add("title");
		itemTitle.textContent = "Storage Devices";
		storageDevices.appendChild(itemTitle);
		document.querySelector(".sidebar").appendChild(storageDevices);
		storageDevices.addEventListener("click", e => showStorageDevices());
	}
	const sidebarwidth = document.querySelector(".sidebar").offsetWidth;
	document.querySelector("main").style.setProperty("--sidebar-width", `${sidebarwidth}px`);
};

window.addEventListener("load", cfgload);
window.addEventListener("updcfg", cfgload);

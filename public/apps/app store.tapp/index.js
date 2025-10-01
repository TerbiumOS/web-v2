let currRepo;
let viewType = "apps";
/**
 * Loads the repos content
 * @param {string} url
 */
async function loadRepo(url) {
	const repo = await window.parent.tb.libcurl.fetch(url);
	let data = await repo.json();
	let type = "Terbium";
	if (data.maintainer) {
		type = "Anura";
		const list = await window.parent.tb.libcurl.fetch(url.replace("manifest.json", "list.json"));
		currRepo = {
			name: data.name,
			url: url,
		};
		data = await list.json();
	} else if (data.title) {
		type = "Xen";
	} else {
		currRepo = data.repo.name;
	}
	document.querySelector(".app-prev").classList.remove("flex");
	document.querySelector(".app-prev").classList.add("hidden");
	document.querySelector(".main").classList.remove("hidden");
	document.querySelector(".main").classList.add("flex");
	const featured = document.querySelector(".featured");
	switch (type) {
		case "Terbium":
			const featuredList1 = data.apps;
			const randomIndex1 = Math.floor(Math.random() * featuredList1.length);
			data.featured = featuredList1[randomIndex1] || {};
			const icn1 = await window.parent.tb.libcurl.fetch(data.featured.icon);
			const blob1 = await icn1.blob();
			const icnurl1 = URL.createObjectURL(blob1);
			featured.classList.forEach(cls => {
				if (cls.startsWith("bg-[url")) {
					featured.classList.remove(cls);
				}
			});
			featured.classList.add(`bg-[url('${icnurl1 || "/tb.svg"}')]`);
			featured.onclick = () => {
				loadApp(data.featured, type);
			};
			featured.querySelector("h3").textContent = data.featured.name;
			if (data.featured.version) {
				featured.querySelector("h4:nth-child(2)").textContent = `Version ${data.featured.version}`;
			} else {
				featured.querySelector("h4:nth-child(2)").textContent = `Progressive Web App`;
			}
			featured.querySelector("h4:nth-child(3)").textContent = `By ${data.featured.developer || "Unknown"}`;
			const appCards1 = await Promise.all(
				data.apps.map(async app => {
					const icn1 = await window.parent.tb.libcurl.fetch(app.icon);
					const blob1 = await icn1.blob();
					const icnurl1 = URL.createObjectURL(blob1);
					const displayName = app.name && app.name.length > 10 ? app.name.slice(0, 10) + "..." : app.name || "Unknown";
					const cardHtml = `
						<div class="app-card w-[100%] h-[105px] bg-[#00000032] rounded-[12px] flex flex-col items-center justify-center" data-app-index="${data.apps.indexOf(app)}">
							<img src="${icnurl1 || "/tb.svg"}" alt="App Icon" class="w-[50px] h-[50px] rounded-[12px] mb-4 object-cover" />
							<span class="text-white text-lg font-bold">${displayName}</span>
						</div>
					`;
					return { html: cardHtml, hasWmArgs: !!app.wmArgs };
				}),
			);
			const pwaCards = appCards1.filter(card => card.hasWmArgs).map(card => card.html);
			const appCards = appCards1.filter(card => !card.hasWmArgs).map(card => card.html);
			if (pwaCards.length === 0) {
				pwaCards.push(`<h1 class="text-white text-xl font-bold w-full text-center">There are no PWA apps available in this repo</h1>`);
			}
			if (appCards.length === 0) {
				appCards.push(`<h1 class="text-white text-xl font-bold w-full text-center">There are no app card apps available in this repo</h1>`);
			}
			document.querySelector(".pwa-list").innerHTML = pwaCards.join("");
			document.querySelector(".apps-list").innerHTML = appCards.join("");
			document.querySelectorAll(".app-card").forEach(card => {
				card.addEventListener("click", function () {
					const idx = parseInt(this.getAttribute("data-app-index"), 10);
					loadApp(data.apps[idx], type);
				});
			});
			break;
		case "Anura":
			const featuredList2 = data.apps;
			const randomIndex2 = Math.floor(Math.random() * featuredList2.length);
			data.featured = featuredList2[randomIndex2] || {};
			const icn2 = await window.parent.tb.libcurl.fetch(`${url.replace("manifest.json", "")}/apps/${data.featured.package}/${data.featured.icon}`);
			const blob2 = await icn2.blob();
			const icnurl2 = URL.createObjectURL(blob2);
			featured.classList.forEach(cls => {
				if (cls.startsWith("bg-[url")) {
					featured.classList.remove(cls);
				}
			});
			featured.classList.add(`bg-[url('${icnurl2 || "/tb.svg"}')]`);
			featured.onclick = () => {
				loadApp(data.featured, type);
			};
			featured.querySelector("h3").textContent = data.featured.name;
			if (data.featured.version) {
				featured.querySelector("h4:nth-child(2)").textContent = `Version ${data.featured.version}`;
			} else {
				featured.querySelector("h4:nth-child(2)").textContent = `Progressive Web App`;
			}
			featured.querySelector("h4:nth-child(3)").textContent = `Anura Application`;
			const appCards2 = await Promise.all(
				data.apps.map(async app => {
					const icn1 = await window.parent.tb.libcurl.fetch(`${url.replace("manifest.json", "")}/apps/${app.package}/${app.icon}`);
					const blob1 = await icn1.blob();
					const icnurl1 = URL.createObjectURL(blob1);
					const displayName = app.name && app.name.length > 10 ? app.name.slice(0, 10) + "..." : app.name || "Unknown";
					const cardHtml = `
						<div class="app-card w-[100%] h-[105px] bg-[#00000032] rounded-[12px] flex flex-col items-center justify-center" data-app-index="${data.apps.indexOf(app)}">
							<img src="${icnurl1 || "/tb.svg"}" alt="App Icon" class="w-[50px] h-[50px] rounded-[12px] mb-4 object-cover" />
							<span class="text-white text-lg font-bold">${displayName}</span>
						</div>
					`;
					return { html: cardHtml, hasWmArgs: !!app.wmArgs };
				}),
			);
			const pwaCards2 = appCards2.filter(card => card.hasWmArgs).map(card => card.html);
			const appCards_2 = appCards2.filter(card => !card.hasWmArgs).map(card => card.html);
			if (pwaCards2.length === 0) {
				pwaCards2.push(`<h1 class="text-white text-xl font-bold w-full text-center">There are no PWA apps available in this repo</h1>`);
			}
			if (appCards_2.length === 0) {
				appCards_2.push(`<h1 class="text-white text-xl font-bold w-full text-center">There are no app card apps available in this repo</h1>`);
			}
			document.querySelector(".pwa-list").innerHTML = pwaCards2.join("");
			document.querySelector(".apps-list").innerHTML = appCards_2.join("");
			document.querySelectorAll(".app-card").forEach(card => {
				card.addEventListener("click", function () {
					const idx = parseInt(this.getAttribute("data-app-index"), 10);
					loadApp(data.apps[idx], type);
				});
			});
			break;
		case "Xen":
			console.log("Xen repo not implemented yet.");
			document.querySelector(".featured h3").textContent = "Xen App Store";
			break;
	}
}

/**
 * Loads the app content in the preview
 * @param {Object} app - The app to load
 * @param {string} type - The type of app (Terbium, Anura, Xen)
 */
async function loadApp(app, type) {
	document.querySelector(".app-prev").classList.remove("hidden");
	document.querySelector(".app-prev").classList.add("flex");
	document.querySelector(".main").classList.remove("flex");
	document.querySelector(".main").classList.add("hidden");
	let icnUrl;
	let isInstalled = false;
	let uptodate = true;
	const installedApps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
	if (installedApps.some(a => a.name === app.name)) {
		isInstalled = true;
		const config = JSON.parse(await window.parent.tb.fs.promises.readFile(`${installedApps.find(a => a.name === app.name).config}`, "utf8"));
		if (app.version && config.version && semverCompare(app.version, config.version) > 0) {
			uptodate = false;
		}
	}
	if (app.wmArgs) {
		type = "tb-PWA";
	} else if ("anura-pkg" in app) {
		type = "tb-liq";
	}
	switch (type) {
		case "Terbium":
		case "tb-PWA":
			const icn1 = await window.parent.tb.libcurl.fetch(app.icon);
			const blob1 = await icn1.blob();
			icnUrl = URL.createObjectURL(blob1);
			break;
		case "Anura":
		case "tb-liq":
			let icn2;
			if (currRepo.url) {
				icn2 = await window.parent.tb.libcurl.fetch(`${currRepo.url.replace("manifest.json", "")}/apps/${app.package}/${app.icon}`);
			} else {
				icn2 = await window.parent.tb.libcurl.fetch(app.icon);
			}
			if (!icn2.ok) {
				icn2 = await window.parent.tb.libcurl.fetch("https://terbiumon.top/favicon.ico");
			}
			const blob2 = await icn2.blob();
			icnUrl = URL.createObjectURL(blob2);
			break;
		case "Xen":
			break;
	}
	document.querySelector(".app-prev").innerHTML = `
		<h1 class="font-black text-3xl" onclick="document.querySelector('.app-prev').classList.remove('flex'); document.querySelector('.app-prev').classList.add('hidden'); document.querySelector('.main').classList.remove('hidden'); document.querySelector('.main').classList.add('flex');">${typeof currRepo === "object" ? currRepo.name : currRepo} → ${app.name}</h1>
		<div class="featured flex w-[97%] h-[175px] bg-[#00000032] rounded-[22px] p-2 items-center gap-6 relative bg-no-repeat bg-[url('${icnUrl || "/tb.svg"}')] bg-center bg-cover">
			<div class="info flex flex-col justify-end text-white absolute left-6 bottom-6">
				<h3 class="text-2xl font-bold mb-2">${app.name}</h3>
				<h4 class="text-[16px] text-[#ffffff75]">By ${app.developer || "Unknown"}</h4>
			</div>
			<div class="info flex flex-col justify-end text-white absolute right-6 bottom-6">
				${isInstalled ? (uptodate ? `<button class="uns-btn bg-[#4d4d4d] text-white rounded-lg p-1.5">Uninstall</button>` : `<button class="upd-btn bg-[#5DD881] text-black rounded-lg p-1.5">Update</button>`) : `<button class="ins-btn bg-[#5DD881] text-black rounded-lg p-1.5">Install</button>`}
			</div>
		</div>
		<div class="flex w-[97%] h-[45%] mt-6 gap-6">
			<div class="w-1/2 bg-[#00000032] rounded-[12px] h-full p-4 overflow-auto">
				<h2 class="font-black text-3xl mb-2">About ${app.name}</h2>
				<p class="text-white text-base">${app.description || "No description available."}</p>
				<ul class="text-white text-base">
					<li><strong>Version:</strong> ${app.version || "1.0.0"}</li>
					<li><strong>Developer:</strong> ${app.developer || "Unknown"}</li>
					<li><strong>License:</strong> ${app.license || "N/A"}</li>
					<li><strong>Scanned:</strong> ${app.scanned ? `<a href="${app.scanned}" target="_blank" rel="noopener noreferrer" class="text-[#ffffff]">${new URL(app.scanned).hostname.replace(/^www\./, "")}</a>` : "N/A"}</li>
					<li><strong>Size:</strong> ${app.size || "N/A"}</li>
					<ul>
						<h2 class="font-black text-3xl mb-2">Requirements:</h2>
						<li><strong>OS: ${(app.requirements && app.requirements.os) || "Any"}</strong></li>
						<li><strong>Proxy: ${(app.requirements && app.requirements.proxy) || "Any"}</strong></li>
					</ul>
				</ul>
				</div>
				<div class="w-1/2 bg-[#00000032] rounded-[12px] h-full p-4 overflow-auto">
					<h2 class="font-black text-3xl mb-2">Images</h2>
					<div class="flex flex-wrap gap-4">
						${
							app.images
								? app.images
										.map(
											img => `
							<div class="w-full">
								<img src="${img}" alt="App Image" class="w-full h-[200px] rounded-[12px] object-cover" />
							</div>
						`,
										)
										.join("")
								: "<p class='text-white'>No images available.</p>"
						}
					</div>
				</div>
			</div>
		</div>
	`;

	const addBtns = () => {
		const insBtn = document.querySelector(".ins-btn");
		const updBtn = document.querySelector(".upd-btn");
		const unsBtn = document.querySelector(".uns-btn");
		if (insBtn) {
			insBtn.addEventListener("click", async function handler() {
				insBtn.disabled = true;
				insBtn.textContent = "Installing...";
				insBtn.classList.remove("bg-[#5DD881]", "text-black");
				insBtn.classList.add("bg-[#4d4d4d]", "text-white");
				const success = await install(app, type);
				if (success) {
					insBtn.outerHTML = `<button class="uns-btn bg-[#4d4d4d] text-white rounded-lg p-1.5">Uninstall</button>`;
					addBtns();
				} else {
					insBtn.disabled = false;
					insBtn.textContent = "Install";
					insBtn.classList.remove("bg-[#4d4d4d]", "text-white");
					insBtn.classList.add("bg-[#5DD881]", "text-black");
				}
			});
		}
		if (updBtn) {
			updBtn.addEventListener("click", async function handler() {
				updBtn.disabled = true;
				updBtn.textContent = "Updating...";
				updBtn.classList.remove("bg-[#5DD881]", "text-black");
				updBtn.classList.add("bg-[#4d4d4d]", "text-white");
				await uninstall(app, type);
				const success = await install(app, type);
				if (success) {
					updBtn.outerHTML = `<button class="uns-btn bg-[#4d4d4d] text-white rounded-lg p-1.5">Uninstall</button>`;
					addBtns();
				} else {
					updBtn.disabled = false;
					updBtn.textContent = "Update";
					updBtn.classList.remove("bg-[#4d4d4d]", "text-white");
					updBtn.classList.add("bg-[#5DD881]", "text-black");
				}
			});
		}
		if (unsBtn) {
			unsBtn.addEventListener("click", async function handler() {
				await uninstall(app, type);
				unsBtn.outerHTML = `<button class="ins-btn bg-[#5DD881] text-black rounded-lg p-1.5">Install</button>`;
				addBtns();
			});
		}
	};

	addBtns();
}

/**
 * Loads the current list of repos
 */
async function loadRepos() {
	const repoList = document.querySelector(".repo-list");
	repoList.innerHTML = "";
	const repos = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, "utf8"));
	for (const repo of repos) {
		const repoinfo = await window.parent.tb.libcurl.fetch(repo.url);
		if (!repoinfo.ok) {
			const displayName = repo.name && repo.name.length > 8 ? repo.name.slice(0, 8) + "..." : repo.name || "Unknown";
			const repoCard = document.createElement("div");
			repoCard.className = "repo-card flex flex-row items-center bg-[#00000032] rounded-lg h-[50px] p-1 gap-1";
			repoCard.onclick = () => loadRepo(repo.url);
			repoCard.innerHTML = `
				<img src="/tb.svg" alt="Featured App" class="w-[32px] h-[32px] rounded-[12px] object-cover" />
				<h3 class="text-white text-base font-black">${displayName}</h3>
				<svg class="flex-1" width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="16" cy="16" r="16" fill="#D8645D"/>
				</svg>
			`;
			repoCard.addEventListener("contextmenu", function (e) {
				e.preventDefault();
				window.parent.tb.contextmenu.create({
					x: e.clientX + 100,
					y: e.clientY + 275,
					options: [
						{ text: "Load Repo", click: () => loadRepo(repo.url) },
						{
							text: "Remove Repo",
							click: () => {
								repoList.removeChild(repoCard);
								const index = repos.findIndex(r => r.url === repo.url);
								if (index !== -1) {
									repos.splice(index, 1);
								}
								window.parent.tb.fs.promises.writeFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, JSON.stringify(repos, null, 2));
							},
						},
					],
				});
			});
			repoList.appendChild(repoCard);
			continue;
		}
		const data = await repoinfo.json();
		if (data.maintainer) {
			const icn = await window.parent.tb.libcurl.fetch(repo.icon);
			const blob = await icn.blob();
			const icnurl = URL.createObjectURL(blob);
			const displayName = data.name && data.name.length > 8 ? data.name.slice(0, 8) + "..." : data.name || "Unknown";
			const repoCard = document.createElement("div");
			repoCard.className = "repo-card flex flex-row items-center bg-[#00000032] rounded-lg h-[50px] p-1 gap-1";
			repoCard.onclick = () => loadRepo(repo.url);
			repoCard.innerHTML = `
				<img src="${icnurl || "/tb.svg"}" alt="Featured App" class="w-[32px] h-[32px] rounded-[12px] object-cover" />
				<h3 class="text-white text-base font-black">${displayName}</h3>
				<svg class="flex-1" width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="16" cy="16" r="16" fill="#5DD881"/>
				</svg>
			`;
			repoCard.addEventListener("contextmenu", function (e) {
				e.preventDefault();
				window.parent.tb.contextmenu.create({
					x: e.clientX + 100,
					y: e.clientY + 275,
					options: [
						{ text: "Load Repo", click: () => loadRepo(repo.url) },
						{
							text: "Remove Repo",
							click: () => {
								repoList.removeChild(repoCard);
								const index = repos.findIndex(r => r.url === repo.url);
								if (index !== -1) {
									repos.splice(index, 1);
								}
								window.parent.tb.fs.promises.writeFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, JSON.stringify(repos, null, 2));
							},
						},
					],
				});
			});
			repoList.appendChild(repoCard);
		} else if (data.title) {
			throw new Error("Xen repo not implemented yet.");
		} else {
			const icn = await window.parent.tb.libcurl.fetch(data.repo.icon);
			const blob = await icn.blob();
			const icnurl = URL.createObjectURL(blob);
			const displayName = data.repo.name && data.repo.name.length > 8 ? data.repo.name.slice(0, 8) + "..." : data.repo.name || "Unknown";
			const repoCard = document.createElement("div");
			repoCard.className = "repo-card flex flex-row items-center bg-[#00000032] rounded-lg h-[50px] p-1 gap-1";
			repoCard.onclick = () => loadRepo(repo.url);
			repoCard.innerHTML = `
				<img src="${icnurl || "/tb.svg"}" alt="Featured App" class="w-[32px] h-[32px] rounded-[12px] object-cover" />
				<h3 class="text-white text-base font-black">${displayName}</h3>
				<svg class="flex-1" width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="16" cy="16" r="16" fill="#5DD881"/>
				</svg>
			`;
			repoCard.addEventListener("contextmenu", function (e) {
				e.preventDefault();
				window.parent.tb.contextmenu.create({
					x: e.clientX + 100,
					y: e.clientY + 275,
					options: [
						{ text: "Load Repo", click: () => loadRepo(repo.url) },
						{
							text: "Remove Repo",
							click: () => {
								repoList.removeChild(repoCard);
								const index = repos.findIndex(r => r.url === repo.url);
								if (index !== -1) {
									repos.splice(index, 1);
								}
								window.parent.tb.fs.promises.writeFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, JSON.stringify(repos, null, 2));
							},
						},
					],
				});
			});
			repoList.appendChild(repoCard);
		}
	}
}

/**
 * Changes the view between apps and PWAs
 * @param {string} type - The type of view ("apps" or "pwa")
 */
function view(type) {
	if (type === "apps") {
		viewType = "apps";
		document.querySelector(".apps-list").classList.remove("hidden");
		document.querySelector(".pwa-list").classList.add("hidden");
		document.querySelector(".apps-list").classList.remove("flex");
		document.querySelector(".apps-list").classList.add("grid");
		document.querySelector(".pwa-list").classList.remove("grid");
		document.querySelector(".pwa-list").classList.add("hidden");
		document.querySelector(".app-togg").classList.add("bg-[#5DD88122]");
		document.querySelector(".app-togg").classList.remove("bg-[#00000022]");
		document.querySelector(".pwa-togg").classList.remove("bg-[#5DD88122]");
		document.querySelector(".pwa-togg").classList.add("bg-[#00000022]");
	} else if (type === "pwa") {
		viewType = "pwa";
		document.querySelector(".pwa-list").classList.remove("hidden");
		document.querySelector(".apps-list").classList.add("hidden");
		document.querySelector(".pwa-list").classList.remove("flex");
		document.querySelector(".pwa-list").classList.add("grid");
		document.querySelector(".apps-list").classList.remove("grid");
		document.querySelector(".apps-list").classList.add("hidden");
		document.querySelector(".app-togg").classList.remove("bg-[#5DD88122]");
		document.querySelector(".app-togg").classList.add("bg-[#00000022]");
		document.querySelector(".pwa-togg").classList.add("bg-[#5DD88122]");
		document.querySelector(".pwa-togg").classList.remove("bg-[#00000022]");
	}
}

/**
 * Adds a new repo to the repo list
 */
async function addRepo() {
	window.parent.tb.dialog.Message({
		title: "Enter a Repo URL",
		onOk: async value => {
			const res = await window.parent.tb.libcurl.fetch(value);
			const meta = await res.json();
			const repos = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, "utf8"));
			if (meta.maintainer) {
				const list = await window.parent.tb.libcurl.fetch(value.replace("manifest.json", "list.json"));
				if (list.ok) {
					repos.push({
						name: meta.name || "Unknown",
						url: value,
						icon: "https://anura.pro/icon.png",
					});
				} else {
					window.parent.tb.notification.Toast({
						message: "Failed to add repo. The URL does not point to a valid Anura repo manifest",
						application: "App Store",
						iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
						time: 5000,
					});
				}
			} else if (meta.title) {
				repos.push({
					name: meta.title || "Unknown",
					url: value,
					icon: "https://raw.githubusercontent.com/NebulaServices/XenOS/refs/heads/main/public/assets/logo.svg",
				});
			} else {
				repos.push({
					name: meta.repo.name || "Unknown",
					url: value,
					icon: meta.repo.icon,
				});
			}
			await window.parent.tb.fs.promises.writeFile(`/apps/user/${sessionStorage.getItem("currAcc")}/app store/repos.json`, JSON.stringify(repos, null, 2));
			loadRepos();
		},
	});
}

/**
 * Searches for the apps that are loaded in
 * @param {string} input - The search input
 */
async function search(input) {
	if (viewType === "apps") {
		const applist = document.querySelector(".apps-list");
		applist.querySelectorAll(".app-card").forEach(card => {
			const appName = card.querySelector("span").textContent.toLowerCase();
			if (appName.includes(input.toLowerCase())) {
				card.classList.remove("hidden");
			} else {
				card.classList.add("hidden");
			}
		});
	} else {
		const pwaList = document.querySelector(".pwa-list");
		pwaList.querySelectorAll(".app-card").forEach(card => {
			const appName = card.querySelector("span").textContent.toLowerCase();
			if (appName.includes(input.toLowerCase())) {
				card.classList.remove("hidden");
			} else {
				card.classList.add("hidden");
			}
		});
	}
}

/**
 * Compares two semantic version strings.
 * @param {string} a - The first version string.
 * @param {string} b - The second version string.
 * @returns {number} - Returns 1 if a > b, -1 if a < b, 0 if they are equal.
 */
const semverCompare = (a, b) => {
	const pa = a.split(/[-.]/);
	const pb = b.split(/[-.]/);
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const na = pa[i] || "0";
		const nb = pb[i] || "0";
		if (!isNaN(na) && !isNaN(nb)) {
			if (+na > +nb) return 1;
			if (+na < +nb) return -1;
		} else {
			if (na > nb) return 1;
			if (na < nb) return -1;
		}
	}
	return 0;
};

/**
 * Installs the requested app
 * @param {string} type - The type of app (Terbium, tb-PWA, Anura, Xen)
 * @returns {Promise<boolean>} - Returns true if the installation was successful, false otherwise
 */
async function install(app, type) {
	if (app.requirements) {
		if (app.requirements.os) {
			if (semverCompare(window.parent.tb.system.version(), app.requirements.os.replace(/^v/, "")) < 0) {
				window.parent.tb.notification.Toast({
					message: `Failed to install ${app.name}. Your version of Terbium does not meet the minimum requirements.`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
				return false;
			}
		}
		if (app.requirements.proxy && app.requirements.proxy !== window.parent.tb.proxy.get()) {
			window.parent.tb.notification.Toast({
				message: `Failed to install ${app.name}. The current selected proxy does not meet the minimum requirements.`,
				application: "App Store",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 5000,
			});
			return false;
		}
	}
	switch (type) {
		case "Terbium":
			try {
				await window.parent.tb.system.download(app["pkg-download"], `/apps/system/${app.name}.zip`);
				await unzip(`/apps/system/${app.name}.zip`, `/apps/system/${app.name}.tapp/`);
				await window.parent.tb.fs.promises.unlink(`/apps/system/${app.name}.zip`);
				const appConf = await window.parent.tb.fs.promises.readFile(`/apps/system/${app.name}.tapp/.tbconfig`, "utf8");
				const appData = JSON.parse(appConf);
				await window.parent.tb.launcher.addApp({
					title:
						typeof appData.wmArgs.title === "object"
							? {
									text: appData.wmArgs.title.text,
									weight: appData.wmArgs.title.weight,
									html: appData.wmArgs.title.html,
								}
							: appData.wmArgs.title,
					name: appData.title,
					icon: `/fs/apps/system/${app.name}.tapp/${appData.icon}`,
					src: `/fs/apps/system/${app.name}.tapp/${appData.wmArgs.src}`,
					size: {
						width: appData.wmArgs.size.width,
						height: appData.wmArgs.size.height,
					},
					single: appData.wmArgs.single,
					resizable: appData.wmArgs.resizable,
					controls: appData.wmArgs.controls,
					message: appData.wmArgs.message,
					snapable: appData.wmArgs.snapable,
				});
				try {
					let apps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
					apps.push({
						name: app.name,
						user: await window.parent.tb.user.username(),
						config: `/apps/system/${app.name}.tapp/.tbconfig`,
					});
					await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(apps));
				} catch {
					await window.parent.tb.fs.promises.writeFile(
						`/apps/installed.json`,
						JSON.stringify([
							{
								name: app.name,
								user: await window.parent.tb.user.username(),
								config: `/apps/system/${app.name}.tapp/.tbconfig`,
							},
						]),
					);
				}
				window.parent.tb.notification.Toast({
					message: `${app.name} has been installed!`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
					onOk: () => {
						window.parent.tb.system.openApp(app.name);
					},
				});
				return true;
			} catch (e) {
				console.error("Error installing the app:", e);
				await window.parent.tb.sh.promises.rm(`/apps/system/${app.name}.tapp`, { recursive: true });
				window.parent.tb.notification.Toast({
					message: `Failed to install ${app.name}. Check the console for details.`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
				return false;
			}
		case "tb-PWA":
			const web_apps = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/web_apps.json", "utf8"));
			web_apps.apps.push(app.name.toLowerCase());
			await window.parent.tb.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(web_apps));
			await window.parent.tb.launcher.addApp({
				title: app["wmArgs"]["title"],
				name: app.name,
				icon: app.icon,
				src: app["wmArgs"]["src"],
				size: {
					width: app["wmArgs"]["size"]["width"],
					height: app["wmArgs"]["size"]["height"],
				},
				single: app["wmArgs"]["single"],
				resizable: app["wmArgs"]["resizable"],
				controls: app["wmArgs"]["controls"],
				message: app["wmArgs"]["message"],
				proxy: app["wmArgs"]["proxy"],
				snapable: app["wmArgs"]["snapable"],
			});
			await window.parent.tb.fs.promises.mkdir(`/apps/user/${await window.parent.tb.user.username()}/${app.name}`);
			await window.parent.tb.fs.promises.writeFile(`/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`, JSON.stringify(app));
			try {
				let apps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
				apps.push({
					name: app.name,
					user: await window.parent.tb.user.username(),
					config: `/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`,
				});
				await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(apps));
			} catch {
				await window.parent.tb.fs.promises.writeFile(
					`/apps/installed.json`,
					JSON.stringify([
						{
							name: app.name,
							user: await window.parent.tb.user.username(),
							config: `/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`,
						},
					]),
				);
			}
			window.parent.tb.notification.Toast({
				message: `${app.name} has been installed!`,
				application: "App Store",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 5000,
				onOk: () => {
					window.parent.tb.system.openApp(app.name);
				},
			});
			return true;
		case "tb-liq":
		case "Anura":
			try {
				if (type === "tb-liq") {
					await window.parent.tb.system.download(app["anura-pkg"], `/apps/anura/${app.name}.zip`);
				} else {
					await window.parent.tb.system.download(`${currRepo.url.replace("manifest.json", "")}/apps/${app.package}/${app.data}`, `/apps/anura/${app.name}.zip`);
				}
				await unzip(`/apps/anura/${app.name}.zip`, `/apps/anura/${app.name}/`);
				await window.parent.tb.fs.promises.unlink(`/apps/anura/${app.name}.zip`);
				const appConf = await window.parent.tb.fs.promises.readFile(`/apps/anura/${app.name}/manifest.json`, "utf8");
				const appData = JSON.parse(appConf);
				console.log(appData);
				await window.parent.tb.launcher.addApp({
					name: appData.name,
					title: appData.wininfo.title,
					icon: `/fs/apps/anura/${app.name}/${appData.icon}`,
					src: `/fs/apps/anura/${app.name}/${appData.index}`,
					size: {
						width: appData.wininfo.width,
						height: appData.wininfo.height,
					},
					single: appData.wininfo.allowMultipleInstance,
				});
				window.parent.anura.apps[appData.package] = {
					title: appData.name,
					icon: appData.icon,
					id: appData.package,
				};
				try {
					let apps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
					apps.push({
						name: appData.name,
						user: await window.parent.tb.user.username(),
						config: `/apps/anura/${app.name}/manifest.json`,
					});
					await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(apps));
				} catch {
					await window.parent.tb.fs.promises.writeFile(
						`/apps/installed.json`,
						JSON.stringify([
							{
								name: appData.name,
								user: await window.parent.tb.user.username(),
								config: `/apps/anura/${app.name}/manifest.json`,
							},
						]),
					);
				}
				window.parent.tb.notification.Toast({
					message: `${app.name} has been installed!`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
					onOk: () => {
						window.parent.tb.system.openApp(app.name);
					},
				});
				return true;
			} catch (e) {
				console.error("Error installing the app:", e);
				await window.parent.tb.sh.promises.rm(`/apps/anura/${app.name}`, { recursive: true });
				window.parent.tb.notification.Toast({
					message: `Failed to install ${app.name}. Check the console for details.`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
				return false;
			}
		case "Xen":
			throw new Error("Xen repo not implemented yet.");
	}
}

/**
 * Uninstalls the requested app
 * @param {Object} app - The app to uninstall
 * @param {string} type - The type of app (Terbium, tb-PWA, Anura, Xen)
 */
async function uninstall(app, type) {
	switch (type) {
		case "Terbium":
			if (await dirExists(`/apps/system/${app.name}.tapp`)) {
				await new window.parent.tb.fs.Shell().promises.rm(`/apps/system/${app.name}.tapp`, { recursive: true });
			} else {
				await new window.parent.tb.fs.Shell().promises.rm(`/apps/user/${sessionStorage.getItem("currAcc")}/${app.name}.tapp`, { recursive: true });
			}
			try {
				let installedApps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
				installedApps = installedApps.filter(a => a.name !== app.name);
				await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(installedApps));
			} catch {
				throw new Error("Failed to update the installed app list");
			}
			window.parent.tb.launcher.removeApp(app.name);
			window.parent.tb.notification.Toast({
				message: `Successfully uninstalled ${app.name}.`,
				application: "App Store",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 5000,
			});
			break;
		case "tb-PWA":
			const web_apps = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/web_apps.json", "utf8"));
			const index = web_apps.apps.indexOf(app.name.toLowerCase());
			if (index > -1) {
				web_apps.apps.splice(index, 1);
			}
			await window.parent.tb.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(web_apps));
			window.parent.tb.launcher.removeApp(app.name);
			await window.parent.tb.fs.promises.unlink(`/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`);
			await window.parent.tb.sh.promises.rm(`/apps/user/${await window.parent.tb.user.username()}/${app.name}`, { recursive: true });
			try {
				let installedApps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
				installedApps = installedApps.filter(a => a.name !== app.name);
				await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(installedApps));
			} catch {
				throw new Error("Failed to update the installed app list");
			}
			window.parent.tb.notification.Toast({
				message: `Successfully uninstalled ${app.name}.`,
				application: "App Store",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 5000,
			});
			break;
		case "Anura":
		case "tb-liq":
			await new window.parent.tb.fs.Shell().promises.rm(`/apps/anura/${app.name}`, { recursive: true });
			try {
				let installedApps = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/installed.json`, "utf8"));
				installedApps = installedApps.filter(a => a.name !== app.name);
				await window.parent.tb.fs.promises.writeFile(`/apps/installed.json`, JSON.stringify(installedApps));
			} catch {
				throw new Error("Failed to update the installed app list");
			}
			window.parent.tb.launcher.removeApp(app.name);
			delete window.parent.anura.apps[app.package];
			window.parent.tb.notification.Toast({
				message: `Successfully uninstalled ${app.name}.`,
				application: "App Store",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 5000,
			});
			break;
	}
}

/**
 * Unzips the requested file to the target dir
 * @param {string} path
 * @param {string} target
 */
async function unzip(path, target) {
	const response = await fetch("/fs/" + path);
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
					await window.parent.tb.fs.promises.writeFile(currentPath.slice(0, -1), window.parent.tb.buffer.from(content));
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
	return "Done!";
}

/**
 * Resolves if a directory exists
 * @param {string} path
 * @returns {Promise<Boolean>}
 */
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

window.addEventListener("load", async () => {
	await loadRepo("https://raw.githubusercontent.com/TerbiumOS/tb-repo/refs/heads/main/manifest.json");
	loadRepos();
	window.parent.document.querySelector(".app-search").addEventListener("input", e => {
		search(e.target.value);
	});
});

window.addEventListener("contextmenu", e => {
	e.preventDefault();
});

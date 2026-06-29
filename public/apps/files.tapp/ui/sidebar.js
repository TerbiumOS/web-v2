import { folderIcon, systemIcon } from "../icons.js";
import { user } from "../state.js";
import { loadConfig, saveConfig } from "../utils.js";

let sidebarEl;
let openPathFn;

export async function initSidebar(openPath) {
	sidebarEl = document.querySelector(".sidebar");
	openPathFn = openPath;
	await renderSidebar();
	window.addEventListener("updcfg", renderSidebar);
}

async function renderSidebar() {
	sidebarEl.innerHTML = "";
	const config = (await loadConfig()) || {};
	const openCollapsibles = config["open-collapsibles"] || {};

	const defaults = {
		Home: `/home/${user}`,
		Desktop: `/home/${user}/desktop`,
		Documents: `/home/${user}/documents`,
		Images: `/home/${user}/images`,
		Videos: `/home/${user}/videos`,
		Music: `/home/${user}/music`,
		Trash: "/system/trash",
	};
	const pinned = config["quick-access"] && typeof config["quick-access"] === "object" ? config["quick-access"] : {};
	const quickAccess = { ...defaults, ...pinned };
	await addCollapsible("Quick access", "quick-access", openCollapsibles["quick-access"] !== false, quickAccess, config);

	if (config.drives && Object.keys(config.drives).length) {
		await addCollapsible("Drives", "drives", openCollapsibles.drives !== false, config.drives, config);
	}

	if (config.storage) {
		const storageItem = document.createElement("div");
		storageItem.className = "sidebar-item absolute-path-item";
		storageItem.innerHTML = `<span class="icon">${systemIcon("drive")}</span><span class="label"></span>`;
		storageItem.querySelector(".label").textContent = "Storage Devices";
		storageItem.addEventListener("click", () => openPathFn("storage devices"));
		sidebarEl.appendChild(storageItem);
	}

	requestAnimationFrame(() => {
		const width = sidebarEl.offsetWidth;
		const main = document.querySelector("main");
		if (main) main.style.setProperty("--sidebar-width", `${width}px`);
	});
}

async function addCollapsible(title, id, opened, children, config) {
	const section = document.createElement("div");
	section.className = "sidebar-section collapsible-path";
	section.id = id;

	const header = document.createElement("div");
	header.className = "sidebar-heading title";
	const headingText = document.createElement("h2");
	headingText.textContent = title;
	const chevron = document.createElement("div");
	chevron.className = "collapsible-icon";
	chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="collapse-button"><path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clip-rule="evenodd"/></svg>`;
	header.appendChild(headingText);
	header.appendChild(chevron);
	section.appendChild(header);

	const paths = document.createElement("div");
	paths.className = "paths";
	if (!opened) {
		paths.classList.add("collapsed");
		chevron.querySelector("svg").classList.add("collapsed");
		section.classList.add("collapsed");
	}

	for (const [label, path] of Object.entries(children)) {
		const item = document.createElement("div");
		item.className = "sidebar-item path-item";
		item.setAttribute("path", path);
		item.setAttribute("name", label);

		const iconEl = document.createElement("span");
		iconEl.className = "icon";
		const labelLow = String(label).toLowerCase();
		const pathLow = String(path).toLowerCase();
		let oneClick = false;

		if (labelLow.endsWith(".tapp") || pathLow.endsWith(".tapp")) {
			try {
				iconEl.innerHTML = await folderIcon(path, label.endsWith(".tapp") ? label : `${label}.tapp`);
			} catch {
				iconEl.innerHTML = systemIcon("file");
			}
		} else {
			const sysKeys = ["home", "desktop", "documents", "images", "videos", "music", "trash", "filesystem", "file system", "drive"];
			if (labelLow === "file system") {
				iconEl.innerHTML = systemIcon("filesystem");
				oneClick = true;
				item.setAttribute("system-folder", "true");
			} else if (sysKeys.includes(labelLow)) {
				iconEl.innerHTML = systemIcon(labelLow);
				oneClick = true;
				item.setAttribute("system-folder", "true");
			} else if (path && (path.startsWith("/mnt/") || /^https?:\/\//.test(path))) {
				iconEl.innerHTML = systemIcon("drive");
				item.id = `f-${labelLow}`;
			} else {
				iconEl.innerHTML = systemIcon("folder");
			}
		}

		const labelEl = document.createElement("span");
		labelEl.className = "label";
		labelEl.textContent = label;
		item.appendChild(iconEl);
		item.appendChild(labelEl);

		const handler = () => openPathFn(path);
		if (oneClick) item.addEventListener("click", handler);
		else {
			item.addEventListener("dblclick", handler);
			item.addEventListener("click", handler);
		}

		paths.appendChild(item);
	}

	section.appendChild(paths);

	header.addEventListener("click", async () => {
		const icon = chevron.querySelector("svg");
		const isCollapsed = paths.classList.contains("collapsed");
		if (isCollapsed) {
			paths.classList.remove("collapsed");
			icon.classList.remove("collapsed");
			section.classList.remove("collapsed");
		} else {
			paths.classList.add("collapsed");
			icon.classList.add("collapsed");
			section.classList.add("collapsed");
		}
		try {
			const latest = (await loadConfig()) || {};
			if (!latest["open-collapsibles"]) latest["open-collapsibles"] = {};
			latest["open-collapsibles"][id] = isCollapsed;
			await saveConfig(latest);
		} catch (e) {
			console.error("persist collapsible:", e);
		}
		void config;
	});

	sidebarEl.appendChild(section);
}

export function updateDavStatus(name, connected) {
	const el = document.getElementById(`f-${String(name).toLowerCase()}`);
	if (!el) return;
	const iconSpan = el.querySelector(".icon");
	if (!iconSpan) return;
	const color = connected ? "#5DD881" : "#D8645D";
	iconSpan.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.08 5.227A3 3 0 016.979 3H17.02a3 3 0 012.9 2.227l2.113 7.926A5.228 5.228 0 0018.75 12H5.25a5.228 5.228 0 00-3.284 1.153L4.08 5.227z"/><path fill-rule="evenodd" d="M5.25 13.5a3.75 3.75 0 100 7.5h13.5a3.75 3.75 0 100-7.5H5.25z" clip-rule="evenodd"/><circle cx="18" cy="17.25" r="3" fill="${color}"/></svg>`;
}

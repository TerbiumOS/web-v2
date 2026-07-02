import { emit, on, state, tb } from "../state.js";
import { basename } from "../utils.js";

let els = null;

export function initTopbar(openPath) {
	els = {
		back: document.getElementById("back"),
		forward: document.getElementById("forward"),
		up: document.getElementById("up"),
		reload: document.getElementById("reload"),
		breadcrumbs: document.getElementById("breadcrumbs"),
		dirInput: document.querySelector(".nav-input.dir"),
		searchWrap: document.querySelector(".search-wrap"),
		search: document.querySelector(".nav-input.search"),
		clearSearch: document.querySelector(".clear-search"),
		viewModes: document.getElementById("viewModes"),
	};

	els.back.addEventListener("click", () => {
		if (state.historyIndex > 0) {
			state.historyIndex--;
			openPath(state.history[state.historyIndex], { skipHistory: true });
		}
	});
	els.forward.addEventListener("click", () => {
		if (state.historyIndex < state.history.length - 1) {
			state.historyIndex++;
			openPath(state.history[state.historyIndex], { skipHistory: true });
		}
	});
	els.up.addEventListener("click", () => {
		const p = state.currentPath;
		if (!p || p === "/" || p === "//") return;
		const parts = p.split("/").filter(Boolean);
		parts.pop();
		openPath(parts.length ? `/${parts.join("/")}` : "/");
	});
	els.reload.addEventListener("click", () => {
		openPath(state.currentPath, { skipHistory: true });
	});

	els.breadcrumbs.addEventListener("click", e => {
		if (e.target === els.breadcrumbs) {
			enterEditMode();
		}
	});

	els.dirInput.addEventListener("keydown", e => {
		if (e.key === "Enter") {
			const val = els.dirInput.value.trim();
			if (val) openPath(val);
			exitEditMode();
		} else if (e.key === "Escape") {
			exitEditMode();
		}
	});
	els.dirInput.addEventListener("blur", () => exitEditMode());

	els.search.addEventListener("input", () => {
		state.searchQuery = els.search.value;
		els.searchWrap.classList.toggle("has-query", !!state.searchQuery);
		emit("search:change", state.searchQuery);
	});
	els.clearSearch.addEventListener("click", () => {
		els.search.value = "";
		state.searchQuery = "";
		els.searchWrap.classList.remove("has-query");
		emit("search:change", "");
	});

	els.viewModes.querySelectorAll(".view-mode-btn").forEach(btn => {
		btn.addEventListener("click", () => {
			const mode = btn.dataset.mode;
			state.viewMode = mode;
			updateViewModeButtons();
			emit("view:change", mode);
		});
	});
	updateViewModeButtons();

	on("path:change", () => {
		renderBreadcrumbs();
		updateNavButtons();
		els.dirInput.value = state.currentPath;
		els.search.setAttribute("placeholder", `Search ${basename(state.currentPath) || ""}`);
		if (els.search.value) {
			els.search.value = "";
			state.searchQuery = "";
			els.searchWrap.classList.remove("has-query");
			emit("search:change", "");
		}
		updateDriveModal(state.currentPath);
	});

	renderBreadcrumbs();
	updateNavButtons();
}

function enterEditMode() {
	els.breadcrumbs.classList.add("editing");
	els.dirInput.value = state.currentPath;
	els.dirInput.focus();
	els.dirInput.select();
}

function exitEditMode() {
	els.breadcrumbs.classList.remove("editing");
}

function updateViewModeButtons() {
	els.viewModes.querySelectorAll(".view-mode-btn").forEach(b => {
		b.classList.toggle("active", b.dataset.mode === state.viewMode);
	});
}

function updateNavButtons() {
	els.back.classList.toggle("disabled", state.historyIndex <= 0);
	els.forward.classList.toggle("disabled", state.historyIndex >= state.history.length - 1);
	const p = state.currentPath;
	const noUp = !p || p === "/" || p === "//";
	els.up.classList.toggle("disabled", noUp);
}

function renderBreadcrumbs() {
	const p = state.currentPath || "";
	els.breadcrumbs.innerHTML = "";
	if (!p || p === "/" || p === "//") {
		addCrumb("/", "/");
		return;
	}
	const parts = p.split("/").filter(Boolean);
	addCrumb("/", "/");
	let acc = "";
	for (let i = 0; i < parts.length; i++) {
		acc += `/${parts[i]}`;
		addSep();
		addCrumb(parts[i], acc);
	}
}

function addCrumb(label, path) {
	const c = document.createElement("span");
	c.className = "crumb";
	c.textContent = label;
	c.addEventListener("click", e => {
		e.stopPropagation();
		emit("crumb:click", path);
	});
	
	if (label === "/") {
		let hoverPanel = null;
		let hoverTimeout = null;
		let hideTimeout = null;
		
		const showPanel = async () => {
			if (hoverPanel) return;
			
			hoverPanel = document.createElement("div");
			hoverPanel.className = "breadcrumb-hover-panel";
			
			const currentPath = state.currentPath || "/";
			const parts = currentPath.split("/").filter(Boolean);
			
			const rootItem = createTreeItem("/", "/", 0);
			hoverPanel.appendChild(rootItem);
			
			let accPath = "";
			for (let i = 0; i < parts.length; i++) {
				accPath += `/${parts[i]}`;
				try {
					const item = createTreeItem(parts[i], accPath, i + 1);
					hoverPanel.appendChild(item);
					
					if (i < parts.length - 1) {
						const children = await loadFolderChildren(accPath);
						for (const child of children) {
							const childItem = createTreeItem(child.name, child.path, i + 2, true);
							hoverPanel.appendChild(childItem);
						}
					}
				} catch (e) {
					console.error("Error loading tree item:", e);
				}
			}
			
			const rect = c.getBoundingClientRect();
			hoverPanel.style.left = `${rect.left}px`;
			hoverPanel.style.top = `${rect.bottom + 4}px`;
			
			hoverPanel.addEventListener("mouseenter", () => {
				clearTimeout(hideTimeout);
			});
			
			hoverPanel.addEventListener("mouseleave", () => {
				hideTimeout = setTimeout(() => {
					if (hoverPanel) {
						hoverPanel.remove();
						hoverPanel = null;
					}
				}, 100);
			});
			
			document.body.appendChild(hoverPanel);
		};
		
		const hidePanel = () => {
			hideTimeout = setTimeout(() => {
				if (hoverPanel) {
					hoverPanel.remove();
					hoverPanel = null;
				}
			}, 100);
		};
		
		c.addEventListener("mouseenter", () => {
			clearTimeout(hideTimeout);
			hoverTimeout = setTimeout(showPanel, 300);
		});
		
		c.addEventListener("mouseleave", () => {
			clearTimeout(hoverTimeout);
			hidePanel();
		});
	}
	
	els.breadcrumbs.appendChild(c);
}

function createTreeItem(label, path, depth, isChild = false) {
	const item = document.createElement("div");
	item.className = "tree-item";
	if (isChild) item.classList.add("is-child");
	item.style.paddingLeft = `${depth * 16}px`;
	
	const icon = document.createElement("span");
	icon.className = "tree-icon";
	icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.25 3.5h-5.5A1.75 1.75 0 0 0 2 5.25v13.5c0 .966.784 1.75 1.75 1.75h16.5A1.75 1.75 0 0 0 22 18.75v-11a1.75 1.75 0 0 0-1.75-1.75h-8.5a.25.25 0 0 1-.186-.084l-1.626-1.83a1.75 1.75 0 0 0-1.188-.586Z"/></svg>`;
	
	const name = document.createElement("span");
	name.className = "tree-name";
	name.textContent = label;
	
	item.appendChild(icon);
	item.appendChild(name);
	
	item.addEventListener("click", e => {
		e.stopPropagation();
		emit("crumb:click", path);
		const panel = item.closest(".breadcrumb-hover-panel");
		if (panel) panel.remove();
	});
	
	return item;
}

async function loadFolderChildren(path) {
	try {
		const entries = await tb.fs.promises.readdir(path);
		const children = [];
		for (const name of entries) {
			if (name.startsWith(".")) continue;
			const fullPath = path === "/" ? `/${name}` : `${path}/${name}`;
			try {
				const stats = await tb.fs.promises.stat(fullPath);
				if (stats.isDirectory()) {
					children.push({ name, path: fullPath });
				}
			} catch (e) {
				// Skip files that can't be stat'd
			}
		}
		return children.slice(0, 10);
	} catch (e) {
		return [];
	}
}

function addSep() {
	const s = document.createElement("span");
	s.className = "crumb-sep";
	s.textContent = "›";
	els.breadcrumbs.appendChild(s);
}

export function pushHistory(path) {
	if (state.history[state.historyIndex] === path) return;
	state.history = state.history.slice(0, state.historyIndex + 1);
	state.history.push(path);
	state.historyIndex = state.history.length - 1;
	updateNavButtons();
}

function updateDriveModal(path) {
	const modal = document.querySelector(".drive-modal");
	if (!modal) return;
	if (path === "local storage" || path?.startsWith("local storage/")) {
		modal.style.display = "flex";
		modal.innerHTML = `<svg style="width: 22px; height: fit-content;" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.08 5.227A3 3 0 016.979 3H17.02a3 3 0 012.9 2.227l2.113 7.926A5.228 5.228 0 0018.75 12H5.25a5.228 5.228 0 00-3.284 1.153L4.08 5.227z"/><path fill-rule="evenodd" d="M5.25 13.5a3.75 3.75 0 100 7.5h13.5a3.75 3.75 0 100-7.5H5.25z" clip-rule="evenodd"/></svg><span>LFS</span>`;
		return;
	}
	if (path?.startsWith("/mnt/")) {
		modal.style.display = "flex";
		modal.innerHTML = `<svg style="width: 22px; height: fit-content;" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.08 5.227A3 3 0 016.979 3H17.02a3 3 0 012.9 2.227l2.113 7.926A5.228 5.228 0 0018.75 12H5.25a5.228 5.228 0 00-3.284 1.153L4.08 5.227z"/><path fill-rule="evenodd" d="M5.25 13.5a3.75 3.75 0 100 7.5h13.5a3.75 3.75 0 100-7.5H5.25z" clip-rule="evenodd"/><circle cx="18" cy="17.25" r="3" fill="#5DD881"/></svg><span>WebDav</span>`;
		return;
	}
	modal.style.display = "none";
	modal.innerHTML = "";
}

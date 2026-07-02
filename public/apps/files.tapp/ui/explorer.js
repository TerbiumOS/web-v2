import { fileIcon, folderIcon } from "../icons.js";
import { clearSelection, emit, on, setSelection, state, toggleSelect } from "../state.js";
import { formatDate, formatSize, getExt } from "../utils.js";

let wrapEl;
let expEl;
let headerEl;
let statusEl;
let marqueeEl;
let openPathFn;
let openFileFn;
let contextMenuFn;
let renderToken = 0;

export function initExplorer({ openPath, openFile, contextMenu }) {
	wrapEl = document.querySelector(".exp-wrap");
	expEl = document.querySelector(".exp");
	headerEl = document.getElementById("expHeader");
	statusEl = document.getElementById("expStatus");
	marqueeEl = document.getElementById("marquee");
	openPathFn = openPath;
	openFileFn = openFile;
	contextMenuFn = contextMenu;

	applyViewMode(state.viewMode);
	renderDetailsHeader();

	on("view:change", mode => {
		applyViewMode(mode);
		if (state.currentPath !== "storage devices") {
			renderItems();
		}
	});
	on("selection:change", () => updateSelectionUI());
	on("search:change", () => renderItems());
	on("items:set", () => renderItems());

	expEl.addEventListener("click", e => {
		if (e.target === expEl) clearSelection();
	});

	expEl.addEventListener("contextmenu", e => {
		e.preventDefault();

		if (state.currentPath === "storage devices" || state.currentPath === "local storage" || state.currentPath.startsWith("local storage/")) {
			return;
		}

		const itemEl = e.target.closest(".item");
		if (itemEl) {
			const path = itemEl.dataset.path;
			if (!state.selection.has(path)) {
				setSelection([path]);
			}
			contextMenuFn(e, { type: itemEl.dataset.type, target: itemEl });
		} else {
			clearSelection();
			contextMenuFn(e, { type: "background" });
		}
	});

	initMarquee();
	initDragDrop();
	initKeyboard();
}

function applyViewMode(mode) {
	wrapEl.classList.remove("grid", "list", "details");
	wrapEl.classList.add(mode);
}

function renderDetailsHeader() {
	headerEl.innerHTML = `
		<span class="col col-name" data-key="name">Name</span>
		<span class="col col-size" data-key="size">Size</span>
		<span class="col col-modified" data-key="modified">Modified</span>
		<span class="col col-type" data-key="type">Type</span>
	`;
	headerEl.querySelectorAll(".col").forEach(col => {
		col.addEventListener("click", () => {
			const key = col.dataset.key;
			if (state.sortKey === key) state.sortAsc = !state.sortAsc;
			else {
				state.sortKey = key;
				state.sortAsc = true;
			}
			updateSortIndicators();
			renderItems();
			emit("sort:change", { key: state.sortKey, asc: state.sortAsc });
		});
	});
	updateSortIndicators();
}

function updateSortIndicators() {
	headerEl.querySelectorAll(".col").forEach(c => {
		c.classList.remove("sorted", "asc");
		if (c.dataset.key === state.sortKey) {
			c.classList.add("sorted");
			if (state.sortAsc) c.classList.add("asc");
		}
	});
}

export function setItems(items) {
	state.items = items;
	emit("items:set", items);
}

function sortItems(items) {
	const dir = state.sortAsc ? 1 : -1;
	const key = state.sortKey;
	const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
	return [...items].sort((a, b) => {
		if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
		let cmp = 0;
		switch (key) {
			case "size":
				cmp = (a.size || 0) - (b.size || 0);
				break;
			case "modified":
				cmp = new Date(a.modified || 0).getTime() - new Date(b.modified || 0).getTime();
				break;
			case "type":
				cmp = getExt(a.name).localeCompare(getExt(b.name));
				break;
			default:
				cmp = 0;
		}
		if (cmp === 0) cmp = byName(a, b);
		return cmp * dir;
	});
}

async function renderItems() {
	const token = ++renderToken;
	expEl.innerHTML = "";
	let items = state.items;
	if (state.searchQuery) {
		const q = state.searchQuery.toLowerCase();
		items = items.filter(i => i.name.toLowerCase().includes(q));
	}
	items = sortItems(items);
	if (!items.length) {
		const empty = document.createElement("div");
		empty.className = "exp-empty";
		empty.textContent = state.searchQuery ? "No matches" : "This folder is empty";
		expEl.appendChild(empty);
		updateStatus(items);
		return;
	}
	for (const it of items) {
		if (token !== renderToken) return;
		const el = await createItemEl(it);
		expEl.appendChild(el);
	}
	updateSelectionUI();
	updateStatus(items);
}

async function createItemEl(item) {
	const el = document.createElement("div");
	el.className = `item ${item.type}-item`;
	el.dataset.path = item.path;
	el.dataset.name = item.name;
	el.dataset.type = item.type;
	el.draggable = true;
	if (item.systemFolder) el.dataset.systemFolder = "true";

	const icon = document.createElement("div");
	icon.className = "item-icon";
	icon.innerHTML = item.type === "folder" ? await folderIcon(item.path, item.name) : await fileIcon(item.name);
	el.appendChild(icon);

	const nameEl = document.createElement("div");
	nameEl.className = "item-name";
	nameEl.textContent = item.name;
	el.appendChild(nameEl);

	if (state.viewMode === "details") {
		const sizeEl = document.createElement("div");
		sizeEl.className = "item-meta meta-size";
		sizeEl.textContent = item.type === "file" ? formatSize(item.size) : "";
		el.appendChild(sizeEl);
		const modEl = document.createElement("div");
		modEl.className = "item-meta meta-modified";
		modEl.textContent = formatDate(item.modified);
		el.appendChild(modEl);
		const typeEl = document.createElement("div");
		typeEl.className = "item-meta meta-type";
		typeEl.textContent = item.type === "folder" ? "Folder" : (getExt(item.name) || "File").toUpperCase();
		el.appendChild(typeEl);
	}

	el.addEventListener("click", e => {
		e.stopPropagation();
		toggleSelect(item.path, { additive: e.ctrlKey || e.metaKey, range: e.shiftKey });
	});
	el.addEventListener("dblclick", e => {
		e.stopPropagation();
		if (item.type === "folder") openPathFn(item.path);
		else if (item.path.startsWith("local storage/")) emit("action:ls-edit", item.path);
		else openFileFn(item.path, item.name);
	});

	return el;
}

function updateSelectionUI() {
	expEl.querySelectorAll(".item").forEach(el => {
		el.classList.toggle("selected", state.selection.has(el.dataset.path));
	});
	updateStatus();
}

function updateStatus(items) {
	const total = (items || state.items).length;
	const selected = state.selection.size;
	let text = `${total} item${total === 1 ? "" : "s"}`;
	if (selected > 0) text += ` · ${selected} selected`;
	statusEl.textContent = text;
}

function initMarquee() {
	let dragging = false;
	let startX = 0;
	let startY = 0;
	let scrollLeft = 0;
	let scrollTop = 0;

	expEl.addEventListener("mousedown", e => {
		if (e.button !== 0) return;
		if (e.target !== expEl && !e.target.classList?.contains("exp-empty")) return;
		dragging = true;
		const rect = expEl.getBoundingClientRect();
		startX = e.clientX - rect.left + expEl.scrollLeft;
		startY = e.clientY - rect.top + expEl.scrollTop;
		scrollLeft = expEl.scrollLeft;
		scrollTop = expEl.scrollTop;
		marqueeEl.hidden = false;
		marqueeEl.style.left = `${startX - scrollLeft}px`;
		marqueeEl.style.top = `${startY - scrollTop}px`;
		marqueeEl.style.width = "0px";
		marqueeEl.style.height = "0px";
		if (!(e.ctrlKey || e.metaKey)) clearSelection();
	});
	window.addEventListener("mousemove", e => {
		if (!dragging) return;
		const rect = expEl.getBoundingClientRect();
		const curX = e.clientX - rect.left + expEl.scrollLeft;
		const curY = e.clientY - rect.top + expEl.scrollTop;
		const x = Math.min(curX, startX);
		const y = Math.min(curY, startY);
		const w = Math.abs(curX - startX);
		const h = Math.abs(curY - startY);
		marqueeEl.style.left = `${x - expEl.scrollLeft}px`;
		marqueeEl.style.top = `${y - expEl.scrollTop}px`;
		marqueeEl.style.width = `${w}px`;
		marqueeEl.style.height = `${h}px`;
		const box = { left: x, top: y, right: x + w, bottom: y + h };
		const paths = new Set(state.selection);
		expEl.querySelectorAll(".item").forEach(el => {
			const er = {
				left: el.offsetLeft,
				top: el.offsetTop,
				right: el.offsetLeft + el.offsetWidth,
				bottom: el.offsetTop + el.offsetHeight,
			};
			const hit = !(er.left > box.right || er.right < box.left || er.top > box.bottom || er.bottom < box.top);
			if (hit) paths.add(el.dataset.path);
		});
		setSelection([...paths]);
	});
	window.addEventListener("mouseup", () => {
		if (!dragging) return;
		dragging = false;
		marqueeEl.hidden = true;
	});
}

function initDragDrop() {
	expEl.addEventListener("dragstart", e => {
		const itemEl = e.target.closest(".item");
		if (!itemEl) return;
		if (!state.selection.has(itemEl.dataset.path)) {
			setSelection([itemEl.dataset.path]);
		}
		const paths = [...state.selection];
		e.dataTransfer.setData("application/x-files-paths", JSON.stringify(paths));
		e.dataTransfer.effectAllowed = "copyMove";
	});
	expEl.addEventListener("dragover", e => {
		e.preventDefault();
		const itemEl = e.target.closest(".item");
		for (const el of expEl.querySelectorAll(".drop-target")) el.classList.remove("drop-target");
		if (itemEl && itemEl.dataset.type === "folder") {
			itemEl.classList.add("drop-target");
		} else {
			expEl.classList.add("drop-hover");
		}
		e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
	});
	expEl.addEventListener("dragleave", e => {
		if (e.target === expEl) expEl.classList.remove("drop-hover");
	});
	expEl.addEventListener("drop", e => {
		e.preventDefault();
		expEl.classList.remove("drop-hover");
		for (const el of expEl.querySelectorAll(".drop-target")) el.classList.remove("drop-target");
		const itemEl = e.target.closest(".item");
		const destDir = itemEl && itemEl.dataset.type === "folder" ? itemEl.dataset.path : state.currentPath;
		const pathsData = e.dataTransfer.getData("application/x-files-paths");
		if (pathsData) {
			const paths = JSON.parse(pathsData);
			emit("drop:internal", { paths, destDir, copy: e.ctrlKey });
			return;
		}
		if (e.dataTransfer.files?.length) {
			emit("drop:external", { files: [...e.dataTransfer.files], destDir });
		}
	});
}

function initKeyboard() {
	window.addEventListener("keydown", e => {
		if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
			e.preventDefault();
			setSelection(state.items.map(i => i.path));
			return;
		}
		if (e.key === "Delete") {
			if (state.selection.size > 0) emit("action:delete");
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
			if (state.selection.size > 0) emit("action:copy");
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
			if (state.selection.size > 0) emit("action:cut");
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
			emit("action:paste");
		} else if (e.key === "F2") {
			if (state.selection.size === 1) emit("action:rename");
		} else if (e.key === "F5") {
			emit("action:reload");
		} else if (e.key === "Enter") {
			if (state.selection.size === 1) emit("action:open");
		}
	});
}

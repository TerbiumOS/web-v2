export const tb = window.parent.tb;
export const user = sessionStorage.getItem("currAcc");

export const state = {
	currentPath: "",
	history: [],
	historyIndex: -1,
	selection: new Set(),
	lastSelected: null,
	items: [],
	displayedItems: [],
	clipboard: null,
	viewMode: "grid",
	sortKey: "name",
	sortAsc: true,
	showHidden: false,
	searchQuery: "",
	editingPath: false,
};

export const subscribers = new Map();

export function emit(event, payload) {
	const list = subscribers.get(event);
	if (!list) return;
	for (const fn of list) {
		try {
			fn(payload);
		} catch (e) {
			console.error(`event "${event}" handler:`, e);
		}
	}
}

export function on(event, fn) {
	if (!subscribers.has(event)) subscribers.set(event, new Set());
	subscribers.get(event).add(fn);
	return () => subscribers.get(event)?.delete(fn);
}

export function setClipboard(payload) {
	state.clipboard = payload;
	emit("clipboard:change", payload);
}

export function clearSelection() {
	state.selection.clear();
	state.lastSelected = null;
	emit("selection:change", state.selection);
}

export function setSelection(paths) {
	state.selection = new Set(paths);
	emit("selection:change", state.selection);
}

export function toggleSelect(path, options = {}) {
	const { additive = false, range = false } = options;
	if (range && state.lastSelected) {
		const paths = state.displayedItems.map(i => i.path);
		const a = paths.indexOf(state.lastSelected);
		const b = paths.indexOf(path);
		if (a !== -1 && b !== -1) {
			const [lo, hi] = a < b ? [a, b] : [b, a];
			if (!additive) state.selection.clear();
			for (let i = lo; i <= hi; i++) state.selection.add(paths[i]);
			state.lastSelected = path;
			emit("selection:change", state.selection);
			return;
		}
	}
	if (additive) {
		if (state.selection.has(path)) state.selection.delete(path);
		else state.selection.add(path);
	} else {
		state.selection.clear();
		state.selection.add(path);
	}
	state.lastSelected = path;
	emit("selection:change", state.selection);
}

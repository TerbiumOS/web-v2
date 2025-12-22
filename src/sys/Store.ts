import React from "react";
import { create } from "zustand";
import { WindowConfig, cmprops, fileExists } from "./types";
import { init } from "@paralleldrive/cuid2";
import { updateInfo } from "./gui/AppIsland";

interface WindowState {
	windows: WindowConfig[];
	wid?: string;
	pid?: string;
	matchedWindows: any;
	addWindow: (config: WindowConfig) => void;
	killWindow: (wid: any) => void;
	removeWindow: (wid: any) => void;
	arrange: (wid: any) => void;
	minimize: (wid: any) => void;
	getWindow: (wid: any) => void;
	currentPID?: string;
}

interface ContextMenuState {
	menu: cmprops;
	setContextMenu: (options: any) => void;
	clearContextMenu: () => void;
}

interface SearchMenuState {
	open: boolean;
	setOpen: (open: boolean) => void;
	searchRef: React.RefObject<HTMLInputElement | null>;
	searchMenuRef: React.RefObject<HTMLDivElement | null>;
}

let lastPID = 1;

export const createPID = () => {
	return (lastPID++).toString();
};

export const createWID = () => {
	const cuid = init({
		length: 10,
	});
	return "w-" + cuid();
};

const useWindowStore = create<WindowState>()(set => ({
	windows: [],
	matchedWindows: [],
	addWindow: async (config: WindowConfig) => {
		const recentApps = (await fileExists("/system/var/terbium/recent.json"))
			? JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/recent.json", "utf8"))
			: (await window.tb.fs.promises.writeFile("/system/var/terbium/recent.json", JSON.stringify([], null, 2), "utf8").catch((err: any) => console.error(err)), []);
		const updateState = async (state: WindowState) => {
			const indexes = state.windows.map(w => w.zIndex ?? 0);
			config.zIndex = Math.max(...indexes) + 1;
			config.focused = true;
			if (config.zIndex === -Infinity) {
				config.zIndex = 2;
			}
			state.windows.forEach(w => {
				if (w.wid !== config.wid) {
					w.focused = false;
					if (w.zIndex !== undefined) {
						Math.max(0, w.zIndex - 1);
					}
				}
			});

			// @ts-expect-error
			const matched = state.matchedWindows.findIndex(group =>
				// @ts-expect-error
				group.some(w => (typeof w.title === "string" ? w.title : w.title?.text) === (typeof config.title === "string" ? config.title : config.title?.text)),
			);

			if (matched !== -1) {
				state.matchedWindows[matched].push(config);
			} else {
				state.matchedWindows.push([config]);
			}

			config.wid = createWID();
			config.pid = createPID();
			const appName = typeof config.title === "string" ? config.title : config.title?.text;
			let configData: any = null;
			try {
				const data = JSON.parse(await window.tb.fs.promises.readFile(`/apps/system/${appName.toLowerCase()}.tapp/index.json`, "utf8")).config;
				configData = {
					...data,
					weight: 1,
				};
			} catch (err) {
				configData = {
					title: appName,
					icon: config.icon,
					src: config.src,
					weight: 1,
				};
			}

			if (recentApps.length > 10) {
				const lowestWeight = Math.min(...recentApps.map((app: any) => app.weight));
				const lowestWeightIndex = recentApps.findIndex((app: any) => app.weight === lowestWeight);
				recentApps.splice(lowestWeightIndex, 1);
			}

			const recentAppIndex = recentApps.findIndex((app: any) => {
				return (typeof app.title === "string" ? app.title.toLowerCase() : app.title?.text.toLowerCase()) === (typeof configData.title === "string" ? configData.title.toLowerCase() : configData.title?.text.toLowerCase());
			});

			if (recentAppIndex === -1) {
				recentApps.push(configData);
			} else {
				recentApps[recentAppIndex].weight += 1;
			}
			await window.tb.fs.promises.writeFile("/system/var/terbium/recent.json", JSON.stringify(recentApps, null, 2), "utf8").catch((err: any) => {
				console.error("Error writing recent apps file:", err);
			});

			window.dispatchEvent(new CustomEvent("selwin-upd", { detail: typeof config.title === "string" ? config.title : config.title?.text }));

			return {
				windows: [...state.windows, config],
				matchedWindows: [...state.matchedWindows],
				currentPID: config.pid,
			};
		};

		const newState = await updateState(useWindowStore.getState());
		set(newState);
	},
	killWindow: (pid: string) =>
		set((state: any) => {
			const windows = state.windows.filter((w: any) => w.pid !== pid);
			const matchedWindows = state.matchedWindows
				.map((group: any) => {
					const newGroup = group.filter((w: any) => w.pid !== pid);
					return newGroup.length > 0 ? newGroup : null;
				})
				.filter((group: any) => group !== null);
			const indexes = windows.map((w: any) => w.zIndex ?? 0);
			const highest = Math.max(...indexes);
			const win = windows.find((w: any) => w.zIndex === highest);
			if (win) {
				win.focused = true;
				updateInfo({ appname: typeof win.title === "string" ? win.title : win.title?.text });
				window.dispatchEvent(new CustomEvent("selwin-upd", { detail: typeof win.title === "string" ? win.title : win.title?.text }));
			}

			return {
				windows,
				matchedWindows,
			};
		}),
	removeWindow: (wid: string) => {
		set((state: any) => {
			const windows = state.windows.filter((w: any) => w.wid !== wid);
			const matchedWindows = state.matchedWindows
				.map((group: any) => {
					const newGroup = group.filter((w: any) => w.wid !== wid);
					return newGroup.length > 0 ? newGroup : null;
				})
				.filter((group: any) => group !== null);
			const indexes = windows.map((w: any) => w.zIndex ?? 0);
			const highest = Math.max(...indexes);
			const win = windows.find((w: any) => w.zIndex === highest);
			if (win) {
				win.focused = true;
				updateInfo({ appname: typeof win.title === "string" ? win.title : win.title?.text });
				window.dispatchEvent(new CustomEvent("selwin-upd", { detail: typeof win.title === "string" ? win.title : win.title?.text }));
			}

			return {
				windows,
				matchedWindows,
			};
		});
	},
	arrange: (wid: string) =>
		set((state: WindowState) => {
			const window = state.windows.find(w => w.wid === wid);
			if (!window) return state;
			
			const indexes = state.windows.map(w => w.zIndex ?? 0);
			const maxIndex = Math.max(...indexes);
			
			// Optimization: Check if window is already at highest z-index
			// This can be disabled if window optimization setting is off
			if (window.focused && window.zIndex === maxIndex) {
				return state; // No update needed
			}
			
			set({ currentPID: window.pid });

			window.zIndex = maxIndex + 1;
			window.focused = true;
			state.windows.forEach(w => {
				if (w.wid !== wid) {
					w.focused = false;
				}
			});

			return {
				windows: [...state.windows], // Create new array reference for React to detect change
			};
		}),
	minimize: (wid: string) =>
		set((state: WindowState) => {
			const window = state.windows.find(w => w.wid === wid);
			if (!window) return state;
			window.focused = false;
			return {
				windows: state.windows,
			};
		}),
	getWindow: (wid: string) => {
		const state = useWindowStore.getState();
		return state.windows.find(w => w.wid === wid);
	},
}));

const useContextMenuStore = create<ContextMenuState>()(set => ({
	menu: { x: 0, y: 0, options: [] },
	setContextMenu: (options: any) => set({ menu: options }),
	clearContextMenu: () => set({ menu: { x: 0, y: 0, options: [] } }),
}));

const useSearchMenuStore = create<SearchMenuState>()(set => ({
	open: false,
	setOpen: (open: boolean) => set({ open }),
	searchRef: React.createRef<HTMLInputElement | null>(),
	searchMenuRef: React.createRef<HTMLDivElement | null>(),
}));

export { useWindowStore, useContextMenuStore, useSearchMenuStore };

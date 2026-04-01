import { fileExists } from "../../types";

export async function launchProcs(): Promise<void> {
	const toLaunch = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/startup.json", "utf8"));
	const currUser = sessionStorage.getItem("currAcc") || "Guest";
	const userProcs = toLaunch[currUser] || {};
	const systemProcs = toLaunch["System"] || {};
	for (const proc in systemProcs) {
		setTimeout(() => {}, 1000);
		if (systemProcs[proc].enabled) {
			try {
				eval(systemProcs[proc].start);
			} catch (e) {
				console.error(`Failed to launch system startup process ${proc}:`, e);
			}
		}
	}
	for (const proc in userProcs) {
		setTimeout(() => {}, 1000);
		if (userProcs[proc].enabled) {
			try {
				eval(userProcs[proc].start);
			} catch (e) {
				console.error(`Failed to launch user startup process ${proc}:`, e);
			}
		}
	}
}

export async function addStartupProc(proc: string, target: "System" | "User", cmd?: string): Promise<void> {
	if (!(await fileExists("/system/var/terbium/startup.json"))) {
		const users = await window.tb.fs.promises.readdir("/home/");
		const startupObj = {
			System: {},
			...Object.fromEntries(users.map(user => [user, {}])),
		};
		await window.tb.fs.promises.writeFile("/system/var/terbium/startup.json", JSON.stringify(startupObj), "utf8");
	}
	const startupData = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/startup.json", "utf8"));
	const currUser = sessionStorage.getItem("currAcc") || "Guest";
	const relTarget = target === "System" ? "System" : currUser;
	if (!startupData[relTarget]) {
		startupData[relTarget] = {};
	}
	startupData[relTarget][proc] = {
		start: cmd || `tb.system.openApp('${proc.toLowerCase().replace(/\s+/g, "")}')`,
		installedby: currUser,
		enabled: false,
	};
	await window.tb.fs.promises.writeFile("/system/var/terbium/startup.json", JSON.stringify(startupData, null, 4), "utf8");
}

export async function removeStartupProc(proc: string, target: "System" | "User"): Promise<void> {
	if (!(await fileExists("/system/var/terbium/startup.json"))) {
		return;
	}
	const startupData = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/startup.json", "utf8"));
	const currUser = sessionStorage.getItem("currAcc") || "Guest";
	const relTarget = target === "System" ? "System" : currUser;
	if (!startupData[relTarget] || !startupData[relTarget][proc]) {
		return;
	}
	delete startupData[relTarget][proc];
	await window.tb.fs.promises.writeFile("/system/var/terbium/startup.json", JSON.stringify(startupData, null, 4), "utf8");
}

export async function enableProc(proc: string, target: "System" | "User"): Promise<void> {
	if (!(await fileExists("/system/var/terbium/startup.json"))) {
		return;
	}
	const startupData = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/startup.json", "utf8"));
	const currUser = sessionStorage.getItem("currAcc") || "Guest";
	const relTarget = target === "System" ? "System" : currUser;
	if (!startupData[relTarget] || !startupData[relTarget][proc]) {
		return;
	}
	startupData[relTarget][proc].enabled = true;
	await window.tb.fs.promises.writeFile("/system/var/terbium/startup.json", JSON.stringify(startupData, null, 4), "utf8");
}

export async function disableProc(proc: string, target: "System" | "User"): Promise<void> {
	if (!(await fileExists("/system/var/terbium/startup.json"))) {
		return;
	}
	const startupData = JSON.parse(await window.tb.fs.promises.readFile("/system/var/terbium/startup.json", "utf8"));
	const currUser = sessionStorage.getItem("currAcc") || "Guest";
	const relTarget = target === "System" ? "System" : currUser;
	if (!startupData[relTarget] || !startupData[relTarget][proc]) {
		return;
	}
	startupData[relTarget][proc].enabled = false;
	await window.tb.fs.promises.writeFile("/system/var/terbium/startup.json", JSON.stringify(startupData, null, 4), "utf8");
}

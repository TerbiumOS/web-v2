import { tb, user } from "../state.js";
import { readJSON } from "../utils.js";
import { updateDavStatus } from "./sidebar.js";

const DRIVE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.08 5.227A3 3 0 016.979 3H17.02a3 3 0 012.9 2.227l2.113 7.926A5.228 5.228 0 0018.75 12H5.25a5.228 5.228 0 00-3.284 1.153L4.08 5.227z"/><path fill-rule="evenodd" d="M5.25 13.5a3.75 3.75 0 100 7.5h13.5a3.75 3.75 0 100-7.5H5.25zm10.5 4.5a.75.75 0 100-1.5.75.75 0 000 1.5zm3.75-.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clip-rule="evenodd"/></svg>`;

const DAV_OK_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25Z"/><circle cx="18" cy="17.25" r="3" fill="#5DD881"/></svg>`;

const DAV_BAD_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.07982 5.227C4.25015 4.58826 4.6267 4.02366 5.15094 3.62094C5.67518 3.21822 6.31775 2.99993 6.97882 3H17.0198C17.6811 2.99971 18.3239 3.2179 18.8483 3.62063C19.3728 4.02337 19.7494 4.58809 19.9198 5.227L22.0328 13.153C21.1022 12.4051 19.9437 11.9982 18.7498 12H5.24982C4.05559 11.998 2.89667 12.4049 1.96582 13.153L4.07982 5.227Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 13.5C4.75754 13.5 4.26991 13.597 3.81494 13.7855C3.35997 13.9739 2.94657 14.2501 2.59835 14.5983C2.25013 14.9466 1.97391 15.36 1.78545 15.8149C1.597 16.2699 1.5 16.7575 1.5 17.25C1.5 17.7425 1.597 18.2301 1.78545 18.6851C1.97391 19.14 2.25013 19.5534 2.59835 19.9017C2.94657 20.2499 3.35997 20.5261 3.81494 20.7145C4.26991 20.903 4.75754 21 5.25 21H18.75C19.2425 21 19.7301 20.903 20.1851 20.7145C20.64 20.5261 21.0534 20.2499 21.4017 19.9017C21.7499 19.5534 22.0261 19.14 22.2145 18.6851C22.403 18.2301 22.5 17.7425 22.5 17.25C22.5 16.7575 22.403 16.2699 22.2145 15.8149C22.0261 15.36 21.7499 14.9466 21.4017 14.5983C21.0534 14.2501 20.64 13.9739 20.1851 13.7855C19.7301 13.597 19.2425 13.5 18.75 13.5H5.25Z"/><circle cx="18" cy="17.25" r="3" fill="#D8645D"/></svg>`;

function formatBytes(bytes) {
	if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	return `${(bytes / 1024).toFixed(2)} KB`;
}

function makeCard(type, davInfo) {
	const item = document.createElement("div");
	item.className = "sd-item";
	const icon = document.createElement("div");
	icon.className = "icon";
	icon.innerHTML = DRIVE_ICON;
	item.appendChild(icon);
	const info = document.createElement("div");
	info.className = "info";
	const title = document.createElement("span");
	title.className = "title";
	info.appendChild(title);
	const percentContainer = document.createElement("span");
	percentContainer.className = "percent-container";
	const percent = document.createElement("span");
	percent.className = "percent";
	percent.style.width = "100%";
	percentContainer.appendChild(percent);
	info.appendChild(percentContainer);
	const size = document.createElement("div");
	size.className = "size";
	info.appendChild(size);
	item.appendChild(info);

	if (type === "local") {
		title.textContent = "Local Storage";
		const maxStorage = 10 * 1024 * 1024;
		const usedSize = Object.keys(localStorage).reduce((total, key) => {
			const val = localStorage.getItem(key);
			return total + JSON.stringify(val).length * 2 + key.length * 2;
		}, 0);
		const usedPct = (usedSize / maxStorage) * 100;
		size.textContent = `${formatBytes(usedSize)} of ${maxStorage / (1024 * 1024)} MB`;
		percent.style.width = `${Math.min(usedPct, 100)}%`;
		percent.style.backgroundColor = usedPct >= 90 ? "#D8645D" : "#5D78D8";
	} else if (type === "fs") {
		title.textContent = "File System";
		if ("navigator" in window && "storage" in navigator) {
			navigator.storage.estimate().then(estimate => {
				const totalSize = estimate.quota || 0;
				const usedSize = estimate.usage || 0;
				const usedPct = totalSize ? (usedSize / totalSize) * 100 : 0;
				size.textContent = `${formatBytes(usedSize)} of ${formatBytes(totalSize)}`;
				percent.style.width = `${Math.min(usedPct, 100)}%`;
				percent.style.backgroundColor = usedPct >= 90 ? "#D8645D" : "#5D78D8";
			});
		}
	} else if (type === "dav") {
		title.textContent = davInfo.name || "Dav Drive";
		const url = davInfo.url || "";
		size.textContent = url.length > 28 ? `${url.slice(0, 28)}…` : url;
		percent.style.width = "100%";
		item.id = `f-${String(davInfo.name || "").toLowerCase()}`;
		try {
			const servers = tb.vfs.servers;
			const connected = servers?.has(davInfo.name) && servers.get(davInfo.name).connected === true;
			icon.innerHTML = connected ? DAV_OK_ICON : DAV_BAD_ICON;
			percent.style.backgroundColor = connected ? "#5DD881" : "#D8645D";
			try {
				updateDavStatus(davInfo.name, connected);
			} catch {}
		} catch {
			icon.innerHTML = DAV_BAD_ICON;
			percent.style.backgroundColor = "#D8645D";
		}
	}

	return item;
}

export async function renderStorageDevices(expEl, openPath) {
	expEl.innerHTML = "";
	const wrap = document.createElement("div");
	wrap.className = "sd-items";

	const fsCard = makeCard("fs");
	fsCard.addEventListener("dblclick", () => openPath("//"));
	wrap.appendChild(fsCard);

	const lsCard = makeCard("local");
	lsCard.addEventListener("dblclick", () => openPath("local storage"));
	wrap.appendChild(lsCard);

	try {
		const davs = (await readJSON(`/apps/user/${user}/files/davs.json`)) || [];
		for (const dav of davs) {
			const card = makeCard("dav", dav);
			card.addEventListener("dblclick", () => openPath(`/mnt/${dav.name}/`));
			wrap.appendChild(card);
		}
	} catch (e) {
		console.error("davs.json:", e);
	}

	expEl.appendChild(wrap);
}

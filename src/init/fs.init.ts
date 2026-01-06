import paths from "../installer.json";
import { unzip } from "../sys/types";

export async function copyfs() {
	for (const item of paths) {
		const p = item.toString();
		if (p.includes("browser.tapp")) continue;
		window.dispatchEvent(new CustomEvent("oobe-setupstage", { detail: `Copying ${p} to File System...` }));
		if (p.toLowerCase().includes(".tapp.zip")) {
			const res = await fetch(`/apps/${p}`);
			if (!res.ok) {
				console.error(`Failed to fetch /apps/${p}: ${res.status} ${res.statusText}`);
				continue;
			}
			const data = await res.arrayBuffer();
			await window.tb.fs.promises.writeFile(`/apps/system/${p}`, window.tb.buffer.from(data));
			await unzip(`/apps/system/${p}`, `/apps/system/${p.slice(0, -4)}`);
			await window.tb.fs.promises.unlink(`/apps/system/${p}`);
			continue;
		}
		if (p.endsWith("/")) {
			await window.tb.fs.promises.mkdir(`/apps/system/${p}`);
		} else {
			const res = await fetch(`/apps/${p}`);
			if (!res.ok) {
				console.error(`Failed to fetch /apps/${p}: ${res.status} ${res.statusText}`);
				continue;
			}
			const data = await res.text();
			await window.tb.fs.promises.writeFile(`/apps/system/${p}`, data);
		}
	}
	return "Success";
}

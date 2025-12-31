import paths from "../installer.json";

export async function copyfs() {
	for (const item of paths) {
		const p = item.toString();
		if (p.includes("browser.tapp")) continue;
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

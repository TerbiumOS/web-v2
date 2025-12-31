import { WindowConfig } from "../types";
import { fileStat, isFilePathString } from "./utils/file";

type TSearchTerm = string | object | File | ArrayBuffer | Blob | null;

export const searchFiles = async (searchTerm: TSearchTerm): Promise<boolean | any[]> => {
	const sh = window.tb.sh;
	const searchResults: any[] = [];
	const searchTermString = typeof searchTerm === "string" ? searchTerm : JSON.stringify(searchTerm);
	const files = await sh.promises.find("/", { name: `*${searchTermString}` });

	if (!isFilePathString(searchTermString)) return false;
	for (const file of files) {
		const filePath = file.replace(/\\/g, "/");
		const fileName = await fileStat.name(filePath);
		const fileDir = await fileStat.dir(filePath);
		const fileSize = await fileStat.size(filePath);
		const fileType = await fileStat.type(filePath);
		const fileMTime = await fileStat.mTime(filePath);
		const fileCTime = await fileStat.cTime(filePath);
		const fileExt = await fileStat.ext(filePath);

		if (fileName.toLowerCase().includes(searchTermString.toLowerCase())) {
			let result = {
				name: fileName,
				ext: fileExt,
				type: fileType,
				size: fileSize,
				cTime: fileCTime,
				mTime: fileMTime,
				path: filePath,
				dir: fileDir,
			};
			searchResults.push(result);
		}
	}

	if (searchResults.length > 0) {
		return searchResults;
	} else {
		return false;
	}
};

interface IAppName {
	text: string;
	weight?: number;
	html?: string;
}

type TAppName = string | IAppName;

export const searchApps = async (searchTerm: TSearchTerm): Promise<boolean | { dir: string; icon: string; cfg: WindowConfig; name?: TAppName }[]> => {
	let searchTermString = typeof searchTerm === "string" ? searchTerm.toLowerCase() : JSON.stringify(searchTerm).toLowerCase();
	if (searchTermString.endsWith(".tapp")) searchTermString = searchTermString.replace(".tapp", "");

	let installed = JSON.parse(await window.tb.fs.promises.readFile("/apps/installed.json", "utf8"));
	const searchResults: any[] = [];
	for (const app of installed) {
		if (app.name && app.name.toLowerCase().includes(searchTermString)) {
			let cfg = JSON.parse(await window.tb.fs.promises.readFile(app.config, "utf8"));
			let icon: string | null = null;
			let appDir = app.config.replace(/\/[^\/]+\.json$|\/[^\/]+\.tbconfig$/i, "");

			try {
				if (cfg.icon) {
					icon = cfg.icon.includes("http") ? cfg.icon : cfg.icon;
				} else if (cfg.config && cfg.config.icon) {
					icon = cfg.config.icon.includes("http") ? cfg.config.icon : cfg.config.icon;
				} else if (cfg.wmArgs) {
					icon = cfg.wmArgs.icon.includes("http") ? cfg.config.icon : cfg.config.icon;
				}
			} catch {
				icon = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-[49] h-[49]" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd"></path>
                        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z"></path>
                    </svg>
                `;
			}

			if (!icon) {
				icon = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-[49] h-[49]" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd"></path>
                        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z"></path>
                    </svg>
                `;
			}

			if (cfg.manifest) {
				cfg.config = {
					title: cfg.manifest.name,
					icon: cfg.manifest.name.includes("Anura File Manager") ? "/apps/fsapp.app/files.png" : `${appDir}/${cfg.manifest.icon}`,
					src: cfg.manifest.name.includes("Anura File Manager") ? "/apps/fsapp.app/index.html" : `${appDir}/${cfg.manifest.index}`,
				};
			}

			let title: string = cfg.name;
			if (cfg.config && cfg.config.title) {
				title = typeof cfg.config.title === "object" ? cfg.config.title.text : cfg.config.title;
			} else if (cfg.wmArgs && cfg.wmArgs.title) {
				title = typeof cfg.wmArgs.title === "object" ? cfg.wmArgs.title.text : cfg.wmArgs.title;
			}
			searchResults.push({
				dir: title.includes("Anura File Manager") ? "int://apps/fsapp.app/" : appDir,
				icon: title.includes("Anura File Manager") ? "/apps/fsapp.app/files.png" : icon,
				name: title,
				cfg: cfg.config,
			});
		}
	}

	return searchResults.length > 0 ? searchResults : false;
};

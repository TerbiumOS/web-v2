const tb = parent.window.tb;
const tb_island = tb.window.island;

tb_island.addControl({
	text: "File",
	appname: "Media Viewer",
	id: "media-file",
	click: () => {
		const appIsland = parent.document.querySelector(".app_island");
		const options = [
			{
				text: "Open File",
				click: async () => {
					await tb.dialog.FileBrowser({
						title: "Select a file to view",
						onOk: async file => {
							if (window.__mvOpenExternal) {
								await window.__mvOpenExternal(file);
							}
						},
					});
				},
			},
		];
		tb.contextmenu.create({
			x: appIsland.clientWidth - 110,
			y: appIsland.clientHeight + 12,
			iframe: false,
			options: options,
		});
	},
});
tb_island.addControl({
	text: "Computer",
	appname: "Media Viewer",
	id: "media-computer",
	click: () => {
		const appIsland = parent.document.querySelector(".app_island");
		const options = [
			{
				text: "Open File from PC",
				click: async () => {
					const file = document.createElement("input");
					file.type = "file";
					file.accept = "image/*,video/*,audio/*,application/pdf";
					file.onchange = async () => {
						const picked = file.files[0];
						if (!picked) return;
						const url = URL.createObjectURL(picked);
						const ext = picked.name.split(".").pop();
						if (window.__mvOpenBlobFile) {
							await window.__mvOpenBlobFile(url, ext, picked.name);
						}
					};
					file.click();
				},
			},
		];
		tb.contextmenu.create({
			x: appIsland.clientWidth - 110,
			y: appIsland.clientHeight + 12,
			iframe: false,
			options: options,
		});
	},
});

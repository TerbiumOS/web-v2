const tb = parent.window.tb;
const tb_island = tb.window.island;
const tb_window = tb.window;
const tb_context_menu = tb.context_menu;
const tb_dialog = tb.dialog;

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
							const url = `${parent.window.location.origin}/fs/${file}`;
							const ext = file.split(".").pop();
							openFile(url, ext);
						},
					});
				},
			},
		];
		tb.contextmenu.create({
			x: appIsland.clientWidth - 110,
			y: appIsland.clientHeight + 12,
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
					file.accept = "image/*,video/*";
					file.onchange = async () => {
						const url = URL.createObjectURL(file.files[0]);
						const ext = file.files[0].name.split(".").pop();
						openFile(url, ext);
					};
					file.click();
				},
			},
		];
		tb.contextmenu.create({
			x: appIsland.clientWidth - 110,
			y: appIsland.clientHeight + 12,
			options: options,
		});
	},
});

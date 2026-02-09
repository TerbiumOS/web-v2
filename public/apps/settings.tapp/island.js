const appisland = window.parent.document.querySelector(".app_island").clientHeight + 12;

tb_island.addControl({
	text: "File",
	appname: "Settings",
	id: "settings_file",
	click: () => {
		tb.contextmenu.create({
			x: 6,
			y: appisland,
			iframe: false,
			options: [
				{
					text: "Import Settings",
					click: () => {
						const input = document.createElement("input");
						input.type = "file";
						input.accept = ".json";
						input.onchange = async () => {
							let file = input.files[0];
							let reader = new FileReader();
							reader.onload = async () => {
								let settings = JSON.parse(reader.result);
								await window.parent.tb.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings), "utf8");
							};
							reader.readAsText(file);
						};
						input.click();
					},
				},
				{
					text: "Export Settings",
					click: async () => {
						let settings = JSON.parse(await window.parent.tb.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
						let data = JSON.stringify(settings);
						let blob = new Blob([data], { type: "application/json" });
						let url = URL.createObjectURL(blob);
						let a = document.createElement("a");
						a.href = url;
						a.download = "settings.json";
						a.click();
					},
				},
			],
		});
	},
});

tb_island.addControl({
	text: "View",
	appname: "Settings",
	id: "settings_view",
	click: () => {
		tb.contextmenu.create({
			x: 6,
			y: appisland,
			iframe: false,
			options: [
				{
					text: "Appearance",
					click: () => {
						document.querySelector(`[data-category="appearance"]`).click();
					},
				},
				{
					text: "Window",
					click: () => {
						document.querySelector(`[data-category="window"]`).click();
					},
				},
				{
					text: "Networking",
					click: () => {
						document.querySelector(`[data-category="networking"]`).click();
					},
				},
				{
					text: "Other",
					click: () => {
						document.querySelector(`[data-category="other"]`).click();
					},
				},
			],
		});
	},
});

tb_island.addControl({
	text: "Help",
	appname: "Settings",
	id: "help",
	click: () => {
		window.open("https://github.com/TerbiumOS/web-v2/blob/main/docs/README.md", "_blank");
	},
});

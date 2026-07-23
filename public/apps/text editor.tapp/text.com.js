const tb = parent.window.tb;
const tb_island = tb.window.island;
const tb_window = tb.window;
const tb_context_menu = tb.context_menu;
const tb_dialog = tb.dialog;

const appisland = window.parent.document.querySelector(".app_island").clientHeight + 12;

tb_island.addControl({
	text: "File",
	appname: "Text Editor",
	id: "text-file",
	click: () => {
		tb.contextmenu.create({
			x: 112,
			y: appisland,
			iframe: false,
			options: [
				{
					text: "Open",
					click: async () => {
						await tb.dialog.FileBrowser({
							title: "Open Text File",
							filename: "untitled.txt",
							onOk: async file => {
								const fileData = await tb.vfs.whatFS(file).promises.readFile(file, "utf8");
								document.body.setAttribute("path", file);
								openFile(fileData, file);
							},
						});
					},
				},
				{
					text: "Save",
					click: async () => {
						const textarea = document.querySelector("textarea");
						const path = document.body.getAttribute("path");
						if (path && path !== "undefined") {
							await tb.vfs.whatFS(path).promises.writeFile(path, textarea.value);
						} else {
							await tb.dialog.SaveFile({
								title: "Save Text File",
								filename: "untitled.txt",
								onOk: async txt => {
									await tb.vfs.whatFS(txt).promises.writeFile(txt, textarea.value);
									document.body.setAttribute("path", txt);
								},
							});
						}
					},
				},
			],
		});
	},
});

tb_island.addControl({
	text: "Computer",
	appname: "Text Editor",
	id: "text-computer",
	click: () => {
		tb.contextmenu.create({
			x: 156,
			y: appisland,
			iframe: false,
			options: [
				{
					text: "Open",
					click: async () => {
						const file = document.createElement("input");
						file.type = "file";
						file.onchange = async e => {
							let blob = e.target.files[0];
							const fileReader = new FileReader();
							fileReader.readAsText(blob);
							fileReader.onload = () => {
								openFile(fileReader.result);
							};
						};
						file.click();
					},
				},
				{
					text: "Save",
					click: async () => {
						const textarea = document.querySelector("textarea");
						const file = new Blob([textarea.value], { type: "text/plain" });
						const url = URL.createObjectURL(file);
						const a = document.createElement("a");
						a.href = url;
						a.download = "text.txt";
						a.click();
					},
				},
			],
		});
	},
});

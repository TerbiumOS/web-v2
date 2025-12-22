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
			options: [
				{
					text: "Open",
					click: async () => {
						const textarea = document.querySelector("textarea");
						await tb.dialog.FileBrowser({
							title: "Open Text File",
							filename: "untitled.txt",
							onOk: async file => {
								document.body.setAttribute("path", file);
								textarea.value = await tb.vfs.whatFS(file).promises.readFile(file, "utf8");
							},
						});
					},
				},
				{
					text: "Save",
					click: async () => {
						const textarea = document.querySelector("textarea");
						if (document.body.getAttribute("path") && document.body.getAttribute("path") !== "undefined") {
							tb.fs.promises.writeFile(document.body.getAttribute("path"), textarea.value);
						} else {
							await tb.dialog.SaveFile({
								title: "Save Text File",
								filename: "untitled.txt",
								onOk: async txt => {
									tb.vfs.whatFS(txt).writeFile(`${txt}`, textarea.value, err => {
										if (err) return alert(err);
									});
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

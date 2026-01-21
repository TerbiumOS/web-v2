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
		const ctx = document.createElement("div");
		ctx.classList.add("context-menu", "fade-in");
		if (parent.document.querySelector(".context-menu")) {
			parent.document.querySelector(".context-menu").remove();
		}
		ctx.id = "media-files_ctx";
		ctx.style.left = `6px`;
		ctx.style.top = parent.document.querySelector(".app_island").clientHeight + 12 + "px";
		const options = [
			{
				text: "Open File",
				click: async () => {
					await tb.dialog.FileBrowser({
						title: "Select a file to view",
						onOk: async file => {
							let url = `${(parent, window.location.origin)}/fs/${file}`;
							const ext = file.split(".").pop();
							openFile(url, ext);
						},
					});
				},
			},
		];
		options.forEach(option => {
			const btn = document.createElement("button");
			btn.classList.add("context-menu-button");
			btn.innerText = option.text;
			btn.onclick = option.click;
			ctx.appendChild(btn);
		});
		parent.document.body.appendChild(ctx);
		parent.window.addEventListener("click", e => {
			if (!e.target.classList.contains("app_control")) {
				if (parent.document.querySelector(".context-menu")) {
					parent.document.querySelector(".context-menu").classList.add("fade-out");
					setTimeout(() => {
						if (parent.document.querySelector(".context-menu")) {
							parent.document.querySelector(".context-menu").remove();
						}
					}, 100);
				}
			}
		});
	},
});
tb_island.addControl({
	text: "Computer",
	appname: "Media Viewer",
	id: "media-computer",
	click: () => {
		const ctx = document.createElement("div");
		ctx.classList.add("context-menu", "fade-in");
		if (parent.document.querySelector(".context-menu")) {
			parent.document.querySelector(".context-menu").remove();
		}
		ctx.id = "media-computer_ctx";
		ctx.style.left = `6px`;
		ctx.style.top = parent.document.querySelector(".app_island").clientHeight + 12 + "px";
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
		options.forEach(option => {
			const btn = document.createElement("button");
			btn.classList.add("context-menu-button");
			btn.innerText = option.text;
			btn.onclick = option.click;
			ctx.appendChild(btn);
		});
		parent.document.body.appendChild(ctx);
		parent.window.addEventListener("click", e => {
			if (!e.target.classList.contains("app_control")) {
				if (parent.document.querySelector(".context-menu")) {
					parent.document.querySelector(".context-menu").classList.add("fade-out");
					setTimeout(() => {
						if (parent.document.querySelector(".context-menu")) {
							parent.document.querySelector(".context-menu").remove();
						}
					}, 100);
				}
			}
		});
	},
});

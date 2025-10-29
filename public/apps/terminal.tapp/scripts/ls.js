async function ls(args) {
	if (args._raw === "/mnt/" || path === "/mnt/") {
		function centerText(text, width) {
			const pad = Math.max(0, width - text.length);
			const padLeft = Math.floor(pad / 2);
			const padRight = pad - padLeft;
			return " ".repeat(padLeft) + text + " ".repeat(padRight);
		}
		const columns = [
			{ name: "Name", width: 12 },
			{ name: "URL", width: 32 },
			{ name: "Mounted", width: 10 },
			{ name: "Mounted Path", width: 20 },
		];
		const header = "| " + columns.map(col => centerText(col.name, col.width)).join(" | ") + " |";
		const separator = "|" + columns.map(col => "-".repeat(col.width + 2)).join("|") + "|";
		displayOutput(centerText(`TerbiumOS Network Storage Manager v1.2.0`, header.length));
		displayOutput(header);
		displayOutput(separator);
		for (const instance of window.parent.tb.vfs.servers) {
			const dav = instance[1];
			const row = [centerText(dav.name, columns[0].width), centerText(dav.url, columns[1].width), centerText(dav.connected ? "Yes" : "No", columns[2].width), centerText(`/mnt/${dav.name.toLowerCase()}`, columns[3].width)];
			displayOutput("| " + row.join(" | ") + " |");
		}
		createNewCommandInput();
	} else if ((args._raw.includes("/mnt/") && args._raw !== "/mnt/") || (path.includes("/mnt/") && path !== "/mnt/")) {
		try {
			const match = args._raw.match(/\/mnt\/([^\/]+)\//) || path.match(/\/mnt\/([^\/]+)\//);
			const davName = match ? match[1].toLowerCase() : "";
			const contents = await tb.vfs.servers.get(davName).connection.promises.readdir(`${path}/${args._raw}`);
			for (const entry of contents) {
				if (entry.type === "directory") {
					displayOutput(`${entry.basename}/`);
				} else {
					displayOutput(entry.basename);
				}
			}
		} catch (e) {
			displayError(`TNSM ls: Dav Drive is not mounted with error: ${e.message}`);
			createNewCommandInput();
			return;
		}
		createNewCommandInput();
	} else if (args._raw) {
		try {
			const entries = await tb.sh.promises.ls(path + args._raw);
			entries.forEach(entry => {
				displayOutput(entry);
			});
			createNewCommandInput();
		} catch {
			const entries = await tb.sh.promises.ls(args._raw);
			entries.forEach(entry => {
				displayOutput(entry);
			});
			createNewCommandInput();
		}
	} else {
		const entries = await tb.sh.promises.ls(path);
		entries.forEach(entry => {
			displayOutput(entry);
		});
		createNewCommandInput();
	}
}
ls(args);

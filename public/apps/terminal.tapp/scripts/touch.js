async function touch(args) {
	if (args._raw.length <= 0) {
		displayError("touch: missing operand");
		createNewCommandInput();
		return;
	}

	if (path.includes("/mnt/")) {
		try {
			const match = path.match(/\/mnt\/([^\/]+)\//);
			const davName = match ? match[1].toLowerCase() : "";
			const np = path.replace(`/mnt/${davName.toLowerCase()}/`, "");
			await tb.vfs.servers.get(davName).connection.promises.writeFile(`${np}/${args._raw}`, "", "utf8");
			createNewCommandInput();
		} catch (e) {
			displayError(`TNSM touch: ${e.message}`);
			createNewCommandInput();
			return;
		}
	} else {
		tb.sh.touch(`${path}/${args._raw}`, err => {
			if (err) {
				displayError(`touch: ${err.message}`);
				createNewCommandInput();
			} else {
				createNewCommandInput();
			}
		});
	}
}
touch(args);

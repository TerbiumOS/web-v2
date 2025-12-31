async function cat(args) {
	if (args._raw.length <= 0) {
		displayError("cat: missing operand");
		createNewCommandInput();
		return;
	}
	displayOutput(`%cRight now cat only outputs the contents of a file.\n`, "color: #e39d34");
	if (path.includes("/mnt/")) {
		try {
			const match = path.match(/\/mnt\/([^\/]+)\//);
			const davName = match ? match[1].toLowerCase() : "";
			const text = await tb.vfs.servers.get(davName).connection.promises.readFile(`${path}/${args._raw}`, "utf8");
			displayOutput(text);
			createNewCommandInput();
		} catch (e) {
			displayError(`TNSM cat: ${e.message}`);
			createNewCommandInput();
			return;
		}
	} else {
		tb.sh.cat(`${path}/${args._raw}`, (err, data) => {
			if (err) {
				displayError(`cat: ${err.message}`);
				createNewCommandInput();
			} else {
				displayOutput(data);
				createNewCommandInput();
			}
		});
	}
}
cat(args);

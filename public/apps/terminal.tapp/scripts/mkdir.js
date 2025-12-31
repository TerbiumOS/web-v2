async function mkdir(args) {
	if (!args._raw) {
		displayError("mkdir: Please provide a directory name");
		createNewCommandInput();
		return;
	}

	if (path.includes("/mnt/")) {
		try {
			const match = path.match(/\/mnt\/([^\/]+)\//);
			const davName = match ? match[1].toLowerCase() : "";
			const np = path.replace(`/mnt/${davName.toLowerCase()}/`, "");
			await tb.vfs.servers.get(davName).connection.promises.mkdir(`${np}/${args._raw}`);
			createNewCommandInput();
		} catch (e) {
			displayError(`TNSM mkdir: ${e.message}`);
			createNewCommandInput();
			return;
		}
	} else {
		try {
			await window.parent.tb.fs.promises.mkdir(path + args._raw);
			createNewCommandInput();
		} catch (error) {
			if (error.code === "ENOENT") {
				error = "No such file or directory";
			}
			displayError(`mkdir: cannot create directory "${args._raw}': ${error}`);
			createNewCommandInput();
		}
	}
}
mkdir(args);

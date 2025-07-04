async function uzip(path, target) {
	const response = await fetch("/fs/" + path);
	const zipFileContent = await response.arrayBuffer();
	if (!(await dirExists(target))) {
		await Filer.fs.promises.mkdir(target, { recursive: true });
	}
	const compressedFiles = window.parent.tb.fflate.unzipSync(new Uint8Array(zipFileContent));
	for (const [relativePath, content] of Object.entries(compressedFiles)) {
		const fullPath = `${target}/${relativePath}`;
		const pathParts = fullPath.split("/");
		let currentPath = "";
		for (let i = 0; i < pathParts.length; i++) {
			currentPath += pathParts[i] + "/";
			if (i === pathParts.length - 1 && !relativePath.endsWith("/")) {
				try {
					console.log(`touch ${currentPath.slice(0, -1)}`);
					displayOutput(`touch ${currentPath.slice(0, -1)}`);
					await Filer.fs.promises.writeFile(currentPath.slice(0, -1), Filer.Buffer.from(content));
				} catch {
					displayOutput(`Cant make ${currentPath.slice(0, -1)}`);
					console.log(`Cant make ${currentPath.slice(0, -1)}`);
				}
			} else if (!(await dirExists(currentPath))) {
				try {
					console.log(`mkdir ${currentPath}`);
					displayOutput(`mkdir ${currentPath}`);
					await Filer.fs.promises.mkdir(currentPath);
				} catch {
					console.log(`Cant make ${currentPath}`);
					displayOutput(`Cant make ${currentPath}`);
				}
			}
		}
		if (relativePath.endsWith("/")) {
			try {
				console.log(`mkdir fp ${fullPath}`);
				await Filer.fs.promises.mkdir(fullPath);
			} catch {
				console.log(`Cant make ${fullPath}`);
			}
		}
	}
	return "Done!";
}

const dirExists = async path => {
	return new Promise(resolve => {
		Filer.fs.stat(path, (err, stats) => {
			if (err) {
				if (err.code === "ENOENT") {
					resolve(false);
				} else {
					console.error(err);
					resolve(false);
				}
			} else {
				const exists = stats.type === "DIRECTORY";
				resolve(exists);
			}
		});
	});
};

async function unzip(args) {
	if (!args._raw || args._raw.length < 2) {
		displayOutput("Usage: unzip <zipfile> <target>");
		createNewCommandInput();
		return;
	}
	try {
		await uzip(`${path}/${args._raw[0]}`, `${path}/${args._raw[1]}`);
		displayOutput(`Successfully unzipped ${args._raw[0]} to ${args._raw[1]}`);
	} catch (e) {
		displayError(`Error unzipping file: ${e.message}`);
	}
	createNewCommandInput();
	return;
}

unzip(args);

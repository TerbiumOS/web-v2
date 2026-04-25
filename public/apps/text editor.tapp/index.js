function getExtension(path) {
	const match = path?.toString().match(/\.([^.\\/]+)$/);
	return match ? match[1].toLowerCase() : "";
}

const extensionMap = {
	js: "javascript",
	s: "javascript",
	sx: "typescript",
	tsx: "typescript",
	ts: "typescript",
	jsx: "javascript",
	html: "html",
	css: "css",
	scss: "scss",
	json: "json",
	md: "markdown",
	yml: "yaml",
	yaml: "yaml",
	sh: "bash",
	bash: "bash",
	py: "python",
	pyw: "python",
	rb: "ruby",
	java: "java",
	kt: "kotlin",
	kts: "kotlin",
	swift: "swift",
	go: "go",
	php: "php",
	rs: "rust",
	c: "c",
	cpp: "cpp",
	cc: "cpp",
	cxx: "cpp",
	cs: "csharp",
	xml: "xml",
	vue: "vue",
	json5: "json",
	ini: "ini",
	toml: "toml",
};

const saveExtensionMap = {
	javascript: "js",
	typescript: "ts",
	python: "py",
	html: "html",
	css: "css",
	json: "json",
	markdown: "md",
	yaml: "yml",
	bash: "sh",
	ruby: "rb",
	java: "java",
	kotlin: "kt",
	swift: "swift",
	go: "go",
	php: "php",
	rust: "rs",
	csharp: "cs",
	cpp: "cpp",
	c: "c",
	xml: "xml",
	vue: "vue",
	ini: "ini",
	toml: "toml",
};

function getLanguageFromPath(path) {
	const ext = getExtension(path);
	return extensionMap[ext] || ext || null;
}

async function detectLanguage(text, path) {
	const byPath = getLanguageFromPath(path);
	if (byPath) return byPath;
	const result = await hljs.highlightAuto(text);
	if (result.language) return result.language;
	if (result._top?.aliases?.length) return result._top.aliases[0];
	return null;
}

function updateLineNumbers(text = textarea.value) {
	const lines = String(text).split("\n");
	const lineNumbers = document.querySelector(".lines");
	lineNumbers.innerHTML = lines.map((_, index) => `<span>${index + 1}</span>`).join("");
	lineNumbers.scrollTop = textarea.scrollTop;
}

async function renderHighlight(text, path) {
	const highlight = document.querySelector("pre.editor-highlight");
	const code = highlight.querySelector("code");
	const language = await detectLanguage(text, path);
	if (language && hljs.getLanguage(language)) {
		try {
			const result = hljs.highlight(text, { language, ignoreIllegals: true });
			code.innerHTML = result.value;
			code.className = `language-${language} hljs`;
		} catch (err) {
			console.warn("Highlight failed:", err);
			code.textContent = text;
			code.className = "hljs";
		}
	} else {
		code.textContent = text;
		code.className = "hljs";
	}
	highlight.scrollTop = textarea.scrollTop;
	updateLineNumbers(text);
}

async function normalizeDavUrl(url) {
	const davInstances = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
	const match = url.match(/^https?:\/\/[^/]+\/dav\/(.*)$/);
	if (!match) return null;
	for (const dav of davInstances) {
		const normalized = dav.url.replace(/\/+$/, "").toLowerCase();
		if (url.toLowerCase().startsWith(normalized)) {
			const suffix = url.slice(normalized.length).replace(/^\/+/, "");
			return { name: dav.name, path: suffix ? `/${suffix}` : "/" };
		}
	}
	return null;
}

async function readPath(path) {
	if (path.startsWith("http")) {
		const server = await normalizeDavUrl(path);
		if (server) {
			const mounted = `/mnt/${server.name}${server.path}`;
			const fs = window.parent.tb.vfs.whatFS(mounted);
			if (fs?.promises?.readFile) {
				return await fs.promises.readFile(mounted, "utf8");
			}
		}
	}
	const fs = window.parent.tb.vfs.whatFS(path);
	return await fs.promises.readFile(path, "utf8");
}

async function writePath(path, contents) {
	if (path.startsWith("http")) {
		const server = await normalizeDavUrl(path);
		if (server) {
			const mounted = `/mnt/${server.name}${server.path}`;
			const fs = window.parent.tb.vfs.whatFS(mounted);
			if (fs?.promises?.writeFile) {
				return await fs.promises.writeFile(mounted, contents);
			}
		}
	}
	const fs = window.parent.tb.vfs.whatFS(path);
	return await fs.promises.writeFile(path, contents);
}

function openFile(data, path) {
	const textarea = document.querySelector("textarea");
	textarea.value = typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
	document.body.setAttribute("path", path || "");
	document.body.setAttribute("isDav", path?.startsWith("http") ? "true" : "false");
	renderHighlight(textarea.value, path);
}

window.addEventListener("contextmenu", e => {
	e.preventDefault();
	return false;
});

window.addEventListener("message", async function load(e) {
	let data;
	try {
		data = JSON.parse(e.data);
	} catch (err) {
		data = e.data;
	}
	if (data && data.type === "process" && data.path) {
		try {
			let file = await readPath(data.path);
			if (typeof file === "object") file = JSON.stringify(file, null, 2);
			openFile(file, data.path);
		} catch (err) {
			window.tb.dialog.Alert({
				title: "Failed to read file",
				message: err?.message || String(err),
			});
		}
	}
	window.removeEventListener("message", load);
});

const textarea = document.querySelector("textarea");
textarea.addEventListener("scroll", () => {
	document.querySelector("pre.editor-highlight").scrollTop = textarea.scrollTop;
	document.querySelector(".lines").scrollTop = textarea.scrollTop;
});

textarea.addEventListener("input", () => {
	renderHighlight(textarea.value, document.body.getAttribute("path"));
});

textarea.addEventListener("keydown", async e => {
	if ((e.ctrlKey || e.metaKey) && e.key === "s") {
		e.preventDefault();
		const path = document.body.getAttribute("path");
		if (path && path !== "undefined") {
			try {
				await writePath(path, textarea.value);
			} catch (err) {
				window.tb.dialog.Alert({
					title: "Failed to save file",
					message: err?.message || String(err),
				});
			}
		} else {
			const highlightResult = await hljs.highlightAuto(textarea.value);
			let ext = "txt";
			if (highlightResult.language) {
				ext = saveExtensionMap[highlightResult.language] || getExtension(highlightResult.language) || highlightResult.language || ext;
			} else if (highlightResult._top?.aliases?.length) {
				ext = saveExtensionMap[highlightResult._top.aliases[0]] || highlightResult._top.aliases[0] || ext;
			}
			await tb.dialog.SaveFile({
				title: "Save Text File",
				filename: `untitled.${ext}`,
				onOk: async txt => {
					try {
						await window.parent.tb.vfs.whatFS(txt).promises.writeFile(txt, textarea.value);
						document.body.setAttribute("path", txt);
					} catch (err) {
						window.tb.dialog.Alert({
							title: "Failed to save file",
							message: err?.message || String(err),
						});
					}
				},
			});
		}
	}
});

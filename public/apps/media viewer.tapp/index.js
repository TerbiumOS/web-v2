window.addEventListener("load", async () => {
	parent.postMessage(JSON.stringify({ type: "ready" }), "*");
});

async function openFile(url, ext, dav) {
	let exts = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
	if (exts["animated"].includes(ext)) {
		let imgObj = new Image();
		imgObj.src = url;
		imgObj.setAttribute("draggable", false);
		document.querySelector(".media").innerHTML = "";
		document.querySelector(".media").appendChild(imgObj);
		let scale = 1;

		window.addEventListener("wheel", function (e) {
			const zoomSpeed = 0.1;
			e.preventDefault();
			if (e.deltaY < 0) {
				scale *= 1 + zoomSpeed;
			} else {
				scale /= 1 + zoomSpeed;
			}
			imgObj.style.transform = `scale(${scale})`;
		});

		window.addEventListener("resize", () => {
			imgObj.style.transform = `scale(${scale})`;
		});

		imgObj.addEventListener("load", () => {
			imgObj.style.transform = `scale(${scale})`;
		});
	} else if (exts["image"].includes(ext)) {
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d");
		document.querySelector(".media").innerHTML = "";
		document.querySelector(".media").appendChild(canvas);
		let isDragging = false;
		let isMouseDown = false;
		let startCoords = { x: 0, y: 0 };
		let offset = { x: 0, y: 0 };
		let scale = 0.5;
		let imgObj = new Image();
		if (dav) {
			try {
				const davInstances = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
				const davUrl = url.split("/dav/")[0] + "/dav/";
				const dav = davInstances.find(d => d.url.toLowerCase().includes(davUrl));
				if (!dav) throw new Error("No matching dav instance found");
				const client = window.parent.tb.vfs.servers.get(dav.name);
				let filePath;
				if (url.startsWith("http")) {
					const match = url.match(/^https?:\/\/[^\/]+\/dav\/([^\/]+\/)?(.+)$/);
					filePath = match ? "/" + match[2] : url;
				} else {
					filePath = url.replace(davUrl, "/");
				}
				const response = await client.getFileContents(filePath);
				const blob = new Blob([response], { type: "image/" + ext });
				imgObj.src = URL.createObjectURL(blob);
			} catch (err) {
				window.tb.dialog.Alert({
					title: "Failed to read dav file",
					message: err,
				});
			}
		} else {
			imgObj.src = url;
		}
		imgObj.onload = () => {
			initializeCanvas();
		};

		function initializeCanvas() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			drawImageWithOffsetAndScale();
		}

		window.addEventListener("resize", function () {
			initializeCanvas();
		});

		canvas.addEventListener("mousedown", function (e) {
			isDragging = true;
			isMouseDown = true;
			startCoords = { x: e.clientX, y: e.clientY };
		});

		window.addEventListener("mouseup", function () {
			isDragging = false;
			isMouseDown = false;
		});

		canvas.addEventListener("mousemove", function (e) {
			if (isDragging) {
				const deltaX = e.clientX - startCoords.x;
				const deltaY = e.clientY - startCoords.y;
				offset.x += deltaX;
				offset.y += deltaY;
				startCoords = { x: e.clientX, y: e.clientY };
				drawImageWithOffsetAndScale();
			}
		});

		canvas.addEventListener("touchstart", e => {
			isDragging = true;
			isMouseDown = true;
			startCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		});

		window.addEventListener("touchend", () => {
			isDragging = false;
			isMouseDown = false;
		});

		canvas.addEventListener("touchmove", e => {
			if (isDragging) {
				const deltaX = e.touches[0].clientX - startCoords.x;
				const deltaY = e.touches[0].clientY - startCoords.y;
				offset.x += deltaX;
				offset.y += deltaY;
				startCoords = { x: e.touches[0].clientX, y: e.touches[0].clientY };
				drawImageWithOffsetAndScale();
			}
		});

		canvas.addEventListener("mouseleave", () => {
			isDragging = false;
		});

		canvas.addEventListener("mouseenter", () => {
			if (isMouseDown) {
				isDragging = true;
			}
		});

		canvas.addEventListener("wheel", function (e) {
			const zoomSpeed = 0.1;
			e.preventDefault();
			if (e.deltaY < 0) {
				scale *= 1 + zoomSpeed;
			} else {
				scale /= 1 + zoomSpeed;
			}
			drawImageWithOffsetAndScale();
		});

		function drawImageWithOffsetAndScale() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			const newWidth = imgObj.width * scale;
			const newHeight = imgObj.height * scale;
			const x = offset.x + (canvas.width - newWidth) / 2;
			const y = offset.y + (canvas.height - newHeight) / 2;
			ctx.drawImage(imgObj, x, y, newWidth, newHeight);
		}
	} else if (exts["pdf"].includes(ext)) {
		document.querySelector(".media").innerHTML = "";
		const canvas = document.createElement("canvas");
		canvas.style.width = "75%";
		canvas.style.height = "75%";
		document.querySelector(".media").appendChild(canvas);
		const loadingTask = pdfjsLib.getDocument({ url });
		const pdf = await loadingTask.promise;
		const page = await pdf.getPage(1);
		let scale = 1.5;
		const viewport = page.getViewport({ scale });
		canvas.width = viewport.width;
		canvas.height = viewport.height;
		const context = canvas.getContext("2d");
		const renderContext = {
			canvasContext: context,
			viewport: viewport,
		};
		await page.render(renderContext).promise;

		window.addEventListener("wheel", function (e) {
			const zoomSpeed = 0.1;
			e.preventDefault();
			if (e.deltaY < 0) {
				scale *= 1 + zoomSpeed;
			} else {
				scale /= 1 + zoomSpeed;
			}
			canvas.style.transform = `scale(${scale})`;
		});

		window.addEventListener("resize", () => {
			canvas.style.transform = `scale(${scale})`;
		});

		canvas.addEventListener("load", () => {
			canvas.style.transform = `scale(${scale})`;
		});
	} else if (exts["video"].includes(ext)) {
		let videoElem = document.createElement("video");
		if (dav) {
			try {
				const davInstances = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
				const davUrl = url.split("/dav/")[0] + "/dav/";
				const dav = davInstances.find(d => d.url.toLowerCase().includes(davUrl));
				if (!dav) throw new Error("No matching dav instance found");
				const client = window.parent.tb.vfs.servers.get(dav.name);
				let filePath;
				if (url.startsWith("http")) {
					const match = url.match(/^https?:\/\/[^\/]+\/dav\/([^\/]+\/)?(.+)$/);
					filePath = match ? "/" + match[2] : url;
				} else {
					filePath = url.replace(davUrl, "/");
				}
				const response = await client.getFileContents(filePath);
				const blob = new Blob([response], { type: "video/" + ext });
				videoElem.src = URL.createObjectURL(blob);
			} catch (err) {
				window.tb.dialog.Alert({
					title: "Failed to read dav file",
					message: err,
				});
			}
		} else {
			videoElem.src = url;
		}
		videoElem.controls = true;
		videoElem.style.width = "75%";
		videoElem.style.height = "75%";
		document.querySelector(".media").innerHTML = "";
		document.querySelector(".media").appendChild(videoElem);
		videoElem.play();
		let scale = 1;

		window.addEventListener("wheel", function (e) {
			const zoomSpeed = 0.1;
			e.preventDefault();
			if (e.deltaY < 0) {
				scale *= 1 + zoomSpeed;
			} else {
				scale /= 1 + zoomSpeed;
			}
			videoElem.style.transform = `scale(${scale})`;
		});

		window.addEventListener("resize", () => {
			videoElem.style.transform = `scale(${scale})`;
		});

		videoElem.addEventListener("load", () => {
			videoElem.style.transform = `scale(${scale})`;
		});
	} else if (exts["audio"].includes(ext)) {
		let audioElem = document.createElement("audio");
		if (dav) {
			try {
				const davInstances = JSON.parse(await window.parent.tb.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/files/davs.json`, "utf8"));
				const davUrl = url.split("/dav/")[0] + "/dav/";
				const dav = davInstances.find(d => d.url.toLowerCase().includes(davUrl));
				if (!dav) throw new Error("No matching dav instance found");
				const client = window.parent.tb.vfs.servers.get(dav.name);
				let filePath;
				if (url.startsWith("http")) {
					const match = url.match(/^https?:\/\/[^\/]+\/dav\/([^\/]+\/)?(.+)$/);
					filePath = match ? "/" + match[2] : url;
				} else {
					filePath = url.replace(davUrl, "/");
				}
				const response = await client.getFileContents(filePath);
				const blob = new Blob([response], { type: "audio/" + ext });
				audioElem.src = URL.createObjectURL(blob);
			} catch (err) {
				window.tb.dialog.Alert({
					title: "Failed to read dav file",
					message: err,
				});
			}
		} else {
			audioElem.src = url;
		}
		audioElem.controls = true;
		document.querySelector(".media").innerHTML = "";
		document.querySelector(".media").appendChild(audioElem);
		audioElem.play();
		let scale = 1;

		audioElem.addEventListener("play", async () => {
			const ext = await window.parent.tb.mediaplayer.isExisting();
			if (ext === false) {
				fetch(url)
					.then(response => response.blob())
					.then(blob => {
						const file = new File([blob], "audio.mp3", { type: blob.type });
						new jsmediatags.Reader(file).setTagsToRead(["title", "artist", "album", "picture"]).read({
							onSuccess: tag => {
								let image = null;
								if (tag.tags.picture) {
									let b64s = "";
									for (let i = 0; i < tag.tags.picture.data.length; i++) {
										b64s += String.fromCharCode(tag.tags.picture.data[i]);
									}
									image = "data:" + tag.tags.picture.format + ";base64," + window.btoa(b64s);
								}
								let artist = tag.tags.artist;
								if (!artist) {
									artist = "Unknown";
								}
								window.parent.tb.mediaplayer.music({
									track_name: tag.tags.title,
									artist: artist,
									endtime: Math.trunc(audioElem.duration),
									background: image,
									onPausePlay: () => {
										if (audioElem.paused) {
											audioElem.play();
										} else {
											audioElem.pause();
										}
									},
								});
							},
							onError: e => {
								console.log("Error reading tags:", e);
							},
						});
					});
			}
		});

		window.addEventListener("wheel", function (e) {
			const zoomSpeed = 0.1;
			e.preventDefault();
			if (e.deltaY < 0) {
				scale *= 1 + zoomSpeed;
			} else {
				scale /= 1 + zoomSpeed;
			}
			audioElem.style.transform = `scale(${scale})`;
		});

		window.addEventListener("resize", () => {
			audioElem.style.transform = `scale(${scale})`;
		});

		audioElem.addEventListener("load", () => {
			audioElem.style.transform = `scale(${scale})`;
		});
	}
}

let asked = false;
window.addEventListener("message", async e => {
	let data;
	try {
		data = JSON.parse(e.data);
	} catch (e) {
		data = e.data;
	}
	if (data === undefined && !asked) {
		asked = true;
		tb.dialog.FileBrowser({
			title: "Open a file",
			onOk: async file => {
				const ext = file.split(".").pop();
				let json = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
				if (file.includes("http")) {
					openFile(file, ext, true);
				} else if (json["image"].includes(ext)) {
					let img = await window.parent.tb.fs.promises.readFile(file);
					let blob = new Blob([img], { type: "image/" + ext });
					let url = URL.createObjectURL(blob);
					openFile(url, ext);
				} else if (json["animated"].includes(ext)) {
					let img = await window.parent.tb.fs.promises.readFile(file);
					let blob = new Blob([img], { type: "image/" + ext });
					let url = URL.createObjectURL(blob);
					openFile(url, ext);
				} else if (json["pdf"].includes(ext)) {
					let pdf = await window.parent.tb.fs.promises.readFile(file);
					let blob = new Blob([pdf], { type: "application/pdf" });
					let url = URL.createObjectURL(blob);
					openFile(url, ext);
				} else if (json["video"].includes(ext)) {
					let video = await window.parent.tb.fs.promises.readFile(file);
					let blob = new Blob([video], { type: "video/" + ext });
					let url = URL.createObjectURL(blob);
					openFile(url, ext);
				} else if (json["audio"].includes(ext)) {
					let audio = await window.parent.tb.fs.promises.readFile(file);
					let blob = new Blob([audio], { type: "audio/" + ext });
					let url = URL.createObjectURL(blob);
					openFile(url, ext);
				}
			},
		});
	}
	if (data && data.type === "process") {
		asked = false;
		if (data.path) {
			const ext = data.path.split(".").pop();
			let json = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
			if (data.path.includes("http")) {
				openFile(data.path, ext);
			} else if (json["image"].includes(ext)) {
				let img = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([img], { type: "image/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext);
			} else if (json["animated"].includes(ext)) {
				let img = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([img], { type: "image/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext);
			} else if (json["pdf"].includes(ext)) {
				let pdf = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([pdf], { type: "application/pdf" });
				let url = URL.createObjectURL(blob);
				openFile(url, ext);
			} else if (json["video"].includes(ext)) {
				let video = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([video], { type: "video/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext);
			} else if (json["audio"].includes(ext)) {
				let audio = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([audio], { type: "audio/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext);
			}
		}
	}
});

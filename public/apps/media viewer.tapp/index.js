import * as id3 from "https://unpkg.com/id3js@latest/lib/id3.js";
import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs";

if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
	console.log("Setting up PDF.js worker");
	pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs";
}

window.addEventListener("load", async () => {
	parent.postMessage(JSON.stringify({ type: "ready" }), "*");
	setTimeout(() => {
		if (!asked) {
			showFileBrowser();
		}
	}, 100);
});

async function openFile(url, ext, fileName, dav) {
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
		const pdfContainer = document.createElement("div");
		pdfContainer.className = "pdf-container";
		pdfContainer.style.display = "flex";
		pdfContainer.style.flexDirection = "column";
		pdfContainer.style.alignItems = "center";
		pdfContainer.style.gap = "20px";
		pdfContainer.style.overflow = "auto";
		pdfContainer.style.width = "100%";
		pdfContainer.style.height = "100%";
		pdfContainer.style.transformOrigin = "top center";
		pdfContainer.style.paddingTop = "56px";
		document.querySelector(".media").appendChild(pdfContainer);
		const loadingTask = pdfjsLib.getDocument({ url });
		const pdf = await loadingTask.promise;
		for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
			const page = await pdf.getPage(pageNum);
			const viewport = page.getViewport({ scale: 1 });
			const canvas = document.createElement("canvas");
			canvas.style.maxWidth = "75%";
			canvas.style.height = "auto";
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			const context = canvas.getContext("2d");
			const renderContext = {
				canvasContext: context,
				viewport: viewport,
			};
			await page.render(renderContext).promise;
			pdfContainer.appendChild(canvas);
		}
		const controls = document.createElement("div");
		controls.className = "pdf-controls";
		controls.innerHTML = `
			<div class="pdf-controls-inner">
				<button class="prev-btn" title="Previous page">◀</button>
				<button class="next-btn" title="Next page">▶</button>
				<span class="page-indicator">1 / ${pdf.numPages}</span>
				<input type="number" min="1" max="${pdf.numPages}" class="page-input" value="1" style="width:68px">
				<button class="go-btn">Go</button>
			</div>
			<style>
				.pdf-controls {
					position: absolute;
					top: 12px;
					left: 50%;
					transform: translateX(-50%);
					z-index: 50;
					font-family: 'Inter', sans-serif;
				}
				.pdf-controls-inner {
					background: rgba(0,0,0,0.55);
					color: #fff;
					padding: 8px 10px;
					border-radius: 6px;
					display: flex;
					gap: 8px;
					align-items: center;
					font-size: 14px;
					box-shadow: 0 2px 10px rgba(0,0,0,0.3);
				}
				.pdf-controls button {
					background: rgba(255,255,255,0.08);
					border: none;
					color: #fff;
					padding: 6px 8px;
					border-radius: 4px;
					cursor: pointer;
				}
				.pdf-controls button:disabled {
					opacity: 0.45;
					cursor: default;
				}
				.pdf-controls input {
					outline: none;
					border: none;
					background-color: #00000028;
					color: #ffffff;
					border-radius: 8px;
					padding: 6px 10px;
					font-weight: 700;
					font-family: Inter, sans-serif;
					font-size: 14.5px;
				}
			</style>
		`;
		document.querySelector(".media").appendChild(controls);
		const canvases = pdfContainer.querySelectorAll("canvas");
		let currentPage = 1;
		const prevBtn = controls.querySelector(".prev-btn");
		const nextBtn = controls.querySelector(".next-btn");
		const pageIndicator = controls.querySelector(".page-indicator");
		const pageInput = controls.querySelector(".page-input");
		const goBtn = controls.querySelector(".go-btn");
		function updateControls() {
			pageIndicator.textContent = `${currentPage} / ${canvases.length}`;
			pageInput.value = currentPage;
			prevBtn.disabled = currentPage <= 1;
			nextBtn.disabled = currentPage >= canvases.length;
		}
		function showPage(page) {
			page = Math.max(1, Math.min(page, canvases.length));
			const target = canvases[page - 1];
			if (!target) return;
			pdfContainer.scrollTo({ top: target.offsetTop - 10, behavior: "smooth" });
			currentPage = page;
			updateControls();
		}
		prevBtn.addEventListener("click", () => showPage(currentPage - 1));
		nextBtn.addEventListener("click", () => showPage(currentPage + 1));
		goBtn.addEventListener("click", () => showPage(parseInt(pageInput.value, 10)));
		pageInput.addEventListener("keydown", e => {
			if (e.key === "Enter") showPage(parseInt(pageInput.value, 10));
		});
		pdfContainer.addEventListener("scroll", () => {
			const containerRect = pdfContainer.getBoundingClientRect();
			const containerCenter = containerRect.top + containerRect.height / 2;
			let closestIndex = 0;
			let closestDist = Infinity;
			canvases.forEach((c, idx) => {
				const r = c.getBoundingClientRect();
				const cCenter = r.top + r.height / 2;
				const dist = Math.abs(cCenter - containerCenter);
				if (dist < closestDist) {
					closestDist = dist;
					closestIndex = idx;
				}
			});
			if (currentPage !== closestIndex + 1) {
				currentPage = closestIndex + 1;
				updateControls();
			}
		});
		updateControls();
		showPage(1);
		window.addEventListener("keydown", e => {
			if (e.key === "ArrowLeft") showPage(currentPage - 1);
			if (e.key === "ArrowRight") showPage(currentPage + 1);
		});
	} else if (exts["video"].includes(ext)) {
		const videoPlayerHTML = `
			<div class="custom-video-player">
				<div class="title-overlay"></div>
				<video></video>
				<div class="video-controls">
					<button class="play-pause-btn">⏸</button>
					<input type="range" class="seek-bar" value="0" step="0.1">
					<span class="time-display">0:00 / 0:00</span>
					<input type="range" class="volume-bar" min="0" max="100" value="100">
					<button class="fullscreen-btn">⛶</button>
				</div>
			</div>
			<style>
				.custom-video-player {
					width: 90%;
					height: 75%;
					background: #000;
					border-radius: 8px;
					overflow: hidden;
					position: relative;
					display: flex;
					flex-direction: column;
				}
				.custom-video-player video {
					width: 100%;
					flex: 1;
					background: #000;
					cursor: pointer;
				}
				.title-overlay {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					padding: 16px 20px;
					background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
					color: white;
					font-size: 16px;
					font-weight: 500;
					opacity: 0;
					transition: opacity 0.3s ease;
					pointer-events: none;
					z-index: 10;
				}
				.custom-video-player:hover .title-overlay {
					opacity: 1;
				}
				.video-controls {
					display: flex;
					align-items: center;
					gap: 10px;
					padding: 10px;
					background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
				}
				.video-controls button {
					background: rgba(255,255,255,0.2);
					border: none;
					color: white;
					padding: 8px 12px;
					border-radius: 4px;
					cursor: pointer;
					font-size: 14px;
				}
				.video-controls button:hover {
					background: rgba(255,255,255,0.3);
				}
				.seek-bar {
					flex: 1;
					height: 5px;
					-webkit-appearance: none;
					background: rgba(255,255,255,0.3);
					border-radius: 5px;
					outline: none;
				}
				.seek-bar::-webkit-slider-thumb {
					-webkit-appearance: none;
					width: 15px;
					height: 15px;
					background: white;
					border-radius: 50%;
					cursor: pointer;
				}
				.time-display {
					color: white;
					font-size: 12px;
					min-width: 100px;
				}
				.volume-bar {
					width: 80px;
					height: 5px;
					-webkit-appearance: none;
					background: rgba(255,255,255,0.3);
					border-radius: 5px;
					outline: none;
				}
				.volume-bar::-webkit-slider-thumb {
					-webkit-appearance: none;
					width: 12px;
					height: 12px;
					background: white;
					border-radius: 50%;
					cursor: pointer;
				}
			</style>
		`;
		document.querySelector(".media").innerHTML = videoPlayerHTML;
		const videoContainer = document.querySelector(".custom-video-player");
		const videoElem = videoContainer.querySelector("video");
		const playPauseBtn = videoContainer.querySelector(".play-pause-btn");
		const seekBar = videoContainer.querySelector(".seek-bar");
		const timeDisplay = videoContainer.querySelector(".time-display");
		const volumeBar = videoContainer.querySelector(".volume-bar");
		const fullscreenBtn = videoContainer.querySelector(".fullscreen-btn");
		const titleOverlay = videoContainer.querySelector(".title-overlay");
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
		let scale = 1;
		titleOverlay.textContent = fileName || "Video.mp4";
		function formatTime(seconds) {
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return `${mins}:${secs.toString().padStart(2, "0")}`;
		}
		videoElem.addEventListener("click", () => {
			if (videoElem.paused) {
				videoElem.play();
				playPauseBtn.textContent = "⏸";
			} else {
				videoElem.pause();
				playPauseBtn.textContent = "▶";
			}
		});
		playPauseBtn.addEventListener("click", () => {
			if (videoElem.paused) {
				videoElem.play();
				playPauseBtn.textContent = "⏸";
			} else {
				videoElem.pause();
				playPauseBtn.textContent = "▶";
			}
		});
		videoElem.addEventListener("timeupdate", () => {
			seekBar.value = (videoElem.currentTime / videoElem.duration) * 100 || 0;
			timeDisplay.textContent = `${formatTime(videoElem.currentTime)} / ${formatTime(videoElem.duration)}`;
		});
		seekBar.addEventListener("input", () => {
			const time = (seekBar.value / 100) * videoElem.duration;
			videoElem.currentTime = time;
		});
		volumeBar.addEventListener("input", () => {
			videoElem.volume = volumeBar.value / 100;
		});
		fullscreenBtn.addEventListener("click", () => {
			if (videoContainer.requestFullscreen) {
				videoContainer.requestFullscreen();
			}
		});
		videoElem.play();
		window.addEventListener("wheel", function (e) {
			const zoomSpeed = 0.1;
			e.preventDefault();
			if (e.deltaY < 0) {
				scale *= 1 + zoomSpeed;
			} else {
				scale /= 1 + zoomSpeed;
			}
			videoContainer.style.transform = `scale(${scale})`;
		});
		window.addEventListener("resize", () => {
			videoContainer.style.transform = `scale(${scale})`;
		});
		videoElem.addEventListener("load", () => {
			videoContainer.style.transform = `scale(${scale})`;
		});
	} else if (exts["audio"].includes(ext)) {
		const audioPlayerHTML = `
			<div class="custom-audio-player">
				<div class="title-overlay"></div>
				<div class="audio-visual"></div>
				<audio></audio>
				<div class="audio-controls">
					<button class="play-pause-btn">⏸</button>
					<input type="range" class="seek-bar" value="0" step="0.1">
					<span class="time-display">0:00 / 0:00</span>
					<input type="range" class="volume-bar" min="0" max="100" value="100">
					<button class="download-btn">⬇</button>
				</div>
			</div>
			<style>
				.custom-audio-player {
					width: 82%;
					height: 200px;
					background: #000;
					border-radius: 8px;
					overflow: hidden;
					position: relative;
					display: flex;
					flex-direction: column;
				}
				.audio-visual {
					width: 100%;
					flex: 1;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 48px;
					cursor: pointer;
				}
				.audio-visual::before {
					content: '🎵';
				}
				.title-overlay {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					padding: 16px 20px;
					background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
					color: white;
					font-size: 16px;
					font-weight: 500;
					opacity: 0;
					transition: opacity 0.3s ease;
					pointer-events: none;
					z-index: 10;
				}
				.custom-audio-player:hover .title-overlay {
					opacity: 1;
				}
				.audio-controls {
					display: flex;
					align-items: center;
					gap: 10px;
					padding: 10px;
					background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
				}
				.audio-controls button {
					background: rgba(255,255,255,0.2);
					border: none;
					color: white;
					padding: 8px 12px;
					border-radius: 4px;
					cursor: pointer;
					font-size: 14px;
				}
				.audio-controls button:hover {
					background: rgba(255,255,255,0.3);
				}
				.seek-bar {
					flex: 1;
					height: 5px;
					-webkit-appearance: none;
					background: rgba(255,255,255,0.3);
					border-radius: 5px;
					outline: none;
				}
				.seek-bar::-webkit-slider-thumb {
					-webkit-appearance: none;
					width: 15px;
					height: 15px;
					background: white;
					border-radius: 50%;
					cursor: pointer;
				}
				.time-display {
					color: white;
					font-size: 12px;
					min-width: 100px;
				}
				.volume-bar {
					width: 80px;
					height: 5px;
					-webkit-appearance: none;
					background: rgba(255,255,255,0.3);
					border-radius: 5px;
					outline: none;
				}
				.volume-bar::-webkit-slider-thumb {
					-webkit-appearance: none;
					width: 12px;
					height: 12px;
					background: white;
					border-radius: 50%;
					cursor: pointer;
				}
			</style>
		`;
		document.querySelector(".media").innerHTML = audioPlayerHTML;
		const audioContainer = document.querySelector(".custom-audio-player");
		const audioElem = audioContainer.querySelector("audio");
		const playPauseBtn = audioContainer.querySelector(".play-pause-btn");
		const seekBar = audioContainer.querySelector(".seek-bar");
		const timeDisplay = audioContainer.querySelector(".time-display");
		const volumeBar = audioContainer.querySelector(".volume-bar");
		const audioVisual = audioContainer.querySelector(".audio-visual");
		const titleOverlay = audioContainer.querySelector(".title-overlay");
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
		let scale = 1;
		titleOverlay.textContent = fileName || "Audio.mp3";
		function formatTime(seconds) {
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return `${mins}:${secs.toString().padStart(2, "0")}`;
		}
		audioVisual.addEventListener("click", () => {
			if (audioElem.paused) {
				audioElem.play();
				playPauseBtn.textContent = "⏸";
			} else {
				audioElem.pause();
				playPauseBtn.textContent = "▶";
			}
		});
		playPauseBtn.addEventListener("click", () => {
			if (audioElem.paused) {
				audioElem.play();
				playPauseBtn.textContent = "⏸";
			} else {
				audioElem.pause();
				playPauseBtn.textContent = "▶";
			}
		});
		audioElem.addEventListener("timeupdate", () => {
			seekBar.value = (audioElem.currentTime / audioElem.duration) * 100 || 0;
			timeDisplay.textContent = `${formatTime(audioElem.currentTime)} / ${formatTime(audioElem.duration)}`;
		});
		seekBar.addEventListener("input", () => {
			const time = (seekBar.value / 100) * audioElem.duration;
			audioElem.currentTime = time;
		});
		volumeBar.addEventListener("input", () => {
			audioElem.volume = volumeBar.value / 100;
		});
		const p = async () => {
			const ext = await window.parent.tb.mediaplayer.isExisting();
			if (ext === false) {
				try {
					const response = await fetch(url);
					const blob = await response.blob();
					const tags = await id3.fromFile(new File([blob], "audio.mp3", { type: blob.type }));
					let image = null;
					if (tags.images && tags.images.length > 0) {
						const imageData = tags.images[0];
						try {
							if (image && typeof image === "string" && image.startsWith("blob:")) {
								URL.revokeObjectURL(image);
								image = null;
							}
							let data = imageData.data;
							let uint8;
							if (data instanceof ArrayBuffer) {
								uint8 = new Uint8Array(data);
							} else if (ArrayBuffer.isView(data)) {
								uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
							} else if (Array.isArray(data)) {
								uint8 = new Uint8Array(data);
							} else if (typeof data === "string") {
								const b64 = data.replace(/^data:\w+\/[a-zA-Z+]+;base64,/, "");
								const raw = atob(b64);
								uint8 = new Uint8Array(raw.length);
								for (let i = 0; i < raw.length; ++i) uint8[i] = raw.charCodeAt(i);
							} else if (window.parent && window.parent.tb && window.parent.tb.buffer && typeof window.parent.tb.buffer.from === "function") {
								const buf = window.parent.tb.buffer.from(data);
								uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
							} else {
								throw new Error("Unknown image data type: " + Object.prototype.toString.call(data));
							}
							const mime = imageData.format || imageData.mime || "image/jpeg";
							const signatures = [
								{ name: "jpeg", sig: [0xff, 0xd8, 0xff] },
								{ name: "png", sig: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
								{ name: "gif", sig: [0x47, 0x49, 0x46, 0x38] },
							];
							let startIndex = 0;
							for (const s of signatures) {
								const sig = s.sig;
								for (let i = 0; i <= uint8.length - sig.length; i++) {
									let ok = true;
									for (let j = 0; j < sig.length; j++) {
										if (uint8[i + j] !== sig[j]) {
											ok = false;
											break;
										}
									}
									if (ok) {
										startIndex = i;
										break;
									}
								}
								if (startIndex) break;
							}
							if (startIndex > 0) {
								uint8 = uint8.subarray(startIndex);
								console.warn("Sliced album art buffer to skip", startIndex, "bytes of leading data");
							}
							const blob = new Blob([uint8], { type: mime });
							image = URL.createObjectURL(blob);
							audioVisual.style.backgroundImage = `url("${image}")`;
							audioVisual.style.backgroundSize = "cover";
							audioVisual.style.backgroundPosition = "center";
							audioVisual.innerHTML = "";
							const uint8ToBase64 = u8 => {
								const CHUNK = 0x8000;
								let index = 0;
								let result = [];
								while (index < u8.length) {
									result.push(String.fromCharCode.apply(null, u8.subarray(index, Math.min(index + CHUNK, u8.length))));
									index += CHUNK;
								}
								return btoa(result.join(""));
							};
							const testImg = new Image();
							testImg.onload = () => {
								if (audioVisual.contains(testImg)) audioVisual.removeChild(testImg);
							};
							testImg.onerror = () => {
								console.warn("Album art blob failed to load; trying base64 fallback");
								try {
									const b64 = uint8ToBase64(uint8);
									const dataUrl = `data:${mime};base64,${b64}`;
									testImg.src = dataUrl;
									audioVisual.style.backgroundImage = `url("${dataUrl}")`;
								} catch (err) {
									console.warn("Base64 fallback failed", err);
								}
							};
							testImg.src = image;
						} catch (err) {
							console.warn("Failed to decode album art:", err, imageData);
						}
					}
					const title = tags.title || fileName || "Unknown Title";
					const artist = tags.artist || "Unknown Artist";
					titleOverlay.textContent = `${title} - ${artist}`;
					window.parent.tb.mediaplayer.music({
						track_name: title,
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
						onSeek: time => {
							audioElem.currentTime = time;
						},
					});
				} catch (e) {
					console.log("Error reading ID3 tags:", e);
				}
			}
		};
		audioElem.addEventListener("play", p);
		p();
		audioElem.play();
		window.addEventListener("wheel", function (e) {
			const zoomSpeed = 0.1;
			e.preventDefault();
			if (e.deltaY < 0) {
				scale *= 1 + zoomSpeed;
			} else {
				scale /= 1 + zoomSpeed;
			}
			audioContainer.style.transform = `scale(${scale})`;
		});
		window.addEventListener("resize", () => {
			audioContainer.style.transform = `scale(${scale})`;
		});
		audioElem.addEventListener("load", () => {
			audioContainer.style.transform = `scale(${scale})`;
		});
	}
}

function showFileBrowser() {
	if (asked) return;
	asked = true;
	if (!(window.parent && window.parent.tb && window.parent.tb.dialog && window.parent.tb.fs && window.parent.tb.window)) return;
	window.parent.tb.dialog.FileBrowser({
		title: "Open a file",
		onOk: async file => {
			const ext = file.split(".").pop();
			let json = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
			if (file.includes("http")) {
				openFile(file, ext, file.split("/").pop(), true);
			} else if (json["image"].includes(ext)) {
				let img = await window.parent.tb.fs.promises.readFile(file);
				let blob = new Blob([img], { type: "image/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, file.split("/").pop());
			} else if (json["animated"].includes(ext)) {
				let img = await window.parent.tb.fs.promises.readFile(file);
				let blob = new Blob([img], { type: "image/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, file.split("/").pop());
			} else if (json["pdf"].includes(ext)) {
				let pdf = await window.parent.tb.fs.promises.readFile(file);
				let blob = new Blob([pdf], { type: "application/pdf" });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, file.split("/").pop());
			} else if (json["video"].includes(ext)) {
				let video = await window.parent.tb.fs.promises.readFile(file);
				let blob = new Blob([video], { type: "video/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, file.split("/").pop());
			} else if (json["audio"].includes(ext)) {
				let audio = await window.parent.tb.fs.promises.readFile(file);
				let blob = new Blob([audio], { type: "audio/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, file.split("/").pop());
			}
		},
		onCancel: () => {
			window.parent.tb.window.close();
		},
	});
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
		showFileBrowser();
	}
	if (data && data.type === "process") {
		asked = true;
		if (data.path) {
			const ext = data.path.split(".").pop();
			let json = JSON.parse(await window.parent.tb.fs.promises.readFile("/apps/system/files.tapp/extensions.json", "utf8"));
			if (data.path.includes("http")) {
				openFile(data.path, ext, data.path.split("/").pop(), true);
			} else if (json["image"].includes(ext)) {
				let img = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([img], { type: "image/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, data.path.split("/").pop());
			} else if (json["animated"].includes(ext)) {
				let img = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([img], { type: "image/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, data.path.split("/").pop());
			} else if (json["pdf"].includes(ext)) {
				let pdf = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([pdf], { type: "application/pdf" });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, data.path.split("/").pop());
			} else if (json["video"].includes(ext)) {
				let video = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([video], { type: "video/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, data.path.split("/").pop());
			} else if (json["audio"].includes(ext)) {
				let audio = await window.parent.tb.fs.promises.readFile(data.path);
				let blob = new Blob([audio], { type: "audio/" + ext });
				let url = URL.createObjectURL(blob);
				openFile(url, ext, data.path.split("/").pop());
			}
		}
	}
});

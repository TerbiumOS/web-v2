console.log("Media Interactions Injected");

function useSec(timeStr) {
	const [minutes, seconds] = timeStr.split(":").map(Number);
	return minutes * 60 + seconds;
}

function getBg(style) {
	const match = /url\(['"]?([^'"\)]+)['"]?\)/.exec(style);
	return match ? match[1] : null;
}

function runMp(config) {
	if (config.type === "video") {
		window.parent.tb.mediaplayer.video({
			video_name: config.video_name,
			creator: config.creator,
			background: config.background,
			time: config.time,
			endtime: config.endtime,
			onBack: config.onBack,
			onPausePlay: config.onPausePlay,
			onNext: config.onNext,
		});
	} else {
		window.parent.tb.mediaplayer.music({
			track_name: config.track_name,
			artist: config.artist,
			background: config.background,
			time: config.time,
			endtime: config.endtime,
			onBack: config.onBack,
			onPausePlay: config.onPausePlay,
			onNext: config.onNext,
		});
	}
}

async function newPlayer(elem, getConfig) {
	elem?.addEventListener("click", async () => {
		const exists = await window.parent.tb.mediaplayer.isExisting();
		if (!exists) {
			runMp(getConfig());
		}
	});
}

setInterval(() => {
	// YouTube Music
	const ytmTab = document.querySelector(".ytmusic-app");
	if (ytmTab) {
		const playButtons = [document.querySelector("ytmusic-play-button-renderer"), document.querySelector("tp-yt-paper-icon-button#play-pause-button")];
		const nex = document.querySelector('tp-yt-paper-icon-button[title="Next"]');
		const bac = document.querySelector('tp-yt-paper-icon-button[title="Previous"]');
		const pic = document.querySelector(".image.style-scope.ytmusic-player-bar")?.src;
		const aname = document.querySelector("yt-formatted-string.byline.style-scope")?.innerHTML;
		const cmf = document.querySelector(".title.style-scope.ytmusic-player-bar")?.innerHTML;
		const timeText = document.querySelector("span.time-info.style-scope.ytmusic-player-bar")?.textContent.trim();
		const [currTimeStr, endTimeStr] = timeText?.split(" / ") || [];
		const config = () => ({
			track_name: cmf,
			artist: aname,
			background: pic,
			time: useSec(currTimeStr),
			endtime: useSec(endTimeStr),
			onBack: () => bac?.click(),
			onPausePlay: () => playButtons[0]?.click(),
			onNext: () => {
				nex?.click();
				window.parent.tb.mediaplayer.hide();
			},
		});
		playButtons.forEach(btn => newPlayer(btn, config));
	}

	// SoundCloud
	[".sc-button-play.playButton", ".playControl.sc-ir", ".sc-button-play playButton.sc-button.sc-button-xlarge"].forEach(selector => {
		const playBtn = document.querySelector(selector);
		if (!playBtn) return;
		newPlayer(playBtn, () => {
			const imgStyle = document.querySelector("span.sc-artwork")?.getAttribute("style") || "";
			const img = getBg(imgStyle);
			const aname = document.querySelector(".playbackSoundBadge__lightLink")?.title;
			const sname = document.querySelector(".playbackSoundBadge__titleLink")?.title;
			const curr = document.querySelector('.playbackTimeline__timePassed span[aria-hidden="true"]')?.textContent;
			const end = document.querySelector('.playbackTimeline__duration span[aria-hidden="true"]')?.textContent;
			const fw = document.querySelector(".playControls__next");
			const bk = document.querySelector(".playControls__prev");
			const seeker = document.querySelector(".playbackTimeline__progressWrapper.sc-mx-1x").ariaValueNow;
			return {
				track_name: sname.length > 18 ? sname.slice(0, 18) + "..." : sname,
				artist: aname,
				background: img,
				time: useSec(curr),
				endtime: useSec(end),
				onBack: () => bk?.click(),
				onPausePlay: () => playBtn?.click(),
				onNext: () => {
					fw?.click();
					window.parent.tb.mediaplayer.hide();
				},
				onSeek: (val) => {
					seeker = val;
				}
			};
		});
	});

	// Spotify
	const spotTab = document.querySelector(".vnCew8qzJq3cVGlYFXRI");
	if (spotTab) {
		newPlayer(spotTab, () => {
			const currTime = document.querySelector(".playback-bar__progress-time-elapsed")?.textContent;
			const endTime = document.querySelector(".kQqIrFPM5PjMWb5qUS56")?.textContent;
			const artist = document.querySelector('a[data-testid="context-item-info-artist"]')?.textContent;
			const track = document.querySelector('a[data-testid="context-item-link"]')?.textContent;
			const bgStyle = document.querySelector(".mMx2LUixlnN_Fu45JpFB")?.style.backgroundImage || "";
			const bg = getBg(bgStyle);
			const bk = document.querySelector(".fn72ari9aEmKo4JcwteT");
			const fw = document.querySelector(".mnipjT4SLDMgwiDCEnRC");
			return {
				track_name: track,
				artist: artist,
				background: bg,
				time: useSec(currTime),
				endtime: useSec(endTime),
				onBack: () => bk?.click(),
				onPausePlay: () => spotTab?.click(),
				onNext: () => {
					fw?.click();
					window.parent.tb.mediaplayer.hide();
				},
			};
		});
	}

	// YouTube vid
	const audtab = document.querySelector(".video-stream");
	if (audtab) {
		const setupYT = async () => {
			const exists = await window.parent.tb.mediaplayer.isExisting();
			if (!exists) {
				const fav = document.querySelector('link[rel="icon"]')?.href;
				const vidName = document.querySelector("yt-formatted-string.style-scope.ytd-watch-metadata")?.innerHTML;
				const creator = document.querySelector("a.yt-simple-endpoint.style-scope.yt-formatted-string")?.innerHTML;
				const duration = document.querySelector(".ytp-time-duration")?.innerHTML;
				runMp({
					type: "video",
					video_name: vidName,
					creator,
					background: fav,
					endtime: useSec(duration),
					onPausePlay: () => document.querySelector(".ytp-play-button")?.click(),
					onNext: () => {
						document.querySelector(".ytp-next-button")?.click();
						window.parent.tb.mediaplayer.hide();
					},
				});
			}
		};
		audtab.addEventListener("play", setupYT);
		audtab.addEventListener("click", setupYT);
	}

	// Snae
	[".-q.-u.-Y.da.-m.ha.Qc", ".-D.d.-K.-F.q.Bb"].forEach(selector => {
		const snaeRoot = document.querySelector(selector);
		if (!snaeRoot) return;
		const playBtn = snaeRoot.querySelector(".na.F.Q.-a.-Y.oa.a.m.pa.Va");
		if (!playBtn) return;
		playBtn.addEventListener("click", async () => {
			const exists = await window.parent.tb.mediaplayer.isExisting();
			if (exists) return;
			const snameEl = snaeRoot.querySelector(".I.T.-d") || snaeRoot.querySelector(".C.N.Y");
			const sname = snameEl?.innerHTML || "Unknown Title";
			const bgStyle = snaeRoot.querySelector(".fa.Na.Pa")?.style.backgroundImage || snaeRoot.querySelector(".fa.Na.Sc.Pa")?.style.backgroundImage;
			const backgroundMatch = bgStyle?.match(/url\(["']?(.*?)["']?\)/);
			const background = backgroundMatch ? backgroundMatch[1] : null;
			const parentDiv = snaeRoot.querySelector(".-J.-F.-S.da.zb");
			const timeEl = parentDiv?.querySelector(".H.S.-c.fa.Ab:nth-of-type(1)");
			const currTM = timeEl ? useSec(timeEl.textContent.trim()) : null;
			const etEl = parentDiv?.querySelector(".H.S.-c.fa.Ab:nth-of-type(2)");
			const endTime = etEl ? useSec(etEl.textContent.trim()) : null;
			const fw = snaeRoot.querySelector('button[title="Play previous track (SHIFT+P)"]');
			const bk = snaeRoot.querySelector('button[title="Play next track (SHIFT+N)"]');
			runMp({
				track_name: sname,
				artist: "Snae Player",
				background: background,
				time: currTM,
				endtime: endTime,
				onBack: () => bk?.click(),
				onPausePlay: () => playBtn?.click(),
				onNext: () => {
					fw?.click();
					window.parent.tb.mediaplayer.hide();
				},
			});
		});
	});
}, 1000);

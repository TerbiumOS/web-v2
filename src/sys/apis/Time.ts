let format: string = "12h";
let internet: boolean;
let showSeconds: boolean;
let initialized = false;

const loadSettings = () => {
	window.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, (err: any, data: any) => {
		if (err) return;
		try {
			const settings = JSON.parse(data);
			if (settings?.times) {
				format = settings.times.format || "12h";
				internet = settings.times.internet || false;
				showSeconds = settings.times.showSeconds === true;
			}
		} catch (e) {}
	});
};

const getTime = () => {
	if (!initialized) {
		initialized = true;
		loadSettings();
		window.addEventListener("settings-changed", loadSettings as EventListener);
	}
	const date = new Date();
	let hours: any;
	let minutes: any;
	let seconds: any;
	let time: string = "";
	if (format === "24h") {
		hours = date.getHours();
	} else if (format === "12h") {
		hours = date.getHours();
		hours = hours % 12;
		hours = hours ? hours : 12;
	}
	let ampm: string;

	// set am or pm
	if (date.getHours() >= 12) {
		ampm = "PM";
	} else {
		ampm = "AM";
	}

	minutes = date.getMinutes();
	seconds = date.getSeconds();
	hours = hours < 10 ? "0" + hours : hours;
	minutes = minutes < 10 ? "0" + minutes : minutes;
	seconds = seconds < 10 ? "0" + seconds : seconds;
	if (format === "24h") {
		if (showSeconds === true) {
			time = `${hours}:${minutes}:${seconds}`;
		} else {
			time = `${hours}:${minutes}`;
		}
	} else if (format === "12h") {
		if (showSeconds === true) {
			time = `${hours}:${minutes}:${seconds} ${ampm}`;
		} else {
			time = `${hours}:${minutes} ${ampm}`;
		}
	}
	return time;
};

export default getTime;

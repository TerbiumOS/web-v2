const selects = document.querySelectorAll(".select");

selects.forEach(select => {
	const intiator = select.querySelector(".select-title");
	const select_options = select.querySelector(".options");

	intiator.addEventListener("click", e => {
		document.querySelectorAll(".options").forEach(option => {
			if (option !== select_options) {
				option.classList.remove("open");
			}
		});
		select_options.classList.toggle("open");
		const options = select_options.querySelectorAll(".option");
		options.forEach(option => {
			option.addEventListener("click", () => {
				intiator.querySelector(".text").innerHTML = option.getAttribute("value");
				select_options.classList.remove("open");
				if (select.getAttribute("action") === "fs") {
					if (select.getAttribute("action-for") === "wallpaper-fill") {
						switch (option.getAttribute("value").toLowerCase()) {
							case "cover":
								tb.desktop.wallpaper.cover();
								break;
							case "contain":
								tb.desktop.wallpaper.contain();
								break;
							case "stretch":
								tb.desktop.wallpaper.stretch();
								break;
						}
					} else if (select.getAttribute("action-for") === "proxy") {
						switch (option.getAttribute("value").toLowerCase()) {
							case "Ultraviolet":
								tb.proxy.set("Ultraviolet");
								break;
							case "Scramjet":
								tb.proxy.set("Scramjet");
								break;
						}
					} else if (select.getAttribute("action-for") === "show-seconds") {
						switch (option.getAttribute("value").toLowerCase()) {
							case "no":
								window.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
									if (err) return console.log(err);
									let settings = JSON.parse(data);
									settings["times"]["showSeconds"] = false;
									window.tb.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
								});
								break;
							case "yes":
								window.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
									if (err) return console.log(err);
									let settings = JSON.parse(data);
									settings["times"]["showSeconds"] = true;
									window.tb.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
								});
								break;
						}
					} else if (select.getAttribute("action-for") === "24h-12h") {
						switch (option.getAttribute("value").toLowerCase()) {
							case "no":
								window.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
									if (err) return console.log(err);
									let settings = JSON.parse(data);
									settings["times"]["format"] = "12h";
									window.tb.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
								});
								break;
							case "yes":
								window.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
									if (err) return console.log(err);
									let settings = JSON.parse(data);
									settings["times"]["format"] = "24h";
									window.tb.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
								});
								break;
						}
					} else if (select.getAttribute("action-for") === "location-state") {
						window.tb.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
							if (err) return console.log(err);
							let settings = JSON.parse(data);
							settings["location"]["state"] = option.getAttribute("value");
							window.tb.fs.writeFile("/system/etc/terbium/settings.json", JSON.stringify(settings));
						});
					} else if (select.getAttribute("action-for") === "temperature-unit") {
						window.tb.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
							if (err) return console.log(err);
							let settings = JSON.parse(data);
							settings["weather"]["unit"] = option.getAttribute("value");
							window.tb.fs.writeFile("/system/etc/terbium/settings.json", JSON.stringify(settings));
							window.parent.dispatchEvent(new Event("updWeather"));
						});
					} else if (select.getAttribute("action-for") === "wmx") {
						window.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
							if (err) return console.log(err);
							let settings = JSON.parse(data);
							settings["window"]["alwaysMaximized"] = option.getAttribute("value").toLowerCase() === "yes" ? true : false;
							window.tb.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
							window.parent.dispatchEvent(new Event("upd-accent"));
						});
					} else if (select.getAttribute("action-for") === "wfs") {
						window.tb.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
							if (err) return console.log(err);
							let settings = JSON.parse(data);
							settings["window"]["alwaysFullscreen"] = option.getAttribute("value").toLowerCase() === "yes" ? true : false;
							window.tb.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
							window.parent.dispatchEvent(new Event("upd-accent"));
						});
					}
				}
			});
		});
	});
});

const navbuttons = document.querySelectorAll(".navbtn");

navbuttons.forEach(btn => {
	const tooltip = btn.querySelector("span");
	let btnWidth = btn.getBoundingClientRect().width;
	tooltip.classList.add(`top-[${btnWidth + 4}px]`);

	btn.addEventListener(
		"mouseover",
		() => {
			setTimeout(() => {
				if (btn.matches(":hover")) {
					tooltip.classList.remove("opacity-0");
					tooltip.classList.remove(`top-[${btnWidth + 4}px]`);
					tooltip.classList.add(`top-[${btnWidth + 14}px]`);
					btn.addEventListener("mouseleave", () => {
						tooltip.classList.add("opacity-0");
						tooltip.classList.remove(`top-[${btnWidth + 14}px]`);
						tooltip.classList.add(`top-[${btnWidth + 4}px]`);
					});
				}
			}, 1000);
		},
		"once",
	);
});

document.addEventListener("DOMContentLoaded", () => {
	getTasks();
	setInterval(getTasks, 2500);
});

function loadPane(val) {
	const sys = document.getElementById("sysinf");
	const main = document.getElementById("appl");
	const startup = document.getElementById("startup");
	if (val === "sys") {
		sys.classList.remove("opacity-0", "pointer-events-none");
		main.classList.add("opacity-0", "pointer-events-none");
		startup.classList.add("opacity-0", "pointer-events-none");
		getSpecs();
	} else if (val === "startup") {
		startup.classList.remove("opacity-0", "pointer-events-none");
		main.classList.add("opacity-0", "pointer-events-none");
		sys.classList.add("opacity-0", "pointer-events-none");
		getStartups();
	} else {
		main.classList.remove("opacity-0", "pointer-events-none");
		sys.classList.add("opacity-0", "pointer-events-none");
		startup.classList.add("opacity-0", "pointer-events-none");
	}
}

function getSpecs() {
	const cputxt = document.getElementById("cpu");
	const memtxt = document.getElementById("ram");
	const ssdtxt = document.getElementById("ssd");
	const gputxt = document.getElementById("gpu");
	let mem = navigator.deviceMemory ? navigator.deviceMemory + "GB" + " of ram" : "Not Available";
	let canvas = document.createElement("canvas");
	let gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	if (!gl) {
		console.error("%cGPU%c: Information not available", `color: ${accent}`, "color: #b6b6b6");
		return;
	}
	let gpuName;
	let dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
	if (dbgRenderInfo) {
		let rndr = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
		let regex = /ANGLE \(.+?,\s*(.+?) \(/;
		let match = rndr.match(regex);
		gpuName = match ? match[1] : "Not Available";
	}
	navigator.storage.estimate().then(estimate => {
		const totalSize = estimate.quota;
		const usedSize = estimate.usage;
		const usedPercentage = (usedSize / totalSize) * 100;
		let formattedUsedSize, formattedTotalSize;
		if (usedSize >= 1024 * 1024 * 1024) {
			formattedUsedSize = `${(usedSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
		} else {
			formattedUsedSize = `${(usedSize / (1024 * 1024)).toFixed(2)} MB`;
		}
		if (totalSize >= 1024 * 1024 * 1024) {
			formattedTotalSize = `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
		} else {
			formattedTotalSize = `${Math.round((totalSize / (1024 * 1024)).toFixed(2))} MB`;
		}
		ssdtxt.textContent = `${formattedUsedSize} of ${formattedTotalSize}`;
	});
	let cpuCors = navigator.hardwareConcurrency;
	cputxt.textContent = `${cpuCors} Logical Cores (${Math.floor(cpuCors / 2)} Cores ${cpuCors} threads)`;
	let memoryUsed = window.tman_info && window.tman_info.bytes ? window.tman_info.bytes : 0;
	let formattedMemoryUsed;
	if (memoryUsed >= 1024 * 1024 * 1024) {
		formattedMemoryUsed = `${(memoryUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	} else {
		formattedMemoryUsed = `${(memoryUsed / (1024 * 1024)).toFixed(2)} MB`;
	}
	memtxt.textContent = `${formattedMemoryUsed} of ${mem}`;
	gputxt.textContent = gpuName;
}

async function getTasks() {
	let mem;
	if ("measureUserAgentSpecificMemory" in window.parent.performance) {
		mem = await window.parent.performance.measureUserAgentSpecificMemory();
	} else {
		mem = { bytes: 0, breakdown: [] };
	}
	window.tman_info = mem;
	const windows = window.parent.tb.process.list();
	let main = document.querySelector("tbody");
	let existingEntries = main.querySelectorAll("tr");
	let currentWinIds = Array.from(existingEntries).map(entry => entry.getAttribute("win-id"));
	const currentIdsSet = new Set(currentWinIds);
	Object.values(windows).forEach(win => {
		const winID = win.id;
		if (currentIdsSet.has(winID)) {
			currentIdsSet.delete(winID);
			return;
		}
		const tr = document.createElement("tr");
		tr.classList.add("hover:bg-[#ffffff18]", "duration-150", "ease-in-out", "px-2.5");
		tr.setAttribute("win-id", winID);

		const thName = document.createElement("th");
		thName.textContent = typeof win.name === "string" ? win.name : win.name.text;
		thName.classList.add("text-left", "py-2.5", "pl-3.5", "pr-[100px]");
		const tdMemory = document.createElement("td");
		let memEntry = null;
		if (mem && Array.isArray(mem.breakdown)) {
			memEntry = mem.breakdown.find(entry =>
				entry.attribution.some(attr => {
					return attr.container && attr.container.src === win.src;
				}),
			);
		}
		if (memEntry && typeof memEntry.bytes === "number") {
			tdMemory.textContent = `${(memEntry.bytes / (1024 * 1024)).toFixed(2)} MB`;
		} else {
			tdMemory.textContent = "N/A";
		}

		const tdPID = document.createElement("td");
		tdPID.textContent = win.pid;

		const tdState = document.createElement("td");
		const stateText = document.createElement("span");
		if (win.pid === window.parent.tb.window.getId()) {
			stateText.textContent = "Active";
		} else {
			stateText.textContent = "Idle";
		}
		tdState.appendChild(stateText);

		const tdActions = document.createElement("td");
		const btnEnd = document.createElement("button");
		btnEnd.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>`;
		btnEnd.onclick = () => {
			window.parent.tb.process.kill(win.pid);
		};

		tr.appendChild(thName);
		tr.appendChild(tdMemory);
		tr.appendChild(tdPID);
		tr.appendChild(tdState);
		tr.appendChild(tdActions);
		tdActions.appendChild(btnEnd);
		main.appendChild(tr);
	});
	existingEntries.forEach(entry => {
		const winID = entry.getAttribute("win-id");
		if (!Object.values(windows).some(win => win.id === winID)) {
			main.removeChild(entry);
		}
	});
}

async function getStartups() {
	const tbody = document.getElementById("startupTbody");
	if (!tbody) return;
	tbody.innerHTML = "<tr><td class='text-sm'>Loading startup processes...</td></tr>";
	let data;
	try {
		data = await window.parent.tb.system.startup.list();
	} catch (err) {
		console.error("Failed to load startup list:", err);
		tbody.innerHTML = "<tr><td class='text-sm'>Failed to load startup processes</td></tr>";
		return;
	}
	const scopeFilterEl = document.getElementById("startupScopeSelect");
	const scopeFilter = scopeFilterEl ? scopeFilterEl.value : "all";
	const entries = [];
	for (const scope of Object.keys(data || {})) {
		const procs = data[scope] || {};
		for (const name of Object.keys(procs)) {
			const e = procs[name];
			entries.push({ name, scope, start: e.start, installedby: e.installedby || "-", enabled: !!e.enabled });
		}
	}
	if (entries.length === 0) {
		tbody.innerHTML = "<tr><td class='text-sm'>No Startup processes found</td></tr>";
		return;
	}
	const filtered = entries.filter(ent => (scopeFilter === "all" ? true : ent.scope === scopeFilter));
	if (filtered.length === 0) {
		tbody.innerHTML = "<tr><td class='text-sm'>No Startup processes found for selected scope</td></tr>";
		return;
	}
	tbody.innerHTML = "";
	for (const ent of filtered) {
		const tr = document.createElement("tr");
		tr.classList.add("hover:bg-[#ffffff18]", "duration-150", "ease-in-out", "px-2.5");
		const thName = document.createElement("th");
		thName.textContent = ent.name;
		thName.classList.add("text-left", "py-2.5", "pl-3.5", "pr-[100px]");
		const tdScope = document.createElement("td");
		tdScope.textContent = ent.scope;
		tdScope.classList.add("px-3.5");
		const tdCmd = document.createElement("td");
		tdCmd.classList.add("px-3.5", "text-sm", "text-[#ffffffb3]");
		tdCmd.textContent = ent.start;
		const tdInstalled = document.createElement("td");
		tdInstalled.classList.add("px-3.5");
		tdInstalled.textContent = ent.installedby;
		const tdEnabled = document.createElement("td");
		const enabledSpan = document.createElement("span");
		enabledSpan.textContent = ent.enabled ? "Yes" : "No";
		tdEnabled.appendChild(enabledSpan);
		const tdActions = document.createElement("td");
		const btnToggle = document.createElement("button");
		btnToggle.classList.add("mr-2", "w-max", "py-1", "px-2", "rounded-md", "bg-[#ffffff10]");
		btnToggle.textContent = ent.enabled ? "Disable" : "Enable";
		btnToggle.onclick = async () => {
			try {
				if (ent.enabled) {
					await window.parent.tb.system.startup.disable(ent.name, ent.scope === "System" ? "System" : "User");
				} else {
					await window.parent.tb.system.startup.enable(ent.name, ent.scope === "System" ? "System" : "User");
				}
				await getStartups();
			} catch (err) {
				console.error(err);
			}
		};
		const btnRemove = document.createElement("button");
		btnRemove.classList.add("w-max", "py-1", "px-2", "rounded-md", "bg-[#ff000018]");
		btnRemove.textContent = "Remove";
		btnRemove.onclick = async () => {
			window.parent.tb.dialog.Select({
				title: `Remove startup entry '${ent.name}'?`,
				options: [
					{ text: "Yes", value: "yes" },
					{ text: "No", value: "no" },
				],
				onOk: async choice => {
					if (choice === "yes") {
						try {
							await window.parent.tb.system.startup.removeProc(ent.name, ent.scope === "System" ? "System" : "User");
							await getStartups();
						} catch (err) {
							console.error(err);
						}
					}
				},
			});
		};
		tdActions.appendChild(btnToggle);
		tdActions.appendChild(btnRemove);
		tr.appendChild(thName);
		tr.appendChild(tdScope);
		tr.appendChild(tdCmd);
		tr.appendChild(tdInstalled);
		tr.appendChild(tdEnabled);
		tr.appendChild(tdActions);
		document.getElementById("startupTbody").appendChild(tr);
	}
}

const refreshBtn = document.getElementById("refreshStartup");
if (refreshBtn) refreshBtn.addEventListener("click", getStartups);
const scopeSelect = document.getElementById("startupScopeSelect");
if (scopeSelect) scopeSelect.addEventListener("change", getStartups);
const addBtn = document.getElementById("addStartupBtn");
if (addBtn) {
	addBtn.addEventListener("click", () => {
		window.parent.tb.dialog.Message({
			title: "Enter a name for the startup entry",
			onOk: name => {
				if (!name) return;
				window.parent.tb.dialog.Select({
					title: "Select scope",
					options: [
						{ text: "System", value: "System" },
						{ text: "User", value: "User" },
					],
					onOk: scope => {
						window.parent.tb.dialog.Message({
							title: "Enter the start command (optional)",
							onOk: async cmd => {
								try {
									await window.parent.tb.system.startup.addProc(name, scope, cmd || undefined);
									getStartups();
								} catch (err) {
									console.error(err);
								}
							},
						});
					},
				});
			},
		});
	});
}

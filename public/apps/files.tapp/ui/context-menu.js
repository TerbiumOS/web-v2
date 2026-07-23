let activeMenu = null;

export function showContextMenu(e, options) {
	hideContextMenu();
	const menu = document.createElement("div");
	menu.className = "context-menu fade-in";
	for (const option of options) {
		if (option === null || option === undefined) continue;
		if (option.separator) {
			const sep = document.createElement("div");
			sep.className = "context-menu-separator";
			menu.appendChild(sep);
			continue;
		}
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "context-menu-button";
		if (option.disabled) btn.classList.add("disabled");
		const label = document.createElement("span");
		label.textContent = option.text;
		btn.appendChild(label);
		if (option.shortcut) {
			const sc = document.createElement("span");
			sc.className = "cm-shortcut";
			sc.textContent = option.shortcut;
			btn.appendChild(sc);
		}
		btn.addEventListener("click", async ev => {
			ev.stopPropagation();
			hideContextMenu();
			try {
				await option.click?.();
			} catch (err) {
				console.error(err);
			}
		});
		menu.appendChild(btn);
	}
	document.body.appendChild(menu);
	const x = e.clientX + menu.offsetWidth > window.innerWidth ? Math.max(0, e.clientX - menu.offsetWidth) : e.clientX;
	const y = e.clientY + menu.offsetHeight > window.innerHeight ? Math.max(0, e.clientY - menu.offsetHeight) : e.clientY;
	menu.style.left = `${x}px`;
	menu.style.top = `${y}px`;
	activeMenu = menu;
	setTimeout(() => {
		window.addEventListener("mousedown", outsideHandler, { capture: true });
		window.addEventListener("keydown", escHandler);
	}, 0);
}

function outsideHandler(e) {
	if (!activeMenu) return;
	if (!activeMenu.contains(e.target)) hideContextMenu();
}

function escHandler(e) {
	if (e.key === "Escape") hideContextMenu();
}

export function hideContextMenu() {
	if (!activeMenu) return;
	activeMenu.remove();
	activeMenu = null;
	window.removeEventListener("mousedown", outsideHandler, { capture: true });
	window.removeEventListener("keydown", escHandler);
}

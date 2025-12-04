const style = document.createElement("style");
console.log("Cursor Engine Injected");
const anuraSettings = window.parent.parent.parent.anura.ui.theme.settings;
style.textContent = `
	:root {
		--cursor-normal: url("/cursors/dark/normal.svg") 6 0, default !important; 
		--cursor-pointer: url("/cursors/dark/pointer.svg") 6 0, pointer !important;
		--cursor-text: url("/cursors/dark/text.svg") 10 0, text !important;
		--cursor-crosshair: url("/cursors/dark/crosshair.svg") 0 0, crosshair !important;
		--cursor-wait: url("/cursors/dark/wait.svg") 0 0, wait !important;
		--cursor-nw-resize: url("/cursors/dark/resize-l.svg") 0 0, nw-resize !important;
		--cursor-ne-resize: url("/cursors/dark/resize-r.svg") 0 0, ne-resize !important;
		--cursor-sw-resize: url("/cursors/dark/resize-r.svg") 0 0, sw-resize !important;
		--cursor-se-resize: url("/cursors/dark/resize-l.svg") 0 0, se-resize !important;
		--cursor-n-resize: url("/cursors/dark/resize-v.svg") 0 0, n-resize !important;
		--cursor-s-resize: url("/cursors/dark/resize-v.svg") 0 0, s-resize !important;
		--cursor-e-resize: url("/cursors/dark/resize-h.svg") 0 0, e-resize !important;
		--cursor-w-resize: url("/cursors/dark/resize-h.svg") 0 0, w-resize !important;
		--theme-fg: ${anuraSettings["foreground"] || "#FFFFFF"};
		--theme-secondary-fg: ${anuraSettings["secondaryForeground"] || "#C1C1C1"};
		--theme-border: ${anuraSettings["border"] || "#444444"};
		--material-border: ${anuraSettings["border"] || "#444444"};
		--theme-dark-border: ${anuraSettings["darkBorder"] || "#000000"};
		--theme-bg: ${anuraSettings["darkBackground"] || "#202124"};
		--material-bg: ${anuraSettings["darkBackground"] || "#202124"};
		--theme-secondary-bg: ${anuraSettings["secondaryBackground"] || "#383838"};
		--theme-dark-bg: ${anuraSettings["darkBackground"] || "#161616"};
		--theme-accent: ${anuraSettings["accent"] || "#4285F4"};
		--matter-helper-theme: ${anuraSettings["accent"] || "#4285F4"};
	}
	* {
		cursor: var(--cursor-normal);
	}
	a, a:-webkit-any-link {
		cursor: var(--cursor-pointer) !important;
	}
	input[type="text"], textarea {
		cursor: var(--cursor-text) !important;
	}
	.crosshair {
		cursor: var(--cursor-crosshair) !important;
	}
	.loading {
		cursor: var(--cursor-wait) !important;
	}
	input[disabled], button[disabled] {
		cursor: var(--cursor-normal) !important;
	}
	[contenteditable="true"] {
		cursor: var(--cursor-text) !important;
	}
`;
console.log("Applied TB Styles");
document.head.appendChild(style);

const tb = parent.window.tb;
const tb_island = tb.window.island;
const tb_window = tb.window;
const tb_context_menu = tb.context_menu;
const tb_dialog = tb.dialog;

tb_island.addControl({
	text: "Help",
	appname: "Terminal",
	id: "terminal-help",
	click: async () => {
		term.write("help");
		await window.handleCommand("help");
	},
});

import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import Boot from "./Boot.tsx";
import CustomOS from "./CustomOS.tsx";
import { hash } from "./hash.json";
import Loader from "./Loading.tsx";
import Login from "./Login.tsx";
import Recovery from "./Recovery.tsx";
import Setup from "./Setup.tsx";
import { fileExists } from "./sys/types.ts";
import Updater from "./Updater.tsx";
import { ScramjetHandler } from "./sys/scramjet-handler.ts";
const { Controller } = $scramjetController;

const Root = () => {
	const [currPag, setPag] = useState(<Loader />);
	const params = new URLSearchParams(window.location.search);
	useEffect(() => {
		window.__scramjet$config = {
			prefix: "/service/",
			scramjetPath: "/scram/scramjet.js",
			wasmPath: "/scram/scramjet.wasm",
			injectPath: "/sj-control/controller.inject.js",
			virtualWasmPath: "/scram/scramjet.wasm.js",
			codec: {
				encode: function encode(input: string): string {
					let result = "";
					let len = input.length;
					for (let i = 0; i < len; i++) {
						const char = input[i];
						result += i % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char;
					}
					return encodeURIComponent(result);
				},
				decode: function decode(input: string): string {
					if (!input) return input;
					input = decodeURIComponent(input);
					let result = "";
					let len = input.length;
					for (let i = 0; i < len; i++) {
						const char = input[i];
						result += i % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char;
					}
					return result;
				},
			},
		};
		const tempTransport = async () => {
			const sw = await navigator.serviceWorker.register("/anura-sw.js");
			const scramjetHandler = new ScramjetHandler(Controller, sw, window.__scramjet$config, window.__scramjet$flags);
			scramjetHandler.setTransports();
			// @ts-expect-error
			window.scramjetTb = scramjetHandler;
			const tbOn = async () => {
				while (!window.tb.system?.version) {
					await new Promise(res => setTimeout(res, 50));
				}
				window.dispatchEvent(new Event("tfsready"));
			};
			tbOn();
		};
		if (!window.sjint) {
			tempTransport();
		}
		if (sessionStorage.getItem("recovery")) {
			setPag(<Recovery />);
		} else if (sessionStorage.getItem("boot") || params.get("boot")) {
			const upd = async () => {
				let sha;
				if (await fileExists("/system/etc/terbium/hash.cache")) {
					sha = await window.tb.fs.promises.readFile("/system/etc/terbium/hash.cache", "utf8");
				} else {
					sha = hash;
				}
				if (localStorage.getItem("setup")) {
					if (localStorage.getItem("setup") && (sha !== hash || sessionStorage.getItem("migrateFs"))) {
						setPag(<Updater />);
					} else {
						if (sessionStorage.getItem("logged-in") && sessionStorage.getItem("logged-in") === "true") {
							setPag(<App />);
						} else {
							setPag(<Login />);
						}
					}
				} else {
					setPag(<Setup />);
				}
			};
			upd();
		} else if (sessionStorage.getItem("cusboot")) {
			setPag(<CustomOS />);
		} else {
			setPag(<Boot />);
		}
	}, []);
	return currPag;
};

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Root />
	</StrictMode>,
);

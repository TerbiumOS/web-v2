import { TAuthReturnType } from "../../types";
import { createAuthClient } from "better-auth/client";
import { libcurl } from "libcurl.js";

export const auth = createAuthClient({
	baseURL: "https://auth.terbiumon.top",
	fetchOptions: {
		customFetchImpl: async (input: string | URL | Request, init?: RequestInit | undefined) => {
			if (!window.libcurlLock) {
				window.libcurlLock = true;
				libcurl.load_wasm("https://cdn.jsdelivr.net/npm/libcurl.js@latest/libcurl.wasm");
				// @ts-expect-error no types
				libcurl.set_websocket(`${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`);
				console.log("libcurl wasm loaded");
			}
			const savedCookies = localStorage.getItem("libcurl_cookies") || "";
			const session = new libcurl.HTTPSession({
				enable_cookies: true,
				cookie_jar: savedCookies,
			});
			session.import_cookies();
			try {
				const headers = new Headers(init?.headers);
				if (!headers.has("origin") && !headers.has("referer")) {
					headers.set("origin", window.location.origin);
				}
				const response = await session.fetch(input.toString(), {
					...init,
					headers,
				});
				return response;
			} finally {
				setTimeout(() => {
					const currentCookies = session.export_cookies();
					localStorage.setItem("libcurl_cookies", currentCookies);
					session.close();
					console.log("HTTP Session Destroyed");
				}, 100);
			}
		},
	},
});

export async function getinfo(user?: string | null, pass?: string | null, setting?: string): Promise<TAuthReturnType> {
	if (user && pass) {
		console.log("[TAUTH] Signing in with provided credentials...");
		await auth.signIn.email({
			email: user,
			password: pass,
		});
	}

	const response = await auth.$fetch("https://auth.terbiumon.top/user/info", {
		credentials: "include",
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	const uinf = !response.error ? response.data : { error: "Failed to fetch user info" };

	const sr = setting
		? await auth.$fetch(`https://auth.terbiumon.top/kv/retrieve/${setting}`, {
				credentials: "include",
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			})
		: null;
	const settings = sr === null ? null : !sr.error ? sr.data : { error: "Failed to fetch settings" };

	return {
		user: uinf,
		// @ts-expect-error shutup
		settings: settings ? JSON.parse(settings.value) : null,
	};
}

export async function setinfo(user?: string | null, pass?: string | null, setting?: string, toset?: any) {
	if (user && pass) {
		console.log("[TAUTH] Signing in with provided credentials...");
		await auth.signIn.email({
			email: user,
			password: pass,
		});
	}
	if (!setting || !toset) {
		return { error: "No setting or value to set provided" };
	}

	const response = await auth.$fetch(`https://auth.terbiumon.top/kv/set/${setting}`, {
		credentials: "include",
		method: "POST",
		body: JSON.stringify({
			value: JSON.stringify(toset),
		}),
		headers: {
			"Content-Type": "application/json",
		},
	});
	const changer = !response.error ? response.data : { error: "Failed to set info" };
	return changer;
}

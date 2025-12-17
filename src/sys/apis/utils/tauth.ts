import { createAuthClient } from "better-auth/client";

export const auth = createAuthClient({
	baseURL: "https://auth.terbiumon.top",
});

export async function getinfo(user?: string, pass?: string, setting?: string) {
	if (user && pass) {
		console.log("[TAUTH] Signing in with provided credentials...");
		await auth.signIn.email({
			email: user,
			password: pass,
		});
	}

	const response = await fetch("https://auth.terbiumon.top/user/info", {
		credentials: "include",
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	const uinf = response.ok ? await response.json() : { error: "Failed to fetch user info" };

	const sr = setting
		? await fetch(`https://auth.terbiumon.top/kv/retrieve/${setting}`, {
				credentials: "include",
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			})
		: null;
	const settings = sr === null ? null : sr.ok ? await sr.json() : { error: "Failed to fetch settings" };

	console.log(uinf, settings);
	return {
		user: uinf,
		settings: settings,
	};
}

export async function setinfo(user?: string, pass?: string, setting?: string, toset?: any) {
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

	const response = await fetch(`https://auth.terbiumon.top/kv/set/${setting}`, {
		credentials: "include",
		method: "POST",
		body: JSON.stringify({
			value: JSON.stringify({ toset }),
		}),
		headers: {
			"Content-Type": "application/json",
		},
	});
	const changer = response.ok ? await response.json() : { error: "Failed to set info" };
	return changer;
}

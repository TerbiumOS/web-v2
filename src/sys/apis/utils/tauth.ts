import { createAuthClient } from "better-auth/client";

export const auth = createAuthClient({
	baseURL: "https://auth.terbiumon.top",
});

export async function getinfo(user: string, pass: string, setting?: string) {
	await auth.signIn.email({
		email: user,
		password: pass,
	});

	const uinf = (
		await fetch("https://auth.terbiumon.top/user/info", {
			credentials: "include",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
	).json();

	const settings = setting ? await (
		await fetch(`https://auth.terbiumon.top/kv/retrieve/${setting}`, {
			credentials: "include",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
	).json() : null;

	return {
		user: uinf,
		settings: settings,
	};
}

export async function setinfo(user: string, pass: string, setting: string, toset: any) {
	await auth.signIn.email({
		email: user,
		password: pass,
	});

	const changer = (
		await fetch(`https://auth.terbiumon.top/kv/set/${setting}`, {
			credentials: "include",
			method: "POST",
			body: JSON.stringify({
				"value": JSON.stringify({toset}),
			}),
			headers: {
				"Content-Type": "application/json",
			},
		})
	).json();

	return changer;
}

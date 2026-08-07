export class Platform {
	type: string;
	touchInput: boolean;
	state: {
		fullscreen: boolean;
	};

	constructor() {
		this.state = {
			fullscreen: false,
		};

		let platform = "desktop";

		const mobileRE =
			/(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|samsungbrowser.*mobile|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
		const notMobileRE = /CrOS/;

		const tabletRE = /android|ipad|playbook|silk/i;

		const ua = navigator.userAgent;

		if (typeof ua === "string") {
			if (mobileRE.test(ua) && !notMobileRE.test(ua)) {
				platform = "mobile";
			} else if (tabletRE.test(ua)) {
				platform = "tablet";
			}

			if (
				!mobileRE.test(ua) &&
				navigator &&
				navigator.maxTouchPoints > 1 &&
				ua.indexOf("Macintosh") !== -1 &&
				ua.indexOf("Safari") !== -1
			) {
				platform = "tablet";
			}
		}

		this.type = platform;
		this.touchInput =
			platform === "mobile" ||
			platform === "tablet" ||
			navigator.maxTouchPoints > 1;

		// Settings integration with Terbium
		if (window.anura?.settings) {
			if (window.anura.settings.get("force-platform") !== undefined) {
				this.type = window.anura.settings.get("force-platform");
			}
			if (window.anura.settings.get("force-touch-input") !== undefined) {
				this.touchInput = window.anura.settings.get("force-touch-input");
			}
		}

		document.documentElement.addEventListener("fullscreenchange", () => {
			this.state.fullscreen = !!document.fullscreenElement;
		});
	}
}

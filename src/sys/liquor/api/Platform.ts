export class Platform {
	type: string;
	touchInput: boolean;

	constructor() {
		this.type = "desktop";
		this.touchInput = false;
		const mobileRE =
			/(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|samsungbrowser.*mobile|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
		const notMobileRE = /CrOS/;
		const tabletRE = /android|ipad|playbook|silk/i;
		const ua = navigator.userAgent;
		if (typeof ua === "string") {
			if (mobileRE.test(ua) && !notMobileRE.test(ua)) {
				console.log("Mobile detected");
				this.type = "mobile";
				this.touchInput = true;
			} else if (tabletRE.test(ua)) {
				console.log("Tablet detected");
				this.type = "tablet";
				this.touchInput = true;
			}

			if (!mobileRE.test(ua) && navigator && navigator.maxTouchPoints > 1 && ua.indexOf("Macintosh") !== -1 && ua.indexOf("Safari") !== -1) {
				console.log("Mobile detected");
				this.type = "mobile";
				this.touchInput = true;
			}
		}
	}
}

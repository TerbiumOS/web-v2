interface NotifParams {
	title: string;
	description: string;
	timeout?: number;
	callback?: () => void;
	closeIndicator?: boolean;
	icon?: string;
	buttons?: Array<{ text: string; callback: Function }>;
}

export class NotificationService {
	element: HTMLDivElement | null = null;

	constructor() {
		console.log("Loading notifications API");
	}

	add(params: NotifParams) {
		// API STUB
		console.log(params);
		window.parent.tb.notification.Toast({
			application: params.title,
			iconSrc: "/assets/img/logo.png",
			message: params.description,
			time: params.timeout ? params.timeout : 10000,
			onOk: params.callback,
		});
	}
	remove(_notification: any) {
		// API STUB
	}
}

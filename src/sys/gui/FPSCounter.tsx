import { useEffect, useState, useRef } from "react";

export const FPSCounter = () => {
	const [fps, setFps] = useState(0);
	const [showFPS, setShowFPS] = useState(false);
	const frameCountRef = useRef(0);
	const lastTimeRef = useRef(performance.now());
	const rafRef = useRef<number>(null);

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const settings = JSON.parse(
					await window.tb.fs.promises.readFile(
						`/home/${sessionStorage.getItem("currAcc")}/settings.json`,
						"utf8"
					)
				);
				setShowFPS(settings.showFPS ?? false);
			} catch (err) {
				console.error("Failed to load FPS counter setting:", err);
			}
		};
		loadSettings();

		const handleSettingsChange = (e: CustomEvent) => {
			if (e.detail?.showFPS !== undefined) {
				setShowFPS(e.detail.showFPS);
			}
		};
		window.addEventListener("settings-changed", handleSettingsChange as EventListener);
		return () => window.removeEventListener("settings-changed", handleSettingsChange as EventListener);
	}, []);

	useEffect(() => {
		if (!showFPS) {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
			return;
		}

		const updateFPS = () => {
			frameCountRef.current++;
			const now = performance.now();
			const delta = now - lastTimeRef.current;

			if (delta >= 1000) {
				const currentFPS = Math.round((frameCountRef.current * 1000) / delta);
				setFps(currentFPS);
				frameCountRef.current = 0;
				lastTimeRef.current = now;
			}

			rafRef.current = requestAnimationFrame(updateFPS);
		};

		rafRef.current = requestAnimationFrame(updateFPS);

		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [showFPS]);

	if (!showFPS) return null;

	return (
        <div className="flex gap-2">
            <div className="font-bold cursor-default">
                {fps} FPS
            </div>
            <span className="w-1 h-4.5 bg-[#ffffff28] rounded-full" />
        </div>
	);
};

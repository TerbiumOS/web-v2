import { useState, useRef, useEffect } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { validateActivationKey, formatActivationKey } from "./sys/apis/utils/masqr-auth";
import "./sys/gui/styles/oobe.css";

export default function ActivationScreen() {
	const [activationKey, setActivationKey] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		inputRef.current?.focus();
	}, []);
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatActivationKey(e.target.value);
		setActivationKey(formatted);
		setError("");
	};
	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleActivation();
		}
	};
	const handleActivation = async () => {
		if (loading) return;
		setError("");
		setLoading(true);
		try {
			const result = await validateActivationKey(activationKey);
			if (result.success) {
				window.location.reload();
			} else {
				setError(result.error || "Activation failed");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error("Activation error:", err);
		} finally {
			setLoading(false);
		}
	};
	return (
		<div className="bg-[#0e0e0e] h-full w-full flex items-center justify-center">
			<div className="steps-container flex flex-col lg:flex-row md:flex-row w-full h-full">
				<div className="logo sm:h-full sm:w-1/2 h-1/2 w-full flex items-center justify-center">
					<img src="/assets/img/logo.png" alt="Terbium Logo" className="max-w-[300px] max-h-[300px] object-contain" />
				</div>
				<div className="sm:h-full sm:w-1/2 h-1/2 w-full flex items-center justify-center p-6">
					<div className="w-full max-w-md">
						<h1 className="font-[800] text-[34px] lg:text-[34px] md:text-[28px] sm:text-[22px] mb-2 bg-gradient-to-b from-[#ffffff] to-[#ffffff77] text-transparent bg-clip-text" style={{ lineHeight: "120%" }}>
							Activation Required
						</h1>
						<p className="text-[#ffffffb3] text-[14px] mb-8">Enter your activation key to continue using Terbium</p>
						<div className="mb-4">
							<label htmlFor="activation-key" className="block text-[#ffffffb3] text-[12px] font-[600] mb-2 uppercase tracking-wider">
								Activation Key
							</label>
							<input
								ref={inputRef}
								id="activation-key"
								type="text"
								value={activationKey}
								onChange={handleInputChange}
								onKeyPress={handleKeyPress}
								placeholder="TB-XXXX-XXXX-XXXX-XXXX"
								maxLength={23}
								disabled={loading}
								className="w-full rounded-[6px] px-[14px] py-[10px] bg-[#ffffff0a] text-[#ffffff] border-[#ffffff22] border-[1px] placeholder-[#ffffff38] focus:bg-[#ffffff1f] focus:border-[#73a9ffd6] focus:ring-[#73a9ff74] focus:outline-none focus:ring-2 duration-150 font-mono text-[16px] tracking-wider"
								style={{ textTransform: "uppercase" }}
							/>
						</div>
						{error && (
							<div className="w-full p-3 mb-4 bg-red-500/20 border border-red-500/50 rounded-md text-sm text-red-300 flex items-start">
								<InformationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
								<span>{error}</span>
							</div>
						)}
						<button
							onClick={handleActivation}
							disabled={loading || activationKey.length < 23}
							className="w-full cursor-pointer bg-[#ffffff0a] text-[#ffffff38] border-[#ffffff22] hover:bg-[#ffffff10] hover:text-[#ffffff8d] focus:bg-[#ffffff1f] focus:text-[#ffffff8d] focus:border-[#73a9ffd6] focus:ring-[#73a9ff74] focus:outline-hidden focus:ring-2 ring-[transparent] ring-0 border-[1px] font-[600] px-[20px] py-[10px] rounded-[6px] duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<span className="flex items-center justify-center">
									<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Activating...
								</span>
							) : (
								"Continue"
							)}
						</button>
						<div className="mt-6 text-center">
							<p className="text-[#ffffff60] text-[12px]">Don't have an activation key?</p>
							<p className="text-[#ffffff60] text-[12px] mt-1">Contact your link vendor support or check your configuration below to get a new key or reset your session.</p>
						</div>
						<div className="mt-8 p-3 bg-[#ffffff0a] border border-[#ffffff22] rounded-md text-[10px] text-[#ffffff60]">
							<p className="font-[600] mb-1">Debug Info:</p>
							<p>License Server: {(import.meta.env.VITE_LICENSE_SERVER_URL as string) || "Not configured"}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

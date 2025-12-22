import { useEffect, useState } from "react";
import getTime from "../apis/Time";
import { SysSettings } from "../types";

interface LocationData {
	properties: {
		forecast: string;
	};
}
interface ForecastData {
	properties: {
		periods: Period[];
	};
}
interface WeatherData {
	temp: number;
	unit: string;
	icn: string;
}
interface Period {
	temperature: number;
	shortForecast: string;
}

export default function Weather() {
	const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
	const [loaded, setLoaded] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);
	useEffect(() => {
		const getWeather = async () => {
			try {
				const settings: SysSettings = JSON.parse(await window.tb.fs.promises.readFile("/system/etc/terbium/settings.json"));
				const defaultLocation = "40.7590322,-74.0516312";
				const loc = settings.location || defaultLocation;
				const locationResponse = await fetch(`https://api.weather.gov/points/${loc}`, {
					method: "GET",
					headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0 Safari/537.36 Terbium-Browser/2.1.0",
					},
				});
				const locationData: LocationData = await locationResponse.json();
				const forecastResponse = await fetch(locationData.properties.forecast, {
					method: "GET",
					headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0 Safari/537.36 Terbium-Browser/2.1.0",
					},
				});
				const forecastData: ForecastData = await forecastResponse.json();
				const currentPeriod = forecastData.properties.periods[0];
				let temp = currentPeriod.temperature;
				let unit = "°F";
				if (settings.weather) {
					const { unit: userUnit } = settings.weather;
					({ temp, unit } = FormatTemp(temp, userUnit));
				}
				const icn = getIcon(currentPeriod.shortForecast);
				setWeatherData({ temp, unit, icn });
				setLoaded(true);
			} catch (err: any) {
				setError(err);
			}
		};
		getWeather();
		window.addEventListener("updWeather", getWeather);
		return () => window.removeEventListener("updWeather", getWeather);
	}, []);
	return loaded && !error ? (
		<div className="flex flex-row items-center gap-1.5">
			<img src={weatherData?.icn} className="w-6 h-6" />
			<div className="weather_temp">
				{weatherData?.temp}
				{weatherData?.unit}
			</div>
		</div>
	) : null;
}

function FormatTemp(temp: number, unit: string): { temp: number; unit: string } {
	switch (unit) {
		case "Celsius":
			return { temp: Math.round(((temp - 32) * 5) / 9), unit: "°C" };
		case "Kelvin":
			return { temp: Math.round(((temp - 32) * 5) / 9 + 273.15), unit: " K" };
		default:
			return { temp, unit: "°F" };
	}
}

function getIcon(sky: string): string {
	const time = getTime();
	const [timePart, period] = time.split(" ");
	const [hours] = timePart.split(":").map(Number);
	const hour24 = period === "PM" && hours !== 12 ? hours + 12 : period === "AM" && hours === 12 ? 0 : hours;
	let icn = "/assets/img/day.svg";
	if (sky === "Sunny" || sky === "Clear" || sky === "Mostly Clear") {
		icn = hour24 >= 18 ? "/assets/img/night.svg" : "/assets/img/day.svg";
	} else if (sky.includes("Partly")) {
		icn = hour24 >= 18 ? "/assets/img/cloudy_night.svg" : "/assets/img/cloudy_day.svg";
	} else if (sky.includes("Cloudy")) {
		icn = "/assets/img/cloudy.svg";
	} else if (sky.includes("Rain")) {
		icn = "/assets/img/rainy.svg";
	} else if (sky.includes("Snow") || sky.includes("Hail")) {
		icn = "/assets/img/snowy.svg";
	}
	return icn;
}

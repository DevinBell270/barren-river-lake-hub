// src/lib/serverData.ts
// Server-side data fetching functions with proper caching

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface LakeData {
    level: number | null;
    waterTemp: number | null;
    rain24h: number | null;
    lastUpdated: string;
}





export interface WeatherData {
    temperature: number;
    windSpeed: string;
    windDirection: string;
    shortForecast: string;
    lastUpdated: string;
}

export interface OutflowData {
    outflow: number;
    lastUpdated: string;
    note: string;
}

/**
 * Fetch initial lake level data on the server
 * Cached for 15 minutes since lake levels change slowly
 */
export async function getInitialLakeData(): Promise<LakeData | null> {
    try {
        const res = await fetch(`${BASE_URL}/api/lake-data`, {
            next: { revalidate: 900 }, // 15 minutes
            headers: {
                'User-Agent': 'Barren-River-Lake-Hub/1.0'
            }
        });

        if (!res.ok) {
            console.error(`Failed to fetch lake data: ${res.status}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('Server-side lake data fetch failed:', error);
        return null;
    }
}





/**
 * Fetch initial outflow data on the server (projected 6am discharge)
 * Cached for 24 hours since it's daily data
 */
export async function getInitialOutflowData(): Promise<OutflowData | null> {
    try {
        const res = await fetch(`${BASE_URL}/api/outflow`, {
            next: { revalidate: 86400 }, // 24 hours
            headers: {
                'User-Agent': 'Barren-River-Lake-Hub/1.0'
            }
        });

        if (!res.ok) {
            console.error(`Failed to fetch outflow data: ${res.status}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('Server-side outflow data fetch failed:', error);
        return null;
    }
}

/**
 * Fetch initial weather data on the server
 * Cached for 10 minutes
 */
export async function getInitialWeatherData(): Promise<WeatherData | null> {
    try {
        const res = await fetch(`${BASE_URL}/api/weather`, {
            next: { revalidate: 600 }, // 10 minutes
            headers: {
                'User-Agent': 'Barren-River-Lake-Hub/1.0'
            }
        });

        if (!res.ok) {
            console.error(`Failed to fetch weather data: ${res.status}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('Server-side weather data fetch failed:', error);
        return null;
    }
}

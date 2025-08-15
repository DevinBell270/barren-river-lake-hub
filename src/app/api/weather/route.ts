// src/app/api/weather/route.ts
import { NextResponse } from 'next/server';

// Coordinates for Barren River Lake Dam area
const LAKE_LATITUDE = 36.89;
const LAKE_LONGITUDE = -86.12;

/**
 * API handler for GET requests. Fetches weather data from the Weather.gov API.
 */
export async function GET() {
    try {
        // Step 1: Get the specific forecast grid URL for the lake's coordinates
        const pointsResponse = await fetch(`https://api.weather.gov/points/${LAKE_LATITUDE},${LAKE_LONGITUDE}`, {
            next: { revalidate: 60 * 60 * 6 } // Revalidate every 6 hours
        });

        if (!pointsResponse.ok) {
            throw new Error('Failed to fetch weather API grid points.');
        }

        const pointsData = await pointsResponse.json();
        const forecastUrl = pointsData.properties.forecast;

        // Step 2: Fetch the actual forecast using the grid URL
        const forecastResponse = await fetch(forecastUrl, {
            next: { revalidate: 60 * 15 } // Revalidate every 15 minutes
        });

        if (!forecastResponse.ok) {
            throw new Error('Failed to fetch weather forecast data.');
        }

        const forecastData = await forecastResponse.json();
        const periods = forecastData.properties.periods;

        // Extract the most relevant information
        const currentConditions = periods[0]; // The first period is the most current
        const simpleForecast = periods.slice(1, 4).map((p: any) => ({
            name: p.name,
            shortForecast: p.shortForecast,
            temperature: p.temperature,
        }));

        const responseData = {
            temperature: currentConditions.temperature,
            windSpeed: currentConditions.windSpeed,
            windDirection: currentConditions.windDirection,
            shortForecast: currentConditions.shortForecast,
            forecast: simpleForecast,
            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch weather data' },
            { status: 500 }
        );
    }
}
// src/app/api/lake-data/route.ts
import { NextResponse } from 'next/server';

// Focus on lake level only - flows handled by separate endpoint
const LRL_OFFICE = 'LRL';
const LAKE_LEVEL_TIMESERIES = 'Barren.Elev.Inst.0.0.lrldlb-rev';

// Base URL for the CWMS Data API, using the more efficient 'recent' endpoint.
const API_BASE_URL = 'https://cwms-data.usace.army.mil/cwms-data/timeseries/recent';

/**
 * API handler for lake level data only. 
 * Flows (inflow/outflow) are handled by separate endpoint with different caching.
 */
export async function GET() {
    const params = new URLSearchParams({
        office: LRL_OFFICE,
        'ts-ids': LAKE_LEVEL_TIMESERIES,
        unit: 'EN',
    });

    const url = `${API_BASE_URL}?${params.toString()}`;
    
    console.log(`Fetching data from: ${url}`);

    try {
        // Add timeout and better error handling for slow external API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
            signal: controller.signal,
            next: { 
                // Longer cache for lake data since it changes slowly
                revalidate: 60 * 15 // Revalidate every 15 minutes
            },
            headers: {
                'User-Agent': 'Barren-River-Lake-Hub/1.0'
            }
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`Failed to fetch recent data: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error('Failed to fetch from USACE API');
        }

        const data = await response.json();

        let lakeLevel = null;
        // The structure for 'recent' is an array of objects with 'dqu' property
        data.forEach((item: any) => {
            if (item.id === LAKE_LEVEL_TIMESERIES && item.dqu?.value !== undefined) {
                lakeLevel = item.dqu.value;
            }
        });

        const responseData = {
            level: lakeLevel,
            waterTemp: 78.5, // Static for now - could be fetched separately
            rain24h: 0.1,    // Static for now - could be fetched from weather API
            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Failed to fetch lake data:', error);
        
        // Return reasonable fallback data for when external API is slow
        const fallbackData = {
            level: 545.0, // Normal pool level for Barren River Lake
            waterTemp: 72.0,
            rain24h: 0.0,
            lastUpdated: new Date().toISOString()
        };
        
        console.log('Returning fallback data due to API error/timeout');
        return NextResponse.json(fallbackData);
    }
}

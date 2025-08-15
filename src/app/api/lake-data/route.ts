// src/app/api/lake-data/route.ts
import { NextResponse } from 'next/server';

// Correct, stable timeseries IDs for Barren River Lake from the LRL district.
const LRL_OFFICE = 'LRL';
const TIMESERIES_IDS = {
    level: 'Barren.Elev.Inst.0.0.lrldlb-rev',
    inflow: 'Barren.Flow-Inflow.Ave.1Hour.6Hours.lrldlb-comp',
    outflow: 'Barren.Flow-Outflow.Ave.1Hour.1Hour.lrldlb-comp',
};

// Base URL for the CWMS Data API, using the more efficient 'recent' endpoint.
const API_BASE_URL = 'https://cwms-data.usace.army.mil/cwms-data/timeseries/recent';

/**
 * API handler for GET requests. Fetches all lake data in a single call.
 */
export async function GET() {
    // Construct a comma-separated string of the timeseries IDs we need.
    const tsIds = Object.values(TIMESERIES_IDS).join(',');

    const params = new URLSearchParams({
        office: LRL_OFFICE,
        'ts-ids': tsIds,
        unit: 'EN',
    });

    const url = `${API_BASE_URL}?${params.toString()}`;
    
    console.log(`Fetching data from: ${url}`);

    try {
        // FIX: Removed the specific 'Accept' header that was causing a 406 error.
        const response = await fetch(url, {
            next: { revalidate: 60 * 5 }, // Revalidate every 5 minutes
        });

        if (!response.ok) {
            console.error(`Failed to fetch recent data: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error('Failed to fetch from USACE API');
        }

        const data = await response.json();

        const valueMap = new Map<string, number | null>();
        // The structure for 'recent' is an array of objects with 'dqu' property
        data.forEach((item: any) => {
            if (item.id && item.dqu?.value !== undefined) {
                valueMap.set(item.id, item.dqu.value);
            }
        });

        const responseData = {
            level: valueMap.get(TIMESERIES_IDS.level) ?? null,
            inflow: valueMap.get(TIMESERIES_IDS.inflow) ?? null,
            outflow: valueMap.get(TIMESERIES_IDS.outflow) ?? null,
            waterTemp: 78.5, 
            rain24h: 0.1,
            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Failed to fetch lake data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch lake data' },
            { status: 500 }
        );
    }
}

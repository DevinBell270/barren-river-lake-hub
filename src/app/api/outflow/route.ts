// src/app/api/outflow/route.ts
// API endpoint for daily projected 6am outflow data

import { NextResponse } from 'next/server';

const LRL_OFFICE = 'LRL';
const OUTFLOW_TIMESERIES = 'Barren.Flow-Out.Ave.1Day.1Day.lrldlb-rev';
const API_BASE_URL = 'https://cwms-data.usace.army.mil/cwms-data/timeseries';

interface OutflowData {
    outflow: number;
    lastUpdated: string;
    note: string;
}

/**
 * Get projected 6am outflow for today
 * This is typically the planned discharge rate for the day
 */
export async function GET() {
    console.log('Fetching daily projected outflow...');

    try {
        // Get today's date range (6am to 6am next day is typical for dam operations)
        const today = new Date();
        today.setHours(6, 0, 0, 0); // 6 AM today
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // 6 AM tomorrow

        const params = new URLSearchParams({
            office: LRL_OFFICE,
            name: OUTFLOW_TIMESERIES,
            begin: today.toISOString(),
            end: tomorrow.toISOString(),
            unit: 'EN', // English units (cfs)
            format: 'json'
        });

        const url = `${API_BASE_URL}?${params.toString()}`;
        console.log(`Fetching outflow from: ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            next: { 
                revalidate: 60 * 60 * 24 // Cache for 24 hours - only updates once per day
            },
            headers: {
                'User-Agent': 'Barren-River-Lake-Hub/1.0'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`USACE API error: ${response.status} ${response.statusText}`);
            throw new Error('Failed to fetch from USACE API');
        }

        const data = await response.json();
        console.log('USACE outflow response received');

        let outflowValue = null;

        // Extract the most recent outflow value
        if (data.values && Array.isArray(data.values) && data.values.length > 0) {
            // Get the latest non-null value
            for (let i = data.values.length - 1; i >= 0; i--) {
                const item = data.values[i];
                if (item.length >= 2 && item[1] !== null && item[1] !== undefined) {
                    outflowValue = parseFloat(item[1]);
                    break;
                }
            }
        }

        if (outflowValue !== null) {
            const responseData: OutflowData = {
                outflow: outflowValue,
                lastUpdated: new Date().toISOString(),
                note: "Projected 6am discharge rate"
            };

            console.log(`Successfully fetched outflow: ${outflowValue} cfs`);
            return NextResponse.json(responseData);
        } else {
            throw new Error('No valid outflow data found');
        }

    } catch (error) {
        console.error('Failed to fetch outflow data:', error);

        // Return fallback data - typical outflow for Barren River Lake
        const fallbackData: OutflowData = {
            outflow: 850, // Typical discharge rate in cfs
            lastUpdated: new Date().toISOString(),
            note: "Estimated discharge rate (data unavailable)"
        };

        console.log('Returning fallback outflow data');
        return NextResponse.json(fallbackData);
    }
}

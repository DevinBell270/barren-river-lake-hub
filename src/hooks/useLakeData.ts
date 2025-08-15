// src/hooks/useLakeData.ts
import useSWR from 'swr';

// Enhanced fetcher with timeout and error handling
const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Lake level data hook - changes slowly, longer refresh interval
export function useLakeLevel(fallbackData?: any) {
  return useSWR('/api/lake-data', fetcher, {
    fallbackData, // Use server-side data as fallback
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    dedupingInterval: 5 * 1000, // 5 seconds - prevent duplicate requests
    revalidateOnFocus: true, // Refresh when user returns to tab
    revalidateOnReconnect: true, // Refresh when internet reconnects
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000, // 5 seconds between retries
  });
}





// Outflow data hook - updates once daily (projected 6am discharge)
export function useOutflowData(fallbackData?: any) {
  return useSWR('/api/outflow', fetcher, {
    fallbackData, // Use server-side data as fallback
    refreshInterval: 60 * 60 * 1000, // 1 hour refresh (but cached for 24h on server)
    dedupingInterval: 60 * 1000, // 1 minute deduping
    revalidateOnFocus: false, // Don't refresh on focus - daily data
    revalidateOnReconnect: true, // Refresh on reconnect
    shouldRetryOnError: true,
    errorRetryCount: 2,
    errorRetryInterval: 5000,
  });
}

// Weather data hook (if you want to convert this too)
export function useWeatherData(fallbackData?: any) {
  return useSWR('/api/weather', fetcher, {
    fallbackData, // Use server-side data as fallback
    refreshInterval: 10 * 60 * 1000, // 10 minutes - weather changes moderately
    dedupingInterval: 5 * 1000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  });
}

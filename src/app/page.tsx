// src/app/page.tsx
// Server Component that fetches initial data and passes it to client component

import { LakeInfoClient } from './LakeInfoClient';
import { 
  getInitialLakeData, 
  getInitialOutflowData
} from '@/lib/serverData';

/**
 * Server Component that fetches initial data on the server
 * This provides instant page loads with pre-rendered data
 * SWR takes over for subsequent client-side updates
 */
export default async function Page() {
  // Fetch all initial data in parallel on the server
  // This runs at build time and on each request (with caching)
  const [lakeData, outflowData] = await Promise.allSettled([
    getInitialLakeData(),
    getInitialOutflowData() // Daily projected 6am discharge
  ]);

  // Extract successful results, handle errors gracefully
  const fallbackLakeData = lakeData.status === 'fulfilled' ? lakeData.value : undefined;
  const fallbackOutflowData = outflowData.status === 'fulfilled' ? outflowData.value || undefined : undefined;

  // Pass server-fetched data as fallback to client component
  return (
    <LakeInfoClient 
      fallbackLakeData={fallbackLakeData}
      fallbackOutflowData={fallbackOutflowData}
    />
  );
}
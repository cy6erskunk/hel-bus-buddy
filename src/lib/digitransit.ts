import type { StopSearchQueryResult, StopDeparturesQueryResult, StopDetails, StopSearchItem } from './types';

//const API_URL = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
const API_URL = '/api/digitransit'; 
const API_KEY = process.env.NEXT_PUBLIC_HSL_API_KEY || '';

if (!API_KEY && process.env.NODE_ENV !== 'test') { // Added a check for test environment
  // Only throw error or log if API_KEY is truly needed by this module (due to rewrites)
  // and it's not a test environment where it might be mocked or not required.
  console.warn('NEXT_PUBLIC_HSL_API_KEY environment variable not set. This might be an issue if client-side calls directly use it via rewrites.');
  // Depending on strictness, you might still want to throw an error:
  // throw new Error('NEXT_PUBLIC_HSL_API_KEY environment variable not set.');
}

async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
  // Log the API key being used if it's set, to help debug "Access Denied" issues.
  // This is useful if client-side code (via rewrites) is making the actual call to Digitransit.
  if (API_KEY) {
    console.log("API Key being used in src/lib/digitransit.ts (via NEXT_PUBLIC_HSL_API_KEY):", API_KEY ? '********' : 'NOT SET'); // Mask key in log for security
  } else {
    console.warn("No API Key (NEXT_PUBLIC_HSL_API_KEY) found in src/lib/digitransit.ts. If using rewrites, this could be an issue.");
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    // If the rewrite is correctly proxying and requires the key from the client.
    if (API_KEY) {
        headers['digitransit-subscription-key'] = API_KEY;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('GraphQL API Error Response Status:', response.status, response.statusText);
      console.error('GraphQL API Error Response Body:', errorBody);
      throw new Error(`GraphQL API request failed: ${response.status} ${response.statusText}. Body: ${errorBody}`);
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
      console.error('GraphQL Errors:', jsonResponse.errors);
      throw new Error(`GraphQL query errors: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`);
    }
    return jsonResponse.data;
  } catch (error) {
    console.error('Error fetching from Digitransit API (src/lib/digitransit.ts):', error instanceof Error ? error.message : String(error));
    // To see more details during development, you can log the full error object:
    // console.error('Full error object (src/lib/digitransit.ts):', JSON.stringify(error, null, 2));
    throw error; // Re-throw to be handled by the caller
  }
}

export async function searchStopsByName(name: string): Promise<StopSearchItem[]> {
  const query = `
    query SearchStops($name: String!) {
      stops(name: $name) {
        gtfsId
        name
        code
      }
    }
  `;
  const data: StopSearchQueryResult = await fetchGraphQL(query, { name });
  return data.stops || [];
}

export async function getStopDepartures(stopGtfsId: string): Promise<StopDetails | null> {
  const query = `
    query GetStopDepartures($stopId: String!) {
      stop(id: $stopId) {
        gtfsId
        name
        code
        stoptimesWithoutPatterns(numberOfDepartures: 20, omitNonPickups: true) {
          scheduledArrival
          realtimeArrival
          arrivalDelay
          scheduledDeparture
          realtimeDeparture
          departureDelay
          realtime
          realtimeState
          serviceDay
          headsign
          trip {
            routeShortName
            gtfsId
          }
        }
      }
    }
  `;
  const data: StopDeparturesQueryResult = await fetchGraphQL(query, { stopId: stopGtfsId });
  return data.stop;
}

export function formatDepartureTime(departure: { serviceDay: number, realtimeDeparture: number, scheduledDeparture: number, realtime: boolean }): string {
  const departureTimeSeconds = departure.realtime ? departure.realtimeDeparture : departure.scheduledDeparture;
  const serviceDate = new Date(departure.serviceDay * 1000); // Service day is a UNIX timestamp

  // Combine serviceDate (date part) with departureTimeSeconds (time part)
  const year = serviceDate.getFullYear();
  const month = serviceDate.getMonth();
  const day = serviceDate.getDate();

  const departureDateTime = new Date(year, month, day);
  departureDateTime.setSeconds(departureDateTime.getSeconds() + departureTimeSeconds);

  // Calculate difference from now
  const now = new Date();
  const diffMinutes = Math.round((departureDateTime.getTime() - now.getTime()) / (1000 * 60));

  if (diffMinutes < 1 && diffMinutes >= 0) return 'NOW';
  if (diffMinutes < 0 && diffMinutes > -2) return 'LEFT'; // If just left
  if (diffMinutes < 60 && diffMinutes > 0) return `${diffMinutes} min`;
  
  return departureDateTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
}
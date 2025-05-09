
import type { StopSearchQueryResult, StopDeparturesQueryResult, StopDetails, StopSearchItem } from './types';

const API_URL = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';

async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any HSL-specific API key if required, though it's often not for public queries
        // 'digitransit-subscription-key': 'YOUR_API_KEY_IF_NEEDED' 
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('GraphQL API Error Response:', errorBody);
      throw new Error(`GraphQL API request failed: ${response.status} ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
      console.error('GraphQL Errors:', jsonResponse.errors);
      throw new Error(`GraphQL query errors: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`);
    }
    return jsonResponse.data;
  } catch (error) {
    console.error('Error fetching from Digitransit API:', error);
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

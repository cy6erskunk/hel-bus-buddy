
import type { StopSearchQueryResult, StopDeparturesQueryResult, StopDetails, StopSearchItem, VehicleMode } from './types';

const PROXY_API_URL = '/api/digitransit'; 

async function fetchViaProxy(requestType: 'searchStops' | 'getDepartures', payload: Record<string, any>) {
  try {
    const response = await fetch(PROXY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: requestType, payload }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let detailedError = errorBody;
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError && parsedError.message) {
          detailedError = parsedError.message;
        }
        if (parsedError && parsedError.error) {
            detailedError += ` (Details: ${parsedError.error})`;
        }
      } catch (e) {
        // If parsing fails, use the raw text
      }
      console.error('Proxy API Error Response Status:', response.status, response.statusText);
      console.error('Proxy API Error Response Body:', errorBody);
      throw new Error(`Proxy API request failed: ${response.status} ${response.statusText}. Details: ${detailedError}`);
    }

    const jsonResponse = await response.json();
    return jsonResponse;
  } catch (error) {
    console.error(`Error fetching from Proxy API (src/lib/digitransit.ts) for ${requestType}:`, error instanceof Error ? error.message : String(error));
    throw error; 
  }
}

export async function searchStopsByName(name: string, modes?: VehicleMode[]): Promise<StopSearchItem[]> {
  const payload: { name: string; modes?: VehicleMode[] } = { name };
  if (modes && modes.length > 0) {
    payload.modes = modes;
  }
  const data = await fetchViaProxy('searchStops', payload);
  return data || []; 
}

export async function getStopDepartures(stopGtfsId: string): Promise<StopDetails | null> {
  const data = await fetchViaProxy('getDepartures', { stopId: stopGtfsId });
  return data; 
}

export function formatDepartureTime(departure: { serviceDay: number, realtimeDeparture: number, scheduledDeparture: number, realtime: boolean }): string {
  const departureTimeSeconds = departure.realtime ? departure.realtimeDeparture : departure.scheduledDeparture;
  const serviceDate = new Date(departure.serviceDay * 1000); 

  const year = serviceDate.getFullYear();
  const month = serviceDate.getMonth();
  const day = serviceDate.getDate();

  const departureDateTime = new Date(year, month, day);
  departureDateTime.setSeconds(departureDateTime.getSeconds() + departureTimeSeconds);

  const now = new Date();
  const diffMinutes = Math.round((departureDateTime.getTime() - now.getTime()) / (1000 * 60));

  if (diffMinutes < 1 && diffMinutes >= 0) return 'NOW';
  if (diffMinutes < 0 && diffMinutes > -2) return 'LEFT'; 
  if (diffMinutes < 60 && diffMinutes > 0) return `${diffMinutes} min`;
  
  return departureDateTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
}

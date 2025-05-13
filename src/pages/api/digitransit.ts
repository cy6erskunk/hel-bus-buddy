
import type { NextApiRequest, NextApiResponse } from 'next';
import type { StopSearchQueryResult, StopDeparturesQueryResult, StopDetails, StopSearchItem, VehicleMode } from '../../lib/types';

const API_URL = 'https://api.digitransit.fi/routing/v2/routers/hsl/index/graphql';
const API_KEY = process.env.HSL_API_KEY || '';

if (!API_KEY) {
  console.warn('HSL_API_KEY environment variable not set. This is required to make requests to the Digitransit API. Requests may fail.');
}

async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
  if (!API_KEY) {
    console.error('HSL_API_KEY is not configured. Cannot make requests to Digitransit API.');
    throw new Error('HSL_API_KEY is not configured on the server. Cannot make requests to Digitransit API.');
  }
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'digitransit-subscription-key': API_KEY,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('GraphQL API Error Response Status:', response.status, response.statusText);
      console.error('GraphQL API Error Response Body:', errorBody);
      let detailedError = errorBody;
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError && parsedError.errors && parsedError.errors.length > 0) {
          detailedError = parsedError.errors.map((e: any) => e.message).join(', ');
        } else if (parsedError && parsedError.message) {
          detailedError = parsedError.message;
        }
      } catch (e) {
        // If parsing fails, use the raw text
      }
      throw new Error(`GraphQL API request failed: ${response.status} ${response.statusText}. Details: ${detailedError}`);
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
      console.error('GraphQL Errors:', jsonResponse.errors);
      throw new Error(`GraphQL query errors: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`);
    }
    return jsonResponse.data;
  } catch (error: any) {
    console.error('Error fetching from Digitransit API (src/pages/api/digitransit.ts):', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error message (src/pages/api/digitransit.ts):', errorMessage);
    throw error;
  }
}

export async function searchStopsByName(name: string, modes?: VehicleMode[]): Promise<StopSearchItem[]> {
  const query = `
    query SearchStops($name: String!, $modes: [VehicleMode]) {
      stops(name: $name, modes: $modes) {
        gtfsId
        name
        code
        vehicleMode
      }
    }
  `;
  const variables: { name: string; modes?: VehicleMode[] } = { name };
  if (modes && modes.length > 0) {
    variables.modes = modes;
  }
  const data: StopSearchQueryResult = await fetchGraphQL(query, variables);
  return data.stops?.map(stop => ({ ...stop, vehicleMode: stop.vehicleMode || undefined })) || [];
}

export async function getStopDepartures(stopGtfsId: string): Promise<StopDetails | null> {
  const query = `
    query GetStopDepartures($stopId: String!) {
      stop(id: $stopId) {
        gtfsId
        name
        code
        vehicleMode
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


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ message: 'API key not configured on the server.' });
  }

  const { type, payload } = req.body;

  try {
    if (type === 'searchStops') {
      if (!payload || typeof payload.name !== 'string') {
          return res.status(400).json({ message: 'Invalid payload for searchStops: name is required' });
      }
      const modes = payload.modes as VehicleMode[] | undefined;
      if (payload.modes && (!Array.isArray(payload.modes) || !payload.modes.every((m: any) => typeof m === 'string'))) {
        return res.status(400).json({ message: 'Invalid payload for searchStops: modes must be an array of strings' });
      }
      const stops = await searchStopsByName(payload.name, modes);
      return res.status(200).json(stops);
    } else if (type === 'getDepartures') {
        if (!payload || typeof payload.stopId !== 'string') {
            return res.status(400).json({ message: 'Invalid payload for getDepartures' });
        }
      const departures = await getStopDepartures(payload.stopId);
      return res.status(200).json(departures);
    } else {
      return res.status(400).json({ message: 'Invalid request type' });
    }
  } catch (error: any) {
    console.error('API Route Error (src/pages/api/digitransit.ts):', error);
    return res.status(500).json({ message: 'Error fetching data from Digitransit', error: error.message });
  }
}


import type { NextApiRequest, NextApiResponse } from 'next';
import type { StopSearchQueryResult, StopDeparturesQueryResult, StopDetails, StopSearchItem } from '../../lib/types';

const API_URL = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1'; // Updated to v2
const API_KEY = process.env.HSL_API_KEY || '';

if (!API_KEY) {
  console.error('HSL_API_KEY environment variable not set. This is required to make requests to the Digitransit API.');
  // In a production environment, you might want to crash the application or handle this more gracefully.
}

async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
  if (!API_KEY) {
    // This check is important to prevent requests without a key.
    throw new Error('HSL_API_KEY is not configured. Cannot make requests to Digitransit API.');
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
      // Try to parse errorBody as JSON for more structured error messages from Digitransit
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
    // Log the specific error message if available
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error message (src/pages/api/digitransit.ts):', errorMessage);
    throw error; // Re-throw to be handled by the API route handler
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


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!API_KEY) {
    // Prevent attempts to call the API if the key is not set.
    return res.status(500).json({ message: 'API key not configured on the server.' });
  }

  const { type, payload } = req.body;

  try {
    if (type === 'searchStops') {
      if (!payload || typeof payload.name !== 'string') {
          return res.status(400).json({ message: 'Invalid payload for searchStops' });
      }
      const stops = await searchStopsByName(payload.name);
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
    // Return a generic error message to the client for security
    return res.status(500).json({ message: 'Error fetching data from Digitransit', error: error.message });
  }
}

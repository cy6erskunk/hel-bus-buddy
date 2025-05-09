import type { NextApiRequest, NextApiResponse } from 'next';
import type { StopSearchQueryResult, StopDeparturesQueryResult, StopDetails, StopSearchItem } from '../../lib/types';

const API_URL = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
const API_KEY = process.env.HSL_API_KEY || '';

if (!API_KEY) {
  console.error('HSL_API_KEY environment variable not set.');
  // In a production environment, you might want to crash the application or handle this more gracefully.
}

async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
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
      console.error('GraphQL API Error Response:', errorBody);
      throw new Error(`GraphQL API request failed: ${response.status} ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
      console.error('GraphQL Errors:', jsonResponse.errors);
      // You might want to return the specific GraphQL errors to the client depending on your needs
      throw new Error(`GraphQL query errors: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`);
    }
    return jsonResponse.data;
  } catch (error: any) {
    console.error('Error fetching from Digitransit API:', error);
    console.error('Error message:', error.message);
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
    query GetStopDepartatures($stopId: String!) {
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
    console.error('API Route Error:', error);
    // Return a generic error message to the client for security
    return res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
}
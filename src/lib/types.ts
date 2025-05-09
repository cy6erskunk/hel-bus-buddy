
export interface Stop {
  gtfsId: string;
  name: string;
  code?: string; // Short code like "E1234"
  lat?: number;
  lon?: number;
}

export interface RouteInfo {
  routeShortName: string; // e.g., "101"
  gtfsId: string;
}

export interface Departure {
  scheduledArrival: number;
  realtimeArrival: number;
  arrivalDelay: number;
  scheduledDeparture: number;
  realtimeDeparture: number;
  departureDelay: number;
  realtime: boolean;
  realtimeState: 'SCHEDULED' | 'UPDATED' | 'CANCELED' | 'ADDED' | 'MODIFIED';
  serviceDay: number; // Unix timestamp for the start of the service day
  headsign: string; // Destination
  trip: RouteInfo;
}

export interface StopDetails extends Stop {
  stoptimesWithoutPatterns: Departure[];
}

export interface StopSearchItem {
  gtfsId: string;
  name: string;
  code: string | null;
}

export interface StopSearchQueryResult {
  stops: StopSearchItem[];
}

export interface StopDeparturesQueryResult {
  stop: StopDetails | null;
}

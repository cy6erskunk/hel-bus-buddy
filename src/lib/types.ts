
export type VehicleMode = "BUS" | "TRAM" | "SUBWAY" | "RAIL" | "FERRY" | "WALK" | "BICYCLE" | "CAR" | "AIRPLANE" | "COACH";

export const AVAILABLE_MODES: { mode: VehicleMode; label: string }[] = [
  { mode: "BUS", label: "Bus" },
  { mode: "TRAM", label: "Tram" },
  { mode: "SUBWAY", label: "Subway" },
  { mode: "RAIL", label: "Train/Rail" },
  { mode: "FERRY", label: "Ferry" },
];

export interface Stop {
  gtfsId: string;
  name: string;
  code?: string; // Short code like "E1234"
  lat?: number;
  lon?: number;
  vehicleMode?: VehicleMode;
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
  vehicleMode?: VehicleMode;
}

export interface StopSearchQueryResult {
  stops: (StopSearchItem & { vehicleMode?: VehicleMode })[];
}

export interface StopDeparturesQueryResult {
  stop: StopDetails | null;
}


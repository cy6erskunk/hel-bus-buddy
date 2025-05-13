
"use client";

import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { StopDetails, Departure } from '@/lib/types';
import { BusRouteCard } from './BusRouteCard';
import { Filter, Info } from 'lucide-react';
import { getVehicleModeIcon } from './StopSearchDialog'; // Import the icon helper

interface BusScheduleDisplayProps {
  stopDetails: StopDetails | null;
  isLoading: boolean;
  error: string | null;
}

export const BusScheduleDisplay: FC<BusScheduleDisplayProps> = ({ stopDetails, isLoading, error }) => {
  const [routeFilter, setRouteFilter] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); // Update time every 30 seconds
    return () => clearInterval(timer);
  }, []);


  const filteredDepartures = useMemo(() => {
    if (!stopDetails?.stoptimesWithoutPatterns) return [];
    // Sort departures: NOW first, then by time, then by route number for ties
    const sorted = [...stopDetails.stoptimesWithoutPatterns].sort((a, b) => {
      const timeA = a.realtime ? a.realtimeDeparture : a.scheduledDeparture;
      const timeB = b.realtime ? b.realtimeDeparture : a.scheduledDeparture;
      if (timeA === timeB) {
        return parseInt(a.trip.routeShortName, 10) - parseInt(b.trip.routeShortName, 10);
      }
      return timeA - timeB;
    });

    return sorted.filter(dep =>
      dep.trip.routeShortName.toLowerCase().includes(routeFilter.toLowerCase())
    );
  }, [stopDetails, routeFilter, currentTime]); // Add currentTime to dependencies to re-sort/filter

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="flex-grow p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex flex-col items-center justify-center shadow-lg p-6">
        <CardTitle className="text-destructive mb-2">Error</CardTitle>
        <p className="text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (!stopDetails) {
    return (
      <Card className="h-full flex flex-col items-center justify-center shadow-lg p-6">
        <Info className="h-12 w-12 text-primary mb-4" />
        <CardTitle className="text-xl mb-2">Select a Stop</CardTitle>
        <p className="text-muted-foreground text-center">
          Choose one of your favorite stops to see its bus schedule.
        </p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center">
             {getVehicleModeIcon(stopDetails.vehicleMode, { className: "h-6 w-6 mr-2 text-primary shrink-0" })}
            <div>
                <CardTitle className="text-lg">{stopDetails.name}</CardTitle>
                {stopDetails.code && <p className="text-sm text-muted-foreground">{stopDetails.code}</p>}
            </div>
          </div>
          <div className="relative flex-shrink-0 w-full sm:w-auto sm:max-w-xs">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by route..."
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="pl-10"
              aria-label="Filter bus routes by number"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        {filteredDepartures.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>No upcoming departures found{routeFilter ? ` for route "${routeFilter}"` : ''}.</p>
          </div>
        ) : (
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {filteredDepartures.map((dep, index) => (
                <BusRouteCard key={`${dep.trip.gtfsId}-${dep.scheduledDeparture}-${index}`} departure={dep} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

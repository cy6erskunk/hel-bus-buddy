"use client";

import type { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Departure } from '@/lib/types';
import { formatDepartureTime } from '@/lib/digitransit';
import { Clock, BusFront } from 'lucide-react';

interface BusRouteCardProps {
  departure: Departure;
}

export const BusRouteCard: FC<BusRouteCardProps> = ({ departure }) => {
  const arrivalTimeDisplay = formatDepartureTime(departure);
  const isRealtime = departure.realtime;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Bus icon, route name, headsign, real-time status */}
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto"> {/* Added min-w-0 and responsive width */}
          <BusFront className="h-8 w-8 text-primary shrink-0" />
          <div className="min-w-0 flex-grow"> {/* Added min-w-0 and flex-grow to allow truncation and proper sizing */}
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-sm px-2 py-1 shrink-0">
                {departure.trip.routeShortName}
              </Badge>
              <p className="font-semibold text-base leading-tight truncate" title={departure.headsign}>
                {departure.headsign}
              </p>
            </div>
            <p className={`text-xs flex items-center gap-1 ${isRealtime ? 'text-green-600' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />
              {isRealtime ? 'Real-time' : 'Scheduled'}
              {departure.departureDelay !== 0 && isRealtime && (
                <span className={departure.departureDelay > 0 ? 'text-red-600' : 'text-green-600'}>
                  ({departure.departureDelay > 0 ? `+${Math.round(departure.departureDelay / 60)}` : `${Math.round(departure.departureDelay / 60)}`} min)
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Right side: Departure time */}
        <div className="w-full text-right sm:w-auto sm:text-right flex-shrink-0"> {/* Responsive width/alignment for time. flex-shrink-0 for row layout. */}
          <p className={`text-lg sm:text-xl font-bold ${arrivalTimeDisplay === 'NOW' ? 'text-accent' : ''}`}>
            {arrivalTimeDisplay}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

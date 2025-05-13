
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Stop } from '@/lib/types';
import { StopSearchDialog, getVehicleModeIcon } from './StopSearchDialog'; // Import getVehicleModeIcon
import { PlusCircle, Trash2, Eye } from 'lucide-react';

interface FavoriteStopsManagerProps {
  favoriteStops: Stop[];
  onAddFavorite: (stop: Stop) => void;
  onRemoveFavorite: (stopId: string) => void;
  onSelectStop: (stop: Stop) => void;
  selectedStopId?: string | null;
}

export const FavoriteStopsManager: FC<FavoriteStopsManagerProps> = ({
  favoriteStops,
  onAddFavorite,
  onRemoveFavorite,
  onSelectStop,
  selectedStopId,
}) => {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Favorite Stops</CardTitle>
          <Button size="sm" onClick={() => setIsSearchDialogOpen(true)} aria-label="Add new favorite stop">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Stop
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        {favoriteStops.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>No favorite stops yet.</p>
            <p>Click "Add Stop" to get started.</p>
          </div>
        ) : (
          <ScrollArea className="h-full p-4"> 
            <div className="space-y-3">
              {favoriteStops.map((stop) => (
                <Card 
                  key={stop.gtfsId} 
                  className={`transition-all hover:shadow-md ${selectedStopId === stop.gtfsId ? 'border-primary ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className="p-3 flex flex-row items-center">
                    {getVehicleModeIcon(stop.vehicleMode, { className: "h-5 w-5 mr-2 text-primary shrink-0" })}
                    <div className="min-w-0 flex-grow">
                      <CardTitle className="text-base truncate" title={stop.name}>{stop.name}</CardTitle>
                      {stop.code && <p className="text-xs text-muted-foreground">{stop.code}</p>}
                    </div>
                  </CardHeader>
                  <CardFooter className="p-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectStop(stop)}
                      aria-label={`View schedule for ${stop.name}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemoveFavorite(stop.gtfsId)}
                      aria-label={`Remove ${stop.name} from favorites`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <StopSearchDialog
        isOpen={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onStopSelected={onAddFavorite}
      />
    </Card>
  );
};

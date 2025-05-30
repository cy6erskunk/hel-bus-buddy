
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { StopSearchItem, Stop, VehicleMode } from '@/lib/types';
import { AVAILABLE_MODES } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { searchStopsByName } from '@/lib/digitransit';
import { Loader2, Search as SearchIcon, Bus, TramFront, TrainTrack, Train, Ship, HelpCircle, CheckCircle2 } from 'lucide-react'; // Renamed Search to SearchIcon
import { cn } from '@/lib/utils';

interface StopSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStopSelected: (stop: Stop) => void;
  favoriteStops: Stop[]; 
}

export const getVehicleModeIcon = (mode?: VehicleMode, props?: React.ComponentProps<typeof Bus>) => {
  let modeColorClass = "text-muted-foreground"; // Default color
  switch (mode) {
    case "BUS":
      modeColorClass = "text-primary"; // Blue from theme for buses
      break;
    case "TRAM":
      modeColorClass = "text-green-600"; // Green for trams
      break;
    case "SUBWAY":
      modeColorClass = "text-orange-600"; // Orange for metro/subway
      break;
    case "RAIL":
      modeColorClass = "text-purple-600"; // Purple for rail/train
      break;
    case "FERRY":
      modeColorClass = "text-yellow-600"; // Yellow for ferries
      break;
  }

  const baseIconClasses = "h-5 w-5 mr-2 shrink-0";

  // Combine props: spread incoming props first, then apply base classes, 
  // then specific class from props, and finally the modeColorClass to ensure it takes precedence for color.
  const iconPropsCombined = {
    ...props, 
    className: cn(baseIconClasses, props?.className, modeColorClass),
  };

  switch (mode) {
    case "BUS":
      return <Bus {...iconPropsCombined} />;
    case "TRAM":
      return <TramFront {...iconPropsCombined} />;
    case "SUBWAY":
      return <TrainTrack {...iconPropsCombined} />; 
    case "RAIL":
      return <Train {...iconPropsCombined} />;
    case "FERRY":
      return <Ship {...iconPropsCombined} />;
    default:
      return <HelpCircle {...iconPropsCombined} />;
  }
};

export const StopSearchDialog: FC<StopSearchDialogProps> = ({ isOpen, onOpenChange, onStopSelected, favoriteStops }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StopSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModes, setSelectedModes] = useState<VehicleMode[]>(AVAILABLE_MODES.map(m => m.mode));
  const { toast } = useToast();

  const handleModeChange = (mode: VehicleMode) => {
    setSelectedModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const handleSearch = async () => {
    if (searchTerm.trim().length < 3) {
      toast({
        title: "Search term too short",
        description: "Please enter at least 3 characters to search.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setSearchResults([]);
    try {
      const results = await searchStopsByName(searchTerm.trim(), selectedModes.length > 0 ? selectedModes : undefined);
      setSearchResults(results);
      if (results.length === 0) {
        toast({
          title: "No stops found",
          description: `No stops found matching "${searchTerm}"${selectedModes.length < AVAILABLE_MODES.length ? ' for the selected vehicle types' : ''}.`,
        });
      }
    } catch (error: any) {
      console.error('Error searching stops:', JSON.stringify(error, null, 2));
      let description = 'An unexpected error occurred while searching for stops.';
       if (error.message?.toLowerCase().includes('failed to fetch') || error.message?.toLowerCase().includes('networkerror')) {
        description = "Network error: Could not connect to the server. Please check your internet connection or if an ad-blocker is interfering. The API might also be temporarily unavailable or blocking requests from this origin.";
      } else if (error instanceof Error) {
        description = error.message;
      } else if (error && error.error && typeof error.error === 'string') {
        description = error.error; 
      }
      toast({
        title: "Search Error",
        description: description,
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStop = (stop: StopSearchItem) => {
    onStopSelected({
      gtfsId: stop.gtfsId,
      name: stop.name,
      code: stop.code || undefined,
      vehicleMode: stop.vehicleMode
    });
  };

  const isStopFavorite = (gtfsId: string): boolean => {
    return favoriteStops.some(favStop => favStop.gtfsId === gtfsId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) { 
        setSearchTerm('');
        setSearchResults([]);
        setIsLoading(false); 
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md shadow-xl">
        <DialogHeader>
          <DialogTitle>Add Favorite Stop</DialogTitle>
          <DialogDescription>
            Search by name or code. Filter by vehicle type. Click a stop to add it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="stop-search" className="sr-only">
              Stop Name/Code
            </Label>
            <Input
              id="stop-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., Kamppi or E1234"
              className="flex-grow"
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading || searchTerm.trim().length < 3} className="shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Vehicle Types</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 p-2 rounded-md border">
              {AVAILABLE_MODES.map(({ mode, label }) => (
                <div key={mode} className="flex items-center space-x-2 py-1 hover:bg-accent/10 rounded">
                  <Checkbox
                    id={`mode-${mode}`}
                    checked={selectedModes.includes(mode)}
                    onCheckedChange={() => handleModeChange(mode)}
                    aria-label={`Filter by ${label}`}
                  />
                  <Label htmlFor={`mode-${mode}`} className="text-sm font-normal cursor-pointer flex items-center flex-1 min-w-0">
                    {getVehicleModeIcon(mode, { className: "h-4 w-4 mr-1.5"})}
                    <span className="truncate" title={label}>{label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {isLoading && searchResults.length === 0 && (
            <div className="flex justify-center items-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && searchResults.length > 0 && (
            <ScrollArea className="h-[200px] rounded-md border p-2">
              <div className="space-y-1">
                {searchResults.map((stop) => {
                  const isFavorite = isStopFavorite(stop.gtfsId);
                  return (
                    <Button
                      key={stop.gtfsId}
                      variant={isFavorite ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto py-2.5 px-3 flex items-center"
                      onClick={() => !isFavorite && handleSelectStop(stop)}
                      disabled={isFavorite}
                      aria-label={isFavorite ? `${stop.name} is already a favorite` : `Add stop ${stop.name} to favorites`}
                    >
                      {getVehicleModeIcon(stop.vehicleMode)}
                      <div className="flex-grow min-w-0">
                        <p className="font-medium truncate" title={stop.name}>{stop.name}</p>
                        {stop.code && <p className="text-xs text-muted-foreground">{stop.code}</p>}
                      </div>
                      {isFavorite && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto shrink-0" />}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
           {!isLoading && searchResults.length === 0 && searchTerm.trim().length >=3 && ( 
            <div className="p-6 text-center text-muted-foreground h-[200px] flex flex-col justify-center items-center">
                <p>No stops found matching your search criteria.</p>
            </div>
           )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

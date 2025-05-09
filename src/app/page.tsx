
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FavoriteStopsManager } from '@/components/bus/FavoriteStopsManager';
import { BusScheduleDisplay } from '@/components/bus/BusScheduleDisplay';
import type { Stop, StopDetails } from '@/lib/types';
import { getStopDepartures } from '@/lib/digitransit';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const [favoriteStops, setFavoriteStops] = useLocalStorage<Stop[]>('favoriteStops', []);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [stopDetails, setStopDetails] = useState<StopDetails | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedStop?.gtfsId) {
      const fetchSchedule = async () => {
        setIsLoadingSchedule(true);
        setScheduleError(null);
        setStopDetails(null); 
        try {
          const details = await getStopDepartures(selectedStop.gtfsId);
          if (details) {
            setStopDetails(details);
          } else {
            setScheduleError("Could not find details for this stop.");
            toast({
              title: "Error",
              description: `Could not fetch schedule for ${selectedStop.name}. Stop details not found.`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching stop schedule:', error);
          setScheduleError("Failed to load bus schedule. Please check your connection and try again.");
          toast({
            title: "Network Error",
            description: `Could not fetch schedule for ${selectedStop.name}. Please try again later.`,
            variant: "destructive",
          });
        } finally {
          setIsLoadingSchedule(false);
        }
      };
      fetchSchedule();
    } else {
      // Clear schedule if no stop is selected
      setStopDetails(null);
      setIsLoadingSchedule(false);
      setScheduleError(null);
    }
  }, [selectedStop, toast]);

  const handleAddFavorite = useCallback((stop: Stop) => {
    if (!favoriteStops.find(fs => fs.gtfsId === stop.gtfsId)) {
      setFavoriteStops(prev => [...prev, stop]);
      toast({
        title: "Stop Added",
        description: `${stop.name} has been added to your favorites.`,
      });
    } else {
      toast({
        title: "Already Favorite",
        description: `${stop.name} is already in your favorites.`,
        variant: "default",
      });
    }
  }, [favoriteStops, setFavoriteStops, toast]);

  const handleRemoveFavorite = useCallback((stopId: string) => {
    setFavoriteStops(prev => prev.filter(s => s.gtfsId !== stopId));
    if (selectedStop?.gtfsId === stopId) {
      setSelectedStop(null); // Deselect if removed
    }
    toast({
      title: "Stop Removed",
      description: "The stop has been removed from your favorites.",
    });
  }, [selectedStop, setFavoriteStops, toast]);

  const handleSelectStop = useCallback((stop: Stop) => {
    setSelectedStop(stop);
  }, []);

  return (
    <div className="container mx-auto py-6 px-2 sm:px-4">
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-10rem)]"> {/* Adjust min-height based on header/footer */}
        <div className="lg:w-1/3 xl:w-1/4 h-full">
          <FavoriteStopsManager
            favoriteStops={favoriteStops}
            onAddFavorite={handleAddFavorite}
            onRemoveFavorite={handleRemoveFavorite}
            onSelectStop={handleSelectStop}
            selectedStopId={selectedStop?.gtfsId}
          />
        </div>
        <div className="lg:w-2/3 xl:w-3/4 h-full">
          <BusScheduleDisplay
            stopDetails={stopDetails}
            isLoading={isLoadingSchedule}
            error={scheduleError}
          />
        </div>
      </div>
    </div>
  );
}


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
import { searchStopsByName } from '@/lib/digitransit';
import type { StopSearchItem, Stop } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SearchIcon } from 'lucide-react';

interface StopSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStopSelected: (stop: Stop) => void;
}

export const StopSearchDialog: FC<StopSearchDialogProps> = ({ isOpen, onOpenChange, onStopSelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StopSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    try {
      const results = await searchStopsByName(searchTerm.trim());
      setSearchResults(results);
      if (results.length === 0) {
        toast({
          title: "No stops found",
          description: `No stops found matching "${searchTerm}".`,
        });
      }
    } catch (error) {
      console.error('Error searching stops:', error);
      let description = "Could not fetch stop data. Please try again.";
      if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        description = "Network error: Could not connect to the server. Please check your internet connection or if an ad-blocker is interfering. The API might also be temporarily unavailable or blocking requests from this origin.";
      } else if (error instanceof Error) {
        // For GraphQL errors or other errors from fetchGraphQL
        description = error.message;
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
    onStopSelected({ gtfsId: stop.gtfsId, name: stop.name, code: stop.code || undefined });
    onOpenChange(false); // Close dialog after selection
    setSearchTerm(''); // Reset search
    setSearchResults([]);
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
      <DialogContent className="sm:max-w-[425px] shadow-xl">
        <DialogHeader>
          <DialogTitle>Add Favorite Bus Stop</DialogTitle>
          <DialogDescription>
            Search for a bus stop by name or code (e.g., "Kamppi" or "E1234").
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
          {isLoading && searchResults.length === 0 && (
            <div className="flex justify-center items-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && searchResults.length > 0 && (
            <ScrollArea className="h-[200px] rounded-md border p-2">
              <div className="space-y-2">
                {searchResults.map((stop) => (
                  <Button
                    key={stop.gtfsId}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleSelectStop(stop)}
                  >
                    <div>
                      <p className="font-medium">{stop.name}</p>
                      {stop.code && <p className="text-xs text-muted-foreground">{stop.code}</p>}
                    </div>
                  </Button>
                ))}
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
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

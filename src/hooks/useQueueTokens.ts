import { useState, useEffect, useCallback, useRef } from "react";
import { fetchQueue, QueueToken } from "../lib/queue-tokens";

// Global cache for instant load
let cache: Record<string, QueueToken[]> = {};

export function useQueueTokens(hospitalId: string) {
  const [queue, setQueue] = useState<QueueToken[]>(cache[hospitalId] || []);
  const [loading, setLoading] = useState(!cache[hospitalId]);
  const [error, setError] = useState<string | null>(null);
  
  const isFetching = useRef(false);

  const errorCount = useRef(0);

  const loadQueue = useCallback(async () => {
    if (!hospitalId || isFetching.current) return;
    
    // Stop polling if errors exceed threshold
    if (errorCount.current >= 3) return;

    // Check if the tab is visible to save requests
    if (document.hidden) return;

    isFetching.current = true;
    try {
      const data = await fetchQueue(hospitalId);
      setQueue(data);
      cache[hospitalId] = data; // Update cache
      setError(null);
      errorCount.current = 0; // Reset on success
    } catch (err: any) {
      console.error("TOKEN ERROR:", err);
      setError(err.message || "Failed to load queue tokens.");
      errorCount.current += 1;
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [hospitalId]);

  useEffect(() => {
    loadQueue();
    // Increase polling interval to 6s
    const interval = setInterval(() => {
      // If error threshold reached, clear the interval
      if (errorCount.current >= 3) {
        clearInterval(interval);
        return;
      }
      loadQueue();
    }, 6000);

    return () => clearInterval(interval);
  }, [loadQueue]);

  return { queue, loading, error, refreshQueue: loadQueue };
}


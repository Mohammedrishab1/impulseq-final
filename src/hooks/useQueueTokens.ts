import { useState, useEffect, useCallback } from "react";
import { fetchQueue, QueueToken } from "../lib/queue-tokens";

export function useQueueTokens(hospitalId: string) {
  const [queue, setQueue] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const data = await fetchQueue(hospitalId);
      setQueue(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load queue tokens.");
    } finally {
      if (loading) setLoading(false);
    }
  }, [hospitalId, loading]);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(() => {
      loadQueue();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadQueue]);

  return { queue, loading, error, refreshQueue: loadQueue };
}

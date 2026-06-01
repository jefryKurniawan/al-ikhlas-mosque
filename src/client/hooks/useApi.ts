import { useState, useEffect, useCallback } from 'preact/hooks';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiResponse<T>>;
      })
      .then(res => {
        if (res.success && res.data !== undefined) {
          setData(res.data);
        } else {
          throw new Error(res.error ?? 'Gagal memuat data');
        }
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Terjadi kesalahan'))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(fetchData, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

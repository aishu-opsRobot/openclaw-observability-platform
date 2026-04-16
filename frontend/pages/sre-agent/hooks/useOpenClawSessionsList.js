import { useCallback, useEffect, useState } from "react";
import { extractSessionsArray, fetchOpenClawSessionList } from "../../../lib/sreOpenclawSessions.js";
import { REFRESH_INTERVAL, USE_MOCK } from "../constants.js";

export function useOpenClawSessionsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (USE_MOCK) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      const data = await fetchOpenClawSessionList({ limit: 100 });
      setRows(extractSessionsArray(data));
      setError(null);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    const timer = setInterval(() => void load(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  return { rows, loading, error, reload: load };
}

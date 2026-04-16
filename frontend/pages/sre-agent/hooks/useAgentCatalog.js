import { useCallback, useEffect, useState } from "react";
import { fetchAgentCatalog, STATIC_FALLBACK_CATALOG } from "../../../lib/sreAgentCatalog.js";
import { REFRESH_INTERVAL } from "../constants.js";

export function useAgentCatalog() {
  const [catalog, setCatalog] = useState(STATIC_FALLBACK_CATALOG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromRemote, setFromRemote] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await fetchAgentCatalog();
      setCatalog(result.agents);
      setFromRemote(result.fromRemote);
      setError(result.fromRemote ? null : "使用本地列表");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  return { catalog, loading, error, fromRemote };
}

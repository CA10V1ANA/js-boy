import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { EntregaOperacional, ResumoEntregador } from "../types";

export function useOperacao() {
  const [items, setItems] = useState<EntregaOperacional[]>([]);
  const [summary, setSummary] = useState<ResumoEntregador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const [entregas, resumo] = await Promise.all([
        api.get<EntregaOperacional[]>("/entregas/minhas-entregas"),
        api.get<ResumoEntregador>("/operacao-entregador/resumo"),
      ]);
      setItems(entregas.data);
      setSummary(resumo.data);
    } catch (reason) {
      setError(
        apiErrorMessage(reason, "Não foi possível carregar suas entregas."),
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { items, summary, loading, error, load };
}

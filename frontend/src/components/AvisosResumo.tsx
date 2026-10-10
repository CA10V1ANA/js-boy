import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAreaOperacional } from "../hooks/useAreaOperacional";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";

export function AvisosResumo() {
  const operacional = useAreaOperacional();
  const [items, setItems] = useState<
    { id: string; evento: string; codigo?: string; criadaEm: string }[] | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void api
      .get<typeof items>(
        (operacional ? "/operacao-entregador" : "") + "/notificacoes",
      )
      .then(({ data }) => {
        if (active) setItems(data);
      })
      .catch((r) => {
        if (active)
          setError(apiErrorMessage(r, "Não foi possível carregar avisos."));
      });
    return () => {
      active = false;
    };
  }, [operacional]);
  const destino = operacional ? "/operacional/notificacoes" : "/notificacoes";
  return (
    <section className="panelCard">
      <div className="panelCardHeader">
        <h2>Avisos recentes</h2>
        <Link to={destino}>Ver todos</Link>
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : !items ? (
        <p role="status">Carregando avisos...</p>
      ) : items.length ? (
        items.slice(0, 3).map((n) => (
          <Link className="deliveryOverviewRow" key={n.id} to={destino}>
            <strong>{n.evento.replace(/_/g, " ")}</strong>
            <span>{n.codigo}</span>
            <small>{new Date(n.criadaEm).toLocaleString("pt-BR")}</small>
          </Link>
        ))
      ) : (
        <p className="emptyNote">Nenhum aviso registrado.</p>
      )}
    </section>
  );
}

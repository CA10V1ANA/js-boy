import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { useAreaOperacional } from "../hooks/useAreaOperacional";
import { useAuth } from "../contexts/AuthContext";

type Aviso = {
  id: string;
  entregaId?: string;
  conversaId?: string;
  codigo?: string;
  evento: string;
  criadaEm: string;
  lidaEm?: string;
};
export function NotificacoesPage() {
  const operacional = useAreaOperacional();
  const { usuario } = useAuth();
  const base = operacional
    ? "/operacao-entregador/notificacoes"
    : "/notificacoes";
  const [items, setItems] = useState<Aviso[]>([]);
  const [error, setError] = useState("");
  const [naoLidas, setNaoLidas] = useState(false);
  const [pagina, setPagina] = useState(0);
  const load = useCallback(async () => {
    try {
      setItems(
        (await api.get<Aviso[]>(base, { params: { naoLidas, pagina } })).data,
      );
      setError("");
    } catch (r) {
      setError(apiErrorMessage(r, "Não foi possível carregar avisos."));
    }
  }, [base, naoLidas, pagina]);
  useEffect(() => {
    void load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30000);
    return () => clearInterval(t);
  }, [load]);
  return (
    <main className="page">
      <section className="panelCard notificationPanel">
        <h1>Notificações</h1>
        <div className="segmentedControl">
          <button
            aria-pressed={!naoLidas}
            onClick={() => {
              setNaoLidas(false);
              setPagina(0);
            }}
          >
            Todas
          </button>
          <button
            aria-pressed={naoLidas}
            onClick={() => {
              setNaoLidas(true);
              setPagina(0);
            }}
          >
            Não lidas
          </button>
        </div>
        {error ? (
          <p role="alert">
            {error}
            <button onClick={() => void load()}>Tentar novamente</button>
          </p>
        ) : null}
        {!items.length && !error ? <p>Nenhum aviso neste filtro.</p> : null}
        {items.map((n) => (
          <article className="notificationRow" key={n.id}>
            <div>
              <strong>{n.evento.replace(/_/g, " ")}</strong>
              <p>
                {n.codigo} ·{" "}
                {new Date(n.criadaEm).toLocaleString("pt-BR", {
                  timeZone: "America/Fortaleza",
                })}
              </p>
              <small>{n.lidaEm ? "Lida" : "Não lida"}</small>
            </div>
            <div className="quickLinks">
              {n.entregaId ? (
                <Link
                  className="secondaryButton"
                  to={
                    n.conversaId
                      ? `${operacional && usuario?.perfil === "PROPRIETARIO" ? "/operacional" : ""}/conversas?conversa=${n.conversaId}`
                      : operacional
                        ? `/minhas-entregas?entrega=${n.entregaId}`
                        : usuario?.perfil === "CLIENTE"
                          ? `/portal/entregas?entrega=${n.entregaId}`
                          : `/entregas?busca=${n.codigo}`
                  }
                >
                  Abrir
                </Link>
              ) : null}
              {!n.lidaEm ? (
                <button
                  className="smallButton"
                  onClick={async () => {
                    try {
                      await api.patch(`${base}/${n.id}/leitura`);
                      await load();
                    } catch (r) {
                      setError(
                        apiErrorMessage(
                          r,
                          "Não foi possível registrar leitura.",
                        ),
                      );
                    }
                  }}
                >
                  Marcar como lida
                </button>
              ) : null}
            </div>
          </article>
        ))}
        <div className="quickLinks">
          <button
            className="secondaryButton"
            disabled={pagina === 0}
            onClick={() => setPagina(pagina - 1)}
          >
            Anterior
          </button>
          <button
            className="secondaryButton"
            disabled={items.length < 30}
            onClick={() => setPagina(pagina + 1)}
          >
            Próxima
          </button>
        </div>
      </section>
    </main>
  );
}

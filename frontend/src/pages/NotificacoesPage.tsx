import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, Check, CheckCheck, CircleAlert, Inbox, MessageCircle, PackageCheck } from "lucide-react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { useAreaOperacional } from "../hooks/useAreaOperacional";
import { useAuth } from "../contexts/AuthContext";
import { titleCase } from "../utils/display";

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
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [feedback, setFeedback] = useState("");
  const load = useCallback(async () => {
    try {
      const [listagem, contagem] = await Promise.all([
        api.get<Aviso[]>(base, { params: { naoLidas, pagina } }),
        api.get<{ total: number }>(`${base}/nao-lidas`),
      ]);
      setItems(listagem.data);
      setTotalNaoLidas(contagem.data.total);
      setError("");
    } catch (r) {
      setError(apiErrorMessage(r, "Não foi possível carregar avisos."));
    }
  }, [base, naoLidas, pagina]);

  const marcarTodasComoLidas = async () => {
    if (marcandoTodas || totalNaoLidas === 0) return;
    setMarcandoTodas(true);
    setFeedback("");
    try {
      await api.patch(`${base}/leitura`);
      setTotalNaoLidas(0);
      setFeedback("Todas as notificações foram marcadas como lidas.");
      await load();
    } catch (r) {
      setError(apiErrorMessage(r, "Não foi possível marcar todas como lidas."));
    } finally {
      setMarcandoTodas(false);
    }
  };
  useEffect(() => {
    void load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30000);
    return () => clearInterval(t);
  }, [load]);
  return (
    <main className="page notificationPage">
      <section className="panelCard notificationPanel">
        <header className="notificationHeader">
          <div className="notificationTitle">
            <span className="notificationTitleIcon"><Bell size={20} /></span>
            <div>
              <span className="notificationEyebrow">CENTRAL DE AVISOS</span>
              <h1>Notificações</h1>
              <p>Acompanhe atualizações importantes das suas entregas e conversas.</p>
            </div>
          </div>
          <button
            className="notificationReadAll"
            disabled={marcandoTodas || totalNaoLidas === 0}
            onClick={() => void marcarTodasComoLidas()}
          >
            <CheckCheck size={17} />
            {marcandoTodas ? "Marcando..." : "Marcar todas como lidas"}
          </button>
        </header>
        <div className="notificationSummary" aria-live="polite">
          <div><strong>{totalNaoLidas}</strong><span>{totalNaoLidas === 1 ? "aviso não lido" : "avisos não lidos"}</span></div>
          <span>{items.length ? `${items.length} ${items.length === 1 ? "aviso" : "avisos"} nesta página` : "Sua caixa está em dia"}</span>
        </div>
        {feedback ? <p className="notificationFeedback" role="status"><Check size={16} /> {feedback}</p> : null}
        <div className="notificationToolbar">
          <span className="notificationFilterLabel">Exibir</span>
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
        </div>
        {error ? (
          <p className="notificationFeedback error" role="alert">
            <CircleAlert size={16} />
            {error}
            <button className="linkButton" onClick={() => void load()}>Tentar novamente</button>
          </p>
        ) : null}
        {!items.length && !error ? (
          <div className="notificationEmpty">
            <span><Inbox size={24} /></span>
            <strong>{naoLidas ? "Tudo em dia" : "Nenhuma notificação ainda"}</strong>
            <p>{naoLidas ? "Não há avisos pendentes para conferir." : "Quando houver uma atualização, ela aparecerá aqui."}</p>
          </div>
        ) : null}
        {items.map((n) => (
          <article className={`notificationRow ${n.lidaEm ? "isRead" : "isUnread"}`} key={n.id}>
            <span className={`notificationEventIcon ${n.conversaId ? "conversation" : "delivery"}`} aria-hidden="true">
              {n.conversaId ? <MessageCircle size={18} /> : <PackageCheck size={18} />}
            </span>
            <div className="notificationContent">
              <div className="notificationEventLine"><strong>{titleCase(n.evento.replace(/_/g, " "))}</strong>{!n.lidaEm ? <span>Nova</span> : null}</div>
              <p>
                {n.codigo} ·{" "}
                {new Date(n.criadaEm).toLocaleString("pt-BR", {
                  timeZone: "America/Fortaleza",
                })}
              </p>
              <small><span className={`notificationStatusDot ${n.lidaEm ? "read" : "unread"}`} />{n.lidaEm ? "Lida" : "Não lida"}</small>
            </div>
            <div className="notificationActions">
              {n.entregaId ? (
                <Link
                  className="notificationOpenButton"
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
                  Abrir aviso <ArrowRight size={15} />
                </Link>
              ) : null}
              {!n.lidaEm ? (
                <button
                  className="smallButton"
                  onClick={async () => {
                    try {
                      await api.patch(`${base}/${n.id}/leitura`);
                      setTotalNaoLidas((total) => Math.max(0, total - 1));
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
                  <Check size={14} /> Marcar como lida
                </button>
              ) : null}
            </div>
          </article>
        ))}
        <div className="notificationPagination">
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

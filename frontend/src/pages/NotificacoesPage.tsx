import { domainLabel } from '../i18n/domain';
import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
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
  useLocale();
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
      setError(apiErrorMessage(r, message("notificacoes.nao.foi.possivel.carregar.avisos")));
    }
  }, [base, naoLidas, pagina]);

  const marcarTodasComoLidas = async () => {
    if (marcandoTodas || totalNaoLidas === 0) return;
    setMarcandoTodas(true);
    setFeedback("");
    try {
      await api.patch(`${base}/leitura`);
      setTotalNaoLidas(0);
      setFeedback(message("notificacoes.todas.as.notificacoes.foram.marcadas.como.lidas"));
      await load();
    } catch (r) {
      setError(apiErrorMessage(r, message("notificacoes.nao.foi.possivel.marcar.todas.como.lidas")));
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
              <span className="notificationEyebrow">{message("notificacoes.central.de.avisos")}</span>
              <h1>{message("notificacoes.notificacoes")}</h1>
              <p>{message("notificacoes.acompanhe.atualizacoes.importantes.das.suas.entregas.e.conversas")}</p>
            </div>
          </div>
          <button
            className="notificationReadAll"
            disabled={marcandoTodas || totalNaoLidas === 0}
            onClick={() => void marcarTodasComoLidas()}
          >
            <CheckCheck size={17} />
            {marcandoTodas ? message("comum.marcando") : message("notificacoes.marcar.todas.como.lidas")}
          </button>
        </header>
        <div className="notificationSummary" aria-live="polite">
          <div><strong>{totalNaoLidas}</strong><span>{totalNaoLidas === 1 ? message("notificacoes.aviso.nao.lido") : message("notificacoes.avisos.nao.lidos")}</span></div>
          <span>{items.length ? message("notificacoes.value.value.nesta.pagina", { value1: items.length, value2: message(items.length === 1 ? 'comum.notice' : 'comum.notices') }) : message("notificacoes.sua.caixa.esta.em.dia")}</span>
        </div>
        {feedback ? <p className="notificationFeedback" role="status"><Check size={16} /> {feedback}</p> : null}
        <div className="notificationToolbar">
          <span className="notificationFilterLabel">{message("notificacoes.exibir")}</span>
          <div className="segmentedControl">
          <button
            aria-pressed={!naoLidas}
            onClick={() => {
              setNaoLidas(false);
              setPagina(0);
            }}
          >
            {message("notificacoes.todas")} </button>
          <button
            aria-pressed={naoLidas}
            onClick={() => {
              setNaoLidas(true);
              setPagina(0);
            }}
          >
            {message("notificacoes.nao.lidas")} </button>
          </div>
        </div>
        {error ? (
          <p className="notificationFeedback error" role="alert">
            <CircleAlert size={16} />
            {error}
            <button className="linkButton" onClick={() => void load()}>{message("notificacoes.tentar.novamente")}</button>
          </p>
        ) : null}
        {!items.length && !error ? (
          <div className="notificationEmpty">
            <span><Inbox size={24} /></span>
            <strong>{naoLidas ? message("notificacoes.tudo.em.dia") : message("notificacoes.nenhuma.notificacao.ainda")}</strong>
            <p>{naoLidas ? message("notificacoes.nao.ha.avisos.pendentes.para.conferir") : message("notificacoes.quando.houver.uma.atualizacao.ela.aparecera.aqui")}</p>
          </div>
        ) : null}
        {items.map((n) => (
          <article className={`notificationRow ${n.lidaEm ? "isRead" : "isUnread"}`} key={n.id}>
            <span className={`notificationEventIcon ${n.conversaId ? "conversation" : "delivery"}`} aria-hidden="true">
              {n.conversaId ? <MessageCircle size={18} /> : <PackageCheck size={18} />}
            </span>
            <div className="notificationContent">
              <div className="notificationEventLine"><strong>{domainLabel(n.evento)}</strong>{!n.lidaEm ? <span>{message("notificacoes.nova")}</span> : null}</div>
              <p>
                {n.codigo} ·{" "}
                {new Date(n.criadaEm).toLocaleString(getLocale(), {
                  timeZone: "America/Fortaleza",
                })}
              </p>
              <small><span className={`notificationStatusDot ${n.lidaEm ? "read" : "unread"}`} />{n.lidaEm ? message("notificacoes.lida") : message("notificacoes.nao.lida")}</small>
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
                  {message("notificacoes.abrir.aviso")} <ArrowRight size={15} />
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
                          message("notificacoes.nao.foi.possivel.registrar.leitura"),
                        ),
                      );
                    }
                  }}
                >
                  <Check size={14} /> {message("notificacoes.marcar.como.lida")} </button>
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
            {message("notificacoes.anterior")} </button>
          <button
            className="secondaryButton"
            disabled={items.length < 30}
            onClick={() => setPagina(pagina + 1)}
          >
            {message("notificacoes.proxima")} </button>
        </div>
      </section>
    </main>
  );
}

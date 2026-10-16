import { domainLabel } from '../i18n/domain';
import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Inbox, MessageCircle, Search, Send } from "lucide-react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { useAuth } from "../contexts/AuthContext";
import { useAreaOperacional } from "../hooks/useAreaOperacional";
import { Modal } from "../components/Modal";
import { titleCase } from "../utils/display";

type Resumo = {
  id: string;
  entregaId: string;
  codigo: string;
  clienteNome: string;
  status: string;
  ultimaSequencia: number;
  naoLida: boolean;
  ultimaMensagem?: string;
  atualizadaEm: string;
};
type Detalhe = {
  id: string;
  entregaId: string;
  codigo: string;
  status: string;
  ultimaSequencia: number;
  podeEnviar: boolean;
  encerraEm?: string;
  participantes: string[];
};
type Mensagem = {
  id: string;
  sequencia: number;
  autorNome?: string;
  autorId?: string;
  contexto: string;
  tipo: string;
  conteudo: string;
  criadaEm: string;
  envioId?: string;
};
const hora = (v: string) =>
  new Date(v).toLocaleString(getLocale(), {
    timeZone: "America/Fortaleza",
    dateStyle: "short",
    timeStyle: "short",
  });
const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("") || "JS";
export function ConversasPage() {
  useLocale();
  const { usuario } = useAuth();
  const operacional = useAreaOperacional();
  const base = operacional ? "/operacao-entregador/conversas" : "/conversas";
  const [params, setParams] = useSearchParams();
  const [lista, setLista] = useState<Resumo[]>([]);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [novas, setNovas] = useState(false);
  const [reabrir, setReabrir] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [ate, setAte] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const cursor = useRef(0);
  const lida = useRef(0);
  const selecionada = params.get("conversa");
  const selecionadaAtual = useRef(selecionada);
  selecionadaAtual.current = selecionada;
  const entrega = params.get("entrega");
  const busca = params.get("busca") || "";
  const pagina = Number(params.get("pagina") || 0);
  const naoLidas = params.get("naoLidas") === "true";
  function filtro(chave: string, valor: string) {
    const p = new URLSearchParams(params);
    p.set(chave, valor);
    if (chave !== "pagina") p.set("pagina", "0");
    setParams(p, { replace: true });
  }
  const listaRequest = useRef(0);
  const carregarLista = useCallback(async () => {
    const requestId = ++listaRequest.current;
    const r = await api.get<Resumo[]>(base, {
      params: { busca, naoLidas, pagina },
    });
    if (requestId === listaRequest.current) setLista(r.data);
  }, [base, busca, naoLidas, pagina]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    carregarLista()
      .catch((r) => {
        if (active)
          setError(apiErrorMessage(r, message("conversas.nao.foi.possivel.carregar.conversas")));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [carregarLista]);
  useEffect(() => {
    if (!entrega) return;
    let active = true;
    api
      .post<Detalhe>(`${base}/entregas/${entrega}`)
      .then((r) => {
        if (active) setParams({ conversa: r.data.id }, { replace: true });
      })
      .catch((r) => {
        if (active)
          setError(
            apiErrorMessage(r, message("conversas.conversa.indisponivel.para.esta.entrega")),
          );
      });
    return () => {
      active = false;
    };
  }, [entrega, base, setParams]);
  useEffect(() => {
    let active = true;
    setDetalhe(null);
    setMensagens([]);
    cursor.current = 0;
    lida.current = 0;
    setError("");
    setNovas(false);
    if (!selecionada) return;
    const key = `chat:${usuario?.id}:${selecionada}`;
    const pendente = sessionStorage.getItem(key);
    if (pendente) {
      try {
        setDraft(JSON.parse(pendente).conteudo);
      } catch {
        sessionStorage.removeItem(key);
      }
    } else setDraft("");
    let emConsulta = false;
    async function recuperar(inicial: boolean) {
      if (emConsulta || !active) return;
      emConsulta = true;
      try {
        const d = await api.get<Detalhe>(`${base}/${selecionada}`);
        const r = await api.get<Mensagem[]>(
          `${base}/${selecionada}/mensagens`,
          { params: inicial ? {} : { apos: cursor.current } },
        );
        if (!active) return;
        setDetalhe(d.data);
        const baixo =
          !viewport.current ||
          viewport.current.scrollHeight -
            viewport.current.scrollTop -
            viewport.current.clientHeight <
            70;
        setMensagens((old) =>
          [...new Map([...old, ...r.data].map((m) => [m.id, m])).values()].sort(
            (a, b) => a.sequencia - b.sequencia,
          ),
        );
        if (r.data.length)
          cursor.current = Math.max(
            cursor.current,
            ...r.data.map((m) => m.sequencia),
          );
        if (inicial || baixo) {
          requestAnimationFrame(() => {
            if (viewport.current)
              viewport.current.scrollTop = viewport.current.scrollHeight;
          });
          if (cursor.current > lida.current) {
            const sequencia = cursor.current;
            await api.patch(`${base}/${selecionada}/leitura`, { sequencia });
            lida.current = Math.max(lida.current, sequencia);
          }
        } else if (r.data.length) setNovas(true);
        setError("");
      } catch (r) {
        if (active) {
          setError(
            apiErrorMessage(
              r,
              message("conversas.conexao.interrompida.a.recuperacao.sera.tentada.novamente"),
            ),
          );
          const status = (r as { response?: { status?: number } }).response
            ?.status;
          if (status === 401 || status === 403 || status === 404) {
            setDetalhe(null);
            setMensagens([]);
          }
        }
      } finally {
        emConsulta = false;
      }
    }
    void recuperar(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void recuperar(false);
        void carregarLista().catch(() => undefined);
      }
    }, 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selecionada, base, usuario?.id, carregarLista]);
  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (!detalhe || !draft.trim() || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    const key = `chat:${usuario?.id}:${detalhe.id}`;
    try {
      const salvo = sessionStorage.getItem(key);
      const payload = salvo
        ? (JSON.parse(salvo) as { envioId: string; conteudo: string })
        : { envioId: crypto.randomUUID(), conteudo: draft.trim() };
      if (payload.conteudo !== draft.trim()) {
        setDraft(payload.conteudo);
        throw new Error(
          message("conversas.repita.o.envio.pendente.antes.de.escrever.outra.mensagem"),
        );
      }
      sessionStorage.setItem(key, JSON.stringify(payload));
      const r = await api.post<Mensagem>(
        `${base}/${detalhe.id}/mensagens`,
        payload,
      );
      sessionStorage.removeItem(key);
      if (selecionadaAtual.current !== detalhe.id) {
        await carregarLista();
        return;
      }
      setDraft("");
      setMensagens((old) =>
        [...new Map([...old, r.data].map((m) => [m.id, m])).values()].sort(
          (a, b) => a.sequencia - b.sequencia,
        ),
      );
      // Keep the confirmed polling cursor: other messages may precede this response.
      await carregarLista();
    } catch (r) {
      setError(
        apiErrorMessage(
          r,
          message("conversas.mensagem.ainda.nao.confirmada.tente.novamente.com.o.mesmo.texto"),
        ),
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  async function antigas() {
    if (!detalhe || busy || !mensagens.length) return;
    setBusy(true);
    try {
      const r = await api.get<Mensagem[]>(`${base}/${detalhe.id}/mensagens`, {
        params: { antes: mensagens[0].sequencia },
      });
      setMensagens((old) => [...r.data, ...old]);
    } catch (r) {
      setError(apiErrorMessage(r, message("conversas.nao.foi.possivel.recuperar.o.historico")));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main
      className={`page conversationsPage ${selecionada ? "hasSelection" : ""}`}
    >
      <aside className="panelCard conversationInbox">
        <header className="conversationInboxHeader">
          <span className="conversationInboxIcon" aria-hidden="true"><Inbox size={19} /></span>
          <div>
            <span className="conversationEyebrow">{message("conversas.atendimento")}</span>
            <h1>{message("conversas.caixa.de.entrada")}</h1>
            <p>{message("conversas.converse.sobre.suas.entregas")}</p>
          </div>
        </header>
        <label className="conversationSearch">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label={message("conversas.buscar.conversa")}
            placeholder={message("conversas.buscar.por.cliente.ou.entrega")}
            value={busca}
            onChange={(e) => filtro("busca", e.target.value)}
          />
        </label>
        <div className="segmentedControl conversationFilters">
          <button
            aria-pressed={!naoLidas}
            onClick={() => filtro("naoLidas", "false")}
          >
            {message("conversas.todas")} </button>
          <button
            aria-pressed={naoLidas}
            onClick={() => filtro("naoLidas", "true")}
          >
            {message("conversas.nao.lidas")} </button>
        </div>
        {loading ? (
          <p role="status">{message("conversas.carregando.conversas")}</p>
        ) : !lista.length ? (
          <div className="conversationListEmpty">
            <MessageCircle size={20} />
            <p>{message("conversas.abra.conversar.no.detalhe.de.uma.entrega.para.comecar")}</p>
          </div>
        ) : null}
        {lista.map((c) => (
          <button
            className={`conversationItem ${selecionada === c.id ? "selected" : ""} ${c.naoLida ? "hasUnread" : ""}`}
            key={c.id}
            onClick={() => setParams({ conversa: c.id })}
          >
            <span className="conversationAvatar" aria-hidden="true">{iniciais(c.clienteNome)}</span>
            <span className="conversationItemBody">
              <span className="conversationItemTop">
                <strong>{c.clienteNome}</strong>
                {c.naoLida ? <span className="conversationUnread">{message("conversas.nova")}</span> : null}
              </span>
              <small className="conversationCode">{c.codigo}</small>
              <span className="conversationPreview">{c.ultimaMensagem || message("conversas.nenhuma.mensagem")}</span>
              <span className="conversationMeta">
                <span>{domainLabel(c.status)}</span>
                <span>{hora(c.atualizadaEm)}</span>
              </span>
            </span>
          </button>
        ))}
        <div className="quickLinks">
          <button
            className="secondaryButton"
            disabled={pagina === 0}
            onClick={() => filtro("pagina", String(Math.max(0, pagina - 1)))}
          >
            {message("conversas.anterior")} </button>
          <button
            className="secondaryButton"
            disabled={lista.length < 30}
            onClick={() => filtro("pagina", String(pagina + 1))}
          >
            {message("conversas.proxima")} </button>
        </div>
      </aside>
      <section className="panelCard conversationThread">
        <button
          className="secondaryButton mobileBack"
          onClick={() => setParams({})}
        >
          <ArrowLeft size={16} /> {message("conversas.voltar")} </button>
        {error ? (
          <p className="errorMessage" role="alert">
            {error}
            <button
              type="button"
              className="smallButton"
              onClick={() =>
                void carregarLista().catch((r) =>
                  setError(apiErrorMessage(r, message("conversas.conexao.indisponivel"))),
                )
              }
            >
              {message("conversas.tentar.novamente")} </button>
          </p>
        ) : null}
        {detalhe ? (
          <>
            <header className="conversationHeader">
              <div>
                <h2>{detalhe.codigo}</h2>
                <span className="statusBadge progress">
                  {domainLabel(detalhe.status)}
                </span>
              </div>
              <Link
                className="secondaryButton"
                to={
                  operacional
                    ? `/minhas-entregas?entrega=${detalhe.entregaId}`
                    : usuario?.perfil === "CLIENTE"
                      ? `/portal/entregas?entrega=${detalhe.entregaId}`
                      : `/entregas?busca=${detalhe.codigo}`
                }
              >
                {message("conversas.ver.entrega")} </Link>
            </header>
            <p className="conversationParticipants">
              {message("conversas.conversa.compartilhada")} {detalhe.participantes.join(" · ")}
            </p>
            <div
              className="messageViewport"
              ref={viewport}
              onScroll={() => {
                const v = viewport.current;
                if (v && v.scrollHeight - v.scrollTop - v.clientHeight < 70) {
                  setNovas(false);
                  if (cursor.current <= lida.current) return;
                  lida.current = cursor.current;
                  void api
                    .patch(`${base}/${detalhe.id}/leitura`, {
                      sequencia: cursor.current,
                    })
                    .catch((r) => {
                      lida.current = 0;
                      setError(
                        apiErrorMessage(
                          r,
                          message("conversas.nao.foi.possivel.registrar.leitura"),
                        ),
                      );
                    });
                }
              }}
            >
              {mensagens[0]?.sequencia > 1 ? (
                <button
                  className="smallButton"
                  disabled={busy}
                  onClick={() => void antigas()}
                >
                  {message("conversas.carregar.mensagens.anteriores")} </button>
              ) : null}
              {!mensagens.length ? (
                <p>{message("conversas.nenhuma.mensagem.nesta.entrega")}</p>
              ) : null}
              {mensagens.map((m) => (
                <article
                  key={m.id}
                  className={`chatMessage ${m.tipo === "SISTEMA" ? "system" : m.autorId === usuario?.id ? "own" : ""}`}
                >
                  <small>
                    {m.tipo === "SISTEMA"
                      ? message("conversas.evento.da.entrega")
                      : `${m.autorNome} (${m.contexto.toLowerCase()})`}
                  </small>
                  <p>{m.conteudo}</p>
                  <time dateTime={m.criadaEm}>
                    {hora(m.criadaEm)}
                    {m.autorId === usuario?.id ? (" " + message("conversas.enviada")) : ""}
                  </time>
                </article>
              ))}
            </div>
            {novas ? (
              <button
                className="secondaryButton"
                onClick={() => {
                  if (viewport.current)
                    viewport.current.scrollTop = viewport.current.scrollHeight;
                  setNovas(false);
                }}
              >
                {message("conversas.novas.mensagens")} </button>
            ) : null}
            {detalhe.podeEnviar ? (
              <form className="messageComposer" onSubmit={enviar}>
                <textarea
                  aria-label={message("conversas.mensagem")}
                  maxLength={2000}
                  rows={2}
                  value={draft}
                  disabled={busy}
                  placeholder={message("conversas.digite.uma.mensagem")}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  className="primaryButton"
                  disabled={busy || !draft.trim()}
                >
                  <Send size={18} />
                  {busy ? message("comum.enviando") : message("conversas.enviar")}
                </button>
              </form>
            ) : (
              <p role="status">
                {message("conversas.somente.leitura.o.prazo.de.envio.desta.conversa.foi.encerrado")} </p>
            )}
            {usuario?.perfil === "PROPRIETARIO" &&
            !operacional &&
            !detalhe.podeEnviar ? (
              <button
                className="secondaryButton"
                onClick={() => setReabrir(true)}
              >
                {message("conversas.reabrir.conversa")} </button>
            ) : null}
            <p className="chatNotice">
              {message("conversas.pagamentos.e.status.sao.confirmados.pelos.controles.da.entrega.respo")} </p>
          </>
        ) : (
          <div className="conversationEmpty">
            <MessageCircle size={40} />
            <h2>{message("conversas.conversas.sobre.suas.entregas")}</h2>
            <p>
              {message("conversas.selecione.uma.conversa.ou.use.o.atalho.conversar.no.detalhe.da.entre")} </p>
          </div>
        )}
      </section>
      <Modal
        open={reabrir}
        onClose={() => !busy && setReabrir(false)}
        title={message("conversas.reabrir.conversa")}
      >
        <form
          className="settingsForm"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!detalhe || busy) return;
            setBusy(true);
            try {
              await api.post(`${base}/${detalhe.id}/reabrir`, {
                motivo,
                ate: new Date(ate).toISOString(),
              });
              setDetalhe(
                (await api.get<Detalhe>(`${base}/${detalhe.id}`)).data,
              );
              setReabrir(false);
            } catch (r) {
              setError(apiErrorMessage(r, message("conversas.nao.foi.possivel.reabrir")));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {message("conversas.motivo")} <input
              required
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
          <label>
            {message("conversas.prazo.de.envio")} <input
              required
              type="datetime-local"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
            />
          </label>
          <button className="primaryButton" disabled={busy}>
            {message("conversas.reabrir.com.auditoria")} </button>
        </form>
      </Modal>
    </main>
  );
}

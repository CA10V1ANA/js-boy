import { domainLabel } from '../i18n/domain';
import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import {
  AcompanhamentoResumo,
  PortalMetric,
  PortalStatus,
  operationalDay,
} from "../components/PortalOverview";
import { ContaClienteEdicao } from "../components/ContaClienteEdicao";
import { AvisosResumo } from "../components/AvisosResumo";
import { EnderecosResumo } from "../components/EnderecosResumo";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { SegurancaConta } from "../components/SegurancaConta";
import { Endereco } from "./EnderecosPage";
import {
  CheckCircle2,
  ChevronRight,
  DollarSign,
  FileText,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  FileCheck2,
  Headphones,
  Mail,
  MapPin,
  Package,
  Phone,
  Route,
  User,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  FeedbackMessage,
  LoadingState,
} from "../components/AsyncState";
import { Modal } from "../components/Modal";
import { OperacaoEntrega } from "../components/OperacaoEntrega";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import {
  Cliente,
  ConfiguracaoEmpresa,
  EntregaCliente,
  Pagamento,
  StatusEntrega,
} from "../types";
import type { Comprovante, Parada, SolicitacaoEntrega } from "../types/p2";
import { titleCase } from "../utils/display";
import { formatPhone } from "../utils/inputMasks";

type PortalData = {
  cliente: Cliente;
  entregas: EntregaCliente[];
  pagamentos: Pagamento[];
  contato: ConfiguracaoEmpresa;
};
type Detail = { paradas: Parada[]; comprovantes: Comprovante[] };
type Tab = "RESUMO" | "ENTREGAS" | "CONTA";
const emptyRequest: SolicitacaoEntrega = {
  enderecoOrigem: "",
  bairroOrigem: "",
  enderecoDestino: "",
  bairroDestino: "",
  destinatarioNome: "",
  destinatarioTelefone: "",
  descricaoMercadoria: "",
  observacoes: "",
  distanciaKm: 0,
  formaPagamento: "DINHEIRO",
};
const finalStatuses: StatusEntrega[] = [
  "ENTREGUE",
  "DEVOLVIDA",
  "FALHA_OPERACIONAL",
  "CANCELADA",
];
const money = (value: number) =>
  new Intl.NumberFormat(getLocale(), { style: "currency", currency: "BRL" }).format(
    value || 0,
  );
const date = (value: string) =>
  new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const statusLabel = domainLabel;
function statusClass(status: StatusEntrega) {
  if (status === "ENTREGUE") return "statusBadge active";
  if (status === "CANCELADA" || status === "FALHA_OPERACIONAL")
    return "statusBadge danger";
  if (["COLETADA", "EM_ROTA", "EM_DEVOLUCAO"].includes(status))
    return "statusBadge progress";
  return "statusBadge pending";
}

function localDatetime(v?: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function ClientePortalPage() {
  useLocale();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tab: Tab = location.pathname.includes("/entregas")
    ? "ENTREGAS"
    : location.pathname.includes("/conta")
      ? "CONTA"
      : "RESUMO";
  const setTab = (t: Tab) =>
    navigate(
      t === "ENTREGAS"
        ? "/portal/entregas"
        : t === "CONTA"
          ? "/portal/conta"
          : "/portal",
    );
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [busca, setBusca] = useState("");
  const [editing, setEditing] = useState<{ id: string; versao: number } | null>(
    null,
  );
  const [cancelamento, setCancelamento] = useState<{
    id: string;
    versao: number;
  } | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestStep, setRequestStep] = useState(1);
  const [request, setRequest] = useState(emptyRequest);
  const [sending, setSending] = useState(false);
  const [detail, setDetail] = useState<Record<string, Detail>>({});
  const [detailLoading, setDetailLoading] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cliente, entregas, pagamentos, contato] = await Promise.all([
        api.get<Cliente>("/cliente/me"),
        api.get<EntregaCliente[]>("/cliente/entregas"),
        api.get<Pagamento[]>("/cliente/pagamentos"),
        api.get<ConfiguracaoEmpresa>("/cliente/contato"),
      ]);
      setData({
        cliente: cliente.data,
        entregas: entregas.data,
        pagamentos: pagamentos.data,
        contato: contato.data,
      });
    } catch (reason) {
      setError(
        apiErrorMessage(reason, message("portal.cliente.nao.foi.possivel.carregar.seu.portal")),
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setFeedback("");
    try {
      const payload = {
        ...request,
        distanciaKm: Number(request.distanciaKm),
        fusoHorario: request.agendadaInicio
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : undefined,
        agendadaInicio: request.agendadaInicio
          ? new Date(request.agendadaInicio).toISOString()
          : undefined,
        agendadaFim: request.agendadaFim
          ? new Date(request.agendadaFim).toISOString()
          : undefined,
      };
      if (editing)
        await api.put("/cliente/entregas/" + editing.id, payload, {
          headers: { "If-Match": String(editing.versao) },
        });
      else await api.post("/cliente/entregas", payload);
      setEditing(null);
      setRequest(emptyRequest);
      setRequestOpen(false);
      setRequestStep(1);
      setFeedback(
        message("portal.cliente.solicitacao.recebida.a.js.boy.fara.a.analise.antes.de.confirmar.a.en"),
      );
      await load();
    } catch (reason) {
      setFeedback(
        apiErrorMessage(reason, message("portal.cliente.nao.foi.possivel.enviar.a.solicitacao")),
      );
    } finally {
      setSending(false);
    }
  }

  function openRequest() {
    setEditing(null);
    setRequest(emptyRequest);
    setRequestStep(1);
    setFeedback("");
    setRequestOpen(true);
  }

  useEffect(() => {
    if (!requestOpen) return;
    let active = true;
    api
      .get<Endereco[]>("/cliente/enderecos")
      .then((r) => {
        if (active) setEnderecos(r.data);
      })
      .catch((r) => {
        if (active)
          setFeedback(
            apiErrorMessage(
              r,
              message("portal.cliente.nao.foi.possivel.carregar.enderecos.frequentes"),
            ),
          );
      });
    return () => {
      active = false;
    };
  }, [requestOpen]);
  useEffect(() => {
    if (params.get("solicitar") !== "1") return;
    openRequest();
    const updated = new URLSearchParams(params);
    updated.delete("solicitar");
    navigate(
      { pathname: location.pathname, search: updated.toString() },
      { replace: true },
    );
  }, [params, navigate, location.pathname]);

  function repetirPedido(delivery: EntregaCliente) {
    setEditing(null);
    setRequest({
      ...emptyRequest,
      enderecoOrigem: delivery.enderecoOrigem,
      bairroOrigem: delivery.bairroOrigem,
      enderecoDestino: delivery.enderecoDestino,
      bairroDestino: delivery.bairroDestino,
      destinatarioNome: delivery.destinatarioNome,
      descricaoMercadoria: delivery.descricaoMercadoria,
    });
    setRequestStep(1);
    setRequestOpen(true);
  }

  function advanceRequest() {
    if (
      requestStep === 1 &&
      (!request.enderecoOrigem.trim() ||
        !request.bairroOrigem.trim() ||
        !request.enderecoDestino.trim() ||
        !request.bairroDestino.trim())
    ) {
      setFeedback(
        message("portal.cliente.preencha.os.enderecos.e.bairros.da.rota.antes.de.continuar"),
      );
      return;
    }
    if (
      requestStep === 2 &&
      (!request.destinatarioNome.trim() ||
        request.destinatarioTelefone.replace(/\D/g, "").length < 10 ||
        !request.descricaoMercadoria.trim())
    ) {
      setFeedback(
        message("portal.cliente.preencha.o.destinatario.um.telefone.valido.e.a.mercadoria.antes.de.c"),
      );
      return;
    }
    setFeedback("");
    setRequestStep((step) => Math.min(3, step + 1));
  }
  async function editarPedido(id: string) {
    try {
      const r = await api.get<{
        solicitacao: SolicitacaoEntrega;
        versao: number;
      }>(`/cliente/entregas/${id}/edicao`);
      setEditing({ id, versao: r.data.versao });
      setRequest({
        ...r.data.solicitacao,
        observacoes: r.data.solicitacao.observacoes || "",
        agendadaInicio: localDatetime(r.data.solicitacao.agendadaInicio),
        agendadaFim: localDatetime(r.data.solicitacao.agendadaFim),
      });
      setRequestStep(1);
      setRequestOpen(true);
    } catch (e) {
      setFeedback(apiErrorMessage(e, message("portal.cliente.nao.foi.possivel.editar")));
    }
  }
  async function cancelarPedido(id: string) {
    try {
      const r = await api.get<{ versao: number }>(
        `/cliente/entregas/${id}/cancelamento`,
      );
      setCancelamento({ id, versao: r.data.versao });
      setMotivoCancelamento("");
    } catch (e) {
      setFeedback(
        apiErrorMessage(e, message("portal.cliente.nao.foi.possivel.consultar.a.solicitacao")),
      );
    }
  }
  async function loadDetail(deliveryId: string) {
    if (detailLoading) return;
    if (detail[deliveryId]) {
      setDetail((current) => {
        const copy = { ...current };
        delete copy[deliveryId];
        return copy;
      });
      return;
    }
    setDetailLoading(deliveryId);
    try {
      const [stops, proofs] = await Promise.all([
        api.get<Parada[]>(`/cliente/entregas/${deliveryId}/paradas`),
        api.get<Comprovante[]>(`/cliente/entregas/${deliveryId}/comprovantes`),
      ]);
      setDetail((current) => ({
        ...current,
        [deliveryId]: { paradas: stops.data, comprovantes: proofs.data },
      }));
    } catch (reason) {
      setFeedback(
        apiErrorMessage(reason, message("portal.cliente.nao.foi.possivel.carregar.os.detalhes")),
      );
    } finally {
      setDetailLoading("");
    }
  }

  useEffect(() => {
    const id = params.get("entrega");
    if (data && id && data.entregas.some((e) => e.id === id) && !detail[id])
      void loadDetail(id);
  }, [data, params.get("entrega")]);

  function openProof(deliveryId: string, proofId: string) {
    void api
      .get(`/comprovantes/${deliveryId}/${proofId}/arquivo`, {
        responseType: "blob",
      })
      .then((response) =>
        window.open(URL.createObjectURL(response.data), "_blank", "noopener"),
      );
  }

  const summary = useMemo(() => {
    const deliveries = data?.entregas || [];
    const payments = data?.pagamentos || [];
    const month = operationalDay(new Date()).slice(0, 7);
    const balances = deliveries
      .filter((e) => e.status !== "CANCELADA")
      .map((e) =>
        Math.max(
          0,
          e.valorFinal -
            payments
              .filter((p) => p.entregaId === e.id)
              .reduce(
                (sum, p) => sum + (p.tipo === "ESTORNO" ? -p.valor : p.valor),
                0,
              ),
        ),
      );
    return {
      active: deliveries.filter(
        (e) => !finalStatuses.includes(e.status) && e.status !== "SOLICITADA",
      ).length,
      route: deliveries.filter((e) => e.status === "SOLICITADA").length,
      delivered: deliveries.filter((e) => {
        const finished =
          e.concluidaEm ||
          [...e.historico].reverse().find((h) => h.novoStatus === "ENTREGUE")
            ?.alteradoEm;
        return (
          e.status === "ENTREGUE" &&
          !!finished &&
          operationalDay(finished).startsWith(month)
        );
      }).length,
      pending: balances.reduce((sum, saldo) => sum + saldo, 0),
      pendingCount: balances.filter((saldo) => saldo > 0).length,
    };
  }, [data]);

  if (loading)
    return (
      <main className="page">
        <LoadingState label={message("portal.cliente.montando.seu.portal")} />
      </main>
    );
  if (error || !data)
    return (
      <main className="page">
        <ErrorState
          message={error || message("portal.cliente.nao.foi.possivel.carregar.seu.portal")}
          onRetry={() => void load()}
        />
      </main>
    );
  const companyAddress = [
    data.contato.logradouro,
    data.contato.numero,
    data.contato.bairro,
    data.contato.cidade,
    data.contato.estado,
  ]
    .filter(Boolean)
    .join(", ");
  const entregaAcompanhada =
    data.entregas.find((e) => e.status === "EM_ROTA") ||
    data.entregas.find(
      (e) => !finalStatuses.includes(e.status) && e.status !== "SOLICITADA",
    ) ||
    data.entregas.find((e) => e.status === "SOLICITADA");

  const deliveryList = (deliveries: EntregaCliente[]) =>
    deliveries.length === 0 ? (
      <EmptyState
        title={message("portal.cliente.nenhuma.entrega.vinculada")}
        description={message("portal.cliente.suas.solicitacoes.e.entregas.aparecerao.aqui")}
      />
    ) : (
      <div className="roleDeliveryList clientDeliveryList">
        {deliveries.map((delivery) => (
          <article className="roleDeliveryCard" key={delivery.id}>
            <div className="roleDeliveryMain">
              <span className="publicRecordCode">{delivery.codigo}</span>
              <div>
                <strong>{titleCase(delivery.destinatarioNome)}</strong>
                <p>
                  <MapPin size={14} /> {titleCase(delivery.bairroOrigem)} {message("portal.cliente.para")}{" "}
                  {titleCase(delivery.bairroDestino)}
                </p>
              </div>
            </div>
            <div className="roleDeliveryMeta clientDeliveryMeta">
              <div>
                <span>{message("portal.cliente.criada.em")}</span>
                <strong>{date(delivery.criadoEm)}</strong>
              </div>
              <div>
                <span>{message("portal.cliente.mercadoria")}</span>
                <strong>{delivery.descricaoMercadoria}</strong>
              </div>
              <div>
                <span>{message("portal.cliente.valor")}</span>
                <strong>
                  {delivery.status === "SOLICITADA" && delivery.valorFinal === 0
                    ? message("portal.cliente.a.confirmar.pela.js.boy")
                    : money(delivery.valorFinal)}
                </strong>
              </div>
              <span className={statusClass(delivery.status)}>
                {statusLabel(delivery.status)}
              </span>
            </div>

            <div className="roleDeliveryActions">
              {delivery.status === "SOLICITADA" ? (
                <button
                  className="secondaryButton"
                  onClick={() => void editarPedido(delivery.id)}
                >
                  {message("portal.cliente.editar.solicitacao")} </button>
              ) : null}
              {[
                "SOLICITADA",
                "CONFIRMADA",
                "AGENDADA",
                "AGUARDANDO_ENTREGADOR",
                "ENTREGADOR_DESIGNADO",
              ].includes(delivery.status) ? (
                <button
                  className="secondaryButton"
                  onClick={() => void cancelarPedido(delivery.id)}
                >
                  {message("portal.cliente.cancelar.solicitacao")} </button>
              ) : null}
              <Link
                className="secondaryButton"
                to={`/conversas?entrega=${delivery.id}`}
              >
                {message("portal.cliente.conversar")} </Link>
              <button
                className="smallButton"
                onClick={() => {
                  setEditing(null);
                  setRequest({
                    ...emptyRequest,
                    enderecoOrigem: delivery.enderecoOrigem,
                    bairroOrigem: delivery.bairroOrigem,
                    enderecoDestino: delivery.enderecoDestino,
                    bairroDestino: delivery.bairroDestino,
                    destinatarioNome: delivery.destinatarioNome,
                    descricaoMercadoria: delivery.descricaoMercadoria,
                  });
                  setRequestStep(1);
                  setRequestOpen(true);
                }}
              >
                {message("portal.cliente.repetir.solicitacao")} </button>

              <button
                className="secondaryButton"
                type="button"
                disabled={detailLoading === delivery.id}
                onClick={() => void loadDetail(delivery.id)}
              >
                <Route size={16} />{" "}
                {detail[delivery.id]
                  ? message("portal.cliente.ocultar.detalhes")
                  : detailLoading === delivery.id
                    ? message("portal.cliente.carregando")
                    : message("portal.cliente.acompanhar.entrega")}
              </button>
            </div>
            {detail[delivery.id] ? (
              <>
                <OperacaoEntrega entregaId={delivery.id} />
                <div className="clientDeliveryDetail">
                  <div className="deliveryTimeline">
                    {delivery.historico.map((h, i) => (
                      <div key={i}>
                        <span className="done" />
                        <div>
                          <strong>{statusLabel(h.novoStatus)}</strong>
                          <small>{date(h.alteradoEm)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="proofLinks">
                    {detail[delivery.id].comprovantes.length
                      ? detail[delivery.id].comprovantes.map((proof) => (
                          <button
                            key={proof.id}
                            className="proofLink"
                            type="button"
                            onClick={() => openProof(delivery.id, proof.id)}
                          >
                            <FileCheck2 size={16} /> {message("portal.cliente.comprovante.de")}{" "}
                            {statusLabel(proof.tipo)}
                          </button>
                        ))
                      : null}
                  </div>
                </div>
              </>
            ) : null}
          </article>
        ))}
      </div>
    );

  return (
    <main className="page rolePortal clientPortalV2 portalOverview">
      {feedback ? (
        <FeedbackMessage
          tone={feedback.startsWith("Solicitação") ? "success" : "error"}
        >
          {feedback}
        </FeedbackMessage>
      ) : null}
      {tab === "RESUMO" ? (
        <>
          <AcompanhamentoResumo entrega={entregaAcompanhada} />
          <section
            className="portalMetrics"
            aria-label={message("portal.cliente.resumo.das.suas.entregas")}
          >
            <PortalMetric
              icon={Package}
              tone="amber"
              label={message("portal.cliente.em.andamento")}
              value={summary.active}
              hint={message("portal.cliente.em.rota.ou.em.coleta")}
            />
            <PortalMetric
              icon={FileText}
              tone="green"
              label={message("portal.cliente.aguardando.orcamento")}
              value={summary.route}
              hint={message("portal.cliente.aguardando.confirmacao")}
            />
            <PortalMetric
              icon={CheckCircle2}
              tone="blue"
              label={message("portal.cliente.concluidas.no.mes")}
              value={summary.delivered}
              hint={message("portal.cliente.entregas.finalizadas.neste.mes")}
            />
            <PortalMetric
              icon={DollarSign}
              tone="violet"
              label={message("portal.cliente.pagamentos.pendentes")}
              value={money(summary.pending)}
              hint={
                (message("portal.cliente.em") + " ") +
                summary.pendingCount +
                (summary.pendingCount === 1 ? " entrega" : " entregas")
              }
            />
          </section>
          <div className="portalOverviewColumns clientColumns">
            <div className="portalOverviewMain">
              <section className="portalPanel recentHistoryPanel">
                <div className="portalPanelHeading">
                  <h2>{message("portal.cliente.historico.recente")}</h2>
                  <Link className="portalTextLink" to="/portal/entregas">
                    {message("portal.cliente.ver.todas")} <ChevronRight size={18} />
                  </Link>
                </div>
                <div className="portalHistoryRows">
                  {data.entregas
                    .filter((e) => finalStatuses.includes(e.status))
                    .slice(0, 3)
                    .map((delivery) => (
                      <div className="portalHistoryRow" key={delivery.id}>
                        <span
                          className={
                            "historyCheck" +
                            (delivery.status !== "ENTREGUE" ? " other" : "")
                          }
                        >
                          <CheckCircle2 size={23} />
                        </span>
                        <Link
                          className="portalHistoryCode"
                          to={"/portal/entregas?entrega=" + delivery.id}
                        >
                          <strong>{delivery.codigo}</strong>
                          <small>
                            {date(delivery.concluidaEm || delivery.criadoEm)}
                          </small>
                        </Link>
                        <div className="portalHistoryRoute">
                          <span>
                            {delivery.bairroOrigem} → {delivery.bairroDestino}
                          </span>
                        </div>
                        <PortalStatus status={delivery.status} />
                        <button
                          className="portalOutlineButton"
                          type="button"
                          onClick={() => repetirPedido(delivery)}
                        >
                          <RotateCcw size={17} />
                          {message("portal.cliente.repetir.solicitacao")} </button>
                      </div>
                    ))}
                  {!data.entregas.some((e) =>
                    finalStatuses.includes(e.status),
                  ) ? (
                    <p className="portalEmpty">
                      {message("portal.cliente.seu.historico.aparecera.aqui.apos.a.conclusao.das.entregas")} </p>
                  ) : null}
                </div>
              </section>
            </div>
            <aside className="portalOverviewAside">
              <EnderecosResumo />
              <AvisosResumo />
            </aside>
          </div>
        </>
      ) : null}
      {tab === "ENTREGAS" ? (
        <section className="panelCard">
          <div className="panelCardHeader roleListHeader">
            <div>
              <h2>{message("portal.cliente.minhas.entregas")}</h2>
              <p>{message("portal.cliente.historico.rota.e.recebimentos.da.operacao")}</p>
            </div>
            <label>
              {message("portal.cliente.buscar.entrega")} <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={message("portal.cliente.identificador.destino.ou.status")}
              />
            </label>
          </div>
          <div className="deliveryFilters">
            <label>
              {message("portal.cliente.status")} <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
              >
                <option value="">{message("portal.cliente.todos")}</option>
                {[...new Set(data.entregas.map((e) => e.status))].map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {message("portal.cliente.de")} <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </label>
            <label>
              {message("portal.cliente.ate")} <input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </label>
          </div>
          {deliveryList(
            data.entregas.filter(
              (e) =>
                [e.codigo, e.destinatarioNome, e.enderecoDestino, e.status]
                  .join(" ")
                  .toLowerCase()
                  .includes(busca.toLowerCase()) &&
                (!statusFiltro || e.status === statusFiltro) &&
                (!inicio || e.criadoEm.slice(0, 10) >= inicio) &&
                (!fim || e.criadoEm.slice(0, 10) <= fim),
            ),
          )}
        </section>
      ) : null}
      {tab === "CONTA" ? (
        <div className="clientAccountGrid">
          <section className="panelCard portalAccount">
            <div className="panelCardHeader">
              <div>
                <span className="modalEyebrow">{message("portal.cliente.dados.do.cliente")}</span>
                <h2>{titleCase(data.cliente.nome)}</h2>
              </div>
              <Building2 size={23} />
            </div>
            <ContaClienteEdicao
              cliente={data.cliente}
              onChange={cliente => setData(current => current ? { ...current, cliente } : current)}
            />
            <SegurancaConta />
          </section>
          <section className="panelCard contactCard">
            <div className="panelCardHeader">
              <div>
                <span className="modalEyebrow">{message("portal.cliente.precisa.de.ajuda")}</span>
                <h2>{message("portal.cliente.contato.da.js.boy")}</h2>
              </div>
              <Headphones size={22} />
            </div>
            <ul className="portalContacts">
              {data.contato.telefone ? (
                <li>
                  <Phone size={17} />
                  <a href={`tel:${data.contato.telefone}`}>
                    {formatPhone(data.contato.telefone)}
                  </a>
                </li>
              ) : null}
              {data.contato.whatsapp ? (
                <li>
                  <Phone size={17} />
                  <a href={`https://wa.me/${data.contato.whatsapp}`}>
                    {message("portal.cliente.whatsapp")} </a>
                </li>
              ) : null}
              {data.contato.email ? (
                <li>
                  <Mail size={17} />
                  <a href={`mailto:${data.contato.email}`}>
                    {data.contato.email}
                  </a>
                </li>
              ) : null}
              {companyAddress ? (
                <li>
                  <MapPin size={17} />
                  {companyAddress}
                </li>
              ) : null}
            </ul>
          </section>
        </div>
      ) : null}

      <Modal
        open={!!cancelamento}
        onClose={() => !sending && setCancelamento(null)}
        title={message("portal.cliente.cancelar.solicitacao")}
      >
        <form
          className="settingsForm"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!cancelamento || sending) return;
            setSending(true);
            try {
              await api.post(
                "/cliente/entregas/" + cancelamento.id + "/cancelar",
                { motivo: motivoCancelamento },
                { headers: { "If-Match": String(cancelamento.versao) } },
              );
              setCancelamento(null);
              await load();
            } catch (r) {
              setFeedback(apiErrorMessage(r, message("portal.cliente.nao.foi.possivel.cancelar")));
            } finally {
              setSending(false);
            }
          }}
        >
          <p>
            {message("portal.cliente.o.cancelamento.depende.do.estado.atual.e.da.ausencia.de.recebimento")} </p>
          <label>
            {message("portal.cliente.motivo")} <input
              required
              maxLength={500}
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
            />
          </label>
          <button className="primaryButton" disabled={sending}>
            {message("portal.cliente.confirmar.cancelamento")} </button>
        </form>
      </Modal>
      <Modal
        open={requestOpen}
        onClose={() => !sending && setRequestOpen(false)}
        eyebrow={message("portal.cliente.value.etapa.value.3", { value1: editing ? "EDITAR SOLICITAÇÃO" : "SOLICITAR ENTREGA", value2: requestStep })}
        title={
          requestStep === 1
            ? message("portal.cliente.rota.da.entrega")
            : requestStep === 2
              ? message("portal.cliente.destinatario.e.mercadoria")
              : message("portal.cliente.agendamento.e.revisao")
        }
        maxWidth={760}
        footer={
          <>
            <button
              className="secondaryButton"
              type="button"
              style={requestStep === 1 ? { visibility: "hidden" } : undefined}
              onClick={() => setRequestStep((step) => Math.max(1, step - 1))}
            >
              <ArrowLeft size={16} /> {message("portal.cliente.voltar")} </button>
            <div className="modalFooterActions">
              <span>{message("portal.cliente.etapa")} {requestStep} {message("portal.cliente.de.3")}</span>
              {requestStep < 3 ? (
                <button
                  className="darkButton"
                  type="button"
                  onClick={advanceRequest}
                >
                  {message("portal.cliente.proximo")} <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="primaryButton"
                  form="client-request-form"
                  type="submit"
                  disabled={sending}
                >
                  <Check size={16} />{" "}
                  {sending ? message("comum.enviando") : message("portal.cliente.enviar.solicitacao")}
                </button>
              )}
            </div>
          </>
        }
      >
        {feedback && !feedback.startsWith("Solicitação") ? (
          <div className="portalInlineError" role="alert">
            {feedback}
          </div>
        ) : null}
        <div className="wizardStepper">
          <span className="wizardStepBar done" />
          <span className={`wizardStepBar ${requestStep >= 2 ? "done" : ""}`} />
          <span
            className={`wizardStepBar ${requestStep === 3 ? "done" : ""}`}
          />
        </div>
        <div className="quickLinks">
          <label>
            {message("portal.cliente.origem.frequente")} <select
              defaultValue=""
              onChange={(e) => {
                const a = enderecos.find((a) => a.id === e.target.value);
                if (a)
                  setRequest({
                    ...request,
                    enderecoOrigem: a.endereco,
                    bairroOrigem: a.bairro,
                  });
              }}
            >
              <option value="">{message("portal.cliente.selecionar")}</option>
              {enderecos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.apelido}
                </option>
              ))}
            </select>
          </label>
          <label>
            {message("portal.cliente.destino.frequente")} <select
              defaultValue=""
              onChange={(e) => {
                const a = enderecos.find((a) => a.id === e.target.value);
                if (a)
                  setRequest({
                    ...request,
                    enderecoDestino: a.endereco,
                    bairroDestino: a.bairro,
                    destinatarioNome: a.contatoNome || "",
                    destinatarioTelefone: a.contatoTelefone || "",
                    observacoes: a.referencia || "",
                  });
              }}
            >
              <option value="">{message("portal.cliente.selecionar")}</option>
              {enderecos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.apelido}
                </option>
              ))}
            </select>
          </label>
        </div>
        <form
          id="client-request-form"
          className="clientWizardForm"
          onSubmit={submit}
        >
          {requestStep === 1 ? (
            <div className="formGrid">
              <label>
                {message("portal.cliente.endereco.de.origem")} <input
                  required
                  value={request.enderecoOrigem}
                  onChange={(event) =>
                    setRequest({
                      ...request,
                      enderecoOrigem: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                {message("portal.cliente.bairro.da.origem")} <input
                  required
                  value={request.bairroOrigem}
                  onChange={(event) =>
                    setRequest({ ...request, bairroOrigem: event.target.value })
                  }
                />
              </label>
              <label>
                {message("portal.cliente.endereco.de.destino")} <input
                  required
                  value={request.enderecoDestino}
                  onChange={(event) =>
                    setRequest({
                      ...request,
                      enderecoDestino: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                {message("portal.cliente.bairro.do.destino")} <input
                  required
                  value={request.bairroDestino}
                  onChange={(event) =>
                    setRequest({
                      ...request,
                      bairroDestino: event.target.value,
                    })
                  }
                />
              </label>
              <label className="requestWide">
                {message("portal.cliente.distancia.estimada.km")} <input
                  required
                  min="0"
                  step="0.1"
                  type="number"
                  placeholder="0,0"
                  value={request.distanciaKm || ""}
                  onChange={(event) =>
                    setRequest({
                      ...request,
                      distanciaKm: Number(event.target.value),
                    })
                  }
                />
                <span className="formHelp">
                  {message("portal.cliente.a.js.boy.revisara.o.valor.antes.de.confirmar")} </span>
              </label>
            </div>
          ) : null}
          {requestStep === 2 ? (
            <div className="formGrid">
              <label>
                {message("portal.cliente.destinatario")} <input
                  required
                  value={request.destinatarioNome}
                  onChange={(event) =>
                    setRequest({
                      ...request,
                      destinatarioNome: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                {message("portal.cliente.telefone.autorizado")} <input
                  required
                  type="tel"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  value={request.destinatarioTelefone}
                  onChange={(event) =>
                    setRequest({
                      ...request,
                      destinatarioTelefone: formatPhone(event.target.value),
                    })
                  }
                />
              </label>
              <label className="requestWide">
                {message("portal.cliente.mercadoria")} <input
                  required
                  maxLength={255}
                  value={request.descricaoMercadoria}
                  onChange={(event) =>
                    setRequest({
                      ...request,
                      descricaoMercadoria: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          ) : null}
          {requestStep === 3 ? (
            <div className="formGrid">
              <label>
                {message("portal.cliente.forma.de.pagamento")} <select
                  value={request.formaPagamento || "DINHEIRO"}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      formaPagamento: e.target.value as "PIX" | "DINHEIRO",
                    })
                  }
                >
                  <option value="DINHEIRO">{message("portal.cliente.dinheiro")}</option>
                  <option value="PIX">{message("portal.cliente.pix.direto.do.entregador")}</option>
                </select>
              </label>
              <label>
                <CalendarClock size={15} /> {message("portal.cliente.inicio.agendado.opcional")} <input
                  type="datetime-local"
                  value={request.agendadaInicio || ""}
                  onChange={(event) =>
                    setRequest({
                      ...request,
                      agendadaInicio: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                <CalendarClock size={15} /> {message("portal.cliente.fim.agendado.opcional")} <input
                  type="datetime-local"
                  value={request.agendadaFim || ""}
                  onChange={(event) =>
                    setRequest({ ...request, agendadaFim: event.target.value })
                  }
                />
              </label>
              <label className="requestWide">
                {message("portal.cliente.observacoes")} <textarea
                  rows={4}
                  maxLength={500}
                  value={request.observacoes}
                  onChange={(event) =>
                    setRequest({ ...request, observacoes: event.target.value })
                  }
                />
              </label>
              <div className="requestReview requestWide">
                <strong>{message("portal.cliente.como.funciona")}</strong>
                <span>
                  {message("portal.cliente.a.solicitacao.entra.como.solicitada.a.js.boy.revisa.rota.disponibili")} </span>
              </div>
            </div>
          ) : null}
        </form>
      </Modal>
    </main>
  );
}

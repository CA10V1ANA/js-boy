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
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CreditCard,
  FileCheck2,
  Headphones,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Route,
  Truck,
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
import { formatCpfOrCnpj, formatPhone } from "../utils/inputMasks";

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
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const statusLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
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
        apiErrorMessage(reason, "Não foi possível carregar seu portal."),
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
        "Solicitação recebida. A JS Boy fará a análise antes de confirmar a entrega.",
      );
      await load();
    } catch (reason) {
      setFeedback(
        apiErrorMessage(reason, "Não foi possível enviar a solicitação."),
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
              "Não foi possível carregar endereços frequentes.",
            ),
          );
      });
    return () => {
      active = false;
    };
  }, [requestOpen]);
  function advanceRequest() {
    if (
      requestStep === 1 &&
      (!request.enderecoOrigem.trim() ||
        !request.bairroOrigem.trim() ||
        !request.enderecoDestino.trim() ||
        !request.bairroDestino.trim())
    ) {
      setFeedback(
        "Preencha os endereços e bairros da rota antes de continuar.",
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
        "Preencha o destinatário, um telefone válido e a mercadoria antes de continuar.",
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
      setFeedback(apiErrorMessage(e, "Não foi possível editar."));
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
        apiErrorMessage(e, "Não foi possível consultar a solicitação."),
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
        apiErrorMessage(reason, "Não foi possível carregar os detalhes."),
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
    return {
      total: deliveries.length,
      active: deliveries.filter((item) => !finalStatuses.includes(item.status))
        .length,
      route: deliveries.filter((item) => item.status === "SOLICITADA").length,
      delivered: deliveries.filter((item) => item.status === "ENTREGUE").length,
      pending: deliveries
        .filter((e) => e.status !== "CANCELADA")
        .reduce(
          (sum, e) =>
            sum +
            Math.max(
              0,
              e.valorFinal -
                payments
                  .filter((p) => p.entregaId === e.id)
                  .reduce(
                    (s, p) => s + (p.tipo === "ESTORNO" ? -p.valor : p.valor),
                    0,
                  ),
            ),
          0,
        ),
      paid: payments.reduce(
        (sum, item) =>
          sum + (item.tipo === "ESTORNO" ? -item.valor : item.valor),
        0,
      ),
    };
  }, [data]);

  if (loading)
    return (
      <main className="page">
        <LoadingState label="Montando seu portal..." />
      </main>
    );
  if (error || !data)
    return (
      <main className="page">
        <ErrorState
          message={error || "Não foi possível carregar seu portal."}
          onRetry={() => void load()}
        />
      </main>
    );
  const address = [
    data.cliente.logradouro || data.cliente.endereco,
    data.cliente.numero,
    data.cliente.bairro,
    data.cliente.cidade,
    data.cliente.estado,
  ]
    .filter(Boolean)
    .join(", ");
  const companyAddress = [
    data.contato.logradouro,
    data.contato.numero,
    data.contato.bairro,
    data.contato.cidade,
    data.contato.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const deliveryList = (deliveries: EntregaCliente[]) =>
    deliveries.length === 0 ? (
      <EmptyState
        title="Nenhuma entrega vinculada"
        description="Suas solicitações e entregas aparecerão aqui."
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
                  <MapPin size={14} /> {titleCase(delivery.bairroOrigem)} para{" "}
                  {titleCase(delivery.bairroDestino)}
                </p>
              </div>
            </div>
            <div className="roleDeliveryMeta clientDeliveryMeta">
              <div>
                <span>Criada em</span>
                <strong>{date(delivery.criadoEm)}</strong>
              </div>
              <div>
                <span>Mercadoria</span>
                <strong>{delivery.descricaoMercadoria}</strong>
              </div>
              <div>
                <span>Valor</span>
                <strong>
                  {delivery.status === "SOLICITADA" && delivery.valorFinal === 0
                    ? "A confirmar pela JS Boy"
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
                  Editar solicitação
                </button>
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
                  Cancelar solicitação
                </button>
              ) : null}
              <Link
                className="secondaryButton"
                to={`/conversas?entrega=${delivery.id}`}
              >
                Conversar
              </Link>
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
                Repetir solicitação
              </button>

              <button
                className="secondaryButton"
                type="button"
                disabled={detailLoading === delivery.id}
                onClick={() => void loadDetail(delivery.id)}
              >
                <Route size={16} />{" "}
                {detail[delivery.id]
                  ? "Ocultar detalhes"
                  : detailLoading === delivery.id
                    ? "Carregando..."
                    : "Acompanhar entrega"}
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
                            <FileCheck2 size={16} /> Comprovante de{" "}
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
    <main className="page rolePortal clientPortalV2">
      {feedback ? (
        <FeedbackMessage
          tone={feedback.startsWith("Solicitação") ? "success" : "error"}
        >
          {feedback}
        </FeedbackMessage>
      ) : null}
      {tab !== "CONTA" ? (
        <section className="roleHero clientRoleHero">
          <div>
            <h1>Olá, {titleCase(data.cliente.nome).split(" ")[0]}</h1>
            <p>Solicite e acompanhe a rota e o pagamento das suas entregas.</p>
          </div>
          <button className="primaryButton" type="button" onClick={openRequest}>
            <Plus size={17} /> Solicitar entrega
          </button>
        </section>
      ) : null}
      {tab === "RESUMO" ? (
        <>
          <section className="metricGrid roleMetricGrid">
            <article className="metricCard">
              <span className="metricIcon tone-yellow">
                <Package size={19} />
              </span>
              <span>Solicitações ativas</span>
              <strong>{String(summary.active).padStart(2, "0")}</strong>
              <div className="metricDelta">
                <span className="vs">em análise ou operação</span>
              </div>
            </article>
            <article className="metricCard">
              <span className="metricIcon tone-green">
                <Truck size={19} />
              </span>
              <span>Aguardando orçamento</span>
              <strong>{String(summary.route).padStart(2, "0")}</strong>
              <div className="metricDelta">
                <span className="vs">aguardando análise e confirmação</span>
              </div>
            </article>
            <article className="metricCard">
              <span className="metricIcon tone-navy">
                <Check size={19} />
              </span>
              <span>Entregues no histórico</span>
              <strong>{String(summary.delivered).padStart(2, "0")}</strong>
              <div className="metricDelta">
                <span className="vs">todo o período disponível</span>
              </div>
            </article>
            <article className="metricCard">
              <span className="metricIcon tone-blue">
                <CreditCard size={19} />
              </span>
              <span>Pagamentos pendentes</span>
              <strong className="smaller">{money(summary.pending)}</strong>
              <div className="metricDelta">
                <span className="vs">saldo a regularizar</span>
              </div>
            </article>
          </section>
          <section className="panelCard">
            <div className="panelCardHeader roleListHeader">
              <div>
                <h2>Entregas recentes</h2>
                <p>Veja rapidamente o andamento das últimas solicitações.</p>
              </div>
              <button
                className="smallButton"
                type="button"
                onClick={() => setTab("ENTREGAS")}
              >
                Ver todas
              </button>
            </div>
            {deliveryList(data.entregas.slice(0, 3))}
          </section>
          <div className="portalSummaryExtras">
            <EnderecosResumo />
            <AvisosResumo />
          </div>
        </>
      ) : null}
      {tab === "ENTREGAS" ? (
        <section className="panelCard">
          <div className="panelCardHeader roleListHeader">
            <div>
              <h2>Minhas entregas</h2>
              <p>Histórico, rota e recebimentos da operação.</p>
            </div>
            <label>
              Buscar entrega
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Identificador, destino ou status"
              />
            </label>
          </div>
          <div className="deliveryFilters">
            <label>
              Status
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                {[...new Set(data.entregas.map((e) => e.status))].map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              De
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </label>
            <label>
              Até
              <input
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
                <span className="modalEyebrow">DADOS DO CLIENTE</span>
                <h2>{titleCase(data.cliente.nome)}</h2>
              </div>
              <Building2 size={23} />
            </div>
            <dl className="portalDetails">
              <div>
                <dt>E-mail</dt>
                <dd>{data.cliente.email || "Não informado"}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{formatPhone(data.cliente.telefone)}</dd>
              </div>
              <div>
                <dt>Documento</dt>
                <dd>
                  {data.cliente.documento
                    ? formatCpfOrCnpj(data.cliente.documento)
                    : "Não informado"}
                </dd>
              </div>
              <div>
                <dt>Endereço</dt>
                <dd>{address || "Não informado"}</dd>
              </div>
            </dl>
            <ContaClienteEdicao
              cliente={data.cliente}
              onChange={() => void load()}
            />
            <SegurancaConta />
          </section>
          <section className="panelCard contactCard">
            <div className="panelCardHeader">
              <div>
                <span className="modalEyebrow">PRECISA DE AJUDA?</span>
                <h2>Contato da JS Boy</h2>
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
                    WhatsApp
                  </a>
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
        title="Cancelar solicitação"
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
              setFeedback(apiErrorMessage(r, "Não foi possível cancelar."));
            } finally {
              setSending(false);
            }
          }}
        >
          <p>
            O cancelamento depende do estado atual e da ausência de recebimento.
          </p>
          <label>
            Motivo
            <input
              required
              maxLength={500}
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
            />
          </label>
          <button className="primaryButton" disabled={sending}>
            Confirmar cancelamento
          </button>
        </form>
      </Modal>
      <Modal
        open={requestOpen}
        onClose={() => !sending && setRequestOpen(false)}
        eyebrow={`${editing ? "EDITAR SOLICITAÇÃO" : "SOLICITAR ENTREGA"} · ETAPA ${requestStep}/3`}
        title={
          requestStep === 1
            ? "Rota da entrega"
            : requestStep === 2
              ? "Destinatário e mercadoria"
              : "Agendamento e revisão"
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
              <ArrowLeft size={16} /> Voltar
            </button>
            <div className="modalFooterActions">
              <span>Etapa {requestStep} de 3</span>
              {requestStep < 3 ? (
                <button
                  className="darkButton"
                  type="button"
                  onClick={advanceRequest}
                >
                  Próximo <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="primaryButton"
                  form="client-request-form"
                  type="submit"
                  disabled={sending}
                >
                  <Check size={16} />{" "}
                  {sending ? "Enviando..." : "Enviar solicitação"}
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
            Origem frequente
            <select
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
              <option value="">Selecionar</option>
              {enderecos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.apelido}
                </option>
              ))}
            </select>
          </label>
          <label>
            Destino frequente
            <select
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
              <option value="">Selecionar</option>
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
                Endereço de origem
                <input
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
                Bairro da origem
                <input
                  required
                  value={request.bairroOrigem}
                  onChange={(event) =>
                    setRequest({ ...request, bairroOrigem: event.target.value })
                  }
                />
              </label>
              <label>
                Endereço de destino
                <input
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
                Bairro do destino
                <input
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
                Distância estimada (km)
                <input
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
                  A JS Boy revisará o valor antes de confirmar.
                </span>
              </label>
            </div>
          ) : null}
          {requestStep === 2 ? (
            <div className="formGrid">
              <label>
                Destinatário
                <input
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
                Telefone autorizado
                <input
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
                Mercadoria
                <input
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
                Forma de pagamento
                <select
                  value={request.formaPagamento || "DINHEIRO"}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      formaPagamento: e.target.value as "PIX" | "DINHEIRO",
                    })
                  }
                >
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="PIX">Pix direto do entregador</option>
                </select>
              </label>
              <label>
                <CalendarClock size={15} /> Início agendado (opcional)
                <input
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
                <CalendarClock size={15} /> Fim agendado (opcional)
                <input
                  type="datetime-local"
                  value={request.agendadaFim || ""}
                  onChange={(event) =>
                    setRequest({ ...request, agendadaFim: event.target.value })
                  }
                />
              </label>
              <label className="requestWide">
                Observações
                <textarea
                  rows={4}
                  maxLength={500}
                  value={request.observacoes}
                  onChange={(event) =>
                    setRequest({ ...request, observacoes: event.target.value })
                  }
                />
              </label>
              <div className="requestReview requestWide">
                <strong>Como funciona</strong>
                <span>
                  A solicitação entra como “Solicitada”. A JS Boy revisa rota,
                  disponibilidade e valor antes de confirmar.
                </span>
              </div>
            </div>
          ) : null}
        </form>
      </Modal>
    </main>
  );
}

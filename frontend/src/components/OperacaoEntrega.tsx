import { getLocale } from '../preferences';
import { completionMessage } from '../i18n/server';
import { message, useLocale } from '../i18n';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  LockKeyhole,
  RefreshCw,
  Route,
  WalletCards,
} from "lucide-react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { getStoredUser } from "../services/authStorage";
import {
  clearReceiptIntent,
  createReceiptIntent,
  pendingReceipt,
  PendingReceipt,
} from "../services/financialIntent";
import { FormaPagamento, Parada, Recebimento } from "../types";
import { ConfirmDialog } from "./AsyncState";
import { Modal } from "./Modal";

const money = (value: number) =>
  new Intl.NumberFormat(getLocale(), { style: "currency", currency: "BRL" }).format(
    value,
  );

export function OperacaoEntrega({
  entregaId,
  versao,
  perfil = "CLIENTE",
  onChange,
}: {
  entregaId: string;
  versao?: number;
  perfil?: "CLIENTE" | "ENTREGADOR" | "PROPRIETARIO";
  onChange?: () => void;
}) {
  useLocale();
  const [financeiro, setFinanceiro] = useState<Recebimento | null>(null);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [valor, setValor] = useState("");
  const [transacaoLegada, setTransacaoLegada] = useState("");
  const [ocorrencia, setOcorrencia] = useState({
    paradaId: "",
    motivo: "",
    proximaAcao: "",
  });
  const [occurrenceOpen, setOccurrenceOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [conclusao, setConclusao] = useState({
    recebedorNome: "",
    observacao: "",
  });
  const [paradaConclusao, setParadaConclusao] = useState<Parada | null>(null);
  const [conclusaoError, setConclusaoError] = useState("");

  const intent = useRef<PendingReceipt | null>(null);
  const sending = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const operacional = perfil === "ENTREGADOR";
      const [financial, route] = await Promise.all([
        api.get<Recebimento>(
          perfil === "ENTREGADOR"
            ? `/operacao-entregador/recebimentos/${entregaId}`
            : `/recebimentos/entregas/${entregaId}`,
        ),
        api.get<Parada[]>(
          operacional
            ? `/operacao-entregador/entregas/${entregaId}/paradas`
            : `/rotas/entregas/${entregaId}`,
        ),
      ]);
      setFinanceiro(financial.data);
      setParadas(route.data);
      setValor(
        String(
          intent.current ? intent.current.payload.valor : financial.data.saldo,
        ),
      );
      setTransacaoLegada(
        financial.data.transacaoLegadaId
          ? String(financial.data.transacaoLegadaId)
          : "",
      );
    } catch (reason) {
      setFinanceiro(null);
      setError(
        apiErrorMessage(
          reason,
          message("operacao.entrega.nao.foi.possivel.conferir.rota.e.pagamento.a.finalizacao.permanece.b"),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [entregaId, perfil]);
  useEffect(() => {
    const user = getStoredUser();
    intent.current =
      user && perfil !== "CLIENTE" ? pendingReceipt(user.id, entregaId) : null;
    void load();
  }, [load, versao, perfil, entregaId]);
  async function confirmar() {
    if (!financeiro || sending.current) return;
    if (
      !intent.current &&
      (!Number.isFinite(Number(valor)) ||
        Number(valor) <= 0 ||
        Number(valor) > financeiro.saldo)
    ) {
      setError(message("operacao.entrega.informe.um.valor.positivo.ate.o.saldo.pendente"));
      return;
    }
    try {
      const user = getStoredUser();
      if (!user)
        throw new Error(
          message("operacao.entrega.sessao.nao.identificada.entre.novamente.antes.de.confirmar"),
        );
      if (!intent.current) {
        if (
          financeiro.formaPagamento !== "PIX" &&
          financeiro.formaPagamento !== "DINHEIRO"
        )
          return;
        intent.current = createReceiptIntent(user.id, entregaId, {
          valor: Number(valor),
          formaPagamento: financeiro.formaPagamento,
          referenciaRecebedor: financeiro.referenciaRecebedor,
        });
      }
    } catch (reason) {
      setError(
        apiErrorMessage(
          reason,
          message("operacao.entrega.nao.foi.possivel.preservar.a.confirmacao.habilite.o.armazenamento.do"),
        ),
      );
      return;
    }
    sending.current = true;
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      await api.post(
        perfil === "ENTREGADOR"
          ? `/operacao-entregador/recebimentos/${entregaId}/confirmar`
          : `/recebimentos/entregas/${entregaId}/confirmar`,
        intent.current.payload,
        { headers: { "Idempotency-Key": intent.current.chave } },
      );
      clearReceiptIntent(entregaId);
      intent.current = null;
      await load();
      onChange?.();
    } catch (reason) {
      setError(
        apiErrorMessage(
          reason,
          message("operacao.entrega.recebimento.ainda.nao.confirmado.nesta.tela.atualize.os.dados.ou.rep"),
        ),
      );
      setFinanceiro(null);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function copiarChave() {
    if (!financeiro || busy) return;
    setBusy(true);
    setError("");
    setFeedback("");
    let atual: Recebimento;
    try {
      atual = (
        await api.get<Recebimento>(
          perfil === "ENTREGADOR"
            ? `/operacao-entregador/recebimentos/${entregaId}`
            : `/recebimentos/entregas/${entregaId}`,
        )
      ).data;
      setFinanceiro(atual);
      if (
        atual.referenciaRecebedor !== financeiro.referenciaRecebedor ||
        !atual.chavePix
      ) {
        setError(
          message("operacao.entrega.os.dados.de.pagamento.mudaram.confira.o.recebedor.atualizado.antes.d"),
        );
        setBusy(false);
        return;
      }
    } catch (reason) {
      setFinanceiro(null);
      setBusy(false);
      setError(
        apiErrorMessage(
          reason,
          message("operacao.entrega.nao.foi.possivel.conferir.a.chave.atual.atualize.os.dados.antes.de.p"),
        ),
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(atual.chavePix!);
      setFeedback(
        message("operacao.entrega.chave.copiada.o.recebimento.sera.confirmado.manualmente.apos.a.confe"),
      );
    } catch {
      setError(
        message("operacao.entrega.nao.foi.possivel.copiar.selecione.a.chave.e.copie.manualmente"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function conciliarLegado() {
    if (!financeiro?.cobrancaLegadaId || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/pix/${financeiro.cobrancaLegadaId}/conciliar`, {
        transacaoId: Number(transacaoLegada),
      });
      await load();
      onChange?.();
    } catch (reason) {
      setError(
        apiErrorMessage(
          reason,
          message("operacao.entrega.nao.foi.possivel.conciliar.a.cobranca.legada"),
        ),
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function definirFormaPagamento(formaPagamento: FormaPagamento) {
    if (sending.current || perfil !== "ENTREGADOR") return;
    sending.current = true;
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      await api.patch(
        `/operacao-entregador/recebimentos/${entregaId}/forma-pagamento`,
        { formaPagamento },
      );
      await load();
      setFeedback(
        formaPagamento === "PIX"
          ? message("operacao.entrega.pix.selecionado.confira.os.dados.e.confirme.o.recebimento")
          : message("operacao.entrega.dinheiro.selecionado.confirme.o.valor.recebido.para.liberar.a.finali"),
      );
      onChange?.();
    } catch (reason) {
      setError(
        apiErrorMessage(
          reason,
          message("operacao.entrega.nao.foi.possivel.definir.a.forma.de.pagamento.atualize.os.dados.e.te"),
        ),
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function concluir(parada: Parada) {
    if (sending.current) return;
    const recebedorNome = conclusao.recebedorNome.trim();

    sending.current = true;
    setBusy(true);
    setConclusaoError("");
    try {
      await api.post(
        perfil === "ENTREGADOR"
          ? `/operacao-entregador/entregas/${entregaId}/paradas/${parada.id}/concluir`
          : `/rotas/entregas/${entregaId}/paradas/${parada.id}/concluir`,
        {
          recebedorNome:
            parada.tipo === "ENTREGA" ? recebedorNome || null : null,
          observacao: conclusao.observacao.trim() || null,
        },
        { headers: { "If-Match": String(parada.versao) } },
      );
      setConclusao({ recebedorNome: "", observacao: "" });
      setParadaConclusao(null);
      await load();
      onChange?.();
    } catch (reason) {
      setConclusaoError(
        apiErrorMessage(reason, message("operacao.entrega.nao.foi.possivel.concluir.a.parada")),
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function finalizar() {
    if (!financeiro?.podeFinalizar || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const path =
        perfil === "ENTREGADOR"
          ? `/entregas/minhas-entregas/${entregaId}/status`
          : `/entregas/${entregaId}/status`;
      await api.patch(
        path,
        { status: "ENTREGUE" },
        { headers: { "If-Match": String(versao) } },
      );
      await load();
      onChange?.();
    } catch (reason) {
      setFinanceiro(null);
      setError(
        apiErrorMessage(
          reason,
          message("operacao.entrega.nao.foi.possivel.finalizar.a.entrega.confira.o.estado.no.servidor"),
        ),
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function registrarOcorrencia() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      await api.post(`/operacao-entregador/entregas/${entregaId}/ocorrencias`, {
        ...ocorrencia,
        paradaId: ocorrencia.paradaId || null,
        tipo: "TENTATIVA_SEM_SUCESSO",
      });
      setOccurrenceOpen(false);
      await load();
      onChange?.();
    } catch (reason) {
      setError(
        apiErrorMessage(reason, message("operacao.entrega.nao.foi.possivel.registrar.a.ocorrencia")),
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  const proxima = paradas.find((p) => p.status !== "CONCLUIDA");
  const rotaConcluida =
    paradas.length > 0 && paradas.every((p) => p.status === "CONCLUIDA");
  const pagamentoRegularizado = Boolean(financeiro?.recebidoConfirmado);
  const pagamentoLegado = Boolean(
    financeiro &&
      financeiro.formaPagamento !== "PIX" &&
      financeiro.formaPagamento !== "DINHEIRO",
  );
  const podeEscolherForma = Boolean(
    perfil === "ENTREGADOR" &&
      financeiro &&
      financeiro.saldo > 0 &&
      financeiro.valorRecebido === 0 &&
      !financeiro.recebidoConfirmado &&
      !financeiro.cobrancaLegadaId &&
      !intent.current,
  );
  return (
    <section className="deliveryOperation" aria-label={message("operacao.entrega.rota.e.recebimento")}>
      {loading ? <p role="status">{message("operacao.entrega.conferindo.rota.e.pagamento")}</p> : null}
      {error ? (
        <p role="alert" className="errorMessage">
          {error}
        </p>
      ) : null}
      {feedback ? <p role="status">{feedback}</p> : null}
      <div className="operationToolbar">
        <div>
          <span className="operationEyebrow">{message("operacao.entrega.acompanhamento")}</span>
          <h3>{message("operacao.entrega.rota.e.recebimento")}</h3>
          <p>{message("operacao.entrega.confira.as.etapas.necessarias.antes.de.encerrar.a.entrega")}</p>
        </div>
        <button
          className="secondaryButton operationRefreshButton"
          type="button"
          disabled={busy || loading}
          onClick={() => void load()}
        >
          <RefreshCw size={15} aria-hidden="true" />
          {perfil === "CLIENTE" ? message("operacao.entrega.atualizar") : message("operacao.entrega.atualizar.dados")}
        </button>
      </div>
      {financeiro && !loading ? (
        <>
          {intent.current && perfil !== "CLIENTE" ? (
            <div className="manualReceipt">
              <p>
                {message("operacao.entrega.ha.uma.confirmacao.anterior.sem.resposta.confira.essa.tentativa.ante")} </p>
              <button
                className="secondaryButton"
                type="button"
                disabled={busy}
                onClick={() => void confirmar()}
              >
                {message("operacao.entrega.conferir.tentativa.anterior")} </button>
              <button
                className="secondaryButton"
                type="button"
                disabled={busy}
                onClick={() => setDiscardOpen(true)}
              >
                {message("operacao.entrega.descartar.tentativa")} </button>
            </div>
          ) : null}
          <ConfirmDialog
            open={discardOpen}
            title={message("operacao.entrega.descartar.a.tentativa.anterior")}
            description={message("operacao.entrega.ela.pode.ja.ter.sido.registrada.confira.o.valor.recebido.no.financei")}
            confirmLabel={message("operacao.entrega.descartar.tentativa")}
            danger
            busy={busy}
            onCancel={() => setDiscardOpen(false)}
            onConfirm={() => {
              clearReceiptIntent(entregaId);
              intent.current = null;
              setDiscardOpen(false);
              void load();
            }}
          />
          <div className="operationGrid">
            <div className="paymentSummary">
              <div className="paymentSummaryHeader">
                <span className="operationIcon payment" aria-hidden="true">
                  <WalletCards size={18} />
                </span>
                <div>
                  <span>{message("operacao.entrega.pagamento")}</span>
                  <strong>
                    {financeiro.formaPagamento === "PIX"
                      ? message("operacao.entrega.pix.direto")
                      : financeiro.formaPagamento === "DINHEIRO"
                        ? message("operacao.entrega.dinheiro")
                        : message("operacao.entrega.forma.ainda.nao.definida")}
                  </strong>
                </div>
                <span
                  className={`operationState ${pagamentoRegularizado ? "done" : "pending"}`}
                >
                  {pagamentoRegularizado ? message("operacao.entrega.regularizado") : message("operacao.entrega.pendente")}
                </span>
              </div>
              <div className="paymentAmounts" aria-label={message("operacao.entrega.resumo.do.pagamento")}>
                <div>
                  <span>{message("operacao.entrega.recebido")}</span>
                  <strong>{money(financeiro.valorRecebido)}</strong>
                </div>
                <div>
                  <span>{message("operacao.entrega.saldo.pendente")}</span>
                  <strong>{money(financeiro.saldo)}</strong>
                </div>
              </div>
              <dl className="paymentMetadata">
                <div>
                  <dt>{message("operacao.entrega.recebedor")}</dt>
                  <dd>
                    {financeiro.recebedorNome || message("operacao.entrega.entregador.ainda.nao.designado")}
                  </dd>
                </div>
                <div>
                  <dt>{message("operacao.entrega.situacao")}</dt>
                  <dd>
                    {financeiro.recebidoConfirmado
                      ? financeiro.valorRecebido === 0
                        ? message("operacao.entrega.sem.saldo.pendente")
                        : message("operacao.entrega.recebimento.confirmado")
                      : financeiro.formaPagamento === "DINHEIRO"
                        ? message("operacao.entrega.aguardando.confirmacao.do.dinheiro")
                        : pagamentoLegado
                          ? message("operacao.entrega.escolha.pix.ou.dinheiro")
                          : message("operacao.entrega.aguardando.confirmacao")}
                  </dd>
                </div>
              </dl>
              {podeEscolherForma ? (
                <div
                  className="paymentMethodChoice"
                  role="group"
                  aria-label={message("operacao.entrega.escolher.forma.de.pagamento")}
                >
                  <div>
                    <strong>
                      {pagamentoLegado
                        ? message("operacao.entrega.como.voce.recebeu")
                        : message("operacao.entrega.forma.do.recebimento")}
                    </strong>
                    <small>
                      {pagamentoLegado
                        ? message("operacao.entrega.escolha.a.forma.usada.nesta.entrega.depois.confirme.o.valor.recebido")
                        : message("operacao.entrega.voce.pode.ajustar.a.forma.antes.de.confirmar.qualquer.valor")}
                    </small>
                  </div>
                  <div className="paymentMethodActions">
                    <button
                      className={`secondaryButton ${financeiro.formaPagamento === "PIX" ? "selected" : ""}`}
                      type="button"
                      disabled={busy || financeiro.formaPagamento === "PIX"}
                      aria-pressed={financeiro.formaPagamento === "PIX"}
                      onClick={() => void definirFormaPagamento("PIX")}
                    >
                      {financeiro.formaPagamento === "PIX"
                        ? message("operacao.entrega.pix.selecionado")
                        : message("operacao.entrega.usar.pix")}
                    </button>
                    <button
                      className={`secondaryButton ${financeiro.formaPagamento === "DINHEIRO" ? "selected" : ""}`}
                      type="button"
                      disabled={busy || financeiro.formaPagamento === "DINHEIRO"}
                      aria-pressed={financeiro.formaPagamento === "DINHEIRO"}
                      onClick={() => void definirFormaPagamento("DINHEIRO")}
                    >
                      {financeiro.formaPagamento === "DINHEIRO"
                        ? message("operacao.entrega.dinheiro.selecionado")
                        : message("operacao.entrega.usar.dinheiro")}
                    </button>
                  </div>
                </div>
              ) : null}
              {financeiro.confirmadoEm ? (
                <small>
                  {message("operacao.entrega.confirmado.por")} {financeiro.confirmadoPor} {message("operacao.entrega.em")}{" "}
                  {new Date(financeiro.confirmadoEm).toLocaleString(getLocale())}
                </small>
              ) : null}
              {financeiro.formaPagamento === "PIX" && financeiro.saldo > 0 ? (
                financeiro.chavePix ? (
                  <>
                    <p>{message("operacao.entrega.titular")} {financeiro.titularPix}</p>
                    <code className="pixKey">{financeiro.chavePix}</code>
                    <button
                      type="button"
                      className="secondaryButton"
                      disabled={busy}
                      onClick={() => void copiarChave()}
                    >
                      {message("operacao.entrega.copiar.chave.pix")} </button>
                    <small>
                      {message("operacao.entrega.confira.o.destinatario.no.seu.banco.antes.de.pagar.copiar.a.chave.na")} </small>
                  </>
                ) : (
                  <p>
                    {message("operacao.entrega.cadastre.a.chave.pix.do.entregador.designado.para.apresentar.o.pagam")} </p>
                )
              ) : null}
              {financeiro.cobrancaLegadaId && perfil === "PROPRIETARIO" ? (
                <div className="manualReceipt">
                  <p>
                    {message("operacao.entrega.existe.uma.cobranca.anterior.pendente.confira.a.transacao.no.mercado")} </p>
                  <label>
                    {message("operacao.entrega.id.da.transacao.antiga")} <input
                      inputMode="numeric"
                      value={transacaoLegada}
                      onChange={(e) =>
                        setTransacaoLegada(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </label>
                  <button
                    className="secondaryButton"
                    type="button"
                    disabled={busy || !transacaoLegada}
                    onClick={() => void conciliarLegado()}
                  >
                    {message("operacao.entrega.consultar.e.conciliar.cobranca.antiga")} </button>
                  <small>
                    {message("operacao.entrega.a.consulta.nao.emite.cobranca.sem.id.conhecido.localize.a.transacao.")} </small>
                </div>
              ) : null}
              {financeiro.podeConfirmar && perfil !== "CLIENTE" ? (
                <div className="manualReceipt">
                  <label>
                    {message("operacao.entrega.valor.conferido.na.conta.ou.recebido.em.dinheiro")} <input
                      type="number"
                      min="0.01"
                      max={financeiro.saldo}
                      step="0.01"
                      value={valor}
                      disabled={busy || !!intent.current}
                      onChange={(event) => setValor(event.target.value)}
                    />
                  </label>
                  <button
                    className="primaryButton"
                    type="button"
                    disabled={busy}
                    onClick={() => void confirmar()}
                  >
                    {busy
                      ? message("comum.confirmando")
                      : financeiro.formaPagamento === "PIX"
                        ? message("operacao.entrega.confirmar.pix.recebido")
                        : message("operacao.entrega.confirmar.dinheiro.recebido")}
                  </button>
                </div>
              ) : null}
            </div>
            <ol className="routeCards" aria-label={message("operacao.entrega.etapas.da.rota")}>
              {paradas.map((parada) => (
                <li
                  key={parada.id}
                  className={proxima?.id === parada.id ? "nextStop" : ""}
                >
                  <strong>
                    {parada.ordem}.{" "}
                    {parada.tipo === "COLETA"
                      ? message("operacao.entrega.coleta")
                      : parada.tipo === "INTERMEDIARIA"
                        ? message("operacao.entrega.parada.intermediaria")
                        : message("operacao.entrega.entrega")}
                    {proxima?.id === parada.id ? (" " + message("operacao.entrega.proxima.parada")) : ""}
                  </strong>
                  <p>
                    {parada.endereco}
                    {parada.complemento ? (" " + message("operacao.entrega.value", { value1: parada.complemento })) : ""}
                  </p>
                  <p>
                    {[parada.cidade, parada.estado, parada.cep]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {parada.contatoNome ? (
                    <p>
                      {parada.contatoNome} · {parada.contatoTelefone}
                    </p>
                  ) : null}
                  {parada.observacao ? <p>{parada.observacao}</p> : null}
                  <small>
                    {parada.status === "CONCLUIDA"
                      ? message("operacao.entrega.concluida.em.valuevalue", { value1: new Date(parada.realizadaEm!).toLocaleString(getLocale()), value2: parada.usuarioConclusaoNome ? message('comum.by', { name: parada.usuarioConclusaoNome }) : "" })
                      : parada.status === "FALHOU"
                        ? message("operacao.entrega.tentativa.falhou.parada.pendente.de.resolucao")
                        : message("operacao.entrega.pendente")}
                  </small>
                  {parada.recebedorNome ? (
                    <p>{message("operacao.entrega.recebido.por")} {parada.recebedorNome}</p>
                  ) : null}
                  {parada.observacaoConclusao ? (
                    <p>{message("operacao.entrega.observacao")} {parada.observacaoConclusao}</p>
                  ) : null}
                  {perfil !== "CLIENTE" &&
                  proxima?.id === parada.id &&
                  !financeiro.pendencia?.startsWith("Entrega encerrada") ? (
                    <button
                      className="secondaryButton"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setConclusao({ recebedorNome: "", observacao: "" });
                        setConclusaoError("");
                        setParadaConclusao(parada);
                      }}
                    >
                      {parada.tipo === "COLETA"
                        ? message("operacao.entrega.concluir.coleta")
                        : message("operacao.entrega.concluir.parada")}
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
          {paradas.length === 0 ? (
            <p>{message("operacao.entrega.rota.ainda.nao.cadastrada.procure.o.proprietario")}</p>
          ) : null}
          <section
            className={`completionPanel ${financeiro.podeFinalizar ? "ready" : "blocked"}`}
            aria-labelledby={`completion-title-${entregaId}`}
          >
            <div className="completionHeading">
              <span className="operationIcon" aria-hidden="true">
                {financeiro.podeFinalizar ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <LockKeyhole size={20} />
                )}
              </span>
              <div>
                <h4 id={`completion-title-${entregaId}`}>
                  {financeiro.podeFinalizar
                    ? message("operacao.entrega.entrega.pronta.para.finalizar")
                    : message("operacao.entrega.finalizacao.bloqueada")}
                </h4>
                <p role="status">
                  {completionMessage(financeiro.pendencia, perfil === 'CLIENTE')}
                </p>
              </div>
            </div>

            <div className="completionChecklist" aria-label={message("operacao.entrega.requisitos.para.finalizar")}>
              <div className={rotaConcluida ? "done" : "pending"}>
                {rotaConcluida ? (
                  <CheckCircle2 size={18} aria-hidden="true" />
                ) : (
                  <Route size={18} aria-hidden="true" />
                )}
                <span>
                  <strong>{message("operacao.entrega.rota")}</strong>
                  <small>
                    {rotaConcluida ? message("operacao.entrega.todas.as.paradas.concluidas") : message("operacao.entrega.ha.paradas.pendentes")}
                  </small>
                </span>
              </div>
              <div className={pagamentoRegularizado ? "done" : "pending"}>
                {pagamentoRegularizado ? (
                  <CheckCircle2 size={18} aria-hidden="true" />
                ) : (
                  <Clock3 size={18} aria-hidden="true" />
                )}
                <span>
                  <strong>{message("operacao.entrega.pagamento")}</strong>
                  <small>
                    {pagamentoRegularizado
                      ? message("operacao.entrega.recebimento.regularizado")
                      : message("operacao.entrega.value.ainda.pendente", { value1: money(financeiro.saldo) })}
                  </small>
                </span>
              </div>
            </div>

            {pagamentoLegado && !pagamentoRegularizado ? (
              <div className="completionGuidance">
                <CircleAlert size={18} aria-hidden="true" />
                <p>
                  {perfil === "PROPRIETARIO"
                    ? message("operacao.entrega.edite.esta.entrega.escolha.pix.ou.dinheiro.e.confirme.o.recebimento.")
                    : message("operacao.entrega.escolha.pix.ou.dinheiro.no.cartao.de.pagamento.acima.e.confirme.o.va")}
                </p>
              </div>
            ) : null}

            {perfil !== "CLIENTE" ? (
              <button
                className="darkButton completionButton"
                type="button"
                disabled={busy || !financeiro.podeFinalizar}
                onClick={() => void finalizar()}
              >
                {financeiro.podeFinalizar ? (
                  <CheckCircle2 size={17} aria-hidden="true" />
                ) : (
                  <LockKeyhole size={16} aria-hidden="true" />
                )}
                {message("operacao.entrega.finalizar.entrega")} </button>
            ) : null}
          </section>
          {perfil === "ENTREGADOR" && proxima ? (
            <>
              <button
                className="secondaryButton"
                type="button"
                disabled={busy}
                onClick={() => setOccurrenceOpen(!occurrenceOpen)}
              >
                {message("operacao.entrega.registrar.tentativa.frustrada")} </button>
              {occurrenceOpen ? (
                <div className="settingsForm">
                  <label>
                    {message("operacao.entrega.local")} <select
                      value={ocorrencia.paradaId}
                      onChange={(e) =>
                        setOcorrencia({
                          ...ocorrencia,
                          paradaId: e.target.value,
                        })
                      }
                    >
                      <option value="">{message("operacao.entrega.entrega.inteira")}</option>
                      {paradas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.ordem}. {p.endereco}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {message("operacao.entrega.motivo")} <input
                      maxLength={180}
                      value={ocorrencia.motivo}
                      onChange={(e) =>
                        setOcorrencia({ ...ocorrencia, motivo: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {message("operacao.entrega.proxima.acao")} <input
                      maxLength={300}
                      value={ocorrencia.proximaAcao}
                      onChange={(e) =>
                        setOcorrencia({
                          ...ocorrencia,
                          proximaAcao: e.target.value,
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="secondaryButton"
                    disabled={
                      busy ||
                      !ocorrencia.motivo.trim() ||
                      !ocorrencia.proximaAcao.trim()
                    }
                    onClick={() => void registrarOcorrencia()}
                  >
                    {message("operacao.entrega.registrar.ocorrencia")} </button>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
      <Modal
        open={paradaConclusao !== null}
        onClose={() => {
          if (!busy) setParadaConclusao(null);
        }}
        eyebrow={message("operacao.entrega.proxima.parada.2")}
        title={message("operacao.entrega.concluir.parada")}
        maxWidth={560}
      >
        {loading ? <p role="status">{message("operacao.entrega.conferindo.a.parada.pendente")}</p> : null}
        {!loading && !paradaConclusao ? (
          <p role="alert">
            {error || message("operacao.entrega.nao.ha.parada.pendente.para.concluir.nesta.entrega")}
          </p>
        ) : null}
        {paradaConclusao ? (
          <form
            className="settingsForm"
            onSubmit={(event) => {
              event.preventDefault();
              void concluir(paradaConclusao);
            }}
          >
            <div className="proofDeliverySummary">
              <span>{message("operacao.entrega.entrega.selecionada")}</span>
              <strong>
                {paradaConclusao.contatoNome || paradaConclusao.endereco}
              </strong>
              <small>{paradaConclusao.endereco}</small>
            </div>
            {conclusaoError ? (
              <p role="alert" className="errorMessage">
                {conclusaoError}
              </p>
            ) : null}
            {paradaConclusao.tipo === "ENTREGA" ? (
              <label>
                {message("operacao.entrega.quem.recebeu.opcional")} <input
                  maxLength={140}
                  disabled={busy}
                  value={conclusao.recebedorNome}
                  placeholder={message("operacao.entrega.nome.da.pessoa.que.recebeu")}
                  onChange={(event) =>
                    setConclusao({
                      ...conclusao,
                      recebedorNome: event.target.value,
                    })
                  }
                />
              </label>
            ) : null}
            <label>
              {message("operacao.entrega.observacao.2")} <textarea
                rows={3}
                maxLength={500}
                disabled={busy}
                value={conclusao.observacao}
                onChange={(event) =>
                  setConclusao({ ...conclusao, observacao: event.target.value })
                }
              />
            </label>
            <button className="primaryButton" type="submit" disabled={busy}>
              {busy ? message("comum.registrando") : message("operacao.entrega.confirmar.conclusao")}
            </button>
          </form>
        ) : null}
      </Modal>
    </section>
  );
}

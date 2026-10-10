import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MessageCircle, Phone, Search } from "lucide-react";
import { OperacaoEntrega } from "../components/OperacaoEntrega";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { useOperacao } from "../hooks/useOperacao";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { EntregaOperacional, StatusEntrega } from "../types";

const finais = ["ENTREGUE", "CANCELADA", "DEVOLVIDA", "FALHA_OPERACIONAL"];
export function MinhasEntregasPage() {
  const { items, loading, error, load } = useOperacao();
  const [params, setParams] = useSearchParams();
  const busca = params.get("busca") || "";
  const filtro = params.get("filtro") || "ATIVAS";
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const visible = useMemo(
    () =>
      items.filter(
        (e) =>
          (filtro === "TODAS" ||
            (filtro === "CONCLUIDAS"
              ? e.status === "ENTREGUE"
              : !finais.includes(e.status))) &&
          [
            e.codigo,
            e.clienteNome,
            e.destinatarioNome,
            e.bairroOrigem,
            e.bairroDestino,
            e.enderecoDestino,
          ]
            .join(" ")
            .toLowerCase()
            .includes(busca.toLowerCase()),
      ),
    [items, busca, filtro],
  );
  function atualizar(chave: string, valor: string) {
    const p = new URLSearchParams(params);
    p.set(chave, valor);
    setParams(p, { replace: true });
  }
  async function avancar(e: EntregaOperacional, status: StatusEntrega) {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await api.patch(
        "/entregas/minhas-entregas/" + e.id + "/status",
        { status },
        { headers: { "If-Match": String(e.versao) } },
      );
      await load();
    } catch (r) {
      setActionError(
        apiErrorMessage(r, "Não foi possível atualizar a entrega."),
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <main className="page">
        <LoadingState />
      </main>
    );
  return (
    <main className="page rolePortal courierPortal">
      <section className="panelCard">
        <div className="panelCardHeader">
          <div>
            <h1>Minhas entregas</h1>
            <p>
              Execute as paradas na ordem planejada e confira o recebimento.
            </p>
          </div>
        </div>
        <div className="roleFilters">
          <label className="filterSearch">
            <Search size={18} />
            <input
              aria-label="Buscar entrega"
              placeholder="Cliente, destinatário, bairro ou identificador"
              value={busca}
              onChange={(e) => atualizar("busca", e.target.value)}
            />
          </label>
          <div className="segmentedControl">
            {["ATIVAS", "TODAS", "CONCLUIDAS"].map((f) => (
              <button
                className={filtro === f ? "active" : ""}
                aria-pressed={filtro === f}
                key={f}
                onClick={() => atualizar("filtro", f)}
              >
                {f === "CONCLUIDAS"
                  ? "Concluídas"
                  : f === "ATIVAS"
                    ? "Ativas"
                    : "Todas"}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : null}
        {actionError ? (
          <p role="alert" className="errorMessage">
            {actionError}
          </p>
        ) : null}
        {!visible.length ? (
          <EmptyState
            title="Nenhuma entrega encontrada"
            description="Confira os filtros escolhidos."
          />
        ) : null}
        <div className="roleDeliveryList">
          {visible.map((e) => (
            <details
              key={e.id}
              className="deliveryAccordion"
              open={params.get("entrega") === e.id}
            >
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  atualizar(
                    "entrega",
                    params.get("entrega") === e.id ? "" : e.id,
                  );
                }}
              >
                <strong>{e.codigo}</strong>
                <div>
                  <strong>{e.destinatarioNome}</strong>
                  <small>
                    {e.bairroOrigem} → {e.bairroDestino}
                  </small>
                </div>
                <span>{e.clienteNome}</span>
                <span>{e.enderecoDestino}</span>
                <strong>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(e.valorFinal)}
                </strong>
                <span className="statusBadge progress">
                  {e.status.replace(/_/g, " ")}
                </span>
              </summary>
              {params.get("entrega") === e.id ? (
                <div className="deliveryExpanded">
                  <p>
                    {e.descricaoMercadoria}
                    {e.observacoes ? " · " + e.observacoes : ""}
                  </p>
                  <div className="quickLinks">
                    <Link
                      className="secondaryButton"
                      to={"/operacional/conversas?entrega=" + e.id}
                    >
                      <MessageCircle size={16} /> Conversar
                    </Link>
                    {e.destinatarioTelefone ? (
                      <a
                        className="secondaryButton"
                        href={"tel:" + e.destinatarioTelefone}
                      >
                        <Phone size={16} /> Ligar
                      </a>
                    ) : null}
                  </div>
                  <OperacaoEntrega
                    entregaId={e.id}
                    versao={e.versao}
                    perfil="ENTREGADOR"
                    onChange={() => void load()}
                  />
                  {e.status === "ENTREGADOR_DESIGNADO" ? (
                    <button
                      className="darkButton"
                      disabled={busy}
                      onClick={() => void avancar(e, "COLETADA")}
                    >
                      Confirmar etapa de coleta
                    </button>
                  ) : null}
                  {e.status === "COLETADA" ||
                  e.status === "TENTATIVA_FALHOU" ? (
                    <button
                      className="darkButton"
                      disabled={busy}
                      onClick={() => void avancar(e, "EM_ROTA")}
                    >
                      {e.status === "COLETADA"
                        ? "Iniciar rota"
                        : "Retomar rota"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

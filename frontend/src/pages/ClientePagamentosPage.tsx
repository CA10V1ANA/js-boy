import { useEffect, useState } from "react";
import { OperacaoEntrega } from "../components/OperacaoEntrega";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { EntregaCliente, Pagamento } from "../types";
import { LoadingState } from "../components/AsyncState";

export function ClientePagamentosPage() {
  const [entregas, setEntregas] = useState<EntregaCliente[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [situacao, setSituacao] = useState("TODAS");
  const [aberta, setAberta] = useState<string | null>(null);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<EntregaCliente[]>("/cliente/entregas"),
      api.get<Pagamento[]>("/cliente/pagamentos"),
    ])
      .then(([e, p]) => {
        if (active) {
          setEntregas(e.data);
          setPagamentos(p.data);
        }
      })
      .catch((r) => {
        if (active)
          setError(apiErrorMessage(r, "Não foi possível carregar pagamentos."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
  const items = entregas
    .filter((e) => e.status !== "CANCELADA")
    .map((e) => {
      const registros = pagamentos.filter((p) => p.entregaId === e.id);
      const recebido = registros.reduce(
        (s, p) => s + (p.tipo === "ESTORNO" ? -p.valor : p.valor),
        0,
      );
      return {
        e,
        registros,
        recebido,
        saldo: Math.max(0, e.valorFinal - recebido),
      };
    })
    .filter(
      ({ e, saldo }) =>
        !(
          (situacao === "PENDENTES" && saldo === 0) ||
          (situacao === "QUITADAS" && saldo > 0)
        ) &&
        (!inicio || e.criadoEm.slice(0, 10) >= inicio) &&
        (!fim || e.criadoEm.slice(0, 10) <= fim),
    );
  return (
    <main className="page">
      <section className="panelCard notificationPanel">
        <h1>Pagamentos</h1>
        <p>
          Recebimentos confirmados pela JS Boy. Pix é destinado ao entregador
          responsável.
        </p>
        <div className="deliveryFilters">
          <label>
            Situação
            <select
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
            >
              <option value="TODAS">Todas</option>
              <option value="PENDENTES">Pendentes</option>
              <option value="QUITADAS">Quitadas</option>
            </select>
          </label>
          <label>
            Solicitada a partir de
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
        {loading ? (
          <LoadingState />
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !items.length ? (
          <p>Nenhuma entrega neste filtro.</p>
        ) : (
          items.map(({ e, registros, recebido, saldo }) => (
            <article className="paymentDetails" key={e.id}>
              <button
                type="button"
                className="paymentSummary"
                aria-expanded={aberta === e.id}
                onClick={() => setAberta(aberta === e.id ? null : e.id)}
              >
                <strong>{e.codigo}</strong>
                <span>Devido: {money(e.valorFinal)}</span>
                <span>Recebido: {money(recebido)}</span>
                <span>Saldo: {money(saldo)}</span>
              </button>
              {aberta === e.id ? (
                <>
                  <OperacaoEntrega entregaId={e.id} />
                  <ul>
                    {registros.map((p) => (
                      <li key={p.id}>
                        {p.tipo === "ESTORNO" ? "Estorno · " : ""}
                        {p.formaPagamento} · {money(p.valor)} ·{" "}
                        {new Date(p.pagoEm).toLocaleString("pt-BR")}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}

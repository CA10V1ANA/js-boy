import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import { useEffect, useState } from "react";
import { OperacaoEntrega } from "../components/OperacaoEntrega";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { EntregaCliente, Pagamento } from "../types";
import { LoadingState } from "../components/AsyncState";

export function ClientePagamentosPage() {
  useLocale();
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
          setError(apiErrorMessage(r, message("cliente.pagamentos.nao.foi.possivel.carregar.pagamentos")));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const money = (v: number) =>
    new Intl.NumberFormat(getLocale(), {
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
        <h1>{message("cliente.pagamentos.pagamentos")}</h1>
        <p>
          {message("cliente.pagamentos.recebimentos.confirmados.pela.js.boy.pix.e.destinado.ao.entregador.r")} </p>
        <div className="deliveryFilters">
          <label>
            {message("cliente.pagamentos.situacao")} <select
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
            >
              <option value="TODAS">{message("cliente.pagamentos.todas")}</option>
              <option value="PENDENTES">{message("cliente.pagamentos.pendentes")}</option>
              <option value="QUITADAS">{message("cliente.pagamentos.quitadas")}</option>
            </select>
          </label>
          <label>
            {message("cliente.pagamentos.solicitada.a.partir.de")} <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </label>
          <label>
            {message("cliente.pagamentos.ate")} <input
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
          <p>{message("cliente.pagamentos.nenhuma.entrega.neste.filtro")}</p>
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
                <span>{message("cliente.pagamentos.devido")} {money(e.valorFinal)}</span>
                <span>{message("cliente.pagamentos.recebido")} {money(recebido)}</span>
                <span>{message("cliente.pagamentos.saldo")} {money(saldo)}</span>
              </button>
              {aberta === e.id ? (
                <>
                  <OperacaoEntrega entregaId={e.id} />
                  <ul>
                    {registros.map((p) => (
                      <li key={p.id}>
                        {p.tipo === "ESTORNO" ? (message("cliente.pagamentos.estorno") + " ") : ""}
                        {p.formaPagamento} · {money(p.valor)} ·{" "}
                        {new Date(p.pagoEm).toLocaleString(getLocale())}
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

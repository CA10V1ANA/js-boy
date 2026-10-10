import { CheckCircle2, DollarSign, MapPin, Package, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../components/AsyncState";
import { useOperacao } from "../hooks/useOperacao";
import { api } from "../services/api";
import { AvisosResumo } from "../components/AvisosResumo";

const finais = ["ENTREGUE", "CANCELADA", "DEVOLVIDA", "FALHA_OPERACIONAL"];
export function EntregadorOverviewPage() {
  const { items, summary, loading, error, load } = useOperacao();
  const proxima = items.find((e) => !finais.includes(e.status));
  const [proximaParada, setProximaParada] = useState<{
    entregaId: string;
    endereco: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    setProximaParada(null);
    if (proxima)
      void api
        .get<{ status: string; endereco: string }[]>(
          `/operacao-entregador/entregas/${proxima.id}/paradas`,
        )
        .then(({ data }) => {
          const parada = data.find((p) => p.status !== "CONCLUIDA");
          if (active && parada)
            setProximaParada({
              entregaId: proxima.id,
              endereco: parada.endereco,
            });
        })
        .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [proxima?.id, proxima?.status]);
  if (loading)
    return (
      <main className="page">
        <LoadingState />
      </main>
    );
  if (error || !summary)
    return (
      <main className="page">
        <ErrorState message={error} onRetry={() => void load()} />
      </main>
    );
  // Preserve the order supplied by the existing operational endpoint.
  const metrics = [
    [
      "Entregas ativas",
      summary.entregasAtivas,
      "sob sua responsabilidade",
      Package,
    ],
    ["Em rota", summary.emRota, "em deslocamento agora", Truck],
    [
      "Concluídas hoje",
      summary.concluidasHoje,
      "dia da operação",
      CheckCircle2,
    ],
    [
      "Valor movimentado hoje",
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(summary.valorMovimentadoHoje),
      "não representa comissão",
      DollarSign,
    ],
  ] as const;
  return (
    <main className="page rolePortal">
      <section className="metricGrid roleMetricGrid">
        {metrics.map(([label, value, hint, Icon]) => (
          <article className="metricCard" key={label}>
            <span className="metricIcon tone-yellow">
              <Icon size={21} />
            </span>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </section>
      <section className="panelCard">
        <div className="panelCardHeader">
          <h2>Próxima entrega</h2>
        </div>
        {proxima ? (
          <div className="nextDelivery">
            <div>
              <h3>{proxima.codigo}</h3>
              <p>
                {proxima.clienteNome} · {proxima.status.replace(/_/g, " ")}
              </p>
              <p>
                {proxima.enderecoOrigem} → {proxima.enderecoDestino}
              </p>
            </div>
            <Link
              className="primaryButton"
              to={`/minhas-entregas?entrega=${proxima.id}`}
            >
              Ver entrega
            </Link>
            {proximaParada?.entregaId === proxima.id ? (
              <a
                className="secondaryButton"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(proximaParada.endereco)}`}
              >
                <MapPin size={18} /> Abrir endereço
              </a>
            ) : (
              <span className="emptyNote">
                Abra a entrega para conferir a próxima parada.
              </span>
            )}
          </div>
        ) : (
          <p className="emptyNote">Nenhuma entrega pendente.</p>
        )}
      </section>
      <section className="panelCard">
        <div className="panelCardHeader">
          <h2>Entregas recentes</h2>
          <Link to="/minhas-entregas">Ver todas</Link>
        </div>
        {items.slice(0, 5).map((e) => (
          <Link
            className="deliveryOverviewRow"
            key={e.id}
            to={`/minhas-entregas?entrega=${e.id}`}
          >
            <strong>{e.codigo}</strong>
            <span>{e.clienteNome}</span>
            <span>{e.status.replace(/_/g, " ")}</span>
          </Link>
        ))}
      </section>
      <div className="quickLinks">
        <Link className="secondaryButton" to="/meu-faturamento">
          Ver meu faturamento
        </Link>
        <Link className="secondaryButton" to="/operacional/notificacoes">
          Consultar avisos
        </Link>
      </div>
      <AvisosResumo />
    </main>
  );
}

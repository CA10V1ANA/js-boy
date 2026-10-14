import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Map,
  Package,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/AsyncState";
import { AvisosResumo } from "../components/AvisosResumo";
import {
  PortalMetric,
  PortalRoute,
  PortalStatus,
  operationalDay,
  portalMoney,
  useOverviewRoute,
} from "../components/PortalOverview";
import { useOperacao } from "../hooks/useOperacao";

const finais = ["ENTREGUE", "CANCELADA", "DEVOLVIDA", "FALHA_OPERACIONAL"];
export function EntregadorOverviewPage() {
  const { items, summary, loading, error, load } = useOperacao();
  const proxima = items.find((e) => !finais.includes(e.status));
  const { paradas, error: routeError } = useOverviewRoute(proxima?.id, true);
  const hoje = operationalDay(new Date());
  const doDia = items.filter(
    (e) =>
      operationalDay(e.criadoEm) === hoje ||
      (e.concluidaEm && operationalDay(e.concluidaEm) === hoje) ||
      e.historico.some(
        (h) =>
          h.novoStatus === "ENTREGADOR_DESIGNADO" &&
          operationalDay(h.alteradoEm) === hoje,
      ),
  );
  const proximaParada = paradas?.find((p) => p.status !== "CONCLUIDA");
  const proximaAcao = !proxima
    ? null
    : proxima.status === "ENTREGADOR_DESIGNADO"
      ? "Abra a entrega e confirme a coleta quando chegar ao endereço."
      : proxima.status === "COLETADA"
        ? "Abra a entrega e inicie a rota para seguir ao destino."
        : proxima.status === "TENTATIVA_FALHOU"
          ? "Abra a entrega e retome a rota quando puder continuar."
          : proximaParada
            ? `Siga para ${proximaParada.endereco} e conclua esta parada.`
            : "A rota terminou. Confirme o recebimento e finalize a entrega.";
  const textoAcao = !proxima
    ? "Ver histórico"
    : !proximaParada && proxima.status === "EM_ROTA"
      ? "Receber e finalizar"
      : proxima.status === "ENTREGADOR_DESIGNADO"
        ? "Ir para coleta"
        : proxima.status === "COLETADA"
          ? "Iniciar rota"
          : "Abrir entrega";
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
  return (
    <main className="page portalOverview courierOverview">
      <section className="portalPanel nextDeliveryPanel dailyPriorityPanel">
        <div className="portalPanelHeading">
          <div>
            <span className="dailyPriorityEyebrow">AGORA</span>
            <h2>{proxima ? "Próxima ação" : "Trabalho em dia"}</h2>
            <p>{proximaAcao || "Não há nenhuma entrega pendente."}</p>
          </div>
          {proxima ? <PortalStatus status={proxima.status} /> : null}
        </div>
        {proxima ? (
          <div className="nextDeliveryColumns">
            <div>
              {routeError ? (
                <p role="alert" className="errorMessage">
                  {routeError}
                </p>
              ) : paradas === null ? (
                <p role="status">Carregando rota...</p>
              ) : paradas.length ? (
                <PortalRoute
                  paradas={paradas}
                  bairros={{
                    origem: proxima.bairroOrigem,
                    destino: proxima.bairroDestino,
                  }}
                />
              ) : (
                <p className="portalEmpty">Rota ainda não cadastrada.</p>
              )}
            </div>
            <div className="nextDeliveryMeta">
              <span>Cliente</span>
              <strong>{proxima.clienteNome}</strong>
              <span>Valor da entrega</span>
              <strong>{portalMoney(proxima.valorFinal)}</strong>
            </div>
            <div className="nextDeliveryActions">
              <Link
                className="portalPrimaryButton"
                to={"/minhas-entregas?entrega=" + proxima.id}
              >
                <Truck size={22} />
                {textoAcao}
              </Link>
              {proximaParada ? (
                <a
                  className="portalOutlineButton"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={
                    "https://www.google.com/maps/search/?api=1&query=" +
                    encodeURIComponent(proximaParada.endereco)
                  }
                >
                  <Map size={22} />
                  Abrir endereço
                </a>
              ) : (
                <p className="portalMuted">Confira as paradas no detalhe.</p>
              )}
            </div>
          </div>
        ) : (
          <Link className="portalOutlineButton" to="/minhas-entregas">
            Ver histórico <ChevronRight size={18} />
          </Link>
        )}
      </section>
      <section className="portalMetrics" aria-label="Resumo das entregas">
        <PortalMetric
          icon={Package}
          tone="amber"
          label="Entregas hoje"
          value={doDia.length}
          hint="atribuídas ou concluídas hoje"
        />
        <PortalMetric
          icon={Truck}
          tone="green"
          label="Em andamento"
          value={summary.emRota}
          hint="em deslocamento agora"
        />
        <PortalMetric
          icon={CheckCircle2}
          tone="blue"
          label="Concluídas"
          value={summary.concluidasHoje}
          hint="finalizadas hoje"
        />
        <PortalMetric
          icon={DollarSign}
          tone="violet"
          label={
            summary.valorRecebidoHoje === undefined
              ? "Valor movimentado hoje"
              : "Recebido hoje"
          }
          value={portalMoney(
            summary.valorRecebidoHoje ?? summary.valorMovimentadoHoje,
          )}
          hint={
            summary.valorRecebidoHoje === undefined
              ? "valor dos serviços; não é comissão"
              : "recebimentos líquidos do dia"
          }
        />
      </section>
      <div className="portalOverviewColumns courierColumns">
        <div className="portalOverviewMain">
          <section className="portalPanel">
            <div className="portalPanelHeading">
              <div>
                <h2>Entregas de hoje</h2>
                <p>Acompanhe o andamento das suas entregas.</p>
              </div>
              <Link className="portalTextLink" to="/minhas-entregas">
                Ver todas <ChevronRight size={18} />
              </Link>
            </div>
            <div className="portalDeliveryRows">
              {doDia.length ? (
                doDia.slice(0, 3).map((e, i) => (
                  <Link
                    className="portalDeliveryRow"
                    key={e.id}
                    to={"/minhas-entregas?entrega=" + e.id}
                  >
                    <span className="deliveryRowNumber">{i + 1}</span>
                    <div className="portalRowRoute">
                      <strong>{e.enderecoOrigem}</strong>
                      <small>
                        {e.bairroOrigem} → {e.bairroDestino}
                      </small>
                    </div>
                    <span className="portalRowClient">{e.clienteNome}</span>
                    <strong className="portalRowMoney">
                      {portalMoney(e.valorFinal)}
                    </strong>
                    <PortalStatus status={e.status} />
                    <ChevronRight size={18} />
                  </Link>
                ))
              ) : (
                <p className="portalEmpty">
                  Nenhuma entrega atribuída ou concluída hoje.
                </p>
              )}
            </div>
          </section>
        </div>
        <aside className="portalOverviewAside">
          <AvisosResumo />
          <section className="portalPanel quickActionsPanel">
            <h2>
              <Zap size={28} />
              Ações rápidas
            </h2>
            <Link className="portalQuickAction" to="/meu-faturamento">
              <BarChart3 size={25} />
              <strong>Ver meu faturamento</strong>
              <ChevronRight size={20} />
            </Link>
            <Link className="portalQuickAction" to="/meu-perfil">
              <User size={25} />
              <strong>Atualizar meu contato</strong>
              <ChevronRight size={20} />
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}

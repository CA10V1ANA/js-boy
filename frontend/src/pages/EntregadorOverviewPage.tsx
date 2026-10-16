import { message, useLocale } from '../i18n';
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
  useLocale();
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
      ? message("entregador.resumo.abra.a.entrega.e.confirme.a.coleta.quando.chegar.ao.endereco")
      : proxima.status === "COLETADA"
        ? message("entregador.resumo.abra.a.entrega.e.inicie.a.rota.para.seguir.ao.destino")
        : proxima.status === "TENTATIVA_FALHOU"
          ? message("entregador.resumo.abra.a.entrega.e.retome.a.rota.quando.puder.continuar")
          : proximaParada
            ? message("entregador.resumo.siga.para.value.e.conclua.esta.parada", { value1: proximaParada.endereco })
            : message("entregador.resumo.a.rota.terminou.confirme.o.recebimento.e.finalize.a.entrega");
  const textoAcao = !proxima
    ? message("entregador.resumo.ver.historico")
    : !proximaParada && proxima.status === "EM_ROTA"
      ? message("entregador.resumo.receber.e.finalizar")
      : proxima.status === "ENTREGADOR_DESIGNADO"
        ? message("entregador.resumo.ir.para.coleta")
        : proxima.status === "COLETADA"
          ? message("entregador.resumo.iniciar.rota")
          : message("entregador.resumo.abrir.entrega");
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
            <span className="dailyPriorityEyebrow">{message("entregador.resumo.agora")}</span>
            <h2>{proxima ? message("entregador.resumo.proxima.acao") : message("entregador.resumo.trabalho.em.dia")}</h2>
            <p>{proximaAcao || message("entregador.resumo.nao.ha.nenhuma.entrega.pendente")}</p>
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
                <p role="status">{message("entregador.resumo.carregando.rota")}</p>
              ) : paradas.length ? (
                <PortalRoute
                  paradas={paradas}
                  bairros={{
                    origem: proxima.bairroOrigem,
                    destino: proxima.bairroDestino,
                  }}
                />
              ) : (
                <p className="portalEmpty">{message("entregador.resumo.rota.ainda.nao.cadastrada")}</p>
              )}
            </div>
            <div className="nextDeliveryMeta">
              <span>{message("entregador.resumo.cliente")}</span>
              <strong>{proxima.clienteNome}</strong>
              <span>{message("entregador.resumo.valor.da.entrega")}</span>
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
                  {message("entregador.resumo.abrir.endereco")} </a>
              ) : (
                <p className="portalMuted">{message("entregador.resumo.confira.as.paradas.no.detalhe")}</p>
              )}
            </div>
          </div>
        ) : (
          <Link className="portalOutlineButton" to="/minhas-entregas">
            {message("entregador.resumo.ver.historico")} <ChevronRight size={18} />
          </Link>
        )}
      </section>
      <section className="portalMetrics" aria-label={message("entregador.resumo.resumo.das.entregas")}>
        <PortalMetric
          icon={Package}
          tone="amber"
          label={message("entregador.resumo.entregas.hoje")}
          value={doDia.length}
          hint={message("entregador.resumo.atribuidas.ou.concluidas.hoje")}
        />
        <PortalMetric
          icon={Truck}
          tone="green"
          label={message("entregador.resumo.em.andamento")}
          value={summary.emRota}
          hint={message("entregador.resumo.em.deslocamento.agora")}
        />
        <PortalMetric
          icon={CheckCircle2}
          tone="blue"
          label={message("entregador.resumo.concluidas")}
          value={summary.concluidasHoje}
          hint={message("entregador.resumo.finalizadas.hoje")}
        />
        <PortalMetric
          icon={DollarSign}
          tone="violet"
          label={
            summary.valorRecebidoHoje === undefined
              ? message("entregador.resumo.valor.movimentado.hoje")
              : message("entregador.resumo.recebido.hoje")
          }
          value={portalMoney(
            summary.valorRecebidoHoje ?? summary.valorMovimentadoHoje,
          )}
          hint={
            summary.valorRecebidoHoje === undefined
              ? message("entregador.resumo.valor.dos.servicos.nao.e.comissao")
              : message("entregador.resumo.recebimentos.liquidos.do.dia")
          }
        />
      </section>
      <div className="portalOverviewColumns courierColumns">
        <div className="portalOverviewMain">
          <section className="portalPanel">
            <div className="portalPanelHeading">
              <div>
                <h2>{message("entregador.resumo.entregas.de.hoje")}</h2>
                <p>{message("entregador.resumo.acompanhe.o.andamento.das.suas.entregas")}</p>
              </div>
              <Link className="portalTextLink" to="/minhas-entregas">
                {message("entregador.resumo.ver.todas")} <ChevronRight size={18} />
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
                  {message("entregador.resumo.nenhuma.entrega.atribuida.ou.concluida.hoje")} </p>
              )}
            </div>
          </section>
        </div>
        <aside className="portalOverviewAside">
          <AvisosResumo />
          <section className="portalPanel quickActionsPanel">
            <h2>
              <Zap size={28} />
              {message("entregador.resumo.acoes.rapidas")} </h2>
            <Link className="portalQuickAction" to="/meu-faturamento">
              <BarChart3 size={25} />
              <strong>{message("entregador.resumo.ver.meu.faturamento")}</strong>
              <ChevronRight size={20} />
            </Link>
            <Link className="portalQuickAction" to="/meu-perfil">
              <User size={25} />
              <strong>{message("entregador.resumo.atualizar.meu.contato")}</strong>
              <ChevronRight size={20} />
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}

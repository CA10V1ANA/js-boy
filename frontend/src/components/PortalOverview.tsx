import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import {
  CheckCircle2,
  ChevronRight,
  MapPin,
  Package,
  Route,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EntregaCliente, StatusEntrega } from "../types";
import type { Parada } from "../types/p2";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";

export const portalMoney = (value: number) =>
  new Intl.NumberFormat(getLocale(), { style: "currency", currency: "BRL" }).format(
    value,
  );
export const portalDate = (value: string) =>
  new Date(value).toLocaleString(getLocale(), {
    timeZone: "America/Fortaleza",
    dateStyle: "short",
    timeStyle: "short",
  });
export function operationalDay(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((key) => parts.find((p) => p.type === key)?.value)
    .join("-");
}
const getStatusNames = (): Record<StatusEntrega, string> => ({
  SOLICITADA: message("portal.resumo.aguardando.orcamento"),
  CONFIRMADA: message("portal.resumo.confirmada"),
  AGENDADA: message("portal.resumo.agendada"),
  AGUARDANDO_ENTREGADOR: message("portal.resumo.aguardando.entregador"),
  ENTREGADOR_DESIGNADO: message("portal.resumo.aguardando.coleta"),
  COLETADA: message("portal.resumo.coleta.realizada"),
  EM_ROTA: message("portal.resumo.em.rota"),
  TENTATIVA_FALHOU: message("portal.resumo.tentativa.falhou"),
  EM_DEVOLUCAO: message("portal.resumo.em.devolucao"),
  ENTREGUE: message("portal.resumo.entregue"),
  DEVOLVIDA: message("portal.resumo.devolvida"),
  FALHA_OPERACIONAL: message("portal.resumo.falha.operacional"),
  CANCELADA: message("portal.resumo.cancelada"),
});
export function PortalStatus({ status }: { status: StatusEntrega }) {
  useLocale();
  const tone =
    status === "ENTREGUE"
      ? "green"
      : ["EM_ROTA", "COLETADA"].includes(status)
        ? "teal"
        : ["CANCELADA", "FALHA_OPERACIONAL"].includes(status)
          ? "red"
          : "amber";
  return <span className={`portalStatus ${tone}`}>{getStatusNames()[status]}</span>;
}
export function PortalMetric({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  tone: "amber" | "green" | "blue" | "violet";
  label: string;
  value: string | number;
  hint: string;
}) {
  useLocale();
  return (
    <article className="portalMetric">
      <span className={`portalIcon ${tone}`}>
        <Icon size={25} aria-hidden="true" />
      </span>
      <span className="portalMetricLabel">{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}
export function useOverviewRoute(id?: string, operacional = false) {
  const [route, setRoute] = useState<{ id: string; items: Parada[] } | null>(
    null,
  );
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setRoute(null);
    setError("");
    if (id)
      void api
        .get<Parada[]>(
          operacional
            ? `/operacao-entregador/entregas/${id}/paradas`
            : `/rotas/entregas/${id}`,
        )
        .then(({ data }) => {
          if (active)
            setRoute({
              id,
              items: [...data].sort((a, b) => a.ordem - b.ordem),
            });
        })
        .catch((r) => {
          if (active)
            setError(apiErrorMessage(r, message("portal.resumo.nao.foi.possivel.carregar.a.rota")));
        });
    return () => {
      active = false;
    };
  }, [id, operacional]);
  return { paradas: route && route.id === id ? route.items : null, error };
}
export function PortalRoute({
  paradas,
  bairros,
  compact = false,
}: {
  paradas: Parada[];
  bairros: { origem: string; destino: string };
  compact?: boolean;
}) {
  useLocale();
  return (
    <ol className={compact ? "portalRoute compact" : "portalRoute"}>
      {paradas.map((p, index) => (
        <li key={p.id}>
          <span
            className={`routeNode ${p.status === "CONCLUIDA" ? "done" : index === 0 ? "pickup" : "destination"}`}
          >
            {compact ? <MapPin size={18} /> : p.ordem}
          </span>
          <div>
            <strong>
              {p.tipo === "COLETA"
                ? message("portal.resumo.coleta")
                : p.tipo === "ENTREGA"
                  ? message("portal.resumo.entrega")
                  : message("portal.resumo.parada.intermediaria")}
            </strong>
            <p>{p.endereco}</p>
            <small>
              {index === 0
                ? bairros.origem
                : index === paradas.length - 1
                  ? bairros.destino
                  : p.contatoNome}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function AcompanhamentoResumo({
  entrega,
}: {
  entrega: EntregaCliente | undefined;
}) {
  useLocale();
  const { paradas, error } = useOverviewRoute(entrega?.id);
  if (!entrega)
    return (
      <section className="portalPanel">
        <h2>{message("portal.resumo.acompanhe.sua.entrega")}</h2>
        <p className="portalEmpty">
          {message("portal.resumo.nenhuma.entrega.em.andamento.suas.proximas.solicitacoes.aparecerao.a")} </p>
      </section>
    );
  const coleta = [...entrega.historico]
    .reverse()
    .find((h) => h.novoStatus === "COLETADA");
  const coletada =
    !!coleta ||
    !!paradas?.some((p) => p.tipo === "COLETA" && p.status === "CONCLUIDA");
  const emRota = ["EM_ROTA", "EM_DEVOLUCAO", "TENTATIVA_FALHOU"].includes(
    entrega.status,
  );
  return (
    <section className="portalPanel trackingPanel">
      <div className="portalPanelHeading">
        <h2>{message("portal.resumo.acompanhe.sua.entrega")}</h2>
        <Link
          className="portalOutlineButton"
          to={`/portal/entregas?entrega=${entrega.id}`}
        >
          {message("portal.resumo.ver.detalhes")} <ChevronRight size={18} />
        </Link>
      </div>
      <div className="trackingColumns">
        <div>
          <div className="trackingCode">
            <h3>{entrega.codigo}</h3>
            <PortalStatus status={entrega.status} />
          </div>
          <p className="portalMuted">
            {message("portal.resumo.solicitada.em")} {portalDate(entrega.criadoEm)}
          </p>
          <ol className="portalTrackingTimeline">
            <li className={coletada ? "done" : "current"}>
              <span>{coletada ? <CheckCircle2 size={21} /> : null}</span>
              <div>
                <strong>{coletada ? message("portal.resumo.coleta.realizada") : message("portal.resumo.coleta")}</strong>
                <p>
                  {coleta
                    ? portalDate(coleta.alteradoEm)
                    : coletada
                      ? message("portal.resumo.coleta.concluida")
                      : message("portal.resumo.aguardando.coleta.2")}
                </p>
              </div>
            </li>
            <li className={emRota ? "current" : "pending"}>
              <span />
              <div>
                <strong>
                  {emRota ? getStatusNames()[entrega.status] : message("portal.resumo.em.rota")}
                </strong>
                <p>
                  {emRota
                    ? entrega.status === "TENTATIVA_FALHOU"
                      ? message("portal.resumo.consulte.o.historico.para.acompanhar.a.retomada")
                      : message("portal.resumo.sua.entrega.esta.em.transito")
                    : message("portal.resumo.aguardando.inicio.da.rota")}
                </p>
              </div>
            </li>
            <li className="pending">
              <span />
              <div>
                <strong>{message("portal.resumo.entregue")}</strong>
                <p>{message("portal.resumo.aguardando.conclusao")}</p>
              </div>
            </li>
          </ol>
        </div>
        <div className="trackingRoute">
          <h3>
            <span className="portalIcon neutral">
              <Route size={23} />
            </span>
            {message("portal.resumo.rota.da.entrega")} </h3>
          {error ? (
            <p role="alert" className="errorMessage">
              {error}
            </p>
          ) : paradas === null ? (
            <p role="status">{message("portal.resumo.carregando.rota")}</p>
          ) : paradas.length ? (
            <PortalRoute
              compact
              paradas={paradas}
              bairros={{
                origem: entrega.bairroOrigem,
                destino: entrega.bairroDestino,
              }}
            />
          ) : (
            <p className="portalEmpty">{message("portal.resumo.rota.ainda.nao.cadastrada")}</p>
          )}
          <div className="trackingValue">
            <span className="portalIcon amber">
              <Package size={25} />
            </span>
            <div>
              <span>{message("portal.resumo.valor.da.entrega")}</span>
              <strong>
                {entrega.status === "SOLICITADA" && !entrega.valorFinal
                  ? message("portal.resumo.a.confirmar")
                  : portalMoney(entrega.valorFinal)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

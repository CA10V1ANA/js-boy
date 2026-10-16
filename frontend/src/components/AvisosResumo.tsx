import { message, useLocale } from '../i18n';
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronRight,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAreaOperacional } from "../hooks/useAreaOperacional";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { portalDate } from "./PortalOverview";

type Aviso = {
  id: string;
  evento: string;
  codigo?: string;
  criadaEm: string;
  lidaEm?: string;
  entregaId?: string;
  conversaId?: string;
};
function conteudo(evento: string, operacional: boolean) {
  const e = evento.toUpperCase();
  if (e.includes("CONVERSA") || e.includes("MENSAGEM"))
    return {
      icon: MessageCircle,
      tone: "blue",
      title: message("avisos.resumo.nova.mensagem"),
      description: message("avisos.resumo.ha.uma.atualizacao.na.conversa.da.entrega"),
    };
  if (
    (e.includes("ROTA") && (e.includes("ATUALIZ") || e.includes("EDIT"))) ||
    e.includes("ENDERECO")
  )
    return {
      icon: MapPin,
      tone: "violet",
      title: message("avisos.resumo.rota.atualizada"),
      description: message("avisos.resumo.confira.os.locais.e.a.ordem.das.paradas"),
    };
  if (e.includes("DESIGN"))
    return {
      icon: Package,
      tone: "amber",
      title: operacional ? message("avisos.resumo.nova.entrega.atribuida") : message("avisos.resumo.entregador.designado"),
      description: operacional
        ? message("avisos.resumo.voce.recebeu.uma.nova.entrega.confira.a.rota")
        : message("avisos.resumo.a.entrega.possui.um.responsavel.designado"),
    };
  if (e.includes("EM_ROTA") || e.includes("SAIDA"))
    return {
      icon: Truck,
      tone: "green",
      title: message("avisos.resumo.entrega.em.rota"),
      description: message("avisos.resumo.acompanhe.o.andamento.da.entrega"),
    };
  if (e.includes("SOLICIT"))
    return {
      icon: Package,
      tone: "amber",
      title: message("avisos.resumo.solicitacao.recebida"),
      description: message("avisos.resumo.a.solicitacao.foi.recebida.para.analise"),
    };
  return {
    icon: FileText,
    tone: "violet",
    title: evento
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase()),
    description: message("avisos.resumo.consulte.o.historico.para.ver.a.atualizacao"),
  };
}
export function AvisosResumo() {
  useLocale();
  const operacional = useAreaOperacional();
  const { usuario } = useAuth();
  const [items, setItems] = useState<Aviso[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void api
      .get<Aviso[]>(
        (operacional ? "/operacao-entregador" : "") + "/notificacoes",
      )
      .then(({ data }) => {
        if (active) setItems(data);
      })
      .catch((r) => {
        if (active)
          setError(apiErrorMessage(r, message("avisos.resumo.nao.foi.possivel.carregar.avisos")));
      });
    return () => {
      active = false;
    };
  }, [operacional]);
  const destino = operacional ? "/operacional/notificacoes" : "/notificacoes";
  function destinoAviso(n: Aviso) {
    if (n.conversaId)
      return (
        (operacional ? "/operacional/conversas" : "/conversas") +
        "?conversa=" +
        n.conversaId
      );
    if (n.entregaId)
      return (
        (operacional
          ? "/minhas-entregas?entrega="
          : usuario?.perfil === "CLIENTE"
            ? "/portal/entregas?entrega="
            : "/entregas?busca=") +
        (usuario?.perfil === "PROPRIETARIO" && !operacional
          ? encodeURIComponent(n.codigo || "")
          : n.entregaId)
      );
    return destino;
  }
  return (
    <section
      className={
        "portalPanel overviewNotices" + (operacional ? " courierNotices" : "")
      }
    >
      <div className="portalPanelHeading">
        <h2>{operacional ? <Bell size={28} /> : null}{message("avisos.resumo.avisos")}</h2>
        <Link className="portalTextLink" to={destino}>
          {message("avisos.resumo.ver.todos")} </Link>
      </div>
      {error ? (
        <p role="alert" className="portalEmpty">
          {error}
        </p>
      ) : !items ? (
        <p role="status" className="portalEmpty">
          {message("avisos.resumo.carregando.avisos")} </p>
      ) : items.length ? (
        <div className="overviewNoticeList">
          {items.slice(0, 2).map((n) => {
            const c = conteudo(n.evento, operacional);
            const Icon = c.icon;
            return (
              <Link className="overviewNotice" key={n.id} to={destinoAviso(n)}>
                <span className={"portalIcon " + c.tone}>
                  <Icon size={24} />
                </span>
                <div>
                  <strong>
                    {!n.lidaEm ? (
                      <i className="noticeUnread" aria-label={message("avisos.resumo.nao.lida")} />
                    ) : null}
                    {c.title}
                  </strong>
                  <p>{c.description}</p>
                  <small>
                    {portalDate(n.criadaEm)}
                    {n.codigo ? " · " + n.codigo : ""}
                  </small>
                </div>
                <ChevronRight size={19} />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="portalEmpty">{message("avisos.resumo.nenhum.aviso.registrado")}</p>
      )}
    </section>
  );
}

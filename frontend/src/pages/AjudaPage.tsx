import { message, useLocale } from '../i18n';
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { useAuth } from "../contexts/AuthContext";
import { useAreaOperacional } from "../hooks/useAreaOperacional";
import { ConfiguracaoEmpresa } from "../types";

export function AjudaPage() {
  useLocale();
  const { usuario } = useAuth();
  const operacional = useAreaOperacional();
  const [contato, setContato] = useState<ConfiguracaoEmpresa | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get<ConfiguracaoEmpresa>(
        usuario?.perfil === "CLIENTE"
          ? "/cliente/contato"
          : operacional
            ? "/operacao-entregador/contato"
            : "/configuracoes/empresa",
      )
      .then((r) => setContato(r.data))
      .catch((r) =>
        setError(
          apiErrorMessage(r, message("ajuda.nao.foi.possivel.consultar.o.atendimento")),
        ),
      );
  }, [usuario?.perfil, operacional]);
  return (
    <main className="page">
      <section className="panelCard notificationPanel">
        <h1>{message("ajuda.ajuda.e.contato")}</h1>
        <p>
          {message("ajuda.para.duvidas.sobre.uma.entrega.use.conversar.mensagens.nao.alteram.p")} </p>
        {error ? <p role="alert">{error}</p> : null}
        {contato ? (
          <>
            <h2>{contato.nomeFantasia}</h2>
            <p>{contato.horarioAtendimento}</p>
            <div className="quickLinks">
              {contato.telefone ? (
                <a className="secondaryButton" href={`tel:${contato.telefone}`}>
                  {message("ajuda.ligar.para")} {contato.telefone}
                </a>
              ) : null}
              {contato.whatsapp ? (
                <a
                  className="secondaryButton"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/${contato.whatsapp.replace(/\D/g, "")}`}
                >
                  {message("ajuda.whatsapp.de.atendimento")} </a>
              ) : null}
              {contato.email ? (
                <a className="secondaryButton" href={`mailto:${contato.email}`}>
                  {contato.email}
                </a>
              ) : null}
            </div>
            {!contato.telefone && !contato.whatsapp && !contato.email ? (
              <p>{message("ajuda.canal.de.atendimento.ainda.nao.configurado.pela.empresa")}</p>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

import { message, useLocale } from '../i18n';
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { Cliente } from "../types";
import { GoogleLoginButton } from "./GoogleLoginButton";

export function ContaClienteEdicao({
  cliente,
  onChange,
}: {
  cliente: Cliente;
  onChange: () => void;
}) {
  useLocale();
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp || "");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [emailAtivo, setEmailAtivo] = useState(true);
  useEffect(() => {
    api
      .get<{ emailAtivo: boolean }>("/cliente/notificacoes/preferencias")
      .then((r) => setEmailAtivo(r.data.emailAtivo))
      .catch((r) =>
        setFeedback(
          apiErrorMessage(r, message("cliente.conta.nao.foi.possivel.consultar.preferencias")),
        ),
      );
  }, []);
  return (
    <section>
      <h2>{message("cliente.conta.contato.e.preferencias")}</h2>
      <form
        className="settingsForm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            await api.patch("/cliente/me", { telefone, whatsapp });
            await api.put("/cliente/notificacoes/preferencias", {
              emailAtivo,
              whatsappAtivo: false,
              smsAtivo: false,
            });
            setFeedback(message("cliente.conta.contato.e.preferencias.atualizados"));
            onChange();
          } catch (r) {
            setFeedback(apiErrorMessage(r, message("cliente.conta.nao.foi.possivel.atualizar")));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {message("cliente.conta.telefone")} <input
            maxLength={30}
            required
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </label>
        <label>
          {message("cliente.conta.whatsapp.de.contato")} <input
            maxLength={30}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={emailAtivo}
            onChange={(e) => setEmailAtivo(e.target.checked)}
          />{" "}
          {message("cliente.conta.receber.avisos.da.entrega.por.e.mail")} </label>
        <button className="secondaryButton" disabled={busy}>
          {message("cliente.conta.atualizar.contato")} </button>
      </form>
      <form
        className="settingsForm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            await api.post("/cliente/me/email", { email });
            setFeedback(
              message("cliente.conta.verifique.o.novo.e.mail.seu.endereco.atual.continua.valido.ate.a.con"),
            );
          } catch (r) {
            setFeedback(
              apiErrorMessage(r, message("cliente.conta.nao.foi.possivel.solicitar.alteracao")),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {message("cliente.conta.novo.e.mail")} <input
            required
            type="email"
            maxLength={180}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button className="secondaryButton" disabled={busy}>
          {message("cliente.conta.solicitar.alteracao.de.e.mail")} </button>
      </form>
      <h2>{message("cliente.conta.vincular.google")}</h2>
      <GoogleLoginButton
        onCredential={(credencial) => {
          if (busy) return;
          setBusy(true);
          void api
            .post("/conta/google", { credencial })
            .then(() => setFeedback(message("cliente.conta.google.vinculado.a.sua.conta")))
            .catch((r) =>
              setFeedback(
                apiErrorMessage(r, message("cliente.conta.nao.foi.possivel.vincular.google")),
              ),
            )
            .finally(() => setBusy(false));
        }}
      />
      {feedback ? <p role="status">{feedback}</p> : null}
      <p>
        {message("cliente.conta.para.alterar.identidade.ou.solicitar.exportacao.exclusao.de.dados.us")} </p>
      <h2>{message("cliente.conta.privacidade")}</h2>
      <button
        type="button"
        className="secondaryButton"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await api.get("/cliente/privacidade/exportar");
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(r.data, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "js-boy-meus-dados.json";
            a.click();
            URL.revokeObjectURL(url);
          } catch (e) {
            setFeedback(apiErrorMessage(e, message("cliente.conta.nao.foi.possivel.exportar")));
          } finally {
            setBusy(false);
          }
        }}
      >
        {message("cliente.conta.exportar.meus.dados")} </button>
      <form
        className="settingsForm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            await api.post("/cliente/privacidade/solicitacoes", {
              tipo: "ANONIMIZACAO",
              justificativa,
            });
            setFeedback(
              message("cliente.conta.pedido.registrado.para.analise.da.js.boy.os.historicos.financeiros.s"),
            );
            setJustificativa("");
          } catch (r) {
            setFeedback(
              apiErrorMessage(r, message("cliente.conta.nao.foi.possivel.registrar.o.pedido")),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {message("cliente.conta.motivo.do.pedido.de.anonimizacao")} <textarea
            required
            maxLength={500}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
          />
        </label>
        <button className="secondaryButton" disabled={busy}>
          {message("cliente.conta.solicitar.analise.de.anonimizacao")} </button>
      </form>
    </section>
  );
}

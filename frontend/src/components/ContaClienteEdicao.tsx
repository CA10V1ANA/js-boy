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
          apiErrorMessage(r, "Não foi possível consultar preferências."),
        ),
      );
  }, []);
  return (
    <section>
      <h2>Contato e preferências</h2>
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
            setFeedback("Contato e preferências atualizados.");
            onChange();
          } catch (r) {
            setFeedback(apiErrorMessage(r, "Não foi possível atualizar."));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Telefone
          <input
            maxLength={30}
            required
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </label>
        <label>
          WhatsApp de contato
          <input
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
          Receber avisos da entrega por e-mail
        </label>
        <button className="secondaryButton" disabled={busy}>
          Atualizar contato
        </button>
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
              "Verifique o novo e-mail. Seu endereço atual continua válido até a confirmação.",
            );
          } catch (r) {
            setFeedback(
              apiErrorMessage(r, "Não foi possível solicitar alteração."),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Novo e-mail
          <input
            required
            type="email"
            maxLength={180}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button className="secondaryButton" disabled={busy}>
          Solicitar alteração de e-mail
        </button>
      </form>
      <h2>Vincular Google</h2>
      <GoogleLoginButton
        onCredential={(credencial) => {
          if (busy) return;
          setBusy(true);
          void api
            .post("/conta/google", { credencial })
            .then(() => setFeedback("Google vinculado à sua conta."))
            .catch((r) =>
              setFeedback(
                apiErrorMessage(r, "Não foi possível vincular Google."),
              ),
            )
            .finally(() => setBusy(false));
        }}
      />
      {feedback ? <p role="status">{feedback}</p> : null}
      <p>
        Para alterar identidade ou solicitar exportação/exclusão de dados, use
        Ajuda e contato. O atendimento respeita a retenção do histórico
        operacional e financeiro.
      </p>
      <h2>Privacidade</h2>
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
            setFeedback(apiErrorMessage(e, "Não foi possível exportar."));
          } finally {
            setBusy(false);
          }
        }}
      >
        Exportar meus dados
      </button>
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
              "Pedido registrado para análise da JS Boy. Os históricos financeiros são preservados.",
            );
            setJustificativa("");
          } catch (r) {
            setFeedback(
              apiErrorMessage(r, "Não foi possível registrar o pedido."),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Motivo do pedido de anonimização
          <textarea
            required
            maxLength={500}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
          />
        </label>
        <button className="secondaryButton" disabled={busy}>
          Solicitar análise de anonimização
        </button>
      </form>
    </section>
  );
}

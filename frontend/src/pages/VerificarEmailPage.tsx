import { message, useLocale } from '../i18n';
import { AppearancePreferences } from '../components/AppearancePreferences';
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";

export function VerificarEmailPage() {
  useLocale();
  const [params] = useSearchParams();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <main className="page cadastroPage">
      <AppearancePreferences />
      <section className="panelCard notificationPanel">
        <h1>{message("email.verificar.verificar.e.mail")}</h1>
        {params.get("token") ? (
          <button
            className="primaryButton"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api.post("/auth/verificar-email", {
                  token: params.get("token"),
                });
                setFeedback(message("email.verificar.e.mail.confirmado.voce.ja.pode.entrar"));
              } catch (r) {
                setFeedback(
                  apiErrorMessage(r, message("email.verificar.nao.foi.possivel.verificar.este.link")),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {message("email.verificar.confirmar.meu.e.mail")} </button>
        ) : (
          <form
            className="settingsForm"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);
              try {
                await api.post("/auth/reenviar-verificacao", { email });
                setFeedback(
                  message("email.verificar.se.houver.cadastro.pendente.as.instrucoes.serao.enviadas"),
                );
              } catch (r) {
                setFeedback(
                  apiErrorMessage(r, message("email.verificar.nao.foi.possivel.solicitar.verificacao")),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              {message("email.verificar.e.mail")} <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="primaryButton" disabled={busy}>
              {message("email.verificar.reenviar.verificacao")} </button>
          </form>
        )}
        {feedback ? <p role="status">{feedback}</p> : null}
        <Link to="/login">{message("email.verificar.entrar")}</Link>
      </section>
    </main>
  );
}

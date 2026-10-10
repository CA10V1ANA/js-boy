import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";

export function VerificarEmailPage() {
  const [params] = useSearchParams();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <main className="page cadastroPage">
      <section className="panelCard notificationPanel">
        <h1>Verificar e-mail</h1>
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
                setFeedback("E-mail confirmado. Você já pode entrar.");
              } catch (r) {
                setFeedback(
                  apiErrorMessage(r, "Não foi possível verificar este link."),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirmar meu e-mail
          </button>
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
                  "Se houver cadastro pendente, as instruções serão enviadas.",
                );
              } catch (r) {
                setFeedback(
                  apiErrorMessage(r, "Não foi possível solicitar verificação."),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              E-mail
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="primaryButton" disabled={busy}>
              Reenviar verificação
            </button>
          </form>
        )}
        {feedback ? <p role="status">{feedback}</p> : null}
        <Link to="/login">Entrar</Link>
      </section>
    </main>
  );
}

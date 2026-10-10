import { useEffect, useState } from "react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";

export function SegurancaConta() {
  const [senhaAtual, setAtual] = useState("");
  const [novaSenha, setNova] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(true);
  useEffect(() => {
    api
      .get<{ senhaLocal: boolean }>("/conta")
      .then((r) => setLocal(r.data.senhaLocal))
      .catch((r) =>
        setFeedback(
          apiErrorMessage(r, "Não foi possível consultar o método de acesso."),
        ),
      );
  }, []);
  if (!local)
    return (
      <section>
        <h2>Segurança da conta</h2>
        <p>
          Seu acesso utiliza Google. Gerencie a segurança na sua conta Google.
        </p>
      </section>
    );
  return (
    <section>
      <h2>Segurança da conta</h2>
      <form
        className="settingsForm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setFeedback("");
          try {
            await api.post("/conta/senha", { senhaAtual, novaSenha });
            setAtual("");
            setNova("");
            setFeedback("Senha alterada. Outras sessões foram revogadas.");
          } catch (r) {
            setFeedback(
              apiErrorMessage(r, "Não foi possível alterar a senha."),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Senha atual
          <input
            required
            type="password"
            autoComplete="current-password"
            value={senhaAtual}
            onChange={(e) => setAtual(e.target.value)}
          />
        </label>
        <label>
          Nova senha
          <input
            required
            type="password"
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
            value={novaSenha}
            onChange={(e) => setNova(e.target.value)}
          />
        </label>
        <small>
          Use pelo menos 12 caracteres, com maiúscula, minúscula e número.
        </small>
        <button className="secondaryButton" disabled={busy}>
          Alterar senha
        </button>
      </form>
      {feedback ? <p role="status">{feedback}</p> : null}
    </section>
  );
}

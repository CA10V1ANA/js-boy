import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";

export function SegurancaConta() {
  const [senhaAtual, setAtual] = useState("");
  const [novaSenha, setNova] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackErro, setFeedbackErro] = useState(false);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(true);
  const [mostrarAtual, setMostrarAtual] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);

  useEffect(() => {
    api.get<{ senhaLocal: boolean }>("/conta")
      .then((r) => setLocal(r.data.senhaLocal))
      .catch((r) => {
        setFeedbackErro(true);
        setFeedback(apiErrorMessage(r, "Não foi possível consultar o método de acesso."));
      });
  }, []);

  const requisitos = [
    { texto: "12 caracteres", valido: novaSenha.length >= 12 },
    { texto: "uma letra maiúscula", valido: /[A-Z]/.test(novaSenha) },
    { texto: "uma letra minúscula", valido: /[a-z]/.test(novaSenha) },
    { texto: "um número", valido: /\d/.test(novaSenha) },
  ];
  const novaSenhaValida = requisitos.every((item) => item.valido);

  if (!local) {
    return (
      <section className="accountSecurity" aria-labelledby="security-heading">
        <div className="accountSecurityHeader">
          <span className="profileSectionIcon"><ShieldCheck size={19} /></span>
          <div><h2 id="security-heading">Segurança da conta</h2><p>Seu acesso é protegido pela sua conta Google.</p></div>
        </div>
        <div className="accountSecurityProvider">
          <ShieldCheck size={22} />
          <div><strong>Login com Google</strong><span>Altere senha e verificações de segurança diretamente na sua conta Google.</span></div>
        </div>
      </section>
    );
  }

  return (
    <section className="accountSecurity" aria-labelledby="security-heading">
      <div className="accountSecurityHeader">
        <span className="profileSectionIcon"><ShieldCheck size={19} /></span>
        <div><h2 id="security-heading">Segurança da conta</h2><p>Troque sua senha somente se desconfiar de um acesso ou quiser renová-la.</p></div>
      </div>
      <form
        className="accountSecurityForm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || !novaSenhaValida) return;
          setBusy(true);
          setFeedback("");
          setFeedbackErro(false);
          try {
            await api.post("/conta/senha", { senhaAtual, novaSenha });
            setAtual("");
            setNova("");
            setFeedback("Senha alterada. Outras sessões foram revogadas.");
          } catch (r) {
            setFeedbackErro(true);
            setFeedback(apiErrorMessage(r, "Não foi possível alterar a senha."));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="accountSecurityFields">
          <label>
            Senha atual
            <span className="passwordField">
              <KeyRound size={17} aria-hidden="true" />
              <input required type={mostrarAtual ? "text" : "password"} autoComplete="current-password" value={senhaAtual} onChange={(e) => setAtual(e.target.value)} />
              <button type="button" onClick={() => setMostrarAtual((valor) => !valor)} aria-label={mostrarAtual ? "Ocultar senha atual" : "Mostrar senha atual"}>
                {mostrarAtual ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <label>
            Nova senha
            <span className="passwordField">
              <KeyRound size={17} aria-hidden="true" />
              <input required type={mostrarNova ? "text" : "password"} minLength={12} maxLength={72} autoComplete="new-password" value={novaSenha} onChange={(e) => setNova(e.target.value)} />
              <button type="button" onClick={() => setMostrarNova((valor) => !valor)} aria-label={mostrarNova ? "Ocultar nova senha" : "Mostrar nova senha"}>
                {mostrarNova ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
        </div>
        <div className="passwordRequirements" aria-live="polite">
          <strong>Sua nova senha precisa ter:</strong>
          <ul>
            {requisitos.map((item) => (
              <li key={item.texto} className={item.valido ? "valid" : ""}><Check size={14} aria-hidden="true" /> {item.texto}</li>
            ))}
          </ul>
        </div>
        <div className="accountSecurityActions">
          <button className="secondaryButton" disabled={busy || !senhaAtual || !novaSenhaValida}>{busy ? "Alterando..." : "Alterar senha"}</button>
          {feedback ? <p className={feedbackErro ? "error" : "success"} role={feedbackErro ? "alert" : "status"}>{feedback}</p> : null}
        </div>
      </form>
    </section>
  );
}

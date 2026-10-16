import { message, useLocale } from '../i18n';
import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";

export function SegurancaConta() {
  useLocale();
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
        setFeedback(apiErrorMessage(r, message("conta.seguranca.nao.foi.possivel.consultar.o.metodo.de.acesso")));
      });
  }, []);

  const requisitos = [
    { texto: message("conta.seguranca.12.caracteres"), valido: novaSenha.length >= 12 },
    { texto: message("conta.seguranca.uma.letra.maiuscula"), valido: /[A-Z]/.test(novaSenha) },
    { texto: message("conta.seguranca.uma.letra.minuscula"), valido: /[a-z]/.test(novaSenha) },
    { texto: message("conta.seguranca.um.numero"), valido: /\d/.test(novaSenha) },
  ];
  const novaSenhaValida = requisitos.every((item) => item.valido);

  if (!local) {
    return (
      <section className="accountSecurity" aria-labelledby="security-heading">
        <div className="accountSecurityHeader">
          <span className="profileSectionIcon"><ShieldCheck size={19} /></span>
          <div><h2 id="security-heading">{message("conta.seguranca.seguranca.da.conta")}</h2><p>{message("conta.seguranca.seu.acesso.e.protegido.pela.sua.conta.google")}</p></div>
        </div>
        <div className="accountSecurityProvider">
          <ShieldCheck size={22} />
          <div><strong>{message("conta.seguranca.login.com.google")}</strong><span>{message("conta.seguranca.altere.senha.e.verificacoes.de.seguranca.diretamente.na.sua.conta.go")}</span></div>
        </div>
      </section>
    );
  }

  return (
    <section className="accountSecurity" aria-labelledby="security-heading">
      <div className="accountSecurityHeader">
        <span className="profileSectionIcon"><ShieldCheck size={19} /></span>
        <div><h2 id="security-heading">{message("conta.seguranca.seguranca.da.conta")}</h2><p>{message("conta.seguranca.troque.sua.senha.somente.se.desconfiar.de.um.acesso.ou.quiser.renova")}</p></div>
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
            setFeedback(message("conta.seguranca.senha.alterada.outras.sessoes.foram.revogadas"));
          } catch (r) {
            setFeedbackErro(true);
            setFeedback(apiErrorMessage(r, message("conta.seguranca.nao.foi.possivel.alterar.a.senha")));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="accountSecurityFields">
          <label>
            {message("conta.seguranca.senha.atual")} <span className="passwordField">
              <KeyRound size={17} aria-hidden="true" />
              <input required type={mostrarAtual ? "text" : "password"} autoComplete="current-password" value={senhaAtual} onChange={(e) => setAtual(e.target.value)} />
              <button type="button" onClick={() => setMostrarAtual((valor) => !valor)} aria-label={mostrarAtual ? message("conta.seguranca.ocultar.senha.atual") : message("conta.seguranca.mostrar.senha.atual")}>
                {mostrarAtual ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <label>
            {message("conta.seguranca.nova.senha")} <span className="passwordField">
              <KeyRound size={17} aria-hidden="true" />
              <input required type={mostrarNova ? "text" : "password"} minLength={12} maxLength={72} autoComplete="new-password" value={novaSenha} onChange={(e) => setNova(e.target.value)} />
              <button type="button" onClick={() => setMostrarNova((valor) => !valor)} aria-label={mostrarNova ? message("conta.seguranca.ocultar.nova.senha") : message("conta.seguranca.mostrar.nova.senha")}>
                {mostrarNova ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
        </div>
        <div className="passwordRequirements" aria-live="polite">
          <strong>{message("conta.seguranca.sua.nova.senha.precisa.ter")}</strong>
          <ul>
            {requisitos.map((item) => (
              <li key={item.texto} className={item.valido ? "valid" : ""}><Check size={14} aria-hidden="true" /> {item.texto}</li>
            ))}
          </ul>
        </div>
        <div className="accountSecurityActions">
          <button className="secondaryButton" disabled={busy || !senhaAtual || !novaSenhaValida}>{busy ? message("comum.alterando") : message("conta.seguranca.alterar.senha")}</button>
          {feedback ? <p className={feedbackErro ? "error" : "success"} role={feedbackErro ? "alert" : "status"}>{feedback}</p> : null}
        </div>
      </form>
    </section>
  );
}

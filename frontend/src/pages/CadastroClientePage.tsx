import { FormEvent, useRef, useState } from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { useAuth } from "../contexts/AuthContext";
import { AuthTabs } from "../components/AuthTabs";
import { PublicHeader, SiteFooter } from "./LandingPage";

const vazio = {
  nome: "",
  email: "",
  telefone: "",
  documento: "",
  logradouro: "",
  numero: "",
  semNumero: false,
  bairro: "",
  cidade: "Fortaleza",
  estado: "CE",
};
export function CadastroClientePage() {
  const [form, setForm] = useState(vazio);
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const numeroAnterior = useRef("");
  const location = useLocation();
  const navigate = useNavigate();
  const { entrarGoogle } = useAuth();
  const credencial = (location.state as { credencial?: string } | null)
    ?.credencial;
  const requisitosSenha = [
    { id: "tamanho", label: "Pelo menos 12 caracteres", completo: senha.length >= 12 },
    { id: "maiuscula", label: "Uma letra maiúscula", completo: /[A-Z]/.test(senha) },
    { id: "minuscula", label: "Uma letra minúscula", completo: /[a-z]/.test(senha) },
    { id: "numero", label: "Um número", completo: /\d/.test(senha) },
  ];
  const senhaValida = requisitosSenha.every((requisito) => requisito.completo);

  function alternarSemNumero(semNumero: boolean) {
    setForm((atual) => {
      if (semNumero) {
        numeroAnterior.current = atual.numero;
        return { ...atual, semNumero: true, numero: "" };
      }

      return { ...atual, semNumero: false, numero: numeroAnterior.current };
    });
  }

  async function cadastrar(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFeedback("");
    const cliente = {
      ...form,
      telefone: form.telefone.replace(/\D/g, ""),
      documento: form.documento.replace(/\D/g, ""),
      numero: form.semNumero ? "S/N" : form.numero,
      endereco: form.logradouro,
      whatsapp: "",
    };
    try {
      if (credencial) {
        await entrarGoogle(credencial, cliente);
        navigate("/portal", { replace: true });
      } else {
        await api.post("/auth/cadastro-cliente", { cliente, senha });
        setFeedback(
          "Cadastro recebido. Confira seu e-mail para ativar o acesso ao portal.",
        );
      }
    } catch (r) {
      setFeedback(apiErrorMessage(r, "Não foi possível concluir o cadastro."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="sitePage">
      <PublicHeader />
      <section className="clientArea clientRegistrationArea">
        <div className="siteContainer">
          <h1>Criar conta como cliente</h1>
          <section className="clientLoginCard clientRegistrationCard">
            <AuthTabs active="cadastro" />
            <p className="clientRegistrationIntro">
              Solicite entregas e acompanhe os serviços da sua empresa.
            </p>
            <form className="clientRegistrationForm" onSubmit={cadastrar}>
              {Object.entries({
                nome: "Nome ou razão social",
                email: "E-mail",
                telefone: "Telefone",
                documento: "CPF ou CNPJ (opcional)",
                logradouro: "Logradouro",
                numero: "Número",
                bairro: "Bairro",
                cidade: "Cidade",
                estado: "UF",
              }).map(([key, label]) => (
                <label
                  className={key === "nome" || key === "logradouro" ? "registrationWide" : undefined}
                  key={key}
                >
                  {label}
                  <input
                    type={key === "email" ? "email" : "text"}
                    required={
                      key !== "documento" && !(key === "numero" && form.semNumero)
                    }
                    disabled={busy || (key === "numero" && form.semNumero)}
                    aria-describedby={key === "numero" && form.semNumero ? "numero-desativado" : undefined}
                    placeholder={key === "numero" && form.semNumero ? "Não se aplica" : undefined}
                    maxLength={
                      key === "estado"
                        ? 2
                        : key === "numero"
                          ? 20
                          : key === "telefone" || key === "documento"
                            ? 30
                            : key === "nome"
                              ? 140
                              : key === "bairro" || key === "cidade"
                                ? 80
                                : 180
                    }
                    value={form[key as keyof typeof vazio] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                  {key === "numero" && form.semNumero ? (
                    <small className="disabledFieldHint" id="numero-desativado">
                      Campo desativado. Desmarque “Sem número” para restaurar o valor informado.
                    </small>
                  ) : null}
                </label>
              ))}
              <label className="registrationCheckbox registrationWide">
                <input
                  type="checkbox"
                  checked={form.semNumero}
                  onChange={(e) => alternarSemNumero(e.target.checked)}
                />
                <span>
                  <strong>Sem número</strong>
                  <small>Use quando o endereço não possui numeração.</small>
                </span>
              </label>
              {!credencial ? (
                <div className="registrationPassword registrationWide">
                  <div className="registrationPasswordHeader">
                    <label htmlFor="cadastro-senha">Senha</label>
                    <span aria-live="polite">
                      {requisitosSenha.filter((requisito) => requisito.completo).length} de 4 requisitos
                    </span>
                  </div>
                  <span className="passwordInputWrap">
                    <input
                      id="cadastro-senha"
                      required
                      type={senhaVisivel ? "text" : "password"}
                      minLength={12}
                      maxLength={72}
                      autoComplete="new-password"
                      aria-invalid={senha.length > 0 && !senhaValida}
                      aria-describedby="requisitos-cadastro-senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                    <button
                      className="passwordVisibilityButton"
                      type="button"
                      aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                      aria-pressed={senhaVisivel}
                      onClick={() => setSenhaVisivel((visivel) => !visivel)}
                    >
                      {senhaVisivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </span>
                  <ul className="passwordRequirements" id="requisitos-cadastro-senha">
                    {requisitosSenha.map((requisito) => (
                      <li className={requisito.completo ? "complete" : undefined} key={requisito.id}>
                        {requisito.completo ? <Check size={15} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
                        {requisito.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="registrationWide">Seu acesso será vinculado ao Google verificado.</p>
              )}
              <button
                className="primaryButton registrationWide"
                disabled={busy || (!credencial && !senhaValida)}
              >
                {busy ? "Enviando..." : "Criar conta de cliente"}
              </button>
            </form>
            {feedback ? <p className="registrationFeedback" role="status">{feedback}</p> : null}
            <p className="registrationHelp">
              Já iniciou o cadastro? <Link to="/verificar-email">Reenviar verificação</Link>
            </p>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

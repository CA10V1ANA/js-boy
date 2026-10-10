import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { useAuth } from "../contexts/AuthContext";

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
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { entrarGoogle } = useAuth();
  const credencial = (location.state as { credencial?: string } | null)
    ?.credencial;
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
    <main className="page cadastroPage">
      <section className="panelCard notificationPanel">
        <h1>Criar conta como cliente</h1>
        <p>Solicite entregas e acompanhe os serviços da sua empresa.</p>
        <form className="settingsForm" onSubmit={cadastrar}>
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
            <label key={key}>
              {label}
              <input
                type={key === "email" ? "email" : "text"}
                required={
                  key !== "documento" && !(key === "numero" && form.semNumero)
                }
                disabled={busy || (key === "numero" && form.semNumero)}
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
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={form.semNumero}
              onChange={(e) =>
                setForm({ ...form, semNumero: e.target.checked })
              }
            />{" "}
            Sem número
          </label>
          {!credencial ? (
            <label>
              Senha
              <input
                required
                type="password"
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <small>12 caracteres, maiúscula, minúscula e número.</small>
            </label>
          ) : (
            <p>Seu acesso será vinculado ao Google verificado.</p>
          )}
          <button className="primaryButton" disabled={busy}>
            {busy ? "Enviando..." : "Criar conta de cliente"}
          </button>
        </form>
        {feedback ? <p role="status">{feedback}</p> : null}
        <p>
          <Link to="/login">Já tenho conta</Link> ·{" "}
          <Link to="/verificar-email">Reenviar verificação</Link>
        </p>
      </section>
    </main>
  );
}

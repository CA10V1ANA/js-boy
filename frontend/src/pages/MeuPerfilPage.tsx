import { useEffect, useState } from "react";
import { BadgeCheck, Bike, CircleAlert, Mail, Phone, UserRound, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { SegurancaConta } from "../components/SegurancaConta";
import { api } from "../services/api";
import { apiErrorMessage } from "../services/apiError";
import { Entregador } from "../types";
import { sentenceCase, titleCase } from "../utils/display";
import { formatPhone, onlyDigits } from "../utils/inputMasks";

function iniciais(nome: string) {
  return titleCase(nome).split(" ").filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("");
}

export function MeuPerfilPage() {
  const [perfil, setPerfil] = useState<Entregador | null>(null);
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Entregador>("/operacao-entregador/perfil")
      .then((r) => {
        setPerfil(r.data);
        setTelefone(formatPhone(r.data.telefone));
      })
      .catch((r) => setError(apiErrorMessage(r, "Perfil indisponível.")));
  }, []);

  const telefoneValido = onlyDigits(telefone).length >= 10;
  const telefoneAlterado = perfil !== null && onlyDigits(telefone) !== onlyDigits(perfil.telefone);

  if (!perfil && !error) {
    return (
      <main className="page profilePage">
        <div className="asyncState" role="status">
          <span className="profileLoadingMark" aria-hidden="true" />
          <strong>Carregando seu perfil</strong>
          <span>Estamos buscando seus dados de acesso e operação.</span>
        </div>
      </main>
    );
  }

  return (
    <main className="page profilePage">
      <header className="profilePageIntro">
        <div>
          <span className="profileEyebrow">CONTA DO ENTREGADOR</span>
          <h1>Meu perfil</h1>
          <p>Confira seus dados e mantenha seu contato atualizado para a operação do dia.</p>
        </div>
        <span className={`profileAvailability ${perfil?.disponivel ? "isAvailable" : ""}`}>
          <span aria-hidden="true" />
          {perfil?.disponivel ? "Disponível para entregas" : "Indisponível no momento"}
        </span>
      </header>

      {error ? (
        <div className="profileMessage error" role="alert"><CircleAlert size={18} /><span>{error}</span></div>
      ) : null}

      {perfil ? (
        <>
          <section className="panelCard profileIdentityCard" aria-labelledby="profile-name">
            <div className="profileAvatar" aria-hidden="true">{iniciais(perfil.nome)}</div>
            <div className="profileIdentityText">
              <div className="profileRole"><BadgeCheck size={15} /> Entregador</div>
              <h2 id="profile-name">{titleCase(perfil.nome)}</h2>
              <p><Mail size={16} /> {perfil.email || "E-mail não informado"}</p>
            </div>
            <div className="profileIdentityHint">
              <UserRound size={18} />
              <span>Nome e e-mail são protegidos. Para alterá-los, fale com o proprietário.</span>
            </div>
          </section>

          <div className="profileContentGrid">
            <section className="panelCard profileSection" aria-labelledby="contact-heading">
              <div className="profileSectionHeader">
                <span className="profileSectionIcon"><Phone size={19} /></span>
                <div><h2 id="contact-heading">Telefone de contato</h2><p>Usado pela equipe durante coletas e entregas.</p></div>
              </div>
              <form
                className="profileContactForm"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (busy || !telefoneAlterado || !telefoneValido) return;
                  setBusy(true);
                  setFeedback("");
                  try {
                    const atualizado = (await api.patch<Entregador>("/operacao-entregador/perfil", { telefone: onlyDigits(telefone) })).data;
                    setPerfil(atualizado);
                    setTelefone(formatPhone(atualizado.telefone));
                    setError("");
                    setFeedback("Telefone atualizado com sucesso.");
                  } catch (r) {
                    setError(apiErrorMessage(r, "Não foi possível atualizar contato."));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label htmlFor="profile-phone">Seu telefone</label>
                <div className="profilePhoneField">
                  <Phone size={18} aria-hidden="true" />
                  <input
                    id="profile-phone"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={15}
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    aria-describedby="profile-phone-help"
                    aria-invalid={telefone.length > 0 && !telefoneValido}
                    onChange={(e) => {
                      setTelefone(formatPhone(e.target.value));
                      setFeedback("");
                      setError("");
                    }}
                  />
                </div>
                <p id="profile-phone-help" className={`profileFieldHelp ${telefone.length > 0 && !telefoneValido ? "error" : ""}`}>
                  {telefone.length > 0 && !telefoneValido ? "Informe o DDD e um telefone válido." : "Digite apenas números; a formatação é automática."}
                </p>
                <button className="primaryButton" disabled={busy || !telefoneAlterado || !telefoneValido}>
                  {busy ? "Salvando..." : telefoneAlterado ? "Salvar telefone" : "Telefone atualizado"}
                </button>
                {feedback ? <p className="profileMessage success" role="status"><BadgeCheck size={18} /> {feedback}</p> : null}
              </form>
            </section>

            <section className="panelCard profileSection" aria-labelledby="operation-heading">
              <div className="profileSectionHeader">
                <span className="profileSectionIcon"><Bike size={19} /></span>
                <div><h2 id="operation-heading">Dados operacionais</h2><p>Informações usadas para organizar suas entregas e recebimentos.</p></div>
              </div>
              <dl className="profileOperationalList">
                <div>
                  <dt><Bike size={17} /> Veículo</dt>
                  <dd>{sentenceCase(perfil.tipoVeiculo)}</dd>
                  <span>{perfil.placaVeiculo || "Placa não informada"}</span>
                </div>
                <div>
                  <dt><WalletCards size={17} /> Recebimento via Pix</dt>
                  <dd>{perfil.chavePix ? "Pix configurado" : "Pix ainda não configurado"}</dd>
                  <span>{perfil.chavePix ? `${perfil.titularPix || "Titular não informado"} · ${perfil.chavePix}` : "Peça ao proprietário para cadastrar sua chave."}</span>
                </div>
              </dl>
              <div className="profileReadOnlyNotice">
                <CircleAlert size={18} />
                <p>Veículo e Pix são alterados pelo proprietário para proteger os recebimentos. <Link to="/operacional/ajuda">Preciso de ajuda</Link></p>
              </div>
            </section>
          </div>

          <div className="panelCard profileSecurityCard"><SegurancaConta /></div>
        </>
      ) : null}
    </main>
  );
}

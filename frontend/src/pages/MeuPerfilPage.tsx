import { domainLabel } from '../i18n/domain';
import { message, useLocale } from '../i18n';
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
  useLocale();
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
      .catch((r) => setError(apiErrorMessage(r, message("entregador.perfil.perfil.indisponivel"))));
  }, []);

  const telefoneValido = onlyDigits(telefone).length >= 10;
  const telefoneAlterado = perfil !== null && onlyDigits(telefone) !== onlyDigits(perfil.telefone);

  if (!perfil && !error) {
    return (
      <main className="page profilePage">
        <div className="asyncState" role="status">
          <span className="profileLoadingMark" aria-hidden="true" />
          <strong>{message("entregador.perfil.carregando.seu.perfil")}</strong>
          <span>{message("entregador.perfil.estamos.buscando.seus.dados.de.acesso.e.operacao")}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="page profilePage">
      <header className="profilePageIntro">
        <div>
          <span className="profileEyebrow">{message("entregador.perfil.conta.do.entregador")}</span>
          <h1>{message("entregador.perfil.meu.perfil")}</h1>
          <p>{message("entregador.perfil.confira.seus.dados.e.mantenha.seu.contato.atualizado.para.a.operacao")}</p>
        </div>
        <span className={`profileAvailability ${perfil?.disponivel ? "isAvailable" : ""}`}>
          <span aria-hidden="true" />
          {perfil?.disponivel ? message("entregador.perfil.disponivel.para.entregas") : message("entregador.perfil.indisponivel.no.momento")}
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
              <div className="profileRole"><BadgeCheck size={15} /> {message("entregador.perfil.entregador")}</div>
              <h2 id="profile-name">{titleCase(perfil.nome)}</h2>
              <p><Mail size={16} /> {perfil.email || message("entregador.perfil.e.mail.nao.informado")}</p>
            </div>
            <div className="profileIdentityHint">
              <UserRound size={18} />
              <span>{message("entregador.perfil.nome.e.e.mail.sao.protegidos.para.altera.los.fale.com.o.proprietario")}</span>
            </div>
          </section>

          <div className="profileContentGrid">
            <section className="panelCard profileSection" aria-labelledby="contact-heading">
              <div className="profileSectionHeader">
                <span className="profileSectionIcon"><Phone size={19} /></span>
                <div><h2 id="contact-heading">{message("entregador.perfil.telefone.de.contato")}</h2><p>{message("entregador.perfil.usado.pela.equipe.durante.coletas.e.entregas")}</p></div>
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
                    setFeedback(message("entregador.perfil.telefone.atualizado.com.sucesso"));
                  } catch (r) {
                    setError(apiErrorMessage(r, message("entregador.perfil.nao.foi.possivel.atualizar.contato")));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label htmlFor="profile-phone">{message("entregador.perfil.seu.telefone")}</label>
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
                  {telefone.length > 0 && !telefoneValido ? message("entregador.perfil.informe.o.ddd.e.um.telefone.valido") : message("entregador.perfil.digite.apenas.numeros.a.formatacao.e.automatica")}
                </p>
                <button className="primaryButton" disabled={busy || !telefoneAlterado || !telefoneValido}>
                  {busy ? message("comum.salvando") : telefoneAlterado ? message("entregador.perfil.salvar.telefone") : message("entregador.perfil.telefone.atualizado")}
                </button>
                {feedback ? <p className="profileMessage success" role="status"><BadgeCheck size={18} /> {feedback}</p> : null}
              </form>
            </section>

            <section className="panelCard profileSection" aria-labelledby="operation-heading">
              <div className="profileSectionHeader">
                <span className="profileSectionIcon"><Bike size={19} /></span>
                <div><h2 id="operation-heading">{message("entregador.perfil.dados.operacionais")}</h2><p>{message("entregador.perfil.informacoes.usadas.para.organizar.suas.entregas.e.recebimentos")}</p></div>
              </div>
              <dl className="profileOperationalList">
                <div>
                  <dt><Bike size={17} /> {message("entregador.perfil.veiculo")}</dt>
                  <dd>{domainLabel(perfil.tipoVeiculo)}</dd>
                  <span>{perfil.placaVeiculo || message("entregador.perfil.placa.nao.informada")}</span>
                </div>
                <div>
                  <dt><WalletCards size={17} /> {message("entregador.perfil.recebimento.via.pix")}</dt>
                  <dd>{perfil.chavePix ? message("entregador.perfil.pix.configurado") : message("entregador.perfil.pix.ainda.nao.configurado")}</dd>
                  <span>{perfil.chavePix ? `${perfil.titularPix || message("entregador.perfil.titular.nao.informado")} · ${perfil.chavePix}` : message("entregador.perfil.peca.ao.proprietario.para.cadastrar.sua.chave")}</span>
                </div>
              </dl>
              <div className="profileReadOnlyNotice">
                <CircleAlert size={18} />
                <p>{message("entregador.perfil.veiculo.e.pix.sao.alterados.pelo.proprietario.para.proteger.os.receb")} <Link to="/operacional/ajuda">{message("entregador.perfil.preciso.de.ajuda")}</Link></p>
              </div>
            </section>
          </div>

          <div className="panelCard profileSecurityCard"><SegurancaConta /></div>
        </>
      ) : null}
    </main>
  );
}

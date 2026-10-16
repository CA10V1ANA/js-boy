import { message, useLocale } from '../i18n';
export function PoliticaPrivacidadePage() {
  useLocale();
  return <article className="siteSection siteContainer privacyPolicy">
    <header><span className="siteEyebrow">{message("politica.privacidade.transparencia.e.privacidade")}</span><h1>{message("politica.privacidade.politica.de.privacidade")}</h1><p>{message("politica.privacidade.ultima.atualizacao.8.de.outubro.de.2026")}</p></header>
    <h2>{message("politica.privacidade.quais.dados.tratamos")}</h2><p>{message("politica.privacidade.tratamos.dados.cadastrais.de.contato.endereco.entregas.pagamentos.co")}</p>
    <h2>{message("politica.privacidade.para.que.usamos.os.dados")}</h2><p>{message("politica.privacidade.usamos.os.dados.para.prestar.e.acompanhar.entregas.manter.contas.ate")}</p>
    <h2>{message("politica.privacidade.compartilhamento.e.conservacao")}</h2><p>{message("politica.privacidade.os.dados.sao.acessados.apenas.por.pessoas.e.fornecedores.necessarios")}</p>
    <h2>{message("politica.privacidade.cookies.e.armazenamento.local")}</h2><p>{message("politica.privacidade.usamos.um.cookie.essencial.de.sessao.para.renovar.o.acesso.e.armazen")}</p>
    <h2>{message("politica.privacidade.seus.direitos")}</h2><p>{message("politica.privacidade.voce.pode.solicitar.confirmacao.acesso.correcao.portabilidade.anonim")}</p>
    <h2>{message("politica.privacidade.seguranca")}</h2><p>{message("politica.privacidade.adotamos.controles.tecnicos.e.organizacionais.para.reduzir.acessos.i")}</p>
    <h2>{message("politica.privacidade.contato")}</h2><p>{message("politica.privacidade.para.duvidas.ou.solicitacoes.de.privacidade.escreva.para")} <a href="mailto:empresajsboy@gmail.com">empresajsboy@gmail.com</a>{message("politica.privacidade.poderemos.solicitar.informacoes.adicionais.para.confirmar.a.identida")}</p>
  </article>;
}

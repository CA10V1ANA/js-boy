import { domainLabel } from '../i18n/domain';
import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import { Filter, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Auditoria } from '../types';
import { sentenceCase, titleCase } from '../utils/display';

export function AuditoriaPage() {
  useLocale();
  const [items, setItems] = useState<Auditoria[]>([]);
  const [entidade, setEntidade] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems((await api.get<Auditoria[]>('/auditorias', { params: entidade ? { entidade } : undefined })).data); }
    catch (reason) { setError(apiErrorMessage(reason, message("auditoria.nao.foi.possivel.carregar.a.auditoria"))); }
    finally { setLoading(false); }
  }, [entidade]);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="page">
      <div className="pageHeader"><div><h1>{message("auditoria.auditoria")}</h1><p>{message("auditoria.historico.seguro.das.acoes.realizadas.no.sistema.sem.expor.senhas.ou")}</p></div></div>
      <section className="infoBanner"><span className="infoBannerIcon"><ShieldCheck size={20} /></span><div><strong>{message("auditoria.para.que.serve")}</strong><p>{message("auditoria.esta.area.ajuda.a.identificar.quem.realizou.uma.alteracao.e.quando.e")}</p></div></section>
      <div className="filterBar compactFilterBar">
        <label className="filterSelect"><Filter size={17} /><span>{message("auditoria.filtrar.por")}</span><select value={entidade} onChange={(event) => setEntidade(event.target.value)}><option value="">{message("auditoria.todas.as.areas")}</option><option value="ENTREGA">{message("auditoria.entregas")}</option><option value="CLIENTE">{message("auditoria.clientes")}</option><option value="ENTREGADOR">{message("auditoria.entregadores")}</option><option value="PAGAMENTO">{message("auditoria.pagamentos")}</option><option value="USUARIO">{message("auditoria.usuarios")}</option><option value="CONFIGURACAO_PRECO">{message("auditoria.precos")}</option></select></label>
      </div>
      {loading ? <LoadingState label={message("auditoria.carregando.auditoria")} /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title={message("auditoria.nenhum.evento.registrado")} /> : null}
      {!loading && !error && items.length > 0 ? (
        <section className="adminList">
          <div className="tableWrap"><table className="responsiveTable"><thead><tr><th>{message("auditoria.acao")}</th><th>{message("auditoria.area")}</th><th>{message("auditoria.responsavel")}</th><th>{message("auditoria.perfil")}</th><th>{message("auditoria.quando")}</th><th>{message("auditoria.motivo")}</th></tr></thead><tbody>
            {items.map((item) => <tr key={item.id}>
              <td data-label={message("auditoria.acao")}><strong className="cellPrimary">{domainLabel(item.acao)}</strong><span className="cellSub">{message("auditoria.registro.protegido")}</span></td>
              <td data-label={message("auditoria.area")}>{domainLabel(item.entidade)}</td>
              <td data-label={message("auditoria.responsavel")}>{titleCase(item.usuarioNome)}</td>
              <td data-label={message("auditoria.perfil")}><span className="statusBadge">{domainLabel(item.perfil)}</span></td>
              <td data-label={message("auditoria.quando")}>{new Date(item.ocorridoEm).toLocaleString(getLocale())}</td>
              <td data-label={message("auditoria.motivo")}>{item.motivo ? sentenceCase(item.motivo) : message("auditoria.nao.informado")}</td>
            </tr>)}
          </tbody></table></div>
        </section>
      ) : null}
    </main>
  );
}

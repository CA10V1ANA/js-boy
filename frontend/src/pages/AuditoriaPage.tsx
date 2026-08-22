import { Filter, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Auditoria } from '../types';
import { sentenceCase, titleCase } from '../utils/display';

export function AuditoriaPage() {
  const [items, setItems] = useState<Auditoria[]>([]);
  const [entidade, setEntidade] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems((await api.get<Auditoria[]>('/auditorias', { params: entidade ? { entidade } : undefined })).data); }
    catch (reason) { setError(apiErrorMessage(reason, 'Não foi possível carregar a auditoria.')); }
    finally { setLoading(false); }
  }, [entidade]);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="page">
      <div className="pageHeader"><div><h1>Auditoria</h1><p>Histórico seguro das ações realizadas no sistema, sem expor senhas ou códigos internos.</p></div></div>
      <section className="infoBanner"><span className="infoBannerIcon"><ShieldCheck size={20} /></span><div><strong>Para que serve?</strong><p>Esta área ajuda a identificar quem realizou uma alteração e quando ela aconteceu. Os identificadores técnicos permanecem protegidos.</p></div></section>
      <div className="filterBar compactFilterBar">
        <label className="filterSelect"><Filter size={17} /><span>Filtrar por:</span><select value={entidade} onChange={(event) => setEntidade(event.target.value)}><option value="">Todas as áreas</option><option value="ENTREGA">Entregas</option><option value="CLIENTE">Clientes</option><option value="ENTREGADOR">Entregadores</option><option value="PAGAMENTO">Pagamentos</option><option value="USUARIO">Usuários</option><option value="CONFIGURACAO_PRECO">Preços</option></select></label>
      </div>
      {loading ? <LoadingState label="Carregando auditoria..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="Nenhum evento registrado" /> : null}
      {!loading && !error && items.length > 0 ? (
        <section className="adminList">
          <div className="tableWrap"><table className="responsiveTable"><thead><tr><th>Ação</th><th>Área</th><th>Responsável</th><th>Perfil</th><th>Quando</th><th>Motivo</th></tr></thead><tbody>
            {items.map((item) => <tr key={item.id}>
              <td data-label="Ação"><strong className="cellPrimary">{sentenceCase(item.acao)}</strong><span className="cellSub">Registro protegido</span></td>
              <td data-label="Área">{sentenceCase(item.entidade)}</td>
              <td data-label="Responsável">{titleCase(item.usuarioNome)}</td>
              <td data-label="Perfil"><span className="statusBadge">{sentenceCase(item.perfil)}</span></td>
              <td data-label="Quando">{new Date(item.ocorridoEm).toLocaleString('pt-BR')}</td>
              <td data-label="Motivo">{item.motivo ? sentenceCase(item.motivo) : 'Não informado'}</td>
            </tr>)}
          </tbody></table></div>
        </section>
      ) : null}
    </main>
  );
}

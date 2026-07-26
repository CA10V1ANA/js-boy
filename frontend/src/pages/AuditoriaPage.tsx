import { useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { Auditoria } from '../types';

export function AuditoriaPage() {
  const [items, setItems] = useState<Auditoria[]>([]);
  const [entidade, setEntidade] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<Auditoria[]>('/auditorias', { params: entidade ? { entidade } : undefined });
      setItems(response.data);
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Nao foi possivel carregar a auditoria.'));
    } finally {
      setLoading(false);
    }
  }, [entidade]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="page">
      <div className="pageHeader">
        <div><h1>Auditoria</h1><p>Acoes operacionais registradas sem senhas ou tokens.</p></div>
      </div>
      <div className="filterBar">
        <label>
          Entidade
          <select value={entidade} onChange={(event) => setEntidade(event.target.value)}>
            <option value="">Todas</option>
            <option value="ENTREGA">Entregas</option>
            <option value="CLIENTE">Clientes</option>
            <option value="ENTREGADOR">Entregadores</option>
            <option value="PAGAMENTO">Pagamentos</option>
            <option value="USUARIO">Usuarios</option>
            <option value="CONFIGURACAO_PRECO">Precos</option>
          </select>
        </label>
      </div>
      {loading ? <LoadingState label="Carregando auditoria..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="Nenhum evento registrado" /> : null}
      {!loading && !error && items.length > 0 ? (
        <section className="responsiveList" aria-label="Eventos de auditoria">
          {items.map((item) => (
            <article className="auditCard" key={item.id}>
              <div><strong>{item.acao.replace(/_/g, ' ')}</strong><span>{item.entidade} · {item.entidadeId}</span></div>
              <dl>
                <div><dt>Responsavel</dt><dd>{item.usuarioNome} ({item.perfil})</dd></div>
                <div><dt>Quando</dt><dd>{new Date(item.ocorridoEm).toLocaleString('pt-BR')}</dd></div>
                {item.motivo ? <div><dt>Motivo</dt><dd>{item.motivo}</dd></div> : null}
              </dl>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Entrega, StatusEntrega } from '../types';

const statusPermitidos: StatusEntrega[] = ['COLETADA', 'EM_ROTA', 'ENTREGUE'];

function labelStatus(status: StatusEntrega) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

export function MinhasEntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarEntregas();
  }, []);

  async function carregarEntregas() {
    setErro('');

    try {
      const response = await api.get<Entrega[]>('/entregas/minhas-entregas');
      setEntregas(response.data);
    } catch {
      setErro('Nao foi possivel carregar suas entregas.');
    }
  }

  async function alterarStatus(entrega: Entrega, status: StatusEntrega) {
    setErro('');
    setMensagem('');

    try {
      await api.patch(`/entregas/minhas-entregas/${entrega.id}/status`, { status });
      setMensagem('Status atualizado.');
      await carregarEntregas();
    } catch {
      setErro('Nao foi possivel atualizar esta entrega.');
    }
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>Minhas entregas</h1>
          <p>Origem, destino, contato do destinatario e atualizacao do andamento.</p>
        </div>
      </div>

      {mensagem ? <p className="successMessage">{mensagem}</p> : null}
      {erro ? <p className="errorMessage">{erro}</p> : null}

      <section className="deliveryCards">
        {entregas.map((entrega) => (
          <article className="deliveryCard" key={entrega.id}>
            <div>
              <span>{entrega.codigo}</span>
              <strong>{entrega.destinatarioNome}</strong>
              <p>{entrega.enderecoDestino}, {entrega.bairroDestino}</p>
            </div>
            <dl>
              <div><dt>Origem</dt><dd>{entrega.enderecoOrigem}, {entrega.bairroOrigem}</dd></div>
              <div><dt>Telefone</dt><dd>{entrega.destinatarioTelefone}</dd></div>
              <div><dt>Mercadoria</dt><dd>{entrega.descricaoMercadoria}</dd></div>
              <div><dt>Status</dt><dd><span className={entrega.status === 'ENTREGUE' ? 'statusBadge active' : 'statusBadge'}>{labelStatus(entrega.status)}</span></dd></div>
            </dl>
            <div className="rowActions">
              {statusPermitidos.map((status) => (
                <button key={status} onClick={() => alterarStatus(entrega, status)}>{labelStatus(status)}</button>
              ))}
            </div>
          </article>
        ))}
        {entregas.length === 0 ? <div className="emptyState">Nenhuma entrega designada para voce.</div> : null}
      </section>
    </main>
  );
}

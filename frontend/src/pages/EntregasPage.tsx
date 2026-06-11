import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Cliente, Entrega, EntregaForm, Entregador, StatusEntrega } from '../types';

const emptyForm: EntregaForm = {
  clienteId: '',
  entregadorId: '',
  enderecoOrigem: '',
  bairroOrigem: '',
  enderecoDestino: '',
  bairroDestino: '',
  destinatarioNome: '',
  destinatarioTelefone: '',
  descricaoMercadoria: '',
  observacoes: '',
  distanciaKm: '0',
  valorFinal: '',
  observacaoValorManual: '',
};

const statusOptions: StatusEntrega[] = [
  'SOLICITADA',
  'CONFIRMADA',
  'AGUARDANDO_ENTREGADOR',
  'ENTREGADOR_DESIGNADO',
  'COLETADA',
  'EM_ROTA',
  'ENTREGUE',
  'CANCELADA',
];

function labelStatus(status: StatusEntrega) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [form, setForm] = useState<EntregaForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarBase();
  }, []);

  async function carregarBase() {
    await Promise.all([carregarEntregas(), carregarClientes(), carregarEntregadores()]);
  }

  async function carregarEntregas(search = busca) {
    setErro('');

    try {
      const response = await api.get<Entrega[]>('/entregas', {
        params: search ? { busca: search } : undefined,
      });
      setEntregas(response.data);
    } catch {
      setErro('Nao foi possivel carregar entregas.');
    }
  }

  async function carregarClientes() {
    const response = await api.get<Cliente[]>('/clientes');
    setClientes(response.data.filter((cliente) => cliente.ativo));
  }

  async function carregarEntregadores() {
    const response = await api.get<Entregador[]>('/entregadores');
    setEntregadores(response.data.filter((entregador) => entregador.ativo));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro('');
    setMensagem('');

    const payload = {
      ...form,
      entregadorId: form.entregadorId || null,
      distanciaKm: Number(form.distanciaKm),
      valorFinal: form.valorFinal ? Number(form.valorFinal) : null,
    };

    try {
      if (editingId) {
        await api.put(`/entregas/${editingId}`, payload);
        setMensagem('Entrega atualizada.');
      } else {
        await api.post('/entregas', payload);
        setMensagem('Entrega criada.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await carregarEntregas();
    } catch {
      setErro('Revise os dados da entrega e tente novamente.');
    }
  }

  function editar(entrega: Entrega) {
    setEditingId(entrega.id);
    setForm({
      clienteId: entrega.clienteId,
      entregadorId: entrega.entregadorId || '',
      enderecoOrigem: entrega.enderecoOrigem,
      bairroOrigem: entrega.bairroOrigem,
      enderecoDestino: entrega.enderecoDestino,
      bairroDestino: entrega.bairroDestino,
      destinatarioNome: entrega.destinatarioNome,
      destinatarioTelefone: entrega.destinatarioTelefone,
      descricaoMercadoria: entrega.descricaoMercadoria,
      observacoes: entrega.observacoes || '',
      distanciaKm: String(entrega.distanciaKm),
      valorFinal: String(entrega.valorFinal),
      observacaoValorManual: entrega.observacaoValorManual || '',
    });
  }

  async function alterarStatus(entrega: Entrega, status: StatusEntrega) {
    setErro('');
    setMensagem('');

    try {
      await api.patch(`/entregas/${entrega.id}/status`, { status });
      setMensagem('Status atualizado.');
      await carregarEntregas();
    } catch {
      setErro('Nao foi possivel atualizar o status.');
    }
  }

  async function designar(entrega: Entrega, entregadorId: string) {
    if (!entregadorId) {
      return;
    }

    setErro('');
    setMensagem('');

    try {
      await api.patch(`/entregas/${entrega.id}/entregador`, { entregadorId });
      setMensagem('Entregador designado.');
      await carregarEntregas();
    } catch {
      setErro('Nao foi possivel designar o entregador.');
    }
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>Entregas</h1>
          <p>Criacao, consulta, edicao, status, historico e designacao de entregador.</p>
        </div>
      </div>

      <section className="adminGrid">
        <form className="adminForm" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Editar entrega' : 'Nova entrega'}</h2>
          <label>Cliente<select value={form.clienteId} onChange={(event: { target: { value: string } }) => setForm({ ...form, clienteId: event.target.value })} required><option value="">Selecione</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</select></label>
          <label>Entregador<select value={form.entregadorId} onChange={(event: { target: { value: string } }) => setForm({ ...form, entregadorId: event.target.value })}><option value="">Sem entregador</option>{entregadores.map((entregador) => <option key={entregador.id} value={entregador.id}>{entregador.nome}</option>)}</select></label>
          <div className="adminFormRow">
            <label>Endereco origem<input value={form.enderecoOrigem} onChange={(event: { target: { value: string } }) => setForm({ ...form, enderecoOrigem: event.target.value })} required /></label>
            <label>Bairro origem<input value={form.bairroOrigem} onChange={(event: { target: { value: string } }) => setForm({ ...form, bairroOrigem: event.target.value })} required /></label>
          </div>
          <div className="adminFormRow">
            <label>Endereco destino<input value={form.enderecoDestino} onChange={(event: { target: { value: string } }) => setForm({ ...form, enderecoDestino: event.target.value })} required /></label>
            <label>Bairro destino<input value={form.bairroDestino} onChange={(event: { target: { value: string } }) => setForm({ ...form, bairroDestino: event.target.value })} required /></label>
          </div>
          <div className="adminFormRow">
            <label>Destinatario<input value={form.destinatarioNome} onChange={(event: { target: { value: string } }) => setForm({ ...form, destinatarioNome: event.target.value })} required /></label>
            <label>Telefone<input value={form.destinatarioTelefone} onChange={(event: { target: { value: string } }) => setForm({ ...form, destinatarioTelefone: event.target.value })} required /></label>
          </div>
          <label>Mercadoria<input value={form.descricaoMercadoria} onChange={(event: { target: { value: string } }) => setForm({ ...form, descricaoMercadoria: event.target.value })} required /></label>
          <div className="adminFormRow">
            <label>Distancia km<input type="number" min="0" step="0.1" value={form.distanciaKm} onChange={(event: { target: { value: string } }) => setForm({ ...form, distanciaKm: event.target.value })} required /></label>
            <label>Valor final<input type="number" min="0" step="0.01" value={form.valorFinal} onChange={(event: { target: { value: string } }) => setForm({ ...form, valorFinal: event.target.value })} /></label>
          </div>
          <label>Observacoes<textarea rows={3} value={form.observacoes} onChange={(event: { target: { value: string } }) => setForm({ ...form, observacoes: event.target.value })} /></label>
          <label>Motivo do valor manual<input value={form.observacaoValorManual} onChange={(event: { target: { value: string } }) => setForm({ ...form, observacaoValorManual: event.target.value })} /></label>
          <div className="adminActions">
            <button className="primaryButton" type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            {editingId ? <button className="secondaryButton" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button> : null}
          </div>
        </form>

        <section className="adminList">
          <div className="listToolbar">
            <input placeholder="Pesquisar por codigo ou cliente" value={busca} onChange={(event: { target: { value: string } }) => setBusca(event.target.value)} />
            <button className="secondaryButton" onClick={() => carregarEntregas()} type="button">Pesquisar</button>
          </div>
          {mensagem ? <p className="successMessage">{mensagem}</p> : null}
          {erro ? <p className="errorMessage">{erro}</p> : null}
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Cliente</th>
                  <th>Entregador</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {entregas.map((entrega) => (
                  <tr key={entrega.id}>
                    <td>{entrega.codigo}</td>
                    <td>{entrega.clienteNome}</td>
                    <td>{entrega.entregadorNome || 'Pendente'}</td>
                    <td><span className={entrega.status === 'ENTREGUE' ? 'statusBadge active' : 'statusBadge'}>{labelStatus(entrega.status)}</span></td>
                    <td>{money(entrega.valorFinal)}</td>
                    <td className="rowActions">
                      <button onClick={() => editar(entrega)}>Editar</button>
                      <select value={entrega.status} onChange={(event: { target: { value: string } }) => alterarStatus(entrega, event.target.value as StatusEntrega)}>{statusOptions.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}</select>
                      <select value={entrega.entregadorId || ''} onChange={(event: { target: { value: string } }) => designar(entrega, event.target.value)}><option value="">Designar</option>{entregadores.map((entregador) => <option key={entregador.id} value={entregador.id}>{entregador.nome}</option>)}</select>
                    </td>
                  </tr>
                ))}
                {entregas.length === 0 ? <tr><td colSpan={6}>Nenhuma entrega encontrada.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

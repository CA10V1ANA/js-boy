import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Entregador, EntregadorForm, TipoVeiculo } from '../types';

const emptyForm: EntregadorForm = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  tipoVeiculo: 'MOTO',
  placaVeiculo: '',
  disponivel: true,
};

const vehicleOptions: TipoVeiculo[] = ['MOTO', 'CARRO', 'BICICLETA', 'OUTRO'];

export function EntregadoresPage() {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [form, setForm] = useState<EntregadorForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarEntregadores();
  }, []);

  async function carregarEntregadores(search = busca) {
    setErro('');

    try {
      const response = await api.get<Entregador[]>('/entregadores', {
        params: search ? { busca: search } : undefined,
      });
      setEntregadores(response.data);
    } catch {
      setErro('Nao foi possivel carregar entregadores.');
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setCarregando(true);
    setErro('');
    setMensagem('');

    try {
      if (editingId) {
        await api.put(`/entregadores/${editingId}`, form);
        setMensagem('Entregador atualizado com sucesso.');
      } else {
        await api.post('/entregadores', form);
        setMensagem('Entregador cadastrado com sucesso.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await carregarEntregadores();
    } catch {
      setErro('Revise os dados do entregador e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  function editar(entregador: Entregador) {
    setEditingId(entregador.id);
    setForm({
      nome: entregador.nome,
      cpf: entregador.cpf,
      telefone: entregador.telefone,
      email: entregador.email || '',
      tipoVeiculo: entregador.tipoVeiculo,
      placaVeiculo: entregador.placaVeiculo || '',
      disponivel: entregador.disponivel,
    });
  }

  async function alterarStatus(entregador: Entregador) {
    setErro('');
    setMensagem('');

    try {
      await api.patch(`/entregadores/${entregador.id}/status`, { ativo: !entregador.ativo });
      setMensagem(entregador.ativo ? 'Entregador desativado.' : 'Entregador ativado.');
      await carregarEntregadores();
    } catch {
      setErro('Nao foi possivel alterar o status do entregador.');
    }
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>Entregadores</h1>
          <p>Cadastro, consulta, edicao, disponibilidade e desativacao de entregadores.</p>
        </div>
      </div>

      <section className="adminGrid">
        <form className="adminForm" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Editar entregador' : 'Novo entregador'}</h2>
          <label>Nome<input value={form.nome} onChange={(event: { target: { value: string } }) => setForm({ ...form, nome: event.target.value })} required /></label>
          <div className="adminFormRow">
            <label>CPF<input value={form.cpf} onChange={(event: { target: { value: string } }) => setForm({ ...form, cpf: event.target.value })} required /></label>
            <label>Telefone<input value={form.telefone} onChange={(event: { target: { value: string } }) => setForm({ ...form, telefone: event.target.value })} required /></label>
          </div>
          <label>E-mail<input type="email" value={form.email} onChange={(event: { target: { value: string } }) => setForm({ ...form, email: event.target.value })} /></label>
          <div className="adminFormRow">
            <label>Tipo de veiculo
              <select value={form.tipoVeiculo} onChange={(event: { target: { value: TipoVeiculo } }) => setForm({ ...form, tipoVeiculo: event.target.value })}>
                {vehicleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>Placa<input value={form.placaVeiculo} onChange={(event: { target: { value: string } }) => setForm({ ...form, placaVeiculo: event.target.value })} /></label>
          </div>
          <label className="checkboxLine">
            <input type="checkbox" checked={form.disponivel} onChange={(event: { target: { checked: boolean } }) => setForm({ ...form, disponivel: event.target.checked })} />
            Disponivel para entregas
          </label>
          <div className="adminActions">
            <button className="primaryButton" disabled={carregando} type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            {editingId ? <button className="secondaryButton" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button> : null}
          </div>
        </form>

        <section className="adminList">
          <div className="listToolbar">
            <input placeholder="Pesquisar por nome ou telefone" value={busca} onChange={(event: { target: { value: string } }) => setBusca(event.target.value)} />
            <button className="secondaryButton" onClick={() => carregarEntregadores()} type="button">Pesquisar</button>
          </div>
          {mensagem ? <p className="successMessage">{mensagem}</p> : null}
          {erro ? <p className="errorMessage">{erro}</p> : null}
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Veiculo</th>
                  <th>Disponibilidade</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {entregadores.map((entregador) => (
                  <tr key={entregador.id}>
                    <td>{entregador.nome}</td>
                    <td>{entregador.telefone}</td>
                    <td>{entregador.tipoVeiculo}{entregador.placaVeiculo ? ` - ${entregador.placaVeiculo}` : ''}</td>
                    <td><span className={entregador.disponivel ? 'statusBadge active' : 'statusBadge'}>{entregador.disponivel ? 'Disponivel' : 'Indisponivel'}</span></td>
                    <td><span className={entregador.ativo ? 'statusBadge active' : 'statusBadge'}>{entregador.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td className="rowActions">
                      <button onClick={() => editar(entregador)}>Editar</button>
                      <button onClick={() => alterarStatus(entregador)}>{entregador.ativo ? 'Desativar' : 'Ativar'}</button>
                    </td>
                  </tr>
                ))}
                {entregadores.length === 0 ? <tr><td colSpan={6}>Nenhum entregador encontrado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

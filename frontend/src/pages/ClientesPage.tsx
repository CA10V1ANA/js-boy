import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { Cliente, ClienteForm } from '../types';

const emptyForm: ClienteForm = {
  nome: '',
  telefone: '',
  whatsapp: '',
  email: '',
  documento: '',
  endereco: '',
  bairro: '',
  cidade: '',
  observacoes: '',
};

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<ClienteForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes(search = busca) {
    setErro('');

    try {
      const response = await api.get<Cliente[]>('/clientes', {
        params: search ? { busca: search } : undefined,
      });
      setClientes(response.data);
    } catch {
      setErro('Nao foi possivel carregar clientes.');
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setCarregando(true);
    setErro('');
    setMensagem('');

    try {
      if (editingId) {
        await api.put(`/clientes/${editingId}`, form);
        setMensagem('Cliente atualizado com sucesso.');
      } else {
        await api.post('/clientes', form);
        setMensagem('Cliente cadastrado com sucesso.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await carregarClientes();
    } catch {
      setErro('Revise os dados do cliente e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  function editar(cliente: Cliente) {
    setEditingId(cliente.id);
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone,
      whatsapp: cliente.whatsapp || '',
      email: cliente.email || '',
      documento: cliente.documento || '',
      endereco: cliente.endereco,
      bairro: cliente.bairro,
      cidade: cliente.cidade,
      observacoes: cliente.observacoes || '',
    });
  }

  async function alterarStatus(cliente: Cliente) {
    setErro('');
    setMensagem('');

    try {
      await api.patch(`/clientes/${cliente.id}/status`, { ativo: !cliente.ativo });
      setMensagem(cliente.ativo ? 'Cliente desativado.' : 'Cliente ativado.');
      await carregarClientes();
    } catch {
      setErro('Nao foi possivel alterar o status do cliente.');
    }
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>Clientes</h1>
          <p>Cadastro, consulta, edicao, pesquisa e desativacao de clientes.</p>
        </div>
      </div>

      <section className="adminGrid">
        <form className="adminForm" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Editar cliente' : 'Novo cliente'}</h2>
          <label>Nome<input value={form.nome} onChange={(event: { target: { value: string } }) => setForm({ ...form, nome: event.target.value })} required /></label>
          <div className="adminFormRow">
            <label>Telefone<input value={form.telefone} onChange={(event: { target: { value: string } }) => setForm({ ...form, telefone: event.target.value })} required /></label>
            <label>WhatsApp<input value={form.whatsapp} onChange={(event: { target: { value: string } }) => setForm({ ...form, whatsapp: event.target.value })} /></label>
          </div>
          <div className="adminFormRow">
            <label>E-mail<input type="email" value={form.email} onChange={(event: { target: { value: string } }) => setForm({ ...form, email: event.target.value })} /></label>
            <label>CPF/CNPJ<input value={form.documento} onChange={(event: { target: { value: string } }) => setForm({ ...form, documento: event.target.value })} /></label>
          </div>
          <label>Endereco<input value={form.endereco} onChange={(event: { target: { value: string } }) => setForm({ ...form, endereco: event.target.value })} required /></label>
          <div className="adminFormRow">
            <label>Bairro<input value={form.bairro} onChange={(event: { target: { value: string } }) => setForm({ ...form, bairro: event.target.value })} required /></label>
            <label>Cidade<input value={form.cidade} onChange={(event: { target: { value: string } }) => setForm({ ...form, cidade: event.target.value })} required /></label>
          </div>
          <label>Observacoes<textarea rows={3} value={form.observacoes} onChange={(event: { target: { value: string } }) => setForm({ ...form, observacoes: event.target.value })} /></label>
          <div className="adminActions">
            <button className="primaryButton" disabled={carregando} type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            {editingId ? <button className="secondaryButton" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button> : null}
          </div>
        </form>

        <section className="adminList">
          <div className="listToolbar">
            <input placeholder="Pesquisar por nome ou telefone" value={busca} onChange={(event: { target: { value: string } }) => setBusca(event.target.value)} />
            <button className="secondaryButton" onClick={() => carregarClientes()} type="button">Pesquisar</button>
          </div>
          {mensagem ? <p className="successMessage">{mensagem}</p> : null}
          {erro ? <p className="errorMessage">{erro}</p> : null}
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Cidade</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.telefone}</td>
                    <td>{cliente.cidade}</td>
                    <td><span className={cliente.ativo ? 'statusBadge active' : 'statusBadge'}>{cliente.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td className="rowActions">
                      <button onClick={() => editar(cliente)}>Editar</button>
                      <button onClick={() => alterarStatus(cliente)}>{cliente.ativo ? 'Desativar' : 'Ativar'}</button>
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 ? <tr><td colSpan={5}>Nenhum cliente encontrado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

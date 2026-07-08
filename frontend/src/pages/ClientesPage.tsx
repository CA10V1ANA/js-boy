import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { ClienteFormData, clienteSchema } from '../schemas/clienteSchema';
import { Cliente } from '../types';

const emptyForm: ClienteFormData = {
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
  const { showToast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: emptyForm,
  });

  useEffect(() => {
    carregarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarClientes(search = busca) {
    try {
      const response = await api.get<Cliente[]>('/clientes', {
        params: search ? { busca: search } : undefined,
      });
      setClientes(response.data);
    } catch {
      showToast('Nao foi possivel carregar clientes.', 'error');
    }
  }

  async function onSubmit(data: ClienteFormData) {
    try {
      if (editingId) {
        await api.put(`/clientes/${editingId}`, data);
        showToast('Cliente atualizado com sucesso.', 'success');
      } else {
        await api.post('/clientes', data);
        showToast('Cliente cadastrado com sucesso.', 'success');
      }

      reset(emptyForm);
      setEditingId(null);
      await carregarClientes();
    } catch {
      showToast('Revise os dados do cliente e tente novamente.', 'error');
    }
  }

  function editar(cliente: Cliente) {
    setEditingId(cliente.id);
    reset({
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

  function cancelarEdicao() {
    setEditingId(null);
    reset(emptyForm);
  }

  async function alterarStatus(cliente: Cliente) {
    try {
      await api.patch(`/clientes/${cliente.id}/status`, { ativo: !cliente.ativo });
      showToast(cliente.ativo ? 'Cliente desativado.' : 'Cliente ativado.', 'success');
      await carregarClientes();
    } catch {
      showToast('Nao foi possivel alterar o status do cliente.', 'error');
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
        <form className="adminForm" onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2>{editingId ? 'Editar cliente' : 'Novo cliente'}</h2>
          <label>
            Nome
            <input {...register('nome')} />
            {errors.nome ? <span className="fieldError">{errors.nome.message}</span> : null}
          </label>
          <div className="adminFormRow">
            <label>
              Telefone
              <input {...register('telefone')} />
              {errors.telefone ? <span className="fieldError">{errors.telefone.message}</span> : null}
            </label>
            <label>
              WhatsApp
              <input {...register('whatsapp')} />
              {errors.whatsapp ? <span className="fieldError">{errors.whatsapp.message}</span> : null}
            </label>
          </div>
          <div className="adminFormRow">
            <label>
              E-mail
              <input type="email" {...register('email')} />
              {errors.email ? <span className="fieldError">{errors.email.message}</span> : null}
            </label>
            <label>
              CPF/CNPJ
              <input {...register('documento')} />
              {errors.documento ? <span className="fieldError">{errors.documento.message}</span> : null}
            </label>
          </div>
          <label>
            Endereco
            <input {...register('endereco')} />
            {errors.endereco ? <span className="fieldError">{errors.endereco.message}</span> : null}
          </label>
          <div className="adminFormRow">
            <label>
              Bairro
              <input {...register('bairro')} />
              {errors.bairro ? <span className="fieldError">{errors.bairro.message}</span> : null}
            </label>
            <label>
              Cidade
              <input {...register('cidade')} />
              {errors.cidade ? <span className="fieldError">{errors.cidade.message}</span> : null}
            </label>
          </div>
          <label>
            Observacoes
            <textarea rows={3} {...register('observacoes')} />
            {errors.observacoes ? <span className="fieldError">{errors.observacoes.message}</span> : null}
          </label>
          <div className="adminActions">
            <button className="primaryButton" disabled={isSubmitting} type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            {editingId ? <button className="secondaryButton" type="button" onClick={cancelarEdicao}>Cancelar</button> : null}
          </div>
        </form>

        <section className="adminList">
          <div className="listToolbar">
            <input placeholder="Pesquisar por nome ou telefone" value={busca} onChange={(event: { target: { value: string } }) => setBusca(event.target.value)} />
            <button className="secondaryButton" onClick={() => carregarClientes()} type="button">Pesquisar</button>
          </div>
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

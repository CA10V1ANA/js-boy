import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../components/Modal';
import { RowMenu } from '../components/RowMenu';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { ClienteFormData, clienteSchema } from '../schemas/clienteSchema';
import { Cliente, Entrega } from '../types';

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

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

export function ClientesPage() {
  const { showToast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [entregasPorCliente, setEntregasPorCliente] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

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
    carregarContagemEntregas();
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

  async function carregarContagemEntregas() {
    try {
      const response = await api.get<Entrega[]>('/entregas');
      const contagem: Record<string, number> = {};
      response.data.forEach((entrega) => {
        contagem[entrega.clienteId] = (contagem[entrega.clienteId] || 0) + 1;
      });
      setEntregasPorCliente(contagem);
    } catch {
      setEntregasPorCliente({});
    }
  }

  function abrirNovo() {
    setEditingId(null);
    reset(emptyForm);
    setModalOpen(true);
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
      setModalOpen(false);
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
    setModalOpen(true);
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
      <div className="filterBar">
        <div className="filterSearch">
          <Search size={17} color="#ABA89B" />
          <input
            placeholder="Pesquisar por nome ou telefone"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && carregarClientes()}
          />
        </div>
        <span style={{ flex: 1 }} />
        <button className="primaryButton" onClick={abrirNovo} type="button">
          <Plus size={17} /> Novo cliente
        </button>
      </div>

      <div className="adminList" style={{ overflow: 'visible' }}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Endereco</th>
                <th style={{ textAlign: 'right' }}>Entregas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <div className="nameCell">
                      <span className="avatarTile">{iniciais(cliente.nome)}</span>
                      {cliente.nome}
                    </div>
                  </td>
                  <td>{cliente.telefone}</td>
                  <td>{cliente.endereco} - {cliente.bairro}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{entregasPorCliente[cliente.id] || 0}</td>
                  <td>
                    <RowMenu
                      items={[
                        { label: 'Editar', onClick: () => editar(cliente) },
                        { label: cliente.ativo ? 'Desativar' : 'Ativar', onClick: () => alterarStatus(cliente), danger: cliente.ativo },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {clientes.length === 0 ? <tr><td colSpan={5}>Nenhum cliente encontrado.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar cliente' : 'Novo cliente'}
        maxWidth={620}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            Nome
            <input {...register('nome')} />
            {errors.nome ? <span className="fieldError">{errors.nome.message}</span> : null}
          </label>
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
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
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
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
          <label style={{ display: 'grid', gap: 7 }}>
            Endereco
            <input {...register('endereco')} />
            {errors.endereco ? <span className="fieldError">{errors.endereco.message}</span> : null}
          </label>
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
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
          <label style={{ display: 'grid', gap: 7 }}>
            Observacoes
            <textarea rows={3} {...register('observacoes')} />
            {errors.observacoes ? <span className="fieldError">{errors.observacoes.message}</span> : null}
          </label>
          <button className="primaryButton" disabled={isSubmitting} type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
        </form>
      </Modal>
    </main>
  );
}

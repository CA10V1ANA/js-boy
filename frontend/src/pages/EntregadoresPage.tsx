import { KeyRound, Plus, Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { RowMenu, RowMenuItem } from '../components/RowMenu';
import { useToast } from '../contexts/ToastContext';
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

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

export function EntregadoresPage() {
  const { showToast } = useToast();
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [form, setForm] = useState<EntregadorForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [accessForm, setAccessForm] = useState({ entregadorId: '', email: '', senha: '123456' });

  useEffect(() => {
    carregarEntregadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarEntregadores(search = busca) {
    try {
      const response = await api.get<Entregador[]>('/entregadores', {
        params: search ? { busca: search } : undefined,
      });
      setEntregadores(response.data);
    } catch {
      showToast('Nao foi possivel carregar entregadores.', 'error');
    }
  }

  function abrirNovo() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
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
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setCarregando(true);

    try {
      if (editingId) {
        await api.put(`/entregadores/${editingId}`, form);
        showToast('Entregador atualizado com sucesso.', 'success');
      } else {
        await api.post('/entregadores', form);
        showToast('Entregador cadastrado com sucesso.', 'success');
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await carregarEntregadores();
    } catch {
      showToast('Revise os dados do entregador e tente novamente.', 'error');
    } finally {
      setCarregando(false);
    }
  }

  async function alterarStatus(entregador: Entregador) {
    try {
      await api.patch(`/entregadores/${entregador.id}/status`, { ativo: !entregador.ativo });
      showToast(entregador.ativo ? 'Entregador desativado.' : 'Entregador ativado.', 'success');
      await carregarEntregadores();
    } catch {
      showToast('Nao foi possivel alterar o status do entregador.', 'error');
    }
  }

  async function criarAcesso(event: FormEvent) {
    event.preventDefault();

    try {
      await api.post(`/entregadores/${accessForm.entregadorId}/acesso`, {
        email: accessForm.email,
        senha: accessForm.senha,
      });
      showToast('Acesso do entregador criado.', 'success');
      setAccessForm({ entregadorId: '', email: '', senha: '123456' });
      await carregarEntregadores();
    } catch {
      showToast('Nao foi possivel criar o acesso. Verifique se o e-mail ja existe.', 'error');
    }
  }

  function prepararAcesso(entregador: Entregador) {
    setAccessForm({
      entregadorId: entregador.id,
      email: entregador.email || '',
      senha: '123456',
    });
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
            onKeyDown={(event) => event.key === 'Enter' && carregarEntregadores()}
          />
        </div>
        <span style={{ flex: 1 }} />
        <button className="primaryButton" onClick={abrirNovo} type="button">
          <Plus size={17} /> Novo entregador
        </button>
      </div>

      <form
        className="adminList"
        style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
        onSubmit={criarAcesso}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: '0 0 auto' }}>
          <span className="metricIcon tone-blue"><KeyRound size={18} /></span>
          <div>
            <strong style={{ display: 'block', fontSize: 14 }}>Criar acesso</strong>
            <span style={{ color: '#8c9096', fontSize: 12, fontWeight: 500 }}>Gere login para o app do entregador</span>
          </div>
        </div>
        <select
          style={{ flex: 1, minWidth: 180, height: 44, border: '1px solid var(--input-border)', borderRadius: 10, padding: '0 14px', fontFamily: 'var(--font-ui)', fontWeight: 600, background: '#fbfbf9' }}
          value={accessForm.entregadorId}
          onChange={(event) => setAccessForm({ ...accessForm, entregadorId: event.target.value })}
          required
        >
          <option value="">Selecione um entregador</option>
          {entregadores.filter((entregador) => !entregador.possuiAcesso).map((entregador) => (
            <option key={entregador.id} value={entregador.id}>{entregador.nome}</option>
          ))}
        </select>
        <input
          style={{ flex: 1, minWidth: 160, height: 44, border: '1px solid var(--input-border)', borderRadius: 10, padding: '0 14px', fontFamily: 'var(--font-ui)' }}
          type="email"
          placeholder="E-mail de login"
          value={accessForm.email}
          onChange={(event) => setAccessForm({ ...accessForm, email: event.target.value })}
          required
        />
        <input
          style={{ width: 130, height: 44, border: '1px solid var(--input-border)', borderRadius: 10, padding: '0 14px', fontFamily: 'var(--font-ui)' }}
          placeholder="Senha inicial"
          value={accessForm.senha}
          onChange={(event) => setAccessForm({ ...accessForm, senha: event.target.value })}
          required
        />
        <button className="darkButton" type="submit">Criar acesso</button>
      </form>

      <div className="adminList" style={{ overflow: 'visible' }}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Entregador</th>
                <th>Telefone</th>
                <th>Veiculo</th>
                <th>Disponibilidade</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entregadores.map((entregador) => {
                const menuItems: RowMenuItem[] = [
                  { label: 'Editar', onClick: () => editar(entregador) },
                ];
                if (!entregador.possuiAcesso) {
                  menuItems.push({ label: 'Preparar acesso', onClick: () => prepararAcesso(entregador) });
                }
                menuItems.push({
                  label: entregador.ativo ? 'Desativar' : 'Ativar',
                  onClick: () => alterarStatus(entregador),
                  danger: entregador.ativo,
                });

                return (
                  <tr key={entregador.id}>
                    <td>
                      <div className="nameCell">
                        <span className="avatarTile tone-yellow">{iniciais(entregador.nome)}</span>
                        <div>
                          <div>{entregador.nome}</div>
                          <div className="cellSub">{entregador.possuiAcesso ? 'Acesso criado' : 'Sem acesso'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{entregador.telefone}</td>
                    <td style={{ fontSize: 13, color: 'var(--body-2)' }}>{entregador.tipoVeiculo}{entregador.placaVeiculo ? ` · ${entregador.placaVeiculo}` : ''}</td>
                    <td><span className={entregador.disponivel ? 'statusBadge active dot' : 'statusBadge dot'}>{entregador.disponivel ? 'Disponivel' : 'Ocupado'}</span></td>
                    <td><span className={entregador.ativo ? 'statusBadge active' : 'statusBadge danger'}>{entregador.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                      <RowMenu items={menuItems} />
                    </td>
                  </tr>
                );
              })}
              {entregadores.length === 0 ? <tr><td colSpan={6}>Nenhum entregador encontrado.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar entregador' : 'Novo entregador'}
        maxWidth={560}
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            Nome
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required />
          </label>
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
            <label>
              CPF
              <input value={form.cpf} onChange={(event) => setForm({ ...form, cpf: event.target.value })} required />
            </label>
            <label>
              Telefone
              <input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} required />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 7 }}>
            E-mail
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
            <label>
              Tipo de veiculo
              <select value={form.tipoVeiculo} onChange={(event) => setForm({ ...form, tipoVeiculo: event.target.value as TipoVeiculo })}>
                {vehicleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Placa
              <input value={form.placaVeiculo} onChange={(event) => setForm({ ...form, placaVeiculo: event.target.value })} />
            </label>
          </div>
          <label className="checkboxLine">
            <input type="checkbox" checked={form.disponivel} onChange={(event) => setForm({ ...form, disponivel: event.target.checked })} />
            Disponivel para entregas
          </label>
          <button className="primaryButton" disabled={carregando} type="submit">{editingId ? 'Salvar' : 'Cadastrar'}</button>
        </form>
      </Modal>
    </main>
  );
}

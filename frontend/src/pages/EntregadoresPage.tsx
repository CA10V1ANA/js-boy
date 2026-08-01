import { KeyRound, Pencil, Plus, Search, ToggleLeft, ToggleRight, UserPlus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { TableAction, TableActions } from '../components/TableActions';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { Entregador, EntregadorForm, TipoVeiculo } from '../types';
import { sentenceCase, titleCase } from '../utils/display';
import { formatCpf, formatEmailInput, formatPhone, formatVehiclePlate, normalizeVehiclePlate, onlyDigits } from '../utils/inputMasks';

const emptyForm: EntregadorForm = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  tipoVeiculo: 'MOTO',
  placaVeiculo: '',
  disponivel: true,
};

const vehicleOptions: TipoVeiculo[] = ['MOTO', 'CARRO'];

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
  const [accessForm, setAccessForm] = useState({ entregadorId: '', email: '', senha: '' });
  const [accessModalOpen, setAccessModalOpen] = useState(false);

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
      cpf: formatCpf(entregador.cpf),
      telefone: formatPhone(entregador.telefone),
      email: formatEmailInput(entregador.email || ''),
      tipoVeiculo: entregador.tipoVeiculo === 'CARRO' ? 'CARRO' : 'MOTO',
      placaVeiculo: formatVehiclePlate(entregador.placaVeiculo || ''),
      disponivel: entregador.disponivel,
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setCarregando(true);
    const payload = {
      ...form,
      cpf: onlyDigits(form.cpf),
      telefone: onlyDigits(form.telefone),
      email: formatEmailInput(form.email),
      placaVeiculo: normalizeVehiclePlate(form.placaVeiculo),
    };

    try {
      if (editingId) {
        await api.put(`/entregadores/${editingId}`, payload, { headers: { 'If-Match': String(entregadores.find((item) => item.id === editingId)?.versao ?? 0) } });
        showToast('Entregador atualizado com sucesso.', 'success');
      } else {
        await api.post('/entregadores', payload);
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
    if (!window.confirm('Confirma a alteracao de status de ' + entregador.nome + '?')) return;
    try {
      await api.patch(`/entregadores/${entregador.id}/status`, { ativo: !entregador.ativo }, { headers: { 'If-Match': String(entregador.versao) } });
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
        email: formatEmailInput(accessForm.email),
        senha: accessForm.senha,
      });
      showToast('Acesso do entregador criado.', 'success');
      setAccessForm({ entregadorId: '', email: '', senha: '' });
      setAccessModalOpen(false);
      await carregarEntregadores();
    } catch {
      showToast('Nao foi possivel criar o acesso. Verifique se o e-mail ja existe.', 'error');
    }
  }

  function prepararAcesso(entregador: Entregador) {
    setAccessForm({
      entregadorId: entregador.id,
      email: entregador.email || '',
      senha: '',
    });
    setAccessModalOpen(true);
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
        <button className="secondaryButton accessButton" onClick={() => { setAccessForm({ entregadorId: '', email: '', senha: '' }); setAccessModalOpen(true); }} type="button">
          <KeyRound size={17} /> Criar acesso
        </button>
        <button className="primaryButton" onClick={abrirNovo} type="button">
          <Plus size={17} /> Novo entregador
        </button>
      </div>

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
                <th style={{ textAlign: 'right' }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {entregadores.map((entregador) => {
                const menuItems: TableAction[] = [
                  { label: 'Editar entregador', icon: <Pencil size={16} />, onClick: () => editar(entregador) },
                ];
                if (!entregador.possuiAcesso) {
                  menuItems.push({ label: 'Criar acesso', icon: <UserPlus size={16} />, onClick: () => prepararAcesso(entregador) });
                }
                menuItems.push({
                  label: entregador.ativo ? 'Desativar' : 'Ativar',
                  icon: entregador.ativo ? <ToggleLeft size={16} /> : <ToggleRight size={16} />,
                  onClick: () => alterarStatus(entregador),
                  danger: entregador.ativo,
                });

                return (
                  <tr key={entregador.id}>
                    <td>
                      <div className="nameCell">
                        <span className="avatarTile tone-yellow">{iniciais(entregador.nome)}</span>
                        <div>
                          <div>{titleCase(entregador.nome)}</div>
                          <div className="cellSub">{entregador.possuiAcesso ? 'Acesso criado' : 'Sem acesso'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatPhone(entregador.telefone)}</td>
                    <td style={{ fontSize: 13, color: 'var(--body-2)' }}>{sentenceCase(entregador.tipoVeiculo)}{entregador.placaVeiculo ? ` · ${entregador.placaVeiculo}` : ''}</td>
                    <td><span className={entregador.disponivel ? 'statusBadge active dot' : 'statusBadge dot'}>{entregador.disponivel ? 'Disponivel' : 'Ocupado'}</span></td>
                    <td><span className={entregador.ativo ? 'statusBadge active' : 'statusBadge danger'}>{entregador.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                      <TableActions actions={menuItems} />
                    </td>
                  </tr>
                );
              })}
              {entregadores.length === 0 ? <tr><td colSpan={6}>Nenhum entregador encontrado.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={accessModalOpen} onClose={() => setAccessModalOpen(false)} title="Criar acesso" eyebrow="ACESSO DO ENTREGADOR" maxWidth={540}>
        <form className="settingsForm compactForm" onSubmit={criarAcesso}>
          <label>
            Entregador
            <select value={accessForm.entregadorId} onChange={(event) => setAccessForm({ ...accessForm, entregadorId: event.target.value })} required>
              <option value="">Selecione um entregador</option>
              {entregadores.filter((entregador) => !entregador.possuiAcesso).map((entregador) => (
                <option key={entregador.id} value={entregador.id}>{titleCase(entregador.nome)}</option>
              ))}
            </select>
          </label>
          <label>
            E-mail de login
            <input type="email" inputMode="email" autoComplete="email" placeholder="nome@exemplo.com" value={accessForm.email} onChange={(event) => setAccessForm({ ...accessForm, email: formatEmailInput(event.target.value) })} required />
          </label>
          <label>
            Senha inicial
            <input type="password" minLength={8} autoComplete="new-password" placeholder="Minimo de 8 caracteres" value={accessForm.senha} onChange={(event) => setAccessForm({ ...accessForm, senha: event.target.value })} required />
          </label>
          <p className="formHelp">A senha sera armazenada de forma protegida e nao podera ser visualizada depois.</p>
          <button className="primaryButton" type="submit"><KeyRound size={17} /> Criar acesso</button>
        </form>
      </Modal>
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
              <input inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" value={form.cpf} onChange={(event) => setForm({ ...form, cpf: formatCpf(event.target.value) })} required />
            </label>
            <label>
              Telefone
              <input type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.telefone} onChange={(event) => setForm({ ...form, telefone: formatPhone(event.target.value) })} required />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 7 }}>
            E-mail
            <input type="email" inputMode="email" autoComplete="email" placeholder="nome@exemplo.com" value={form.email} onChange={(event) => setForm({ ...form, email: formatEmailInput(event.target.value) })} />
          </label>
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
            <label>
              Tipo de veiculo
              <select value={form.tipoVeiculo} onChange={(event) => setForm({ ...form, tipoVeiculo: event.target.value as TipoVeiculo })}>
                {vehicleOptions.map((option) => <option key={option} value={option}>{sentenceCase(option)}</option>)}
              </select>
            </label>
            <label>
              Placa
              <input autoCapitalize="characters" maxLength={8} placeholder="ABC-1D23" value={form.placaVeiculo} onChange={(event) => setForm({ ...form, placaVeiculo: formatVehiclePlate(event.target.value) })} />
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

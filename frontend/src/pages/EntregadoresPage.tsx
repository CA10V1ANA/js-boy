import { domainLabel } from '../i18n/domain';
import { message, useLocale } from '../i18n';
import { KeyRound, Pencil, Plus, Search, ToggleLeft, ToggleRight, UserPlus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { TableAction, TableActions } from '../components/TableActions';
import { useToast } from '../contexts/ToastContext';
import { apiErrorMessage } from '../services/apiError';
import { api } from '../services/api';
import { Entregador, EntregadorForm, TipoVeiculo, TipoChavePix } from '../types';
import { sentenceCase, titleCase } from '../utils/display';
import { formatCpf, formatEmailInput, formatPhone, formatVehiclePlate, normalizeVehiclePlate, onlyDigits } from '../utils/inputMasks';

const emptyForm: EntregadorForm = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  tipoVeiculo: 'MOTO',
  placaVeiculo: '',
  disponivel: true, tipoChavePix: '', chavePix: '', titularPix: '',
};

const vehicleOptions: TipoVeiculo[] = ['MOTO', 'CARRO'];

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

export function EntregadoresPage() {
  useLocale();
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
      showToast(message("entregadores.nao.foi.possivel.carregar.os.entregadores"), 'error');
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
      disponivel: entregador.disponivel, tipoChavePix: entregador.tipoChavePix || '',
      chavePix: entregador.chavePix || '', titularPix: entregador.titularPix || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (carregando) return;
    setCarregando(true);
    const payload = {
      ...form, tipoChavePix: form.tipoChavePix || null,
      cpf: onlyDigits(form.cpf),
      telefone: onlyDigits(form.telefone),
      email: formatEmailInput(form.email),
      placaVeiculo: normalizeVehiclePlate(form.placaVeiculo),
    };

    try {
      if (editingId) {
        await api.put(`/entregadores/${editingId}`, payload, { headers: { 'If-Match': String(entregadores.find((item) => item.id === editingId)?.versao ?? 0) } });
        showToast(message("entregadores.entregador.atualizado.com.sucesso"), 'success');
      } else {
        await api.post('/entregadores', payload);
        showToast(message("entregadores.entregador.cadastrado.com.sucesso"), 'success');
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await carregarEntregadores();
    } catch (reason) {
      showToast(apiErrorMessage(reason, message("entregadores.revise.os.dados.do.entregador.e.tente.novamente")), 'error');
    } finally {
      setCarregando(false);
    }
  }

  async function alterarStatus(entregador: Entregador) {
    if (!window.confirm((message("entregadores.confirma.a.alteracao.de.status.de") + " ") + entregador.nome + '?')) return;
    try {
      await api.patch(`/entregadores/${entregador.id}/status`, { ativo: !entregador.ativo }, { headers: { 'If-Match': String(entregador.versao) } });
      showToast(entregador.ativo ? message("entregadores.entregador.desativado") : message("entregadores.entregador.ativado"), 'success');
      await carregarEntregadores();
    } catch {
      showToast(message("entregadores.nao.foi.possivel.alterar.o.status.do.entregador"), 'error');
    }
  }

  async function criarAcesso(event: FormEvent) {
    event.preventDefault();

    try {
      await api.post(`/entregadores/${accessForm.entregadorId}/convite`, {
        email: formatEmailInput(accessForm.email),

      });
      showToast(message("entregadores.convite.enviado.para.definicao.de.senha"), 'success');
      setAccessForm({ entregadorId: '', email: '', senha: '' });
      setAccessModalOpen(false);
      await carregarEntregadores();
    } catch {
      showToast(message("entregadores.nao.foi.possivel.criar.o.acesso.verifique.se.o.e.mail.ja.existe"), 'error');
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
            placeholder={message("entregadores.pesquisar.por.nome.ou.telefone")}
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && carregarEntregadores()}
          />
        </div>
        <span style={{ flex: 1 }} />
        <button className="secondaryButton accessButton" onClick={() => { setAccessForm({ entregadorId: '', email: '', senha: '' }); setAccessModalOpen(true); }} type="button">
          <KeyRound size={17} /> {message("entregadores.criar.acesso")} </button>
        <button className="primaryButton" onClick={abrirNovo} type="button">
          <Plus size={17} /> {message("entregadores.novo.entregador")} </button>
      </div>

      <div className="adminList" style={{ overflow: 'visible' }}>
        <div className="tableWrap">
          <table className="responsiveTable">
            <thead>
              <tr>
                <th>{message("entregadores.entregador")}</th>
                <th>{message("entregadores.telefone")}</th>
                <th>{message("entregadores.veiculo")}</th>
                <th>{message("entregadores.disponibilidade")}</th>
                <th>{message("entregadores.status")}</th>
                <th style={{ textAlign: 'right' }}>{message("entregadores.acoes")}</th>
              </tr>
            </thead>
            <tbody>
              {entregadores.map((entregador) => {
                const menuItems: TableAction[] = [
                  { label: message("entregadores.editar.entregador"), icon: <Pencil size={16} />, onClick: () => editar(entregador) },
                ];
                if (!entregador.possuiAcesso) {
                  menuItems.push({ label: message("entregadores.vincular.minha.conta.de.proprietario"), icon: <UserPlus size={16} />, onClick: () => { if (!window.confirm(message("entregadores.vincular.este.cadastro.a.sua.conta.de.proprietario"))) return; void api.post(`/entregadores/${entregador.id}/vincular-proprietario`).then(() => { showToast(message("entregadores.vinculo.criado.recarregue.a.pagina.para.alternar.o.modo"), 'success'); void carregarEntregadores(); }).catch(r => showToast(apiErrorMessage(r, message("entregadores.nao.foi.possivel.vincular")), 'error')); } });
                  menuItems.push({ label: message("entregadores.criar.acesso"), icon: <UserPlus size={16} />, onClick: () => prepararAcesso(entregador) });
                }
                menuItems.push({
                  label: entregador.ativo ? message("entregadores.desativar") : message("entregadores.ativar"),
                  icon: entregador.ativo ? <ToggleLeft size={16} /> : <ToggleRight size={16} />,
                  onClick: () => alterarStatus(entregador),
                  danger: entregador.ativo,
                });

                return (
                  <tr key={entregador.id}>
                    <td data-label={message("entregadores.entregador")}>
                      <div className="nameCell">
                        <span className="avatarTile tone-yellow">{iniciais(entregador.nome)}</span>
                        <div>
                          <div>{titleCase(entregador.nome)}</div>
                          <div className="cellSub">{entregador.possuiAcesso ? message("entregadores.acesso.criado") : message("entregadores.sem.acesso")}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label={message("entregadores.telefone")}>{formatPhone(entregador.telefone)}</td>
                    <td data-label={message("entregadores.veiculo")} style={{ fontSize: 13, color: 'var(--body-2)' }}>{domainLabel(entregador.tipoVeiculo)}{entregador.placaVeiculo ? ` · ${entregador.placaVeiculo}` : ''}</td>
                    <td data-label={message("entregadores.disponibilidade")}><span className={entregador.disponivel ? 'statusBadge active dot' : 'statusBadge dot'}>{entregador.disponivel ? message("entregadores.disponivel") : message("entregadores.ocupado")}</span></td>
                    <td data-label={message("entregadores.status")}><span className={entregador.ativo ? 'statusBadge active' : 'statusBadge danger'}>{entregador.ativo ? message("entregadores.ativo") : message("entregadores.inativo")}</span></td>
                    <td data-label={message("entregadores.acoes")}>
                      <TableActions actions={menuItems} />
                    </td>
                  </tr>
                );
              })}
              {entregadores.length === 0 ? <tr><td className="responsiveTableEmpty" colSpan={6}>{message("entregadores.nenhum.entregador.encontrado")}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={accessModalOpen} onClose={() => setAccessModalOpen(false)} title={message("entregadores.criar.acesso")} eyebrow={message("entregadores.acesso.do.entregador")} maxWidth={540}>
        <form className="settingsForm compactForm" onSubmit={criarAcesso}>
          <label>
            {message("entregadores.entregador")} <select value={accessForm.entregadorId} onChange={(event) => setAccessForm({ ...accessForm, entregadorId: event.target.value })} required>
              <option value="">{message("entregadores.selecione.um.entregador")}</option>
              {entregadores.filter((entregador) => !entregador.possuiAcesso).map((entregador) => (
                <option key={entregador.id} value={entregador.id}>{titleCase(entregador.nome)}</option>
              ))}
            </select>
          </label>
          <label>
            {message("entregadores.e.mail.de.login")} <input type="email" inputMode="email" autoComplete="email" placeholder={message("comum.email.exemplo")} value={accessForm.email} onChange={(event) => setAccessForm({ ...accessForm, email: formatEmailInput(event.target.value) })} required />
          </label>
          <p className="formHelp">{message("entregadores.o.entregador.define.sua.senha.pelo.link.de.uso.unico.enviado.ao.e.ma")}</p>
          <button className="primaryButton" type="submit"><KeyRound size={17} /> {message("entregadores.criar.acesso")}</button>
        </form>
      </Modal>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? message("entregadores.editar.entregador") : message("entregadores.novo.entregador")}
        maxWidth={560}
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 7 }}>
            {message("entregadores.nome")} <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required />
          </label>
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
            <label>
              {message("entregadores.cpf")} <input inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" value={form.cpf} onChange={(event) => setForm({ ...form, cpf: formatCpf(event.target.value) })} required />
            </label>
            <label>
              {message("entregadores.telefone")} <input type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.telefone} onChange={(event) => setForm({ ...form, telefone: formatPhone(event.target.value) })} required />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 7 }}>
            {message("entregadores.e.mail")} <input type="email" inputMode="email" autoComplete="email" placeholder={message("comum.email.exemplo")} value={form.email} onChange={(event) => setForm({ ...form, email: formatEmailInput(event.target.value) })} />
          </label>
          <div className="modalFormGrid" style={{ marginBottom: 0 }}>
            <label>
              {message("entregadores.tipo.de.veiculo")} <select value={form.tipoVeiculo} onChange={(event) => setForm({ ...form, tipoVeiculo: event.target.value as TipoVeiculo })}>
                {vehicleOptions.map((option) => <option key={option} value={option}>{domainLabel(option)}</option>)}
              </select>
            </label>
            <label>
              {message("entregadores.placa")} <input autoCapitalize="characters" maxLength={8} placeholder="ABC-1D23" value={form.placaVeiculo} onChange={(event) => setForm({ ...form, placaVeiculo: formatVehiclePlate(event.target.value) })} />
            </label>
          </div>
          <label className="checkboxLine">
            <input type="checkbox" checked={form.disponivel} onChange={(event) => setForm({ ...form, disponivel: event.target.checked })} />
            {message("entregadores.disponivel.para.entregas")} </label>
          <fieldset className="settingsForm">
            <legend>{message("entregadores.pix.direto.do.entregador")}</legend>
            <label>{message("entregadores.tipo.de.chave")}<select value={form.tipoChavePix} onChange={e => setForm({ ...form, tipoChavePix: e.target.value as TipoChavePix | '' })}>
              <option value="">{message("entregadores.ainda.nao.configurado")}</option><option value="CPF">{message("entregadores.cpf")}</option><option value="TELEFONE">{message("entregadores.telefone")}</option><option value="EMAIL">{message("entregadores.e.mail")}</option><option value="ALEATORIA">{message("entregadores.aleatoria")}</option>
            </select></label>
            <label>{message("entregadores.chave.pix")}<input required={!!form.tipoChavePix} maxLength={180} value={form.chavePix} onChange={e => setForm({ ...form, chavePix: e.target.value })} /></label>
            <label>{message("entregadores.nome.do.titular")}<input required={!!form.tipoChavePix} maxLength={140} value={form.titularPix} onChange={e => setForm({ ...form, titularPix: e.target.value })} /></label>
            <p className="formHelp">{message("entregadores.o.cliente.deve.conferir.o.destinatario.no.aplicativo.do.banco.telefo")}</p>
          </fieldset>
          <button className="primaryButton" disabled={carregando} type="submit">{editingId ? message("entregadores.salvar") : message("entregadores.cadastrar")}</button>
        </form>
      </Modal>
    </main>
  );
}

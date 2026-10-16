import { domainLabel } from '../i18n/domain';
import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Ban, Check, History, MapPinned, Pencil, Plus, Search, UserRoundCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OperacaoEntrega } from '../components/OperacaoEntrega';
import { EditorRota, novoLocal, enderecoLocal, payloadLocal } from '../components/EditorRota';
import { apiErrorMessage } from '../services/apiError';
import { Modal } from '../components/Modal';
import { TableActions } from '../components/TableActions';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { Cliente, ConfiguracaoPreco, Entrega, EntregaForm, Entregador, StatusEntrega, LocalRota, Parada, TabelaPreco } from '../types';
import { titleCase } from '../utils/display';
import { formatPhone, onlyDigits } from '../utils/inputMasks';

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
  tipoVeiculo: 'MOTO',
  tempoEsperaMinutos: '0',
  possuiRetorno: false,
  valorNegociado: '', formaPagamento: 'DINHEIRO',
};

const statusOptions: StatusEntrega[] = [
  'SOLICITADA',
  'CONFIRMADA',
  'AGUARDANDO_ENTREGADOR',
  'ENTREGADOR_DESIGNADO',
  'COLETADA',
  'EM_ROTA',
  'CANCELADA',
];

const filtros = ['Todas', 'Em rota', 'Aguardando', 'Entregue'] as const;
type Filtro = typeof filtros[number];

const getStepTitles = () => ([message("entrega.origem.da.coleta"), message("entrega.destino.da.entrega"), message("entregas.carga"), message("entrega.valor.da.entrega")]);
const getStepLabels = () => ([message("entrega.origem"), message("entrega.destino"), message("entregas.carga"), message("entrega.valor")]);

function labelStatus(status: StatusEntrega) {
  return domainLabel(status);
}

function toneStatus(status: StatusEntrega) {
  if (status === 'ENTREGUE') return 'statusBadge active';
  if (status === 'CANCELADA') return 'statusBadge danger';
  if (status === 'EM_ROTA' || status === 'COLETADA' || status === 'ENTREGADOR_DESIGNADO') return 'statusBadge progress';
  if (status === 'AGUARDANDO_ENTREGADOR' || status === 'SOLICITADA' || status === 'CONFIRMADA') return 'statusBadge pending';
  return 'statusBadge';
}

function pertenceFiltro(status: StatusEntrega, filtro: Filtro) {
  if (filtro === 'Todas') return true;
  if (filtro === 'Entregue') return status === 'ENTREGUE';
  if (filtro === 'Em rota') return status === 'EM_ROTA' || status === 'COLETADA' || status === 'ENTREGADOR_DESIGNADO';
  return status === 'SOLICITADA' || status === 'CONFIRMADA' || status === 'AGUARDANDO_ENTREGADOR';
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

function money(value: number) {
  return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'BRL' }).format(value);
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
}

export function EntregasPage() {
  useLocale();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { showToast } = useToast();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [configPreco, setConfigPreco] = useState<ConfiguracaoPreco | null>(null);
  const [tabelaPreco, setTabelaPreco] = useState<TabelaPreco | null>(null);
  const [busca, setBusca] = useState(() => params.get('busca') || '');
  const [filtro, setFiltro] = useState<Filtro>('Todas');

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [form, setForm] = useState<EntregaForm>(emptyForm);
  const [locais, setLocais] = useState<LocalRota[]>([]);
  const [operacao, setOperacao] = useState<Entrega | null>(null);
  const [rotaEdit, setRotaEdit] = useState<LocalRota[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [statusModalEntrega, setStatusModalEntrega] = useState<Entrega | null>(null);
  const [statusModalValor, setStatusModalValor] = useState<StatusEntrega>('SOLICITADA');
  const [designarModalEntrega, setDesignarModalEntrega] = useState<Entrega | null>(null);
  const [designarModalValor, setDesignarModalValor] = useState('');
  const [historicoEntrega, setHistoricoEntrega] = useState<Entrega | null>(null);

  useEffect(() => {
    carregarBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarBase() {
    await Promise.all([carregarEntregas(), carregarClientes(), carregarEntregadores(), carregarConfigPreco(), carregarTabelaPreco()]);
  }

  async function carregarEntregas(search = busca) {
    try {
      const response = await api.get<Entrega[]>('/entregas', {
        params: search ? { busca: search } : undefined,
      });
      setEntregas(response.data);
      setOperacao(current => current ? response.data.find(item => item.id === current.id) || null : null);
    } catch {
      showToast(message("entrega.nao.foi.possivel.carregar.as.entregas"), 'error');
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

  async function carregarConfigPreco() {
    try {
      const response = await api.get<ConfiguracaoPreco>('/configuracoes/preco');
      setConfigPreco(response.data);
    } catch {
      setConfigPreco(null);
    }
  }

  async function carregarTabelaPreco() {
    try {
      const response = await api.get<TabelaPreco>('/configuracoes/preco/tabela');
      setTabelaPreco(response.data);
    } catch {
      setTabelaPreco(null);
    }
  }

  function abrirWizardNovo() {
    setForm(emptyForm);
    setLocais([]);
    setEditingId(null);
    setWizardStep(1);
    setWizardOpen(true);
  }

  function abrirWizardEdicao(entrega: Entrega) {
    setEditingId(entrega.id);
    setLocais([]);
    setForm({
      clienteId: entrega.clienteId,
      entregadorId: entrega.entregadorId || '',
      enderecoOrigem: entrega.enderecoOrigem,
      bairroOrigem: entrega.bairroOrigem,
      enderecoDestino: entrega.enderecoDestino,
      bairroDestino: entrega.bairroDestino,
      destinatarioNome: entrega.destinatarioNome,
      destinatarioTelefone: formatPhone(entrega.destinatarioTelefone),
      descricaoMercadoria: entrega.descricaoMercadoria,
      observacoes: entrega.observacoes || '',
      distanciaKm: String(entrega.distanciaKm),
      valorFinal: String(entrega.valorFinal),
      observacaoValorManual: entrega.observacaoValorManual || '',
      tipoVeiculo: entrega.tipoVeiculo === 'CARRO' ? 'CARRO' : 'MOTO',
      tempoEsperaMinutos: String(entrega.tempoEsperaMinutos || 0),
      possuiRetorno: Boolean(entrega.possuiRetorno),
      valorNegociado: entrega.valorNegociado != null ? String(entrega.valorNegociado) : '',
      formaPagamento: entrega.formaPagamento === 'DINHEIRO' ? 'DINHEIRO' : 'PIX',
    });
    setWizardStep(1);
    setWizardOpen(true);
  }

  function fecharWizard() {
    setWizardOpen(false);
    setWizardStep(1);
  }

  function avancarWizard() {
    const faltando = wizardStep === 1
      ? !form.clienteId || !form.enderecoOrigem.trim() || !form.bairroOrigem.trim()
      : wizardStep === 2
        ? !form.enderecoDestino.trim() || !form.bairroDestino.trim() || !form.destinatarioNome.trim() || onlyDigits(form.destinatarioTelefone).length < 10
        : !form.descricaoMercadoria.trim();
    if (faltando) {
      showToast(message("entrega.preencha.os.campos.obrigatorios.desta.etapa.antes.de.continuar"), 'error');
      return;
    }
    setWizardStep((step) => Math.min(4, step + 1));
  }

  async function finalizarWizard() {
    if (saving) return;
    if (locais.length && (!locais.every(p => p.logradouro.trim() && p.bairro.trim() && (p.semNumero || p.numero.trim()))
      || locais[0].tipo !== 'COLETA' || locais[locais.length - 1].tipo !== 'ENTREGA')) {
      showToast(message("entrega.preencha.endereco.bairro.e.numero.ou.s.n.comece.por.coleta.e.termine"), 'error'); return;
    }
    if (locais.length > 2 && !form.valorNegociado) {
      showToast(message("entrega.informe.o.valor.negociado.para.os.varios.locais"), 'error'); return;
    }
    setSaving(true);
    const payload = {
      ...form,
      paradas: !editingId && locais.length ? locais.map(payloadLocal) : undefined,
      entregadorId: form.entregadorId || null,
      destinatarioTelefone: onlyDigits(form.destinatarioTelefone),
      distanciaKm: Number(form.distanciaKm),
      valorFinal: form.valorFinal ? Number(form.valorFinal) : null,
      tempoEsperaMinutos: Math.max(0, Number(form.tempoEsperaMinutos) || 0),
      valorNegociado: form.valorNegociado ? Number(form.valorNegociado) : null,
    };

    try {
      if (editingId) {
        await api.put(`/entregas/${editingId}`, payload, { headers: { 'If-Match': String(entregas.find((item) => item.id === editingId)?.versao ?? 0) } });
        showToast(message("entrega.entrega.atualizada"), 'success');
      } else {
        await api.post('/entregas', payload);
        showToast(message("entrega.entrega.criada"), 'success');
      }

      fecharWizard();
      await carregarEntregas();
    } catch (reason) {
      showToast(apiErrorMessage(reason, message("entrega.revise.os.dados.da.entrega.e.tente.novamente")), 'error');
    } finally { setSaving(false); }
  }

  async function alterarStatus(entrega: Entrega, status: StatusEntrega) {
    try {
      await api.patch(`/entregas/${entrega.id}/status`, { status }, { headers: { 'If-Match': String(entrega.versao) } });
      showToast(message("entrega.status.atualizado"), 'success');
      await carregarEntregas();
    } catch (reason) {
      showToast(apiErrorMessage(reason, message("entrega.nao.foi.possivel.atualizar.o.status")), 'error');
    }
  }

  async function designar(entrega: Entrega, entregadorId: string) {
    try {
      await api.patch(`/entregas/${entrega.id}/entregador`, { entregadorId }, { headers: { 'If-Match': String(entrega.versao) } });
      showToast(message("entrega.entregador.designado"), 'success');
      await carregarEntregas();
    } catch (reason) {
      showToast(apiErrorMessage(reason, message("entrega.nao.foi.possivel.designar.o.entregador")), 'error');
    }
  }

  function definirLocais(value: LocalRota[]) {
    setLocais(value);
    const primeira = value[0], ultima = value[value.length - 1];
    if (primeira && ultima) setForm(current => ({ ...current,
      enderecoOrigem: enderecoLocal(primeira), bairroOrigem: primeira.bairro,
      enderecoDestino: enderecoLocal(ultima), bairroDestino: ultima.bairro,
      destinatarioNome: ultima.contatoNome || current.destinatarioNome,
      destinatarioTelefone: ultima.contatoTelefone || current.destinatarioTelefone,
    }));
  }

  async function abrirEditorRota() {
    if (!operacao) return;
    setRouteError(''); setSaving(true);
    try {
      const result = await api.get<Parada[]>(`/rotas/entregas/${operacao.id}`);
      setRotaEdit(result.data.map(p => ({ ...p, numero: p.numero || '', complemento: p.complemento || '',
        cidade: p.cidade || '', estado: p.estado || '', cep: p.cep || '', contatoNome: p.contatoNome || '',
        contatoTelefone: p.contatoTelefone || '', observacao: p.observacao || '',
      })));
    } catch (reason) { setRouteError(apiErrorMessage(reason, message("entrega.nao.foi.possivel.carregar.a.rota"))); }
    finally { setSaving(false); }
  }

  async function salvarRota() {
    if (!operacao || !rotaEdit || saving) return;
    if (!rotaEdit.every(p => p.logradouro.trim() && p.bairro.trim() && (p.semNumero || p.numero.trim()))) {
      setRouteError(message("entrega.informe.endereco.bairro.e.numero.ou.s.n.em.cada.local")); return;
    }
    setSaving(true); setRouteError('');
    try {
      await api.put(`/rotas/entregas/${operacao.id}`, {
        paradas: rotaEdit.map((local, index) => ({ id: local.id || null, versao: local.versao ?? null, local: payloadLocal(local, index) })),
      }, { headers: { 'If-Match': String(operacao.versao) } });
      setRotaEdit(null); await carregarEntregas();
    } catch (reason) { setRouteError(apiErrorMessage(reason, message("entrega.nao.foi.possivel.salvar.a.rota"))); }
    finally { setSaving(false); }
  }

  function abrirStatusModal(entrega: Entrega) {
    setStatusModalEntrega(entrega);
    setStatusModalValor(entrega.status);
  }

  function abrirDesignarModal(entrega: Entrega) {
    setDesignarModalEntrega(entrega);
    setDesignarModalValor(entrega.entregadorId || '');
  }

  function cancelarEntrega(entrega: Entrega) {
    if (window.confirm(message("entrega.cancelar.a.entrega.de.value", { value1: titleCase(entrega.destinatarioNome) }))) {
      alterarStatus(entrega, 'CANCELADA');
    }
  }

  const entregasFiltradas = entregas.filter((entrega) => pertenceFiltro(entrega.status, filtro));

  const areaPreco = tabelaPreco?.areas.find((area) =>
    area.bairros.some((bairro) => normalize(bairro) === normalize(form.bairroDestino)));
  const tarifaBase = areaPreco?.valorNegociado || locais.length > 2
    ? Number(form.valorNegociado) || 0
    : areaPreco
      ? (form.tipoVeiculo === 'CARRO' ? areaPreco.valorCarro : areaPreco.valorMoto)
      : configPreco
        ? Math.max(configPreco.taxaInicial + Number(form.distanciaKm || 0) * configPreco.valorPorKm, configPreco.valorMinimo)
        : 0;
  const blocosEspera = Math.floor(Math.max(0, Number(form.tempoEsperaMinutos) || 0) / 30);
  const taxaEspera = blocosEspera * (tabelaPreco?.taxaEsperaTrintaMinutos || 0);
  const taxaRetorno = form.possuiRetorno ? (tabelaPreco?.taxaRetorno || 0) : 0;
  const valorNegociadoPendente = Boolean((areaPreco?.valorNegociado || locais.length > 2) && !form.valorNegociado);
  const previewValor = tabelaPreco && !valorNegociadoPendente ? tarifaBase + taxaEspera + taxaRetorno : null;
  const bairrosTabela = tabelaPreco?.areas.flatMap((area) => area.bairros) || [];

  return (
    <main className="page deliveryManagementPage">
      <div className="filterBar">
        <div className="filterSearch">
          <Search size={17} color="#ABA89B" />
          <input
            placeholder={message("entrega.pesquisar.por.codigo.ou.cliente")}
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && carregarEntregas()}
          />
        </div>
        <div className="filterPills">
          {filtros.map((item) => (
            <button
              key={item}
              type="button"
              className={filtro === item ? 'filterPill active' : 'filterPill'}
              onClick={() => setFiltro(item)}
            >
              {item === 'Todas' ? message('entrega.todas') : item === 'Em rota' ? message('entrega.em.rota') : item === 'Aguardando' ? message('entrega.filtro.aguardando') : domainLabel('ENTREGUE')}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <button className="primaryButton" onClick={abrirWizardNovo} type="button">
          <Plus size={17} /> {message("entrega.nova.entrega")} </button>
      </div>

      <div className="adminList" style={{ overflow: 'visible' }}>
        <div className="tableWrap">
          <table className="responsiveTable">
            <thead>
              <tr>
                <th>{message("entrega.entrega")}</th>
                <th>{message("entrega.destinatario")}</th>
                <th>{message("entrega.status")}</th>
                <th>{message("entrega.entregador")}</th>
                <th style={{ textAlign: 'right' }}>{message("entrega.valor")}</th>
                <th style={{ textAlign: 'right' }}>{message("entrega.acoes")}</th>
              </tr>
            </thead>
            <tbody>
              {entregasFiltradas.map((entrega) => (
                <tr key={entrega.id}>
                  <td data-label={message("entrega.entrega")}><strong className="publicRecordCode">{entrega.codigo}</strong><span className="cellSub">{message("entrega.registro.operacional")}</span></td>
                  <td data-label={message("entrega.destinatario")}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>{titleCase(entrega.destinatarioNome)}</div>
                      <div style={{ color: 'var(--faint)', fontSize: 11.5 }}>{titleCase(entrega.clienteNome)} · {titleCase(entrega.bairroDestino)}</div>
                    </div>
                  </td>
                  <td data-label={message("entrega.status")}><span className={toneStatus(entrega.status)}>{labelStatus(entrega.status)}</span></td>
                  <td data-label={message("entrega.entregador")}>
                    {entrega.entregadorNome ? (
                      <div className="nameCell" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--body-2)' }}>
                        <span className="avatarTile tone-yellow" style={{ width: 26, height: 26, fontSize: 10 }}>{iniciais(entrega.entregadorNome)}</span>
                        {entrega.entregadorNome}
                      </div>
                    ) : (
                      <span style={{ color: '#C6C1B4' }}>—</span>
                    )}
                  </td>
                  <td data-label={message("entrega.valor")} style={{ fontWeight: 700, color: 'var(--ink)' }}>{money(entrega.valorFinal)}</td>
                  <td data-label={message("entrega.acoes")}>
                    <TableActions actions={[
                      { label: message("entrega.editar.entrega"), icon: <Pencil size={16} />, onClick: () => abrirWizardEdicao(entrega) },
                      { label: 'Conversar', icon: <MapPinned size={16} />, onClick: () => navigate(`/conversas?entrega=${entrega.id}`) },
                      { label: message("entrega.rota.e.recebimento"), icon: <MapPinned size={16} />, onClick: () => { setOperacao(entrega); setRotaEdit(null); setRouteError(''); } },
                      { label: message("entrega.alterar.status"), icon: <Check size={16} />, onClick: () => abrirStatusModal(entrega) },
                      { label: message("entrega.designar.entregador"), icon: <UserRoundCheck size={16} />, onClick: () => abrirDesignarModal(entrega) },
                      { label: message("entrega.ver.historico"), icon: <History size={16} />, onClick: () => setHistoricoEntrega(entrega) },
                      { label: message("entrega.cancelar.entrega"), icon: <Ban size={16} />, onClick: () => cancelarEntrega(entrega), danger: true },
                    ]} />
                  </td>
                </tr>
              ))}
              {entregasFiltradas.length === 0 ? <tr><td className="responsiveTableEmpty" colSpan={6}>{message("entrega.nenhuma.entrega.encontrada")}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={wizardOpen}
        onClose={() => !saving && fecharWizard()}
        eyebrow={message("entrega.value.etapa.value.4", { value1: editingId ? 'EDITAR ENTREGA' : 'NOVA ENTREGA', value2: wizardStep })}
        title={getStepTitles()[wizardStep - 1]}
        maxWidth={568}
        footer={(
          <>
            <button
              className="secondaryButton"
              type="button"
              style={wizardStep === 1 ? { visibility: 'hidden' } : undefined}
              onClick={() => setWizardStep((step) => Math.max(1, step - 1))}
            >
              {message("entrega.voltar")} </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#9a9ea3', fontSize: 12, fontWeight: 600 }}>{message("entregas.etapa")} {wizardStep} {message("entregas.de.4")}</span>
              {wizardStep === 4 ? (
                <button className="primaryButton" type="button" disabled={saving} onClick={finalizarWizard}>
                  <Check size={16} /> {editingId ? message("entrega.salvar.entrega") : message("entrega.cadastrar.entrega")}
                </button>
              ) : (
                <button className="darkButton" type="button" onClick={avancarWizard}>
                  {message("entrega.proximo")} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </>
        )}
      >
        <div className="wizardStepper">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={wizardStep >= step ? 'wizardStepBar done' : 'wizardStepBar'} />
          ))}
        </div>
        <div className="wizardStepLabels">
          {getStepLabels().map((label, index) => (
            <span key={label} className={wizardStep >= index + 1 ? 'done' : undefined}>{label}</span>
          ))}
        </div>

        {wizardStep === 1 ? (
          <>
            <div className="modalFormGrid">
              <label>
                {message("entrega.cliente")} <select value={form.clienteId} onChange={(event) => setForm({ ...form, clienteId: event.target.value })} required>
                  <option value="">{message("entregas.selecione")}</option>
                  {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
                </select>
              </label>
              <label>
                {message("entrega.entregador")} <select value={form.entregadorId} onChange={(event) => setForm({ ...form, entregadorId: event.target.value })}>
                  <option value="">{message("entrega.sem.entregador")}</option>
                  {entregadores.map((entregador) => <option key={entregador.id} value={entregador.id}>{entregador.nome}</option>)}
                </select>
              </label>
              <label>
                {message("entrega.tipo.de.veiculo")} <select value={form.tipoVeiculo} onChange={(event) => setForm({ ...form, tipoVeiculo: event.target.value as 'MOTO' | 'CARRO' })}>
                  <option value="MOTO">{message("entregas.moto")}</option>
                  <option value="CARRO">{message("entregas.carro")}</option>
                </select>
              </label>
            </div>
            <div className="modalFormGrid" style={{ marginBottom: 0 }}>
              <label>
                {message("entrega.endereco.de.origem")} <input placeholder={message("entrega.rua.numero")} value={form.enderecoOrigem} onChange={(event) => setForm({ ...form, enderecoOrigem: event.target.value })} required />
              </label>
              <label>
                {message("entrega.bairro")} <input placeholder={message("entrega.bairro")} value={form.bairroOrigem} onChange={(event) => setForm({ ...form, bairroOrigem: event.target.value })} required />
              </label>
            </div>
          </>
        ) : null}

        {wizardStep === 2 ? (
          <>
            <div className="modalFormGrid">
              <label>
                {message("entrega.endereco.de.destino")} <input placeholder={message("entrega.rua.numero")} value={form.enderecoDestino} onChange={(event) => setForm({ ...form, enderecoDestino: event.target.value })} required />
              </label>
              <label>
                {message("entrega.bairro")} <input list="bairros-entrega" placeholder={message("entrega.digite.e.selecione.o.bairro")} value={form.bairroDestino} onChange={(event) => setForm({ ...form, bairroDestino: event.target.value })} required />
                <datalist id="bairros-entrega">{bairrosTabela.map((bairro) => <option key={bairro} value={bairro} />)}</datalist>
              </label>
            </div>
            {form.bairroDestino ? (
              <div className={areaPreco ? 'deliveryAreaNotice matched' : 'deliveryAreaNotice'}>
                <MapPinned size={18} />
                <div><strong>{areaPreco ? areaPreco.nome : message("entrega.bairro.fora.da.tabela")}</strong><span>{areaPreco?.valorNegociado ? message("entrega.o.valor.sera.negociado.nesta.entrega") : areaPreco ? message("entrega.tarifa.identificada.value", { value1: money(form.tipoVeiculo === 'CARRO' ? areaPreco.valorCarro : areaPreco.valorMoto) }) : message("entrega.sera.usado.o.calculo.alternativo.por.distancia")}</span></div>
              </div>
            ) : null}
            <div className="modalFormGrid" style={{ marginBottom: 0 }}>
              <label>
                {message("entrega.destinatario")} <input placeholder={message("entrega.nome.de.quem.recebe")} value={form.destinatarioNome} onChange={(event) => setForm({ ...form, destinatarioNome: event.target.value })} required />
              </label>
              <label>
                {message("entrega.telefone")} <input type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.destinatarioTelefone} onChange={(event) => setForm({ ...form, destinatarioTelefone: formatPhone(event.target.value) })} required />
              </label>
            </div>
          </>
        ) : null}

        {wizardStep === 3 ? (
          <>
            {!editingId ? locais.length ? <EditorRota value={locais} onChange={definirLocais} disabled={saving} /> :
              <button className="secondaryButton" type="button" onClick={() => definirLocais([
                { ...novoLocal('COLETA'), logradouro: form.enderecoOrigem, bairro: form.bairroOrigem },
                { ...novoLocal('ENTREGA'), logradouro: form.enderecoDestino, bairro: form.bairroDestino, contatoNome: form.destinatarioNome, contatoTelefone: form.destinatarioTelefone },
              ])}>{message("entrega.configurar.rota.e.adicionar.paradas")}</button> : <p>{message("entrega.edite.a.sequencia.pela.acao.rota.e.recebimento")}</p>}
            <label style={{ marginBottom: 14, display: 'grid', gap: 7 }}>
              {message("entregas.mercadoria")} <input placeholder={message("entrega.o.que.sera.transportado")} value={form.descricaoMercadoria} onChange={(event) => setForm({ ...form, descricaoMercadoria: event.target.value })} required />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              {message("entrega.observacoes")} <textarea rows={3} placeholder={message("entrega.instrucoes.para.o.entregador.opcional")} value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} />
            </label>
          </>
        ) : null}

        {wizardStep === 4 ? (
          <>
            <label>{message("entrega.forma.de.pagamento")}<select value={form.formaPagamento} onChange={e => setForm({ ...form, formaPagamento: e.target.value as 'PIX' | 'DINHEIRO' })}><option value="DINHEIRO">{message("entrega.dinheiro")}</option><option value="PIX">{message("entrega.pix.direto.do.entregador")}</option></select></label>
            <div className="modalFormGrid deliveryPricingFields">
              {areaPreco?.valorNegociado || locais.length > 2 || editingId ? (
                <label>
                  {message("entrega.valor.negociado")} <input className="highlight" type="number" min="0" step="0.01" placeholder="0,00" value={form.valorNegociado} onChange={(event) => setForm({ ...form, valorNegociado: event.target.value })} required />
                </label>
              ) : null}
              {!areaPreco ? (
                <label>
                  {message("entrega.distancia.para.calculo.alternativo.km")} <input type="number" min="0" step="0.1" placeholder="0,0" value={form.distanciaKm} onChange={(event) => setForm({ ...form, distanciaKm: event.target.value })} required />
                </label>
              ) : null}
              <label>
                {message("entrega.tempo.de.espera.minutos")} <input type="number" min="0" step="1" placeholder="0" value={form.tempoEsperaMinutos} onChange={(event) => setForm({ ...form, tempoEsperaMinutos: event.target.value })} />
              </label>
              <label>
                {message("entrega.valor.final")} <input className="highlight" type="number" min="0" step="0.01" placeholder={previewValor ? money(previewValor) : 'R$ 0,00'} value={form.valorFinal} onChange={(event) => setForm({ ...form, valorFinal: event.target.value })} />
              </label>
            </div>
            <label className="wizardCheckbox deliveryReturnCheck">
              <input type="checkbox" checked={form.possuiRetorno} onChange={(event) => setForm({ ...form, possuiRetorno: event.target.checked })} />
              <span>{message("entrega.possui.retorno")} <small>{message("entregas.adiciona")} {money(tabelaPreco?.taxaRetorno || 0)} {message("entrega.ao.total")}</small></span>
            </label>
            {previewValor !== null ? (
              <div className="wizardSummary">
                <div className="wizardSummaryRow">
                  <span>{areaPreco ? `${areaPreco.nome} · ${form.tipoVeiculo === 'CARRO' ? message("entregas.carro") : message("entregas.moto")}` : message("entrega.calculo.por.distancia.value.km", { value1: form.distanciaKm || 0 })}</span>
                  <strong>{money(tarifaBase)}</strong>
                </div>
                {taxaRetorno > 0 ? <div className="wizardSummaryRow"><span>{message("entregas.retorno")}</span><strong>{money(taxaRetorno)}</strong></div> : null}
                {taxaEspera > 0 ? <div className="wizardSummaryRow"><span>{message("entrega.espera")} {blocosEspera} {message("entrega.bloco.s.de.30.min")}</span><strong>{money(taxaEspera)}</strong></div> : null}
                <div className="wizardSummaryDivider" />
                <div className="wizardSummaryTotal">
                  <span>{message("entrega.total.estimado")}</span>
                  <strong>{money(Number(form.valorFinal) || previewValor)}</strong>
                </div>
              </div>
            ) : null}
            {valorNegociadoPendente ? <p className="errorMessage">{message("entrega.informe.o.valor.negociado.para.a.regiao.metropolitana")}</p> : null}
            <label style={{ marginTop: 14, display: 'grid', gap: 7 }}>
              {message("entrega.motivo.do.valor.manual")} <input value={form.observacaoValorManual} onChange={(event) => setForm({ ...form, observacaoValorManual: event.target.value })} />
            </label>
          </>
        ) : null}
      </Modal>

      <Modal open={operacao !== null} onClose={() => !saving && setOperacao(null)} title={message("entrega.rota.e.recebimento")} maxWidth={760}>
        {operacao ? <>
          {routeError ? <p className="errorMessage" role="alert">{routeError}</p> : null}
          {rotaEdit ? <>
            <EditorRota value={rotaEdit} onChange={setRotaEdit} disabled={saving} />
            <p>{message("entrega.antes.de.adicionar.locais.registre.um.valor.negociado.no.cadastro.da")}</p>
            <button className="primaryButton" type="button" disabled={saving} onClick={() => void salvarRota()}>{message("entrega.salvar.sequencia")}</button>
            <button className="secondaryButton" type="button" disabled={saving} onClick={() => setRotaEdit(null)}>{message("entrega.voltar.a.operacao")}</button>
          </> : <>
            <button className="secondaryButton" type="button" disabled={saving || !['SOLICITADA', 'CONFIRMADA', 'AGENDADA', 'AGUARDANDO_ENTREGADOR', 'ENTREGADOR_DESIGNADO'].includes(operacao.status)} onClick={() => void abrirEditorRota()}>{message("entrega.editar.sequencia.de.locais")}</button>
            <OperacaoEntrega entregaId={operacao.id} versao={operacao.versao} perfil="PROPRIETARIO" onChange={() => void carregarEntregas()} />
          </>}
        </> : null}
      </Modal>

      <Modal
        open={statusModalEntrega !== null}
        onClose={() => setStatusModalEntrega(null)}
        title={message("entrega.alterar.status")}
        maxWidth={420}
        footer={(
          <button
            className="primaryButton"
            type="button"
            style={{ width: '100%' }}
            onClick={async () => {
              if (statusModalEntrega) {
                await alterarStatus(statusModalEntrega, statusModalValor);
                setStatusModalEntrega(null);
              }
            }}
          >
            {message("entrega.salvar.status")} </button>
        )}
      >
        <label style={{ display: 'grid', gap: 7 }}>
          {message("entrega.novo.status.da.entrega.de")} {titleCase(statusModalEntrega?.destinatarioNome)}
          <select value={statusModalValor} onChange={(event) => setStatusModalValor(event.target.value as StatusEntrega)}>
            {statusOptions.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}
          </select>
        </label>
      </Modal>

      <Modal
        open={designarModalEntrega !== null}
        onClose={() => setDesignarModalEntrega(null)}
        title={message("entrega.designar.entregador")}
        maxWidth={420}
        footer={(
          <button
            className="primaryButton"
            type="button"
            style={{ width: '100%' }}
            onClick={async () => {
              if (designarModalEntrega && designarModalValor) {
                await designar(designarModalEntrega, designarModalValor);
                setDesignarModalEntrega(null);
              }
            }}
          >
            {message("entregas.designar")} </button>
        )}
      >
        <label style={{ display: 'grid', gap: 7 }}>
          {message("entrega.entregador.para.a.entrega.de")} {titleCase(designarModalEntrega?.destinatarioNome)}
          <select value={designarModalValor} onChange={(event) => setDesignarModalValor(event.target.value)}>
            <option value="">{message("entregas.selecione")}</option>
            {entregadores.map((entregador) => <option key={entregador.id} value={entregador.id}>{entregador.nome}</option>)}
          </select>
        </label>
      </Modal>

      <Modal
        open={historicoEntrega !== null}
        onClose={() => setHistoricoEntrega(null)}
        title={message("entrega.historico.da.entrega")}
        maxWidth={480}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {(historicoEntrega?.historico || []).map((item, index) => (
            <div key={index} style={{ borderBottom: '1px solid #f1f1ec', paddingBottom: 10 }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>{labelStatus(item.novoStatus)}</strong>
              <div style={{ color: '#8c9096', fontSize: 12, marginTop: 2 }}>
                {item.usuarioResponsavelNome} - {new Date(item.alteradoEm).toLocaleString(getLocale())}
              </div>
            </div>
          ))}
          {!historicoEntrega?.historico?.length ? <p style={{ color: '#8c9096' }}>{message("entrega.sem.registros.de.historico")}</p> : null}
        </div>
      </Modal>
    </main>
  );
}

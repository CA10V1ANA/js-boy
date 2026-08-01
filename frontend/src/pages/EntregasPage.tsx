import { ArrowRight, Ban, Check, History, MapPinned, Pencil, Plus, Search, UserRoundCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { TableActions } from '../components/TableActions';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { Cliente, ConfiguracaoPreco, Entrega, EntregaForm, Entregador, StatusEntrega, TabelaPreco } from '../types';
import { publicDeliveryCode, titleCase } from '../utils/display';
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
  valorNegociado: '',
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

const filtros = ['Todas', 'Em rota', 'Aguardando', 'Entregue'] as const;
type Filtro = typeof filtros[number];

const stepTitles = ['Origem da coleta', 'Destino da entrega', 'Carga', 'Valor da entrega'];
const stepLabels = ['Origem', 'Destino', 'Carga', 'Valor'];

function labelStatus(status: StatusEntrega) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
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
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
}

export function EntregasPage() {
  const { showToast } = useToast();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [configPreco, setConfigPreco] = useState<ConfiguracaoPreco | null>(null);
  const [tabelaPreco, setTabelaPreco] = useState<TabelaPreco | null>(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('Todas');

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [form, setForm] = useState<EntregaForm>(emptyForm);
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
    } catch {
      showToast('Nao foi possivel carregar entregas.', 'error');
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
    setEditingId(null);
    setWizardStep(1);
    setWizardOpen(true);
  }

  function abrirWizardEdicao(entrega: Entrega) {
    setEditingId(entrega.id);
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
      valorNegociado: entrega.valorNegociado ? String(entrega.valorNegociado) : '',
    });
    setWizardStep(1);
    setWizardOpen(true);
  }

  function fecharWizard() {
    setWizardOpen(false);
    setWizardStep(1);
  }

  async function finalizarWizard() {
    const payload = {
      ...form,
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
        showToast('Entrega atualizada.', 'success');
      } else {
        await api.post('/entregas', payload);
        showToast('Entrega criada.', 'success');
      }

      fecharWizard();
      await carregarEntregas();
    } catch {
      showToast('Revise os dados da entrega e tente novamente.', 'error');
    }
  }

  async function alterarStatus(entrega: Entrega, status: StatusEntrega) {
    try {
      await api.patch(`/entregas/${entrega.id}/status`, { status }, { headers: { 'If-Match': String(entrega.versao) } });
      showToast('Status atualizado.', 'success');
      await carregarEntregas();
    } catch {
      showToast('Nao foi possivel atualizar o status.', 'error');
    }
  }

  async function designar(entrega: Entrega, entregadorId: string) {
    try {
      await api.patch(`/entregas/${entrega.id}/entregador`, { entregadorId }, { headers: { 'If-Match': String(entrega.versao) } });
      showToast('Entregador designado.', 'success');
      await carregarEntregas();
    } catch {
      showToast('Nao foi possivel designar o entregador.', 'error');
    }
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
    if (window.confirm(`Cancelar a entrega de ${titleCase(entrega.destinatarioNome)}?`)) {
      alterarStatus(entrega, 'CANCELADA');
    }
  }

  const entregasFiltradas = entregas.filter((entrega) => pertenceFiltro(entrega.status, filtro));

  const areaPreco = tabelaPreco?.areas.find((area) =>
    area.bairros.some((bairro) => normalize(bairro) === normalize(form.bairroDestino)));
  const tarifaBase = areaPreco?.valorNegociado
    ? Number(form.valorNegociado) || 0
    : areaPreco
      ? (form.tipoVeiculo === 'CARRO' ? areaPreco.valorCarro : areaPreco.valorMoto)
      : configPreco
        ? Math.max(configPreco.taxaInicial + Number(form.distanciaKm || 0) * configPreco.valorPorKm, configPreco.valorMinimo)
        : 0;
  const blocosEspera = Math.floor(Math.max(0, Number(form.tempoEsperaMinutos) || 0) / 30);
  const taxaEspera = blocosEspera * (tabelaPreco?.taxaEsperaTrintaMinutos || 0);
  const taxaRetorno = form.possuiRetorno ? (tabelaPreco?.taxaRetorno || 0) : 0;
  const valorNegociadoPendente = Boolean(areaPreco?.valorNegociado && tarifaBase <= 0);
  const previewValor = tabelaPreco && !valorNegociadoPendente ? tarifaBase + taxaEspera + taxaRetorno : null;
  const bairrosTabela = tabelaPreco?.areas.flatMap((area) => area.bairros) || [];

  return (
    <main className="page">
      <div className="filterBar">
        <div className="filterSearch">
          <Search size={17} color="#ABA89B" />
          <input
            placeholder="Pesquisar por codigo ou cliente"
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
              {item}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <button className="primaryButton" onClick={abrirWizardNovo} type="button">
          <Plus size={17} /> Nova entrega
        </button>
      </div>

      <div className="adminList" style={{ overflow: 'visible' }}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Entrega</th>
                <th>Destinatario</th>
                <th>Status</th>
                <th>Entregador</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'right' }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {entregasFiltradas.map((entrega, index) => (
                <tr key={entrega.id}>
                  <td><strong className="publicRecordCode">{publicDeliveryCode(index)}</strong><span className="cellSub">Registro operacional</span></td>
                  <td>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>{titleCase(entrega.destinatarioNome)}</div>
                      <div style={{ color: 'var(--faint)', fontSize: 11.5 }}>{titleCase(entrega.clienteNome)} · {titleCase(entrega.bairroDestino)}</div>
                    </div>
                  </td>
                  <td><span className={toneStatus(entrega.status)}>{labelStatus(entrega.status)}</span></td>
                  <td>
                    {entrega.entregadorNome ? (
                      <div className="nameCell" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--body-2)' }}>
                        <span className="avatarTile tone-yellow" style={{ width: 26, height: 26, fontSize: 10 }}>{iniciais(entrega.entregadorNome)}</span>
                        {entrega.entregadorNome}
                      </div>
                    ) : (
                      <span style={{ color: '#C6C1B4' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>{money(entrega.valorFinal)}</td>
                  <td>
                    <TableActions actions={[
                      { label: 'Editar entrega', icon: <Pencil size={16} />, onClick: () => abrirWizardEdicao(entrega) },
                      { label: 'Alterar status', icon: <Check size={16} />, onClick: () => abrirStatusModal(entrega) },
                      { label: 'Designar entregador', icon: <UserRoundCheck size={16} />, onClick: () => abrirDesignarModal(entrega) },
                      { label: 'Ver historico', icon: <History size={16} />, onClick: () => setHistoricoEntrega(entrega) },
                      { label: 'Cancelar entrega', icon: <Ban size={16} />, onClick: () => cancelarEntrega(entrega), danger: true },
                    ]} />
                  </td>
                </tr>
              ))}
              {entregasFiltradas.length === 0 ? <tr><td colSpan={6}>Nenhuma entrega encontrada.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={wizardOpen}
        onClose={fecharWizard}
        eyebrow={`${editingId ? 'EDITAR ENTREGA' : 'NOVA ENTREGA'} · ETAPA ${wizardStep}/4`}
        title={stepTitles[wizardStep - 1]}
        maxWidth={568}
        footer={(
          <>
            <button
              className="secondaryButton"
              type="button"
              style={wizardStep === 1 ? { visibility: 'hidden' } : undefined}
              onClick={() => setWizardStep((step) => Math.max(1, step - 1))}
            >
              Voltar
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#9a9ea3', fontSize: 12, fontWeight: 600 }}>Etapa {wizardStep} de 4</span>
              {wizardStep === 4 ? (
                <button className="primaryButton" type="button" onClick={finalizarWizard}>
                  <Check size={16} /> {editingId ? 'Salvar entrega' : 'Cadastrar entrega'}
                </button>
              ) : (
                <button className="darkButton" type="button" onClick={() => setWizardStep((step) => Math.min(4, step + 1))}>
                  Proximo <ArrowRight size={16} />
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
          {stepLabels.map((label, index) => (
            <span key={label} className={wizardStep >= index + 1 ? 'done' : undefined}>{label}</span>
          ))}
        </div>

        {wizardStep === 1 ? (
          <>
            <div className="modalFormGrid">
              <label>
                Cliente
                <select value={form.clienteId} onChange={(event) => setForm({ ...form, clienteId: event.target.value })} required>
                  <option value="">Selecione</option>
                  {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
                </select>
              </label>
              <label>
                Entregador
                <select value={form.entregadorId} onChange={(event) => setForm({ ...form, entregadorId: event.target.value })}>
                  <option value="">Sem entregador</option>
                  {entregadores.map((entregador) => <option key={entregador.id} value={entregador.id}>{entregador.nome}</option>)}
                </select>
              </label>
              <label>
                Tipo de veículo
                <select value={form.tipoVeiculo} onChange={(event) => setForm({ ...form, tipoVeiculo: event.target.value as 'MOTO' | 'CARRO' })}>
                  <option value="MOTO">Moto</option>
                  <option value="CARRO">Carro</option>
                </select>
              </label>
            </div>
            <div className="modalFormGrid" style={{ marginBottom: 0 }}>
              <label>
                Endereco de origem
                <input placeholder="Rua, numero" value={form.enderecoOrigem} onChange={(event) => setForm({ ...form, enderecoOrigem: event.target.value })} required />
              </label>
              <label>
                Bairro
                <input placeholder="Bairro" value={form.bairroOrigem} onChange={(event) => setForm({ ...form, bairroOrigem: event.target.value })} required />
              </label>
            </div>
          </>
        ) : null}

        {wizardStep === 2 ? (
          <>
            <div className="modalFormGrid">
              <label>
                Endereco de destino
                <input placeholder="Rua, numero" value={form.enderecoDestino} onChange={(event) => setForm({ ...form, enderecoDestino: event.target.value })} required />
              </label>
              <label>
                Bairro
                <input list="bairros-entrega" placeholder="Digite e selecione o bairro" value={form.bairroDestino} onChange={(event) => setForm({ ...form, bairroDestino: event.target.value })} required />
                <datalist id="bairros-entrega">{bairrosTabela.map((bairro) => <option key={bairro} value={bairro} />)}</datalist>
              </label>
            </div>
            {form.bairroDestino ? (
              <div className={areaPreco ? 'deliveryAreaNotice matched' : 'deliveryAreaNotice'}>
                <MapPinned size={18} />
                <div><strong>{areaPreco ? areaPreco.nome : 'Bairro fora da tabela'}</strong><span>{areaPreco?.valorNegociado ? 'O valor será negociado nesta entrega.' : areaPreco ? `Tarifa identificada: ${money(form.tipoVeiculo === 'CARRO' ? areaPreco.valorCarro : areaPreco.valorMoto)}` : 'Será usado o cálculo alternativo por distância.'}</span></div>
              </div>
            ) : null}
            <div className="modalFormGrid" style={{ marginBottom: 0 }}>
              <label>
                Destinatario
                <input placeholder="Nome de quem recebe" value={form.destinatarioNome} onChange={(event) => setForm({ ...form, destinatarioNome: event.target.value })} required />
              </label>
              <label>
                Telefone
                <input type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.destinatarioTelefone} onChange={(event) => setForm({ ...form, destinatarioTelefone: formatPhone(event.target.value) })} required />
              </label>
            </div>
          </>
        ) : null}

        {wizardStep === 3 ? (
          <>
            <label style={{ marginBottom: 14, display: 'grid', gap: 7 }}>
              Mercadoria
              <input placeholder="O que sera transportado" value={form.descricaoMercadoria} onChange={(event) => setForm({ ...form, descricaoMercadoria: event.target.value })} required />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              Observacoes
              <textarea rows={3} placeholder="Instrucoes para o entregador (opcional)" value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} />
            </label>
          </>
        ) : null}

        {wizardStep === 4 ? (
          <>
            <div className="modalFormGrid deliveryPricingFields">
              {areaPreco?.valorNegociado ? (
                <label>
                  Valor negociado
                  <input className="highlight" type="number" min="0" step="0.01" placeholder="0,00" value={form.valorNegociado} onChange={(event) => setForm({ ...form, valorNegociado: event.target.value })} required />
                </label>
              ) : null}
              {!areaPreco ? (
                <label>
                  Distância para cálculo alternativo (km)
                  <input type="number" min="0" step="0.1" placeholder="0,0" value={form.distanciaKm} onChange={(event) => setForm({ ...form, distanciaKm: event.target.value })} required />
                </label>
              ) : null}
              <label>
                Tempo de espera (minutos)
                <input type="number" min="0" step="1" placeholder="0" value={form.tempoEsperaMinutos} onChange={(event) => setForm({ ...form, tempoEsperaMinutos: event.target.value })} />
              </label>
              <label>
                Valor final
                <input className="highlight" type="number" min="0" step="0.01" placeholder={previewValor ? money(previewValor) : 'R$ 0,00'} value={form.valorFinal} onChange={(event) => setForm({ ...form, valorFinal: event.target.value })} />
              </label>
            </div>
            <label className="wizardCheckbox deliveryReturnCheck">
              <input type="checkbox" checked={form.possuiRetorno} onChange={(event) => setForm({ ...form, possuiRetorno: event.target.checked })} />
              <span>Possui retorno <small>Adiciona {money(tabelaPreco?.taxaRetorno || 0)} ao total.</small></span>
            </label>
            {previewValor !== null ? (
              <div className="wizardSummary">
                <div className="wizardSummaryRow">
                  <span>{areaPreco ? `${areaPreco.nome} · ${form.tipoVeiculo === 'CARRO' ? 'Carro' : 'Moto'}` : `Cálculo por distância · ${form.distanciaKm || 0} km`}</span>
                  <strong>{money(tarifaBase)}</strong>
                </div>
                {taxaRetorno > 0 ? <div className="wizardSummaryRow"><span>Retorno</span><strong>{money(taxaRetorno)}</strong></div> : null}
                {taxaEspera > 0 ? <div className="wizardSummaryRow"><span>Espera · {blocosEspera} bloco(s) de 30 min</span><strong>{money(taxaEspera)}</strong></div> : null}
                <div className="wizardSummaryDivider" />
                <div className="wizardSummaryTotal">
                  <span>Total estimado</span>
                  <strong>{money(Number(form.valorFinal) || previewValor)}</strong>
                </div>
              </div>
            ) : null}
            {valorNegociadoPendente ? <p className="errorMessage">Informe o valor negociado para a Região Metropolitana.</p> : null}
            <label style={{ marginTop: 14, display: 'grid', gap: 7 }}>
              Motivo do valor manual
              <input value={form.observacaoValorManual} onChange={(event) => setForm({ ...form, observacaoValorManual: event.target.value })} />
            </label>
          </>
        ) : null}
      </Modal>

      <Modal
        open={statusModalEntrega !== null}
        onClose={() => setStatusModalEntrega(null)}
        title="Alterar status"
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
            Salvar status
          </button>
        )}
      >
        <label style={{ display: 'grid', gap: 7 }}>
          Novo status da entrega de {titleCase(statusModalEntrega?.destinatarioNome)}
          <select value={statusModalValor} onChange={(event) => setStatusModalValor(event.target.value as StatusEntrega)}>
            {statusOptions.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}
          </select>
        </label>
      </Modal>

      <Modal
        open={designarModalEntrega !== null}
        onClose={() => setDesignarModalEntrega(null)}
        title="Designar entregador"
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
            Designar
          </button>
        )}
      >
        <label style={{ display: 'grid', gap: 7 }}>
          Entregador para a entrega de {titleCase(designarModalEntrega?.destinatarioNome)}
          <select value={designarModalValor} onChange={(event) => setDesignarModalValor(event.target.value)}>
            <option value="">Selecione</option>
            {entregadores.map((entregador) => <option key={entregador.id} value={entregador.id}>{entregador.nome}</option>)}
          </select>
        </label>
      </Modal>

      <Modal
        open={historicoEntrega !== null}
        onClose={() => setHistoricoEntrega(null)}
        title="Historico da entrega"
        maxWidth={480}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {(historicoEntrega?.historico || []).map((item, index) => (
            <div key={index} style={{ borderBottom: '1px solid #f1f1ec', paddingBottom: 10 }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>{labelStatus(item.novoStatus)}</strong>
              <div style={{ color: '#8c9096', fontSize: 12, marginTop: 2 }}>
                {item.usuarioResponsavelNome} - {new Date(item.alteradoEm).toLocaleString('pt-BR')}
              </div>
            </div>
          ))}
          {!historicoEntrega?.historico?.length ? <p style={{ color: '#8c9096' }}>Sem registros de historico.</p> : null}
        </div>
      </Modal>
    </main>
  );
}

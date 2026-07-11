import { ArrowRight, Check, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { RowMenu } from '../components/RowMenu';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { Cliente, ConfiguracaoPreco, Entrega, EntregaForm, Entregador, StatusEntrega } from '../types';

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

export function EntregasPage() {
  const { showToast } = useToast();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [configPreco, setConfigPreco] = useState<ConfiguracaoPreco | null>(null);
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
    await Promise.all([carregarEntregas(), carregarClientes(), carregarEntregadores(), carregarConfigPreco()]);
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
      destinatarioTelefone: entrega.destinatarioTelefone,
      descricaoMercadoria: entrega.descricaoMercadoria,
      observacoes: entrega.observacoes || '',
      distanciaKm: String(entrega.distanciaKm),
      valorFinal: String(entrega.valorFinal),
      observacaoValorManual: entrega.observacaoValorManual || '',
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
      distanciaKm: Number(form.distanciaKm),
      valorFinal: form.valorFinal ? Number(form.valorFinal) : null,
    };

    try {
      if (editingId) {
        await api.put(`/entregas/${editingId}`, payload);
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
      await api.patch(`/entregas/${entrega.id}/status`, { status });
      showToast('Status atualizado.', 'success');
      await carregarEntregas();
    } catch {
      showToast('Nao foi possivel atualizar o status.', 'error');
    }
  }

  async function designar(entrega: Entrega, entregadorId: string) {
    try {
      await api.patch(`/entregas/${entrega.id}/entregador`, { entregadorId });
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
    if (window.confirm(`Cancelar a entrega ${entrega.codigo}?`)) {
      alterarStatus(entrega, 'CANCELADA');
    }
  }

  const entregasFiltradas = entregas.filter((entrega) => pertenceFiltro(entrega.status, filtro));

  const previewValor = configPreco
    ? Math.max(configPreco.taxaInicial + Number(form.distanciaKm || 0) * configPreco.valorPorKm, configPreco.valorMinimo)
    : null;

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
                <th>Codigo</th>
                <th>Destinatario</th>
                <th>Status</th>
                <th>Entregador</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entregasFiltradas.map((entrega) => (
                <tr key={entrega.id}>
                  <td style={{ fontWeight: 600, color: 'var(--body-text)', fontSize: 12.5 }}>{entrega.codigo}</td>
                  <td>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>{entrega.destinatarioNome}</div>
                      <div style={{ color: 'var(--faint)', fontSize: 11.5 }}>{entrega.clienteNome} · {entrega.bairroDestino}</div>
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
                    <RowMenu
                      items={[
                        { label: 'Editar', onClick: () => abrirWizardEdicao(entrega) },
                        { label: 'Alterar status', onClick: () => abrirStatusModal(entrega) },
                        { label: 'Designar entregador', onClick: () => abrirDesignarModal(entrega) },
                        { label: 'Historico', onClick: () => setHistoricoEntrega(entrega) },
                        { label: 'Cancelar', onClick: () => cancelarEntrega(entrega), danger: true },
                      ]}
                    />
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
                <input placeholder="Bairro" value={form.bairroDestino} onChange={(event) => setForm({ ...form, bairroDestino: event.target.value })} required />
              </label>
            </div>
            <div className="modalFormGrid" style={{ marginBottom: 0 }}>
              <label>
                Destinatario
                <input placeholder="Nome de quem recebe" value={form.destinatarioNome} onChange={(event) => setForm({ ...form, destinatarioNome: event.target.value })} required />
              </label>
              <label>
                Telefone
                <input placeholder="(00) 00000-0000" value={form.destinatarioTelefone} onChange={(event) => setForm({ ...form, destinatarioTelefone: event.target.value })} required />
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
            <div className="modalFormGrid">
              <label>
                Distancia (km)
                <input type="number" min="0" step="0.1" value={form.distanciaKm} onChange={(event) => setForm({ ...form, distanciaKm: event.target.value })} required />
              </label>
              <label>
                Valor final
                <input className="highlight" type="number" min="0" step="0.01" placeholder={previewValor ? money(previewValor) : 'R$ 0,00'} value={form.valorFinal} onChange={(event) => setForm({ ...form, valorFinal: event.target.value })} />
              </label>
            </div>
            {previewValor !== null ? (
              <div className="wizardSummary">
                <div className="wizardSummaryRow">
                  <span>Tarifa base + {form.distanciaKm || 0} km x {money(configPreco?.valorPorKm || 0)}</span>
                  <strong>{money(previewValor)}</strong>
                </div>
                <div className="wizardSummaryDivider" />
                <div className="wizardSummaryTotal">
                  <span>Total estimado</span>
                  <strong>{money(Number(form.valorFinal) || previewValor)}</strong>
                </div>
              </div>
            ) : null}
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
          Novo status para {statusModalEntrega?.codigo}
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
          Entregador para {designarModalEntrega?.codigo}
          <select value={designarModalValor} onChange={(event) => setDesignarModalValor(event.target.value)}>
            <option value="">Selecione</option>
            {entregadores.map((entregador) => <option key={entregador.id} value={entregador.id}>{entregador.nome}</option>)}
          </select>
        </label>
      </Modal>

      <Modal
        open={historicoEntrega !== null}
        onClose={() => setHistoricoEntrega(null)}
        title={`Historico - ${historicoEntrega?.codigo || ''}`}
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

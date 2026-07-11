import { zodResolver } from '@hookform/resolvers/zod';
import {
  BarChart3,
  Clock,
  DollarSign,
  MapPin,
  Package,
  Plus,
  Truck,
  UserCog,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { RowMenu } from '../components/RowMenu';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { funcionarioSchema, FuncionarioFormData } from '../schemas/funcionarioSchema';
import {
  DashboardResumo,
  Entrega,
  FormaPagamento,
  Funcionario,
  Pagamento,
  RelatorioFinanceiro,
  StatusEntrega,
} from '../types';

const emptyFuncionarioForm: FuncionarioFormData = { nome: '', email: '', senha: '' };

const emptyResumo: DashboardResumo = {
  totalEntregas: 0,
  solicitadas: 0,
  emAndamento: 0,
  entregues: 0,
  canceladas: 0,
  valorTotal: 0,
  clientes: 0,
  entregadoresAtivos: 0,
};

const emptyRelatorio: RelatorioFinanceiro = {
  valorEntregas: 0,
  valorRecebido: 0,
  valorPendente: 0,
  pagamentosRegistrados: 0,
  pendencias: [],
};

const emAndamentoStatus: StatusEntrega[] = [
  'SOLICITADA',
  'CONFIRMADA',
  'AGUARDANDO_ENTREGADOR',
  'ENTREGADOR_DESIGNADO',
  'COLETADA',
  'EM_ROTA',
];

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function labelStatus(status: StatusEntrega) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

function toneStatus(status: StatusEntrega) {
  if (status === 'ENTREGUE') return 'statusBadge active';
  if (status === 'CANCELADA') return 'statusBadge danger';
  if (status === 'EM_ROTA' || status === 'COLETADA' || status === 'ENTREGADOR_DESIGNADO') return 'statusBadge progress';
  if (status === 'AGUARDANDO_ENTREGADOR' || status === 'SOLICITADA') return 'statusBadge pending';
  return 'statusBadge';
}

function labelForma(forma: FormaPagamento) {
  return forma.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

function horaCurta(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

type EventoTimeline = {
  quando: Date;
  texto: string;
  meta: string;
  cor: string;
};

export function DashboardPage() {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const ehProprietario = usuario?.perfil === 'PROPRIETARIO';

  const [resumo, setResumo] = useState<DashboardResumo>(emptyResumo);
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro>(emptyRelatorio);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [agora, setAgora] = useState(new Date());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: emptyFuncionarioForm,
  });

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    carregarResumo();
    if (ehProprietario) {
      carregarFinanceiro();
      carregarFuncionarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarResumo() {
    try {
      const response = await api.get<DashboardResumo>('/dashboard/resumo');
      setResumo(response.data);
    } catch {
      showToast('Nao foi possivel carregar o dashboard.', 'error');
    }
  }

  async function carregarFinanceiro() {
    try {
      const [relatorioResponse, entregasResponse, pagamentosResponse] = await Promise.all([
        api.get<RelatorioFinanceiro>('/pagamentos/relatorio'),
        api.get<Entrega[]>('/entregas'),
        api.get<Pagamento[]>('/pagamentos'),
      ]);
      setRelatorio(relatorioResponse.data);
      setEntregas(entregasResponse.data);
      setPagamentos(pagamentosResponse.data);
    } catch {
      showToast('Nao foi possivel carregar os dados da operacao.', 'error');
    }
  }

  async function carregarFuncionarios() {
    try {
      const response = await api.get<Funcionario[]>('/funcionarios');
      setFuncionarios(response.data);
    } catch {
      showToast('Nao foi possivel carregar os funcionarios.', 'error');
    }
  }

  async function onSubmitFuncionario(data: FuncionarioFormData) {
    try {
      await api.post('/funcionarios', data);
      showToast('Acesso de funcionario criado com sucesso.', 'success');
      reset(emptyFuncionarioForm);
      await carregarFuncionarios();
    } catch {
      showToast('Nao foi possivel criar o acesso. Verifique se o e-mail ja existe.', 'error');
    }
  }

  async function alterarStatusFuncionario(funcionario: Funcionario) {
    try {
      await api.patch(`/funcionarios/${funcionario.id}/status`, { ativo: !funcionario.ativo });
      showToast(funcionario.ativo ? 'Funcionario desativado.' : 'Funcionario ativado.', 'success');
      await carregarFuncionarios();
    } catch {
      showToast('Nao foi possivel alterar o status do funcionario.', 'error');
    }
  }

  const valorEmTransito = useMemo(
    () => entregas
      .filter((entrega) => emAndamentoStatus.includes(entrega.status))
      .reduce((total, entrega) => total + entrega.valorFinal, 0),
    [entregas],
  );

  const entregasEmAndamento = useMemo(
    () => entregas.filter((entrega) => emAndamentoStatus.includes(entrega.status)).slice(0, 4),
    [entregas],
  );

  const timeline = useMemo<EventoTimeline[]>(() => {
    const eventos: EventoTimeline[] = [];

    entregas.forEach((entrega) => {
      entrega.historico.forEach((item) => {
        let texto = `Entrega ${entrega.codigo} atualizada para ${labelStatus(item.novoStatus).toLowerCase()}`;
        let cor = '#B47A12';
        if (item.novoStatus === 'ENTREGUE') {
          texto = `Entrega ${entrega.codigo} marcada como entregue`;
          cor = '#2E8B57';
        } else if (item.novoStatus === 'EM_ROTA' || item.novoStatus === 'COLETADA') {
          texto = `Entrega ${entrega.codigo} saiu para rota`;
          cor = '#1B8079';
        } else if (item.novoStatus === 'SOLICITADA') {
          texto = 'Nova entrega registrada · aguardando entregador';
          cor = '#B47A12';
        } else if (item.novoStatus === 'CANCELADA') {
          texto = `Entrega ${entrega.codigo} cancelada`;
          cor = '#C0503F';
        }
        eventos.push({
          quando: new Date(item.alteradoEm),
          texto,
          meta: entrega.clienteNome,
          cor,
        });
      });
    });

    pagamentos.forEach((pagamento) => {
      eventos.push({
        quando: new Date(pagamento.criadoEm),
        texto: `Pagamento de ${money(pagamento.valor)} recebido em ${labelForma(pagamento.formaPagamento).toLowerCase()}`,
        meta: pagamento.clienteNome,
        cor: '#1B8079',
      });
    });

    return eventos
      .sort((a, b) => b.quando.getTime() - a.quando.getTime())
      .slice(0, 4);
  }, [entregas, pagamentos]);

  const kpis = [
    {
      label: 'Entregas',
      value: String(resumo.totalEntregas).padStart(2, '0'),
      icon: Package,
      tone: 'yellow',
      delta: `${resumo.entregues} entregues`,
      deltaTone: 'up',
    },
    {
      label: 'Em rota',
      value: String(resumo.emAndamento).padStart(2, '0'),
      icon: Truck,
      tone: 'green',
      delta: 'agora',
      deltaTone: 'vs',
    },
    {
      label: 'Aguardando',
      value: String(resumo.solicitadas).padStart(2, '0'),
      icon: Clock,
      tone: 'red',
      delta: resumo.solicitadas > 0 ? 'sem entregador' : 'em dia',
      deltaTone: resumo.solicitadas > 0 ? 'warn' : 'vs',
    },
    {
      label: 'Recebido hoje',
      value: money(relatorio.valorRecebido),
      icon: DollarSign,
      tone: 'blue',
      delta: relatorio.valorPendente > 0 ? `${money(relatorio.valorPendente)} pendente` : 'tudo recebido',
      deltaTone: relatorio.valorPendente > 0 ? 'warn' : 'up',
      smaller: true,
    },
  ] as const;

  const quickActions = [
    { label: 'Nova entrega', sub: 'Cadastrar', icon: Plus, tone: 'yellow', to: '/entregas', perfil: 'PROPRIETARIO' },
    { label: 'Registrar pagamento', sub: 'Recebimento', icon: DollarSign, tone: 'green', to: '/pagamentos', perfil: 'PROPRIETARIO' },
    { label: 'Novo cliente', sub: 'Cadastrar', icon: UserPlus, tone: 'slate', to: '/clientes', perfil: 'TODOS' },
    { label: 'Relatorios', sub: 'Visualizar', icon: BarChart3, tone: 'navy', to: '/relatorios', perfil: 'PROPRIETARIO' },
  ].filter((acao) => acao.perfil === 'TODOS' || ehProprietario);

  return (
    <main className="page">
      <div className="statusRibbon">
        <span className="ribbonLive">OPERACAO ATIVA</span>
        <div className="ribbonItem">
          <Package size={17} />
          <div>
            <small>ENTREGAS</small>
            <strong>{String(resumo.totalEntregas).padStart(2, '0')}</strong>
          </div>
        </div>
        <div className="ribbonItem">
          <Truck size={17} />
          <div>
            <small>EM ROTA</small>
            <strong className="green">{String(resumo.emAndamento).padStart(2, '0')}</strong>
          </div>
        </div>
        {ehProprietario ? (
          <>
            <div className="ribbonItem">
              <Truck size={17} />
              <div>
                <small>EM TRANSITO</small>
                <strong>{money(valorEmTransito)}</strong>
              </div>
            </div>
            <div className="ribbonItem">
              <DollarSign size={17} />
              <div>
                <small>RECEBIDO HOJE</small>
                <strong className="amber">{money(relatorio.valorRecebido)}</strong>
              </div>
            </div>
          </>
        ) : null}
        <div className="ribbonClock">
          <MapPin size={15} />
          <strong>{agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
        </div>
      </div>

      <div className={ehProprietario ? 'dashGrid' : undefined}>
        <div>
          <h2 className="sectionTitle">Resumo da operacao</h2>

          <section className="metricGrid">
            {kpis.map((kpi) => (
              <article className="metricCard" key={kpi.label}>
                <span className={`metricIcon tone-${kpi.tone}`} style={{ marginBottom: 14, borderRadius: '50%' }}>
                  <kpi.icon size={19} />
                </span>
                <span>{kpi.label}</span>
                <strong className={'smaller' in kpi && kpi.smaller ? 'smaller' : undefined}>{kpi.value}</strong>
                <div className="metricDelta">
                  <span className={kpi.deltaTone}>{kpi.delta}</span>
                  <span className="vs">hoje</span>
                </div>
              </article>
            ))}
          </section>

          {ehProprietario ? (
            <div className="panelCard">
              <div className="panelCardHeader">
                <h2>Entregas em andamento</h2>
                <button className="smallButton" type="button" onClick={() => navigate('/entregas')}>Ver todas</button>
              </div>
              <div className="tableWrap">
                <table style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 20 }}>Codigo</th>
                      <th>Destinatario</th>
                      <th>Status</th>
                      <th>Entregador</th>
                      <th style={{ textAlign: 'right', paddingRight: 20 }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entregasEmAndamento.map((entrega) => (
                      <tr key={entrega.id}>
                        <td style={{ paddingLeft: 20, fontWeight: 600, color: 'var(--body-text)' }}>{entrega.codigo}</td>
                        <td>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>{entrega.destinatarioNome}</div>
                            <div style={{ color: 'var(--faint)', fontSize: 11.5 }}>{entrega.bairroDestino}</div>
                          </div>
                        </td>
                        <td><span className={toneStatus(entrega.status)}>{labelStatus(entrega.status)}</span></td>
                        <td>
                          {entrega.entregadorNome ? (
                            <div className="nameCell" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--body-2)' }}>
                              <span className="avatarTile" style={{ width: 26, height: 26, fontSize: 10 }}>{iniciais(entrega.entregadorNome)}</span>
                              {entrega.entregadorNome}
                            </div>
                          ) : (
                            <span style={{ color: '#C6C1B4' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 20, fontWeight: 700, color: 'var(--ink)' }}>{money(entrega.valorFinal)}</td>
                      </tr>
                    ))}
                    {entregasEmAndamento.length === 0 ? <tr><td colSpan={5} style={{ paddingLeft: 20 }}>Nenhuma entrega em andamento.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {ehProprietario ? (
          <div className="dashSide">
            <div className="panelCard">
              <div className="panelCardHeader" style={{ paddingBottom: 6 }}>
                <h2>Atividade recente</h2>
                <button className="linkButton" type="button" onClick={() => navigate('/relatorios')}>Ver tudo</button>
              </div>
              <div className="timeline">
                {timeline.map((evento, index) => (
                  <div className="timelineItem" key={index}>
                    <div className="timelineTrack">
                      <span className="timelineDot" style={{ color: evento.cor, background: `${evento.cor}22` }} />
                      <span className="timelineLine" />
                    </div>
                    <div className="timelineBody">
                      <time>{horaCurta(evento.quando.toISOString())}</time>
                      <p>{evento.texto}</p>
                      <small>{evento.meta}</small>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13, padding: '8px 0' }}>Sem atividade registrada ainda.</p> : null}
              </div>
            </div>

            <div className="panelCard" style={{ padding: '18px 20px 20px' }}>
              <h2 style={{ margin: '0 0 15px', fontSize: 15, fontWeight: 700 }}>Acoes rapidas</h2>
              <div className="quickGrid">
                {quickActions.map((acao) => (
                  <button className="quickTile" key={acao.label} type="button" onClick={() => navigate(acao.to)}>
                    <span className={`metricIcon tone-${acao.tone}`}>
                      <acao.icon size={17} />
                    </span>
                    <strong>{acao.label}</strong>
                    <small>{acao.sub}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {ehProprietario ? (
        <section className="adminGrid dashboardStaff">
          <form className="adminForm" onSubmit={handleSubmit(onSubmitFuncionario)} noValidate>
            <h2><UserCog size={18} /> Acesso de funcionarios</h2>
            <p className="formHint">Funcionarios acessam apenas o Dashboard e a area de Clientes.</p>
            <label>
              Nome
              <input {...register('nome')} />
              {errors.nome ? <span className="fieldError">{errors.nome.message}</span> : null}
            </label>
            <label>
              E-mail
              <input type="email" {...register('email')} />
              {errors.email ? <span className="fieldError">{errors.email.message}</span> : null}
            </label>
            <label>
              Senha inicial
              <input type="password" {...register('senha')} />
              {errors.senha ? <span className="fieldError">{errors.senha.message}</span> : null}
            </label>
            <div className="adminActions">
              <button className="primaryButton" disabled={isSubmitting} type="submit">Criar acesso</button>
            </div>
          </form>

          <section className="adminList">
            <h2 className="listTitle">Funcionarios cadastrados</h2>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((funcionario) => (
                    <tr key={funcionario.id}>
                      <td>{funcionario.nome}</td>
                      <td>{funcionario.email}</td>
                      <td><span className={funcionario.ativo ? 'statusBadge active' : 'statusBadge'}>{funcionario.ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td>
                        <RowMenu
                          items={[
                            { label: funcionario.ativo ? 'Desativar' : 'Ativar', onClick: () => alterarStatusFuncionario(funcionario), danger: funcionario.ativo },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                  {funcionarios.length === 0 ? <tr><td colSpan={4}>Nenhum funcionario cadastrado.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}

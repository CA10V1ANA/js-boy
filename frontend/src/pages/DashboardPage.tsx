import { domainLabel } from '../i18n/domain';
import { getLocale } from '../preferences';
import { message, useLocale } from '../i18n';
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  Package,
  Plus,
  Truck,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import {
  DashboardResumo,
  Entrega,
  FormaPagamento,
  Pagamento,
  RelatorioFinanceiro,
  StatusEntrega,
} from '../types';
import { titleCase } from '../utils/display';

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
  'CONFIRMADA',
  'AGENDADA',
  'AGUARDANDO_ENTREGADOR',
  'ENTREGADOR_DESIGNADO',
  'COLETADA',
  'EM_ROTA',
  'TENTATIVA_FALHOU',
  'EM_DEVOLUCAO',
];

function money(value: number) {
  return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'BRL' }).format(value);
}

function labelStatus(status: StatusEntrega) {
  return domainLabel(status);
}

function toneStatus(status: StatusEntrega) {
  if (status === 'ENTREGUE') return 'statusBadge active';
  if (status === 'CANCELADA') return 'statusBadge danger';
  if (status === 'EM_ROTA' || status === 'COLETADA' || status === 'ENTREGADOR_DESIGNADO') return 'statusBadge progress';
  if (status === 'AGUARDANDO_ENTREGADOR' || status === 'SOLICITADA') return 'statusBadge pending';
  return 'statusBadge';
}

function labelForma(forma: FormaPagamento) {
  return domainLabel(forma);
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

function horaCurta(iso: string) {
  return new Date(iso).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
}

type EventoTimeline = {
  quando: Date;
  texto: string;
  meta: string;
  cor: string;
};

export function DashboardPage() {
  const locale = useLocale();
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const ehProprietario = usuario?.perfil === 'PROPRIETARIO';

  const [resumo, setResumo] = useState<DashboardResumo>(emptyResumo);
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro>(emptyRelatorio);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    carregarResumo();
    if (ehProprietario) {
      carregarFinanceiro();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarResumo() {
    try {
      const response = await api.get<DashboardResumo>('/dashboard/resumo');
      setResumo(response.data);
    } catch {
      showToast(message("painel.nao.foi.possivel.carregar.o.painel"), 'error');
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
      showToast(message("painel.nao.foi.possivel.carregar.os.dados.da.operacao"), 'error');
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
        let texto = message("painel.entrega.de.value.atualizada.para.value", { value1: titleCase(entrega.destinatarioNome), value2: labelStatus(item.novoStatus).toLowerCase() });
        let cor = '#B47A12';
        if (item.novoStatus === 'ENTREGUE') {
          texto = message("painel.entrega.de.value.marcada.como.entregue", { value1: titleCase(entrega.destinatarioNome) });
          cor = '#2E8B57';
        } else if (item.novoStatus === 'EM_ROTA' || item.novoStatus === 'COLETADA') {
          texto = message("painel.entrega.de.value.saiu.para.rota", { value1: titleCase(entrega.destinatarioNome) });
          cor = '#1B8079';
        } else if (item.novoStatus === 'SOLICITADA') {
          texto = message("painel.nova.entrega.registrada.aguardando.entregador");
          cor = '#B47A12';
        } else if (item.novoStatus === 'CANCELADA') {
          texto = message("painel.entrega.de.value.cancelada", { value1: titleCase(entrega.destinatarioNome) });
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
        texto: message("painel.pagamento.de.value.recebido.em.value", { value1: money(pagamento.valor), value2: labelForma(pagamento.formaPagamento).toLowerCase() }),
        meta: pagamento.clienteNome,
        cor: '#1B8079',
      });
    });

    return eventos
      .sort((a, b) => b.quando.getTime() - a.quando.getTime())
      .slice(0, 4);
  }, [entregas, pagamentos, locale]);

  const kpis = [
    {
      label: message("painel.entregas"),
      value: String(resumo.totalEntregas).padStart(2, '0'),
      icon: Package,
      tone: 'yellow',
      delta: message("painel.value.entregues", { value1: resumo.entregues }),
      deltaTone: 'up',
    },
    {
      label: message("painel.em.andamento"),
      value: String(resumo.emAndamento).padStart(2, '0'),
      icon: Truck,
      tone: 'green',
      delta: message('painel.agora'),
      deltaTone: 'vs',
    },
    {
      label: message("painel.aguardando"),
      value: String(resumo.solicitadas).padStart(2, '0'),
      icon: Clock,
      tone: 'red',
      delta: resumo.solicitadas > 0 ? message("painel.sem.entregador") : message("painel.em.dia"),
      deltaTone: resumo.solicitadas > 0 ? 'warn' : 'vs',
    },
    {
      label: message("painel.recebido.acumulado"),
      value: money(relatorio.valorRecebido),
      icon: DollarSign,
      tone: 'blue',
      delta: relatorio.valorPendente > 0 ? message("painel.value.pendente", { value1: money(relatorio.valorPendente) }) : message("painel.tudo.recebido"),
      deltaTone: relatorio.valorPendente > 0 ? 'warn' : 'up',
      smaller: true,
    },
  ] as const;

  const quickActions = [
    { label: message("painel.nova.entrega"), sub: message("painel.cadastrar"), icon: Plus, tone: 'yellow', to: '/entregas', perfil: 'PROPRIETARIO' },
    { label: message("painel.registrar.pagamento"), sub: message("painel.recebimento"), icon: DollarSign, tone: 'green', to: '/pagamentos', perfil: 'PROPRIETARIO' },
    { label: message("painel.novo.cliente"), sub: message("painel.cadastrar"), icon: UserPlus, tone: 'slate', to: '/clientes', perfil: 'TODOS' },
    { label: message("painel.relatorios"), sub: message("painel.visualizar"), icon: BarChart3, tone: 'navy', to: '/relatorios', perfil: 'PROPRIETARIO' },
  ].filter((acao) => acao.perfil === 'TODOS' || ehProprietario);

  const prioridade = resumo.solicitadas > 0
    ? {
        icon: Clock,
        tone: 'warning',
        title: message("painel.value.value.de.atencao", { value1: resumo.solicitadas, value2: message(resumo.solicitadas === 1 ? 'painel.solicitacao.precisa' : 'painel.solicitacoes.precisam') }),
        description: message("painel.revise.o.pedido.confirme.os.dados.e.designe.o.entregador.quando.esti"),
        action: message("painel.revisar.entregas"),
        to: '/entregas',
      }
    : relatorio.valorPendente > 0
      ? {
          icon: DollarSign,
          tone: 'warning',
          title: message("painel.value.ainda.pendente", { value1: money(relatorio.valorPendente) }),
          description: message("painel.acompanhe.os.recebimentos.o.entregador.designado.pode.confirmar.a.pr"),
          action: message("painel.ver.pagamentos"),
          to: '/pagamentos',
        }
      : resumo.emAndamento > 0
        ? {
            icon: Truck,
            tone: 'active',
            title: `${resumo.emAndamento} ${message(resumo.emAndamento === 1 ? 'painel.entrega.em.andamento' : 'painel.entregas.em.andamento')}`,
            description: message("painel.a.operacao.esta.seguindo.entre.apenas.se.houver.atraso.ocorrencia.ou"),
            action: message("painel.acompanhar.entregas"),
            to: '/entregas',
          }
        : {
            icon: CheckCircle2,
            tone: 'done',
            title: message("painel.operacao.em.dia"),
            description: message("painel.nenhuma.pendencia.exige.sua.acao.agora"),
            action: message("painel.ver.entregas"),
            to: '/entregas',
          };
  const PrioridadeIcon = prioridade.icon;

  return (
    <main className="page">
      <div className="statusRibbon">
        <span className="ribbonLive">{message("painel.operacao.ativa")}</span>
        <div className="ribbonItem">
          <Package size={17} />
          <div>
            <small>{message("painel.entregas")}</small>
            <strong>{String(resumo.totalEntregas).padStart(2, '0')}</strong>
          </div>
        </div>
        <div className="ribbonItem">
          <Truck size={17} />
          <div>
            <small>{message("painel.em.andamento.2")}</small>
            <strong className="green">{String(resumo.emAndamento).padStart(2, '0')}</strong>
          </div>
        </div>
        {ehProprietario ? (
          <>
            <div className="ribbonItem">
              <Truck size={17} />
              <div>
                <small>{message("painel.em.transito")}</small>
                <strong>{money(valorEmTransito)}</strong>
              </div>
            </div>
            <div className="ribbonItem">
              <DollarSign size={17} />
              <div>
                <small>{message("painel.recebido.acumulado.2")}</small>
                <strong className="amber">{money(relatorio.valorRecebido)}</strong>
              </div>
            </div>
          </>
        ) : null}
        <div className="ribbonClock">
          <MapPin size={15} />
          <strong>{agora.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}</strong>
        </div>
      </div>

      {ehProprietario ? (
        <section className={`ownerDailyFocus ${prioridade.tone}`} aria-labelledby="owner-daily-focus-title">
          <span className="ownerDailyFocusIcon"><PrioridadeIcon size={22} /></span>
          <div>
            <small>{message("painel.prioridade.agora")}</small>
            <h2 id="owner-daily-focus-title">{prioridade.title}</h2>
            <p>{prioridade.description}</p>
          </div>
          <button type="button" onClick={() => navigate(prioridade.to)}>
            {prioridade.action} <ChevronRight size={18} />
          </button>
        </section>
      ) : null}

      <div className={ehProprietario ? 'dashGrid' : undefined}>
        <div>
          <h2 className="sectionTitle">{message("painel.resumo.da.operacao")}</h2>

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
                </div>
              </article>
            ))}
          </section>

          {ehProprietario ? (
            <div className="panelCard">
              <div className="panelCardHeader">
                <h2>{message("painel.entregas.em.andamento")}</h2>
                <button className="smallButton" type="button" onClick={() => navigate('/entregas')}>{message("painel.ver.todas")}</button>
              </div>
              <div className="ownerDeliveryList">
                {entregasEmAndamento.map(entrega => <button className="ownerDeliveryCard" key={entrega.id} type="button" onClick={() => navigate('/entregas?busca=' + encodeURIComponent(entrega.codigo))}>
                  <div><strong>{entrega.codigo}</strong><span>{entrega.destinatarioNome}</span><small>{entrega.bairroOrigem} → {entrega.bairroDestino}</small></div>
                  <div><small>{message("painel.entregador")}</small><span>{entrega.entregadorNome || message("painel.aguardando.designacao")}</span></div>
                  <div><span className={toneStatus(entrega.status)}>{labelStatus(entrega.status)}</span><strong>{money(entrega.valorFinal)}</strong></div>
                </button>)}
                {entregasEmAndamento.length === 0 ? <p className="emptyNote">{message("painel.nenhuma.entrega.em.andamento")}</p> : null}
              </div>
            </div>
          ) : null}
        </div>

        {ehProprietario ? (
          <div className="dashSide">
            <div className="panelCard">
              <div className="panelCardHeader" style={{ paddingBottom: 6 }}>
                <h2>{message("painel.atividade.recente")}</h2>
                <button className="linkButton" type="button" onClick={() => navigate('/relatorios')}>{message("painel.ver.tudo")}</button>
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
                {timeline.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13, padding: '8px 0' }}>{message("painel.sem.atividade.registrada.ainda")}</p> : null}
              </div>
            </div>

            <div className="panelCard" style={{ padding: '18px 20px 20px' }}>
              <h2 style={{ margin: '0 0 15px', fontSize: 15, fontWeight: 700 }}>{message("painel.acoes.rapidas")}</h2>
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

    </main>
  );
}

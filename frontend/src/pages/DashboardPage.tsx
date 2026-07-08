import { zodResolver } from '@hookform/resolvers/zod';
import {
  Ban,
  Bike,
  CheckCircle2,
  Clock,
  DollarSign,
  LayoutDashboard,
  PackageSearch,
  Truck,
  UserCog,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { funcionarioSchema, FuncionarioFormData } from '../schemas/funcionarioSchema';
import { DashboardResumo, Funcionario } from '../types';

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

const emptyFuncionarioForm: FuncionarioFormData = { nome: '', email: '', senha: '' };

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function DashboardPage() {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [resumo, setResumo] = useState<DashboardResumo>(emptyResumo);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const ehProprietario = usuario?.perfil === 'PROPRIETARIO';

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
    carregarResumo();
    if (ehProprietario) {
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

  const cards = [
    { label: 'Total de entregas', value: String(resumo.totalEntregas), icon: PackageSearch, tone: 'blue' },
    { label: 'Solicitadas', value: String(resumo.solicitadas), icon: Clock, tone: 'yellow' },
    { label: 'Em andamento', value: String(resumo.emAndamento), icon: Truck, tone: 'blue' },
    { label: 'Entregues', value: String(resumo.entregues), icon: CheckCircle2, tone: 'green' },
    { label: 'Canceladas', value: String(resumo.canceladas), icon: Ban, tone: 'red' },
    { label: 'Valor total', value: money(resumo.valorTotal), icon: DollarSign, tone: 'yellow' },
    { label: 'Clientes', value: String(resumo.clientes), icon: Users, tone: 'blue' },
    { label: 'Entregadores ativos', value: String(resumo.entregadoresAtivos), icon: Bike, tone: 'green' },
  ] as const;

  return (
    <main className="page">
      <div className="pageHeader">
        <div className="pageHeaderTitle">
          <span className="pageHeaderIcon"><LayoutDashboard size={22} /></span>
          <div>
            <h1>Dashboard</h1>
            <p>Resumo operacional e financeiro da base atual do sistema.</p>
          </div>
        </div>
      </div>

      <section className="metricGrid">
        {cards.map((card) => (
          <article className="metricCard" key={card.label}>
            <span className={`metricIcon tone-${card.tone}`}>
              <card.icon size={20} />
            </span>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </section>

      {ehProprietario ? (
        <section className="adminGrid dashboardStaff">
          <form className="adminForm" onSubmit={handleSubmit(onSubmitFuncionario)} noValidate>
            <h2><UserCog size={19} /> Acesso de funcionarios</h2>
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
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((funcionario) => (
                    <tr key={funcionario.id}>
                      <td>{funcionario.nome}</td>
                      <td>{funcionario.email}</td>
                      <td><span className={funcionario.ativo ? 'statusBadge active' : 'statusBadge'}>{funcionario.ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td className="rowActions">
                        <button onClick={() => alterarStatusFuncionario(funcionario)}>{funcionario.ativo ? 'Desativar' : 'Ativar'}</button>
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

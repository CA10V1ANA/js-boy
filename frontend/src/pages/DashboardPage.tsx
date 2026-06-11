import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardResumo } from '../types';

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

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function DashboardPage() {
  const [resumo, setResumo] = useState<DashboardResumo>(emptyResumo);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregarResumo() {
      try {
        const response = await api.get<DashboardResumo>('/dashboard/resumo');
        setResumo(response.data);
      } catch {
        setErro('Nao foi possivel carregar o dashboard.');
      }
    }

    carregarResumo();
  }, []);

  const cards = [
    ['Total de entregas', String(resumo.totalEntregas)],
    ['Solicitadas', String(resumo.solicitadas)],
    ['Em andamento', String(resumo.emAndamento)],
    ['Entregues', String(resumo.entregues)],
    ['Canceladas', String(resumo.canceladas)],
    ['Valor total', money(resumo.valorTotal)],
    ['Clientes', String(resumo.clientes)],
    ['Entregadores ativos', String(resumo.entregadoresAtivos)],
  ];

  return (
    <main className="page">
      <div className="pageHeader">
        <h1>Dashboard</h1>
        <p>Resumo operacional e financeiro do MVP.</p>
      </div>

      {erro ? <p className="errorMessage">{erro}</p> : null}
      <section className="metricGrid">
        {cards.map(([label, value]) => (
          <article className="metricCard" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}

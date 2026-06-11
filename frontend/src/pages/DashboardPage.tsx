const cards = [
  ['Total de entregas', '0'],
  ['Solicitadas', '0'],
  ['Em andamento', '0'],
  ['Entregues', '0'],
  ['Canceladas', '0'],
  ['Valor total', 'R$ 0,00'],
  ['Clientes', '0'],
  ['Entregadores ativos', '0'],
];

export function DashboardPage() {
  return (
    <main className="page">
      <div className="pageHeader">
        <h1>Dashboard</h1>
        <p>Resumo operacional e financeiro do MVP.</p>
      </div>

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


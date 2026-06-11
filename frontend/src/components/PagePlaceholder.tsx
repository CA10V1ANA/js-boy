type PagePlaceholderProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

export function PagePlaceholder({ title, description, actionLabel }: PagePlaceholderProps) {
  return (
    <main className="page">
      <div className="pageHeader">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actionLabel ? <button className="primaryButton">{actionLabel}</button> : null}
      </div>

      <section className="emptyState">
        <strong>Estrutura pronta para a proxima etapa</strong>
        <span>Os formularios, tabelas e integracao com a API entram nas etapas seguintes do MVP.</span>
      </section>
    </main>
  );
}


import { message, useLocale } from '../i18n';
type PagePlaceholderProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

export function PagePlaceholder({ title, description, actionLabel }: PagePlaceholderProps) {
  useLocale();
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
        <strong>{message("pagina.estrutura.pronta.para.a.proxima.etapa")}</strong>
        <span>{message("pagina.os.formularios.tabelas.e.a.integracao.com.a.api.entram.nas.etapas.se")}</span>
      </section>
    </main>
  );
}

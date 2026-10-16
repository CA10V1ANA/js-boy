import { domainLabel } from '../i18n/domain';
import { getLocale } from '../preferences';
import { AppearancePreferences } from '../components/AppearancePreferences';
import { message, useLocale } from '../i18n';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { formatPhone } from '../utils/inputMasks';
import type { RastreamentoPublico } from '../types/p2';

const label = domainLabel;
const dateTime = (value: string) => new Intl.DateTimeFormat(getLocale(), {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value));

export function RastreamentoPage() {
  useLocale();
  const { token = '' } = useParams();
  const [data, setData] = useState<RastreamentoPublico | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<RastreamentoPublico>(`/public/rastreamento/${encodeURIComponent(token)}`);
      setData(response.data);
    } catch (reason) {
      setError(apiErrorMessage(reason, message("rastreamento.rastreamento.indisponivel.expirado.ou.revogado")));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <main className="trackingPage"><AppearancePreferences /><LoadingState label={message("rastreamento.consultando.rastreamento")} /></main>;
  if (error || !data) return <main className="trackingPage"><AppearancePreferences /><ErrorState message={error || message("rastreamento.rastreamento.indisponivel")} onRetry={() => void load()} /></main>;

  return (
    <main className="trackingPage">
      <AppearancePreferences />
      <Link className="trackingBrand" to="/"><img className="trackingBrandLogo" src="/assets/js-boy-logo-oficial.jpg" alt="" aria-hidden="true" /> JS BOY</Link>
      <section className="panelCard trackingCard">
        <span className="modalEyebrow">{message("rastreamento.rastreamento.seguro")}</span>
        <h1>{data.codigoPublico}</h1>
        <p className="trackingStatus"><strong>{label(data.status)}</strong></p>
        {data.estimativa ? <p><Clock3 size={17} /> {message("rastreamento.previsao.informada")} {dateTime(data.estimativa)}</p> : null}
        {data.concluidaEm ? <p><CheckCircle2 size={17} /> {message("rastreamento.concluida.em")} {dateTime(data.concluidaEm)}</p> : null}
        <ol className="trackingTimeline">
          {data.linhaDoTempo.map((item, index) => (
            <li key={`${item.status}-${item.data}-${index}`}><strong>{label(item.status)}</strong><time>{dateTime(item.data)}</time></li>
          ))}
        </ol>
      </section>
      <section className="panelCard trackingContact">
        <h2>{data.empresa.nome}</h2>
        {data.empresa.telefone ? <a href={`tel:${data.empresa.telefone}`}>{formatPhone(data.empresa.telefone)}</a> : null}
        {data.empresa.whatsapp ? <a href={`https://wa.me/${data.empresa.whatsapp}`}>{message("rastreamento.whatsapp")}</a> : null}
        {data.empresa.email ? <a href={`mailto:${data.empresa.email}`}>{data.empresa.email}</a> : null}
        {data.empresa.horario ? <p>{data.empresa.horario}</p> : null}
      </section>
      <p className="trackingPrivacy">{message("rastreamento.este.link.mostra.apenas.o.andamento.necessario.nao.ha.localizacao.em")}</p>
    </main>
  );
}

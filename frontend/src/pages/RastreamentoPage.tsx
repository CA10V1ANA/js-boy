import { CheckCircle2, Clock3, PackageSearch } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/AsyncState';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import type { RastreamentoPublico } from '../types/p2';

const label = (value: string) => value.replace(/_/g, ' ').toLowerCase()
  .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
const dateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value));

export function RastreamentoPage() {
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
      setError(apiErrorMessage(reason, 'Rastreamento indisponível, expirado ou revogado.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <main className="trackingPage"><LoadingState label="Consultando rastreamento..." /></main>;
  if (error || !data) return <main className="trackingPage"><ErrorState message={error || 'Rastreamento indisponível.'} onRetry={() => void load()} /></main>;

  return (
    <main className="trackingPage">
      <Link className="trackingBrand" to="/"><PackageSearch aria-hidden="true" /> JS BOY</Link>
      <section className="panelCard trackingCard">
        <span className="modalEyebrow">RASTREAMENTO SEGURO</span>
        <h1>{data.codigoPublico}</h1>
        <p className="trackingStatus"><strong>{label(data.status)}</strong></p>
        {data.estimativa ? <p><Clock3 size={17} /> Previsão informada: {dateTime(data.estimativa)}</p> : null}
        {data.concluidaEm ? <p><CheckCircle2 size={17} /> Concluída em {dateTime(data.concluidaEm)}</p> : null}
        <ol className="trackingTimeline">
          {data.linhaDoTempo.map((item, index) => (
            <li key={`${item.status}-${item.data}-${index}`}><strong>{label(item.status)}</strong><time>{dateTime(item.data)}</time></li>
          ))}
        </ol>
      </section>
      <section className="panelCard trackingContact">
        <h2>{data.empresa.nome}</h2>
        {data.empresa.telefone ? <a href={`tel:${data.empresa.telefone}`}>{data.empresa.telefone}</a> : null}
        {data.empresa.whatsapp ? <a href={`https://wa.me/${data.empresa.whatsapp}`}>WhatsApp</a> : null}
        {data.empresa.email ? <a href={`mailto:${data.empresa.email}`}>{data.empresa.email}</a> : null}
        {data.empresa.horario ? <p>{data.empresa.horario}</p> : null}
      </section>
      <p className="trackingPrivacy">Este link mostra apenas o andamento necessário. Não há localização em tempo real.</p>
    </main>
  );
}

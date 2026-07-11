import { Bike, Car, Truck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { ConfiguracaoPreco, ConfiguracaoPrecoForm } from '../types';

const emptyForm: ConfiguracaoPrecoForm = {
  taxaInicial: '',
  valorPorKm: '',
  valorMinimo: '',
};

const veiculosReferencia = [
  { nome: 'Moto', desc: 'Padrao para entregas rapidas', mult: '1.0x', icon: Bike },
  { nome: 'Carro', desc: 'Cargas medias e volumosas', mult: '1.4x', icon: Car },
  { nome: 'Utilitario', desc: 'Grandes volumes', mult: '2.0x', icon: Truck },
];

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ConfiguracaoPrecoPage() {
  const [form, setForm] = useState<ConfiguracaoPrecoForm>(emptyForm);
  const [distancia, setDistancia] = useState('8');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarConfiguracao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarConfiguracao() {
    try {
      const response = await api.get<ConfiguracaoPreco>('/configuracoes/preco');
      setForm({
        taxaInicial: String(response.data.taxaInicial),
        valorPorKm: String(response.data.valorPorKm),
        valorMinimo: String(response.data.valorMinimo),
      });
    } catch {
      setErro('Nao foi possivel carregar a configuracao de preco.');
    }
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro('');
    setMensagem('');

    try {
      await api.put('/configuracoes/preco', {
        taxaInicial: Number(form.taxaInicial),
        valorPorKm: Number(form.valorPorKm),
        valorMinimo: Number(form.valorMinimo),
      });
      setMensagem('Configuracao de preco atualizada.');
    } catch {
      setErro('Revise os valores e tente novamente.');
    }
  }

  const previewValor = form.taxaInicial && form.valorPorKm && form.valorMinimo
    ? Math.max(Number(form.taxaInicial) + Number(form.valorPorKm) * Number(distancia || 0), Number(form.valorMinimo))
    : null;

  return (
    <main className="page">
      <div className="adminGrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <form className="adminForm" onSubmit={salvar}>
          <h2>Tarifa base</h2>
          <div className="adminFormRow">
            <label>
              Valor inicial
              <input type="number" min="0" step="0.01" value={form.taxaInicial} onChange={(event) => setForm({ ...form, taxaInicial: event.target.value })} required />
            </label>
            <label>
              Preco por km
              <input type="number" min="0" step="0.01" value={form.valorPorKm} onChange={(event) => setForm({ ...form, valorPorKm: event.target.value })} required />
            </label>
          </div>
          <label>
            Valor minimo
            <input type="number" min="0" step="0.01" value={form.valorMinimo} onChange={(event) => setForm({ ...form, valorMinimo: event.target.value })} required />
          </label>

          <label>
            Simular distancia (km)
            <input type="number" min="0" step="0.1" value={distancia} onChange={(event) => setDistancia(event.target.value)} />
          </label>

          {previewValor !== null ? (
            <div className="wizardSummary">
              <div className="wizardSummaryTotal">
                <span>Ex.: entrega de {distancia || 0} km</span>
                <strong>{money(previewValor)}</strong>
              </div>
            </div>
          ) : null}

          {mensagem ? <p className="successMessage">{mensagem}</p> : null}
          {erro ? <p className="errorMessage">{erro}</p> : null}

          <button className="primaryButton" type="submit">Salvar tarifa</button>
        </form>

        <div className="adminList" style={{ padding: '6px 20px 10px', display: 'block' }}>
          <h2 className="listTitle" style={{ padding: '14px 0 6px', margin: 0 }}>Multiplicador por veiculo</h2>
          {veiculosReferencia.map((veiculo) => (
            <div key={veiculo.nome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--row-divider)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="metricIcon tone-slate"><veiculo.icon size={18} /></span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{veiculo.nome}</div>
                  <div style={{ color: 'var(--faint)', fontSize: 12, fontWeight: 500 }}>{veiculo.desc}</div>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--ink)', background: 'var(--icon-tile-neutral)', borderRadius: 9, padding: '6px 13px' }}>{veiculo.mult}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

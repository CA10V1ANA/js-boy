import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { ConfiguracaoPreco, ConfiguracaoPrecoForm, SimulacaoPreco } from '../types';

const emptyForm: ConfiguracaoPrecoForm = {
  taxaInicial: '',
  valorPorKm: '',
  valorMinimo: '',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ConfiguracaoPrecoPage() {
  const [form, setForm] = useState<ConfiguracaoPrecoForm>(emptyForm);
  const [distancia, setDistancia] = useState('5');
  const [simulacao, setSimulacao] = useState<SimulacaoPreco | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarConfiguracao();
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
      await simular();
    } catch {
      setErro('Revise os valores e tente novamente.');
    }
  }

  async function simular() {
    setErro('');

    try {
      const response = await api.post<SimulacaoPreco>('/configuracoes/preco/simular', {
        distanciaKm: Number(distancia),
      });
      setSimulacao(response.data);
    } catch {
      setErro('Nao foi possivel simular o valor.');
    }
  }

  return (
    <main className="page">
      <div className="pageHeader">
        <h1>Configuracao de preco</h1>
        <p>Taxa inicial, valor por quilometro, valor minimo e simulacao.</p>
      </div>

      <section className="adminGrid">
        <form className="adminForm" onSubmit={salvar}>
          <h2>Valores atuais</h2>
          <label>Taxa inicial<input type="number" min="0" step="0.01" value={form.taxaInicial} onChange={(event: { target: { value: string } }) => setForm({ ...form, taxaInicial: event.target.value })} required /></label>
          <label>Valor por km<input type="number" min="0" step="0.01" value={form.valorPorKm} onChange={(event: { target: { value: string } }) => setForm({ ...form, valorPorKm: event.target.value })} required /></label>
          <label>Valor minimo<input type="number" min="0" step="0.01" value={form.valorMinimo} onChange={(event: { target: { value: string } }) => setForm({ ...form, valorMinimo: event.target.value })} required /></label>
          <button className="primaryButton" type="submit">Salvar configuracao</button>
        </form>

        <section className="adminList">
          <h2>Simulacao</h2>
          <div className="listToolbar">
            <input type="number" min="0" step="0.1" value={distancia} onChange={(event: { target: { value: string } }) => setDistancia(event.target.value)} />
            <button className="secondaryButton" type="button" onClick={simular}>Simular</button>
          </div>
          {mensagem ? <p className="successMessage">{mensagem}</p> : null}
          {erro ? <p className="errorMessage">{erro}</p> : null}
          {simulacao ? (
            <div className="simulationBox">
              <span>Valor previsto</span>
              <strong>{money(simulacao.valorCalculado)}</strong>
              <p>{simulacao.distanciaKm} km usando taxa {money(simulacao.taxaInicial)} + {money(simulacao.valorPorKm)} por km.</p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

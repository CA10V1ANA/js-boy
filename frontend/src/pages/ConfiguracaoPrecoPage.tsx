import { Bike, Calculator, Car, Clock3, MapPinned, RotateCcw, Save } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { ConfiguracaoPreco, ConfiguracaoPrecoForm, TabelaPreco } from '../types';

const emptyFallback: ConfiguracaoPrecoForm = {
  taxaInicial: '',
  valorPorKm: '',
  valorMinimo: '',
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
}

export function ConfiguracaoPrecoPage() {
  const [fallback, setFallback] = useState<ConfiguracaoPrecoForm>(emptyFallback);
  const [tabela, setTabela] = useState<TabelaPreco | null>(null);
  const [bairroSimulado, setBairroSimulado] = useState('Cocó');
  const [tipoSimulado, setTipoSimulado] = useState<'MOTO' | 'CARRO'>('MOTO');
  const [esperaSimulada, setEsperaSimulada] = useState('0');
  const [retornoSimulado, setRetornoSimulado] = useState(false);
  const [valorNegociadoSimulado, setValorNegociadoSimulado] = useState('');
  const [distanciaFallback, setDistanciaFallback] = useState('8');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  async function carregarConfiguracao() {
    try {
      const [configResponse, tabelaResponse] = await Promise.all([
        api.get<ConfiguracaoPreco>('/configuracoes/preco'),
        api.get<TabelaPreco>('/configuracoes/preco/tabela'),
      ]);
      setFallback({
        taxaInicial: String(configResponse.data.taxaInicial),
        valorPorKm: String(configResponse.data.valorPorKm),
        valorMinimo: String(configResponse.data.valorMinimo),
      });
      setTabela(tabelaResponse.data);
    } catch {
      setErro('Não foi possível carregar a tabela de preços.');
    }
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!tabela) return;
    setErro('');
    setMensagem('');

    try {
      const response = await api.put<TabelaPreco>('/configuracoes/preco/tabela', {
        taxaRetorno: tabela.taxaRetorno,
        taxaEsperaTrintaMinutos: tabela.taxaEsperaTrintaMinutos,
        taxaInicialFallback: Number(fallback.taxaInicial),
        valorPorKmFallback: Number(fallback.valorPorKm),
        valorMinimoFallback: Number(fallback.valorMinimo),
        areas: tabela.areas.map((area) => ({
          id: area.id,
          valorMoto: area.valorNegociado ? null : area.valorMoto,
          valorCarro: area.valorNegociado ? null : area.valorCarro,
          versao: area.versao,
        })),
      });
      setTabela(response.data);
      setMensagem('Tabela de preços atualizada.');
    } catch {
      setErro('Revise os valores e tente novamente.');
    }
  }

  const bairros = useMemo(() => tabela?.areas.flatMap((area) => area.bairros) ?? [], [tabela]);
  const areaSimulada = useMemo(() => tabela?.areas.find((area) =>
    area.bairros.some((bairro) => normalize(bairro) === normalize(bairroSimulado))), [bairroSimulado, tabela]);

  const simulacao = useMemo(() => {
    if (!tabela) return null;
    const blocos = Math.floor(Math.max(0, Number(esperaSimulada) || 0) / 30);
    const espera = blocos * tabela.taxaEsperaTrintaMinutos;
    const retorno = retornoSimulado ? tabela.taxaRetorno : 0;
    let base = 0;
    let origem = 'Cálculo alternativo por distância';
    let pendente = false;

    if (areaSimulada?.valorNegociado) {
      base = Number(valorNegociadoSimulado) || 0;
      origem = 'Valor negociado nesta entrega';
      pendente = base <= 0;
    } else if (areaSimulada) {
      base = tipoSimulado === 'CARRO' ? areaSimulada.valorCarro : areaSimulada.valorMoto;
      origem = `${areaSimulada.nome} · ${tipoSimulado === 'CARRO' ? 'Carro' : 'Moto'}`;
    } else {
      base = Math.max(
        Number(fallback.taxaInicial) + Number(distanciaFallback || 0) * Number(fallback.valorPorKm),
        Number(fallback.valorMinimo),
      );
    }
    return { base, espera, retorno, total: base + espera + retorno, origem, blocos, pendente };
  }, [areaSimulada, distanciaFallback, esperaSimulada, fallback, retornoSimulado, tabela, tipoSimulado, valorNegociadoSimulado]);

  function atualizarArea(id: string, campo: 'valorMoto' | 'valorCarro', valor: number) {
    setTabela((atual) => atual ? {
      ...atual,
      areas: atual.areas.map((area) => area.id === id ? { ...area, [campo]: valor } : area),
    } : atual);
  }

  return (
    <main className="page pricePage">
      <div className="infoBanner priceIntro">
        <span className="infoBannerIcon"><MapPinned size={19} /></span>
        <div>
          <strong>{tabela?.nome || 'Tabela de preços por bairro'}</strong>
          <p>O bairro de destino define a área e o valor-base. Rua e número completam o endereço, sem alterar a tarifa.</p>
        </div>
        {tabela ? <span className="priceTableStatus">Vigente desde {new Date(`${tabela.vigenteDesde}T12:00:00`).toLocaleDateString('pt-BR')}</span> : null}
      </div>

      <form className="settingsSections" onSubmit={salvar}>
        <section className="settingsSection">
          <div className="settingsSectionTitle">
            <Clock3 size={19} />
            <div><h2>Taxas adicionais</h2><p>Não existe adicional por horário, domingo, feriado ou período noturno.</p></div>
          </div>
          <div className="priceFeeGrid">
            <label>
              Retorno
              <div className="moneyInput"><span>R$</span><input type="number" min="0" step="0.01" value={tabela?.taxaRetorno ?? ''} onChange={(event) => setTabela((atual) => atual ? { ...atual, taxaRetorno: Number(event.target.value) } : atual)} required /></div>
              <small>Cobrado uma vez quando a entrega possui retorno.</small>
            </label>
            <label>
              Espera a cada 30 minutos completos
              <div className="moneyInput"><span>R$</span><input type="number" min="0" step="0.01" value={tabela?.taxaEsperaTrintaMinutos ?? ''} onChange={(event) => setTabela((atual) => atual ? { ...atual, taxaEsperaTrintaMinutos: Number(event.target.value) } : atual)} required /></div>
              <small>Ex.: 31 minutos = uma cobrança; 60 minutos = duas.</small>
            </label>
          </div>
        </section>

        <section className="settingsSection">
          <div className="settingsSectionTitle">
            <MapPinned size={19} />
            <div><h2>Áreas e bairros</h2><p>Moto e carro começam com o mesmo valor, mas ficam preparados para diferenciação futura.</p></div>
          </div>
          <div className="priceAreaList">
            {tabela?.areas.map((area) => (
              <article className="priceAreaCard" key={area.id}>
                <div className="priceAreaHeader">
                  <div><strong>{area.nome}</strong><span>{area.valorNegociado ? 'Definido em cada entrega' : `${area.bairros.length} bairros cadastrados`}</span></div>
                  {area.valorNegociado ? <span className="statusBadge pending">A combinar</span> : null}
                </div>
                {area.valorNegociado ? (
                  <p className="priceNegotiatedNote">O valor-base será obrigatório durante o cadastro da entrega para esta região.</p>
                ) : (
                  <div className="priceVehicleGrid">
                    <label><span><Bike size={15} /> Moto</span><div className="moneyInput"><span>R$</span><input type="number" min="0" step="0.01" value={area.valorMoto} onChange={(event) => atualizarArea(area.id, 'valorMoto', Number(event.target.value))} required /></div></label>
                    <label><span><Car size={15} /> Carro</span><div className="moneyInput"><span>R$</span><input type="number" min="0" step="0.01" value={area.valorCarro} onChange={(event) => atualizarArea(area.id, 'valorCarro', Number(event.target.value))} required /></div></label>
                  </div>
                )}
                <div className="neighborhoodChips">{area.bairros.map((bairro) => <span key={bairro}>{bairro}</span>)}</div>
              </article>
            ))}
          </div>
        </section>

        <div className="priceBottomGrid">
          <section className="settingsSection">
            <div className="settingsSectionTitle">
              <RotateCcw size={19} />
              <div><h2>Cálculo alternativo</h2><p>Usado somente quando o bairro não estiver na tabela.</p></div>
            </div>
            <div className="priceFallbackGrid">
              <label>Valor inicial<input type="number" min="0" step="0.01" value={fallback.taxaInicial} onChange={(event) => setFallback({ ...fallback, taxaInicial: event.target.value })} required /></label>
              <label>Preço por km<input type="number" min="0" step="0.01" value={fallback.valorPorKm} onChange={(event) => setFallback({ ...fallback, valorPorKm: event.target.value })} required /></label>
              <label>Valor mínimo<input type="number" min="0" step="0.01" value={fallback.valorMinimo} onChange={(event) => setFallback({ ...fallback, valorMinimo: event.target.value })} required /></label>
            </div>
          </section>

          <section className="settingsSection priceSimulator">
            <div className="settingsSectionTitle">
              <Calculator size={19} />
              <div><h2>Simulador</h2><p>Confira a composição antes de usar a tabela.</p></div>
            </div>
            <label>Bairro de destino<input list="bairros-preco" value={bairroSimulado} onChange={(event) => setBairroSimulado(event.target.value)} placeholder="Digite o bairro" /></label>
            <datalist id="bairros-preco">{bairros.map((bairro) => <option key={bairro} value={bairro} />)}</datalist>
            <div className="priceSimulatorFields">
              <label>Veículo<select value={tipoSimulado} onChange={(event) => setTipoSimulado(event.target.value as 'MOTO' | 'CARRO')}><option value="MOTO">Moto</option><option value="CARRO">Carro</option></select></label>
              <label>Espera (minutos)<input type="number" min="0" step="1" value={esperaSimulada} onChange={(event) => setEsperaSimulada(event.target.value)} /></label>
            </div>
            {areaSimulada?.valorNegociado ? <label>Valor negociado<input type="number" min="0" step="0.01" value={valorNegociadoSimulado} onChange={(event) => setValorNegociadoSimulado(event.target.value)} placeholder="0,00" /></label> : null}
            {!areaSimulada && bairroSimulado ? <label>Distância para fallback (km)<input type="number" min="0" step="0.1" value={distanciaFallback} onChange={(event) => setDistanciaFallback(event.target.value)} /></label> : null}
            <label className="priceReturnCheck"><input type="checkbox" checked={retornoSimulado} onChange={(event) => setRetornoSimulado(event.target.checked)} /> Possui retorno (+ {money(tabela?.taxaRetorno || 0)})</label>
            {simulacao ? (
              <div className="wizardSummary priceSimulationResult">
                <div className="wizardSummaryRow"><span>{simulacao.origem}</span><strong>{simulacao.pendente ? 'Informe o valor' : money(simulacao.base)}</strong></div>
                {simulacao.retorno > 0 ? <div className="wizardSummaryRow"><span>Retorno</span><strong>{money(simulacao.retorno)}</strong></div> : null}
                {simulacao.espera > 0 ? <div className="wizardSummaryRow"><span>Espera · {simulacao.blocos} bloco(s)</span><strong>{money(simulacao.espera)}</strong></div> : null}
                <div className="wizardSummaryDivider" />
                <div className="wizardSummaryTotal"><span>Total estimado</span><strong>{simulacao.pendente ? '—' : money(simulacao.total)}</strong></div>
              </div>
            ) : null}
          </section>
        </div>

        {mensagem ? <p className="successMessage">{mensagem}</p> : null}
        {erro ? <p className="errorMessage">{erro}</p> : null}
        <div className="settingsSubmit"><button className="primaryButton" type="submit" disabled={!tabela}><Save size={16} /> Salvar tabela</button></div>
      </form>
    </main>
  );
}

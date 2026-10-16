import { message, useLocale } from '../i18n';
import { LocalRota } from '../types';

export const novoLocal = (tipo: 'COLETA' | 'ENTREGA'): LocalRota => ({
  tipo, logradouro: '', numero: '', semNumero: false, complemento: '', bairro: '', cidade: '', estado: '',
  cep: '', contatoNome: '', contatoTelefone: '', observacao: '',
});
export const enderecoLocal = (p: LocalRota) => `${p.logradouro}${p.semNumero ? ', S/N' : p.numero ? `, ${p.numero}` : ''}`;
export const payloadLocal = (p: LocalRota, index: number) => ({
  ...p, ordem: index + 1, estado: p.estado || null, cep: p.cep || null,
  contatoTelefone: p.contatoTelefone.replace(/\D/g, '') || null,
});

export function EditorRota({ value, onChange, disabled = false }: {
  value: LocalRota[]; onChange: (value: LocalRota[]) => void; disabled?: boolean;
}) {
  useLocale();
  function change(index: number, field: keyof LocalRota, text: string | boolean) {
    onChange(value.map((local, i) => i === index ? { ...local, [field]: text } : local));
  }
  function move(index: number, delta: number) {
    const next = [...value]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; onChange(next);
  }
  return <fieldset className="routeEditor" disabled={disabled}>
    <legend>{message("rota.editor.sequencia.de.locais")}</legend>
    {value.map((local, index) => <article className="routeEditCard" key={local.id || index}>
      <strong>{message("rota.editor.local")} {index + 1}</strong>
      <label>{message("rota.editor.tipo")}<select value={local.tipo} onChange={e => change(index, 'tipo', e.target.value)}><option value="COLETA">{message("rota.editor.coleta")}</option><option value="ENTREGA">{message("rota.editor.entrega")}</option><option value="INTERMEDIARIA">{message("rota.editor.local.intermediario")}</option></select></label>
      <div className="formGrid">
        <label>{message("rota.editor.logradouro")}<input required maxLength={180} value={local.logradouro} onChange={e => change(index, 'logradouro', e.target.value)} /></label>
        <label>{message("rota.editor.numero")}<input required={!local.semNumero} disabled={local.semNumero} maxLength={30} value={local.numero} onChange={e => change(index, 'numero', e.target.value)} /></label>
        <label><input type="checkbox" checked={local.semNumero} onChange={e => change(index, 'semNumero', e.target.checked)} /> {message("rota.editor.sem.numero.s.n")}</label>
        <label>{message("rota.editor.complemento")}<input maxLength={120} value={local.complemento} onChange={e => change(index, 'complemento', e.target.value)} /></label>
        <label>{message("rota.editor.bairro")}<input required maxLength={80} value={local.bairro} onChange={e => change(index, 'bairro', e.target.value)} /></label>
        <label>{message("rota.editor.cidade")}<input maxLength={80} value={local.cidade} onChange={e => change(index, 'cidade', e.target.value)} /></label>
        <label>{message("rota.editor.uf")}<input maxLength={2} value={local.estado} onChange={e => change(index, 'estado', e.target.value.toUpperCase())} /></label>
        <label>{message("rota.editor.cep")}<input inputMode="numeric" maxLength={8} value={local.cep} onChange={e => change(index, 'cep', e.target.value.replace(/\D/g, ''))} /></label>
        <label>{message("rota.editor.contato")}<input maxLength={140} value={local.contatoNome} onChange={e => change(index, 'contatoNome', e.target.value)} /></label>
        <label>{message("rota.editor.telefone")}<input type="tel" value={local.contatoTelefone} onChange={e => change(index, 'contatoTelefone', e.target.value)} /></label>
      </div>
      <label>{message("rota.editor.observacao")}<textarea maxLength={500} value={local.observacao} onChange={e => change(index, 'observacao', e.target.value)} /></label>
      <div className="routeEditActions">
        <button className="secondaryButton" type="button" disabled={index === 0} onClick={() => move(index, -1)}>{message("rota.editor.mover.para.cima")}</button>
        <button className="secondaryButton" type="button" disabled={index === value.length - 1} onClick={() => move(index, 1)}>{message("rota.editor.mover.para.baixo")}</button>
        <button className="secondaryButton" type="button" disabled={value.length <= 2} onClick={() => onChange(value.filter((_, i) => i !== index))}>{message("rota.editor.remover.parada")}</button>
      </div>
    </article>)}
    <button className="secondaryButton" type="button" disabled={value.length >= 50} onClick={() => onChange([...value.slice(0, -1), novoLocal('COLETA'), value[value.length - 1]])}>{message("rota.editor.adicionar.parada")}</button>
    <p>{message("rota.editor.resumo")} {value.map((local, i) => `${i + 1}. ${local.tipo === 'COLETA' ? 'Coleta' : 'Entrega'} em ${enderecoLocal(local) || 'endereço a preencher'}`).join(' → ')}</p>
    <small>{message("rota.editor.a.rota.deve.comecar.com.coleta.e.terminar.com.entrega.varios.locais.")}</small>
  </fieldset>;
}

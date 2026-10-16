import { afterEach, describe, expect, it } from 'vitest';
import portuguese from './messages/messages_pt.properties?raw';
import english from './messages/messages.properties?raw';
import spanish from './messages/messages_es.properties?raw';
import { parseProperties } from './properties';
import { formatMoney, message } from './index';
import { domainLabel } from './domain';
import { setLocale } from '../preferences';
import { completionMessage, serverMessage } from './server';

afterEach(() => setLocale('pt-BR'));

describe('Catálogos .properties', () => {
  it('mantém as mesmas chaves e os mesmos parâmetros nos três idiomas', () => {
    const catalogs = [portuguese, english, spanish].map(parseProperties);
    const keys = Object.keys(catalogs[0]).sort();
    const parameters = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]).sort();
    for (const catalog of catalogs) {
      expect(Object.keys(catalog).sort()).toEqual(keys);
      for (const key of keys) {
        expect(catalog[key].trim(), key).not.toBe('');
        expect(parameters(catalog[key]), key).toEqual(parameters(catalogs[0][key]));
      }
    }
  });

  it('localiza os termos pelo domínio da operação e mantém BRL', () => {
    setLocale('en');
    expect(message('pagamento.aba.esquerda')).toBe('Payments');
    expect(domainLabel('ENTREGADOR')).toBe('Courier');
    expect(domainLabel('ESTORNO')).toBe('Refund');
    expect(message('entregador.faturamento.valores.movimentados.nas.suas.entregas.concluidas.nao.representam.co')).toContain('not commission');
    expect(formatMoney(1250.5)).toContain('1,250.50');
    setLocale('es');
    expect(message('pagamento.aba.esquerda')).toBe('Pagos');
    expect(domainLabel('ENTREGADOR')).toBe('Repartidor');
    expect(domainLabel('COLETADA')).toBe('Recogida');
    expect(message('contato.formulario.solicitacao.recebida.protocolo.value', { value1: 'JS-123' })).toContain('JS-123');
  });

  it('detecta chaves literais que não existem nos catálogos', () => {
    const catalog = parseProperties(portuguese);
    const sources = import.meta.glob(['../**/*.ts', '../**/*.tsx', '!../**/*.test.ts', '!../**/*.test.tsx'], { query: '?raw', import: 'default', eager: true });
    for (const [file, source] of Object.entries(sources)) {
      for (const match of String(source).matchAll(/\bmessage\(['"]([^'"]+)['"]/g)) expect(catalog, `${file}: ${match[1]}`).toHaveProperty(match[1]);
    }
  });

  it('traduz os bloqueios financeiros pelo papel sem alterar mensagens livres da API', () => {
    setLocale('en');
    expect(completionMessage('Conclua as paradas pendentes', false)).toBe('Complete the pending stops');
    expect(completionMessage('Conclua as paradas pendentes', true)).toBe('Waiting for pending stops to be completed');
    expect(serverMessage('Mensagem específica não catalogada')).toBe('Mensagem específica não catalogada');
    setLocale('es');
    expect(serverMessage('detalhe', 'OPTIMISTIC_LOCK')).toContain('Recarga');
  });
});

describe('Parser de properties', () => {
  it('aceita UTF-8, escapes, separadores e continuação sem perder valores', () => {
    const source = '# comentário\n! comentário\n chave=Pagamento\nspanish: Recepción\ncolon\\:key=um\\=dois\nescape=linha\\nseguinte\nunicode=a\\u00e7ão\njoined=primeira\\\n  segunda';
    expect(parseProperties(source)).toEqual({ chave: 'Pagamento', spanish: 'Recepción', 'colon:key': 'um=dois', escape: 'linha\nseguinte', unicode: 'ação', joined: 'primeirasegunda' });
  });

  it('rejeita chaves duplicadas e continuação incompleta', () => {
    expect(() => parseProperties('a=1\na=2')).toThrow('Duplicate message key');
    expect(() => parseProperties('a=texto\\')).toThrow('Unterminated');
  });
});

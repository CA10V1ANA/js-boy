import { domainLabel } from '../i18n/domain';
import { message, useLocale } from '../i18n';
import { KeyRound, ToggleLeft, ToggleRight, UserCog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog, EmptyState, ErrorState, FeedbackMessage, LoadingState } from '../components/AsyncState';
import { TableActions } from '../components/TableActions';
import { api } from '../services/api';
import { apiErrorMessage } from '../services/apiError';
import { UsuarioSistema } from '../types';
import { sentenceCase, titleCase } from '../utils/display';

export function UsuariosPage() {
  useLocale();
  const [items, setItems] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState<UsuarioSistema | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems((await api.get<UsuarioSistema[]>('/usuarios')).data); }
    catch (reason) { setError(apiErrorMessage(reason, message("usuarios.nao.foi.possivel.carregar.os.usuarios"))); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function toggle() {
    if (!pending || busy) return;
    setBusy(true); setError('');
    try {
      await api.patch(`/usuarios/${pending.id}/status`, { ativo: !pending.ativo });
      setSuccess(pending.ativo ? message("usuarios.usuario.desativado") : message("usuarios.usuario.ativado")); setPending(null); await load();
    } catch (reason) { setError(apiErrorMessage(reason, message("usuarios.nao.foi.possivel.alterar.o.usuario"))); }
    finally { setBusy(false); }
  }

  return (
    <main className="page">
      <div className="pageHeader"><div><h1>{message("usuarios.usuarios")}</h1><p>{message("usuarios.acessos.vinculados.aos.perfis.reais.da.operacao")}</p></div></div>
      <section className="infoBanner"><span className="infoBannerIcon"><KeyRound size={20} /></span><div><strong>{message("usuarios.senhas.permanecem.protegidas")}</strong><p>{message("usuarios.por.seguranca.o.sistema.exibe.apenas.uma.representacao.mascarada.nen")}</p></div></section>
      {success ? <FeedbackMessage tone="success">{success}</FeedbackMessage> : null}
      {loading ? <LoadingState label={message("usuarios.carregando.usuarios")} /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title={message("usuarios.nenhum.usuario.cadastrado")} /> : null}
      {!loading && !error && items.length > 0 ? (
        <section className="adminList"><div className="tableWrap"><table className="responsiveTable"><thead><tr><th>{message("usuarios.usuario")}</th><th>{message("usuarios.status")}</th><th>{message("usuarios.perfil")}</th><th>{message("usuarios.vinculo")}</th><th>{message("usuarios.senha")}</th><th style={{ textAlign: 'right' }}>{message("usuarios.acoes")}</th></tr></thead><tbody>
          {items.map((item) => <tr key={item.id}>
            <td data-label={message("usuarios.usuario")}><div className="nameCell"><span className="avatarTile"><UserCog size={16} /></span><div><div>{titleCase(item.nome)}</div><div className="cellSub">{item.email.toLowerCase()}</div></div></div></td>
            <td data-label={message("usuarios.status")}><span className={`statusBadge ${item.ativo ? 'active' : 'danger'}`}>{item.ativo ? message("usuarios.ativo") : message("usuarios.inativo")}</span></td>
            <td data-label={message("usuarios.perfil")}>{domainLabel(item.perfil)}</td>
            <td data-label={message("usuarios.vinculo")}>{domainLabel(item.vinculo || 'PROPRIETARIO')}</td>
            <td data-label={message("usuarios.senha")}><span className="passwordMask" title={message("usuarios.senha.protegida")}>••••••••</span></td>
            <td data-label={message("usuarios.acoes")}><TableActions actions={[{ label: item.ativo ? message("usuarios.desativar.usuario") : message("usuarios.ativar.usuario"), icon: item.ativo ? <ToggleLeft size={16} /> : <ToggleRight size={16} />, onClick: () => setPending(item), danger: item.ativo }]} /></td>
          </tr>)}
        </tbody></table></div></section>
      ) : null}
      <ConfirmDialog open={pending !== null} title={message("usuarios.value.usuario", { value1: message(pending?.ativo ? 'comum.deactivate' : 'comum.activate') })} description={message("usuarios.a.mudanca.afeta.o.proximo.acesso.desta.conta")} confirmLabel={message(pending?.ativo ? 'comum.deactivate' : 'comum.activate')} danger={pending?.ativo} busy={busy} onCancel={() => setPending(null)} onConfirm={() => void toggle()} />
    </main>
  );
}

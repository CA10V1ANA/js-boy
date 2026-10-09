import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const request = vi.fn();
  const rejected = vi.fn();
  const instance = Object.assign(vi.fn().mockResolvedValue({ data: 'retried' }), {
    interceptors: { request: { use: request }, response: { use: rejected } },
  });
  return { request, rejected, instance, post: vi.fn(), token: vi.fn(), user: vi.fn(), update: vi.fn(), clear: vi.fn() };
});
vi.mock('axios', () => ({ default: { create: () => mocks.instance, post: mocks.post } }));
vi.mock('./authStorage', () => ({
  getStoredToken: mocks.token, getStoredUser: mocks.user,
  updateStoredTokens: mocks.update, clearStoredAuth: mocks.clear,
}));
vi.mock('./toastBus', () => ({ emitToast: vi.fn() }));
import './api';

const onRequest = mocks.request.mock.calls[0][0];
const onFailure = mocks.rejected.mock.calls[0][1];
describe('renovação da sessão', () => {
  beforeEach(() => {
    mocks.post.mockReset(); mocks.instance.mockClear(); mocks.update.mockClear(); mocks.clear.mockClear();
    mocks.token.mockReturnValue('current'); mocks.user.mockReturnValue({ id: 'owner' });
  });
  it('envia o acesso atual para consultar a sessão, sem enviar para login', () => {
    expect(onRequest({ url: '/auth/me', headers: {} }).headers.Authorization).toBe('Bearer current');
    expect(onRequest({ url: '/auth/login', headers: {} }).headers.Authorization).toBeUndefined();
  });
  it('renova uma única vez consultas simultâneas de sessão após recarregar', async () => {
    mocks.token.mockReturnValue(null);
    mocks.post.mockResolvedValue({ data: { token: 'renewed' } });
    const error = () => ({ response: { status: 401 }, config: { url: '/auth/me', headers: {} } });
    await Promise.all([onFailure(error()), onFailure(error())]);
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.post.mock.calls[0][0]).toMatch(/\/auth\/refresh$/);
    expect(mocks.update).toHaveBeenCalledWith('renewed');
    expect(mocks.instance).toHaveBeenCalledTimes(2);
    expect(mocks.instance.mock.calls[0][0].headers.Authorization).toBe('Bearer renewed');
    expect(mocks.clear).not.toHaveBeenCalled();
  });
  it('não tenta renovar credenciais recusadas no login', async () => {
    const error = { response: { status: 401 }, config: { url: '/auth/login', headers: {} } };
    await expect(onFailure(error)).rejects.toBe(error);
    expect(mocks.post).not.toHaveBeenCalled();
  });
});

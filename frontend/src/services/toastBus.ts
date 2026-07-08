export type ToastType = 'success' | 'error' | 'info';
type Listener = (message: string, type: ToastType) => void;

const listeners = new Set<Listener>();

export function subscribeToast(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitToast(message: string, type: ToastType = 'info') {
  listeners.forEach((listener) => listener(message, type));
}

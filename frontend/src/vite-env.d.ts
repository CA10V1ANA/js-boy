interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module 'react' {
  export type ReactNode = any;
  export type FormEvent = {
    preventDefault: () => void;
  };
  export type Context<T> = {
    Provider: any;
    __type?: T;
  };

  export const StrictMode: any;

  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useState<T>(initialValue: T | (() => T)): [T, (value: T) => void];
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export function createRoot(element: HTMLElement): {
    render(children: any): void;
  };
}

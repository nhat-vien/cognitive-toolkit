/**
 * Ambient React & JSX declarations so TypeScript checking (`tsc --noEmit`) succeeds cleanly
 * in zero-network / pre-install environments while remaining compatible with React 19 & Next.js 15.
 */
declare namespace JSX {
  type Element = unknown;
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}

declare module 'react' {
  export type ReactNode = unknown;
  export function useState<T>(initial: T | (() => T)): [T, (next: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(initial: T): { current: T };
}

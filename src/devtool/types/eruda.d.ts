declare global {
  interface Window {
    eruda: Eruda;
  }
}

export interface Eruda {
  init(options?: ErudaOptions): void;
  add(plugin: ErudaPlugin): void;
  remove(name: string): void;
  show(name?: string): void;
  hide(): void;
}

export interface ErudaOptions {
  container?: HTMLElement;
  tool?: string[];
  autoScale?: boolean;
  useShadowDom?: boolean;
  defaults?: {
    displaySize?: number;
    transparency?: number;
  };
}

export interface ErudaPlugin {
  name: string;
  init($el: HTMLElement, eruda: Eruda): void;
  show?(): void;
  hide?(): void;
  destroy?(): void;
}

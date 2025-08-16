/// <reference types="vite/client" />

// this was needed because the onBeforeinput event was expected by the typescript compiler
import '@vue/runtime-dom';

declare module '@vue/runtime-dom' {
  interface HTMLAttributes {
    onBeforeinput?: (event: InputEvent) => void;
  }
}

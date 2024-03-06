interface Window {
  config: {
    hawkClientToken: string;
    misprintsChatId: string;
    basePath: string;
    locales: Record<string, any>;
  };
}

declare module 'module-dispatcher' {
  export default class ModuleDispatcher {
    constructor(options: any);
  }
}

declare module '@codexteam/shortcuts' {
  export default class Shortcut {
    constructor(options: any);
  }
}

declare module '@codexteam/misprints' {
  export default class Misprints {
    constructor(options: any);
  }
}

declare module '@editorjs/header';
declare module '@editorjs/image';
declare module '@editorjs/code';
declare module '@editorjs/list';
declare module '@editorjs/delimiter';
declare module '@editorjs/table';
declare module '@editorjs/warning';
declare module '@editorjs/checklist';
declare module '@editorjs/link';
declare module '@editorjs/raw';
declare module '@editorjs/embed';
declare module '@editorjs/inline-code';
declare module '@editorjs/marker';
declare module 'editorjs-toggle-block';

declare module 'editorjs-undo';
declare module 'editorjs-drag-drop';

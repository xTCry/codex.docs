/**
 * Module for pages create/edit
 */
import { I18nDictionary } from '@editorjs/editorjs';
import Editor from '../classes/editor';
import { Storage } from '../utils/storage';

type ENodes =
  | 'saveButton'
  | 'autoSaveCheckbox'
  | 'removeButton'
  | 'goViewButton'
  | 'parentIdSelector'
  | 'putAboveIdSelector'
  | 'uriInput';

type PageType = {
  parent: string;
  _id: string;
  title: string;
  uri: string;
  body: {
    /** saving time */
    time: number;
    /** used Editor version  */
    version: string;
    /** array of Blocks */
    blocks: {
      id: string;
      type: string;
      data: any;
    }[];
  };
};

type WritingSettings = {
  /** page data for editing */
  page: PageType;
  editorjs_i18n: { messages: I18nDictionary } | string;
};

/**
 * @class Writing
 * @classdesc Class for create/edit pages
 */
export default class Writing {
  basePath = window.config.basePath || '';
  locales: Record<string, any> = window.config.locales.writing || {};

  editor: Editor | null = null;

  // stores Page on editing
  page: PageType | null = null;
  editorjs_i18n: { messages: I18nDictionary } | null = null;

  editorWrapper: HTMLElement | null = null;
  lastSaveAt: HTMLElement | null = null;

  nodes: Record<ENodes, HTMLInputElement | null> = {
    saveButton: null,
    autoSaveCheckbox: null,
    removeButton: null,
    goViewButton: null,
    parentIdSelector: null,
    putAboveIdSelector: null,
    uriInput: null,
  };

  lastBlocksJson: string | null = null;
  autoSaveStorage = new Storage('autoSave');
  autoSaveInterval: NodeJS.Timer | null = null;
  autoSaveLoop = false;

  /**
   * Called by ModuleDispatcher to initialize module from DOM
   * @param {WritingSettings} settings - module settings
   * @param {HTMLElement} moduleEl - module element
   */
  init(settings: WritingSettings, moduleEl: HTMLElement) {
    /**
     * Create Editor
     */
    this.editorWrapper = document.getElementById('codex-editor');
    if (settings.page) {
      this.page = settings.page;
      this.lastBlocksJson = JSON.stringify(settings.page.body?.blocks);
    }

    if (typeof settings.editorjs_i18n === 'object' /*  !== 'editorjs_i18n' */) {
      this.editorjs_i18n = settings.editorjs_i18n;
    }

    this.loadEditor().then((editor) => {
      this.editor = editor;
    });

    /**
     * Activate form elements
     */
    this.lastSaveAt = moduleEl.querySelector('#last-save-at > span');

    this.nodes.autoSaveCheckbox = moduleEl.querySelector(
      '[name="js-auto-save"]',
    );
    if (this.nodes.autoSaveCheckbox) {
      this.nodes.autoSaveCheckbox.checked =
        this.autoSaveStorage.get() === 'true';
      this.nodes.autoSaveCheckbox.addEventListener('change', () => {
        this.autoSaveStorage.set(String(this.nodes.autoSaveCheckbox!.checked));
      });
    }

    this.nodes.saveButton = moduleEl.querySelector('[name="js-submit-save"]');
    this.nodes.saveButton!.addEventListener('click', () => {
      window.onbeforeunload = null;
      this.saveButtonClicked();
    });

    this.nodes.removeButton = moduleEl.querySelector(
      '[name="js-submit-remove"]',
    );
    if (this.nodes.removeButton) {
      this.nodes.removeButton.addEventListener('click', () => {
        const isUserAgree = window.confirm(this.locales.confirm_remove);

        if (!isUserAgree) {
          return;
        }
        window.onbeforeunload = null;
        this.autoSaveLoop = false;
        this.removeButtonClicked();
      });
    }

    this.nodes.goViewButton = moduleEl.querySelector('[name="js-go-view"]');
    if (this.nodes.goViewButton) {
      this.nodes.goViewButton.addEventListener('click', () => {
        if (this.page) {
          document.location = `${this.basePath}/page/` + this.page._id;
        }
      });
    }

    this.nodes.parentIdSelector = moduleEl.querySelector('[name="parent"]');
    this.nodes.putAboveIdSelector = moduleEl.querySelector('[name="above"]');
    this.nodes.uriInput = moduleEl.querySelector('[name="uri-input"]');

    /**
     * Set minimum margin left for main column to prevent editor controls from overlapping sidebar
     */
    document.documentElement.style.setProperty(
      '--main-col-min-margin-left',
      '50px',
    );

    this.initAutosave();
  }

  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveLoop = false;
    }
  }

  initAutosave() {
    if (this.autoSaveLoop) return;
    this.autoSaveLoop = true;
    // this.autoSaveInterval = setInterval(fn, 5e3);

    const loop = async () => {
      while (this.autoSaveLoop) {
        try {
          if (this.editor) {
            if (!(await this.compareData())) {
              this.nodes.saveButton!.classList.add('pulse');
              window.onbeforeunload = () => '';

              if (this.nodes.autoSaveCheckbox?.checked) {
                window.onbeforeunload = null;
                if (this.page) {
                  this.saveButtonClicked(true);
                }
              }
            }
          }
        } catch (err) {
          console.error(err);
        }

        await new Promise(
          (resolve) => (this.autoSaveInterval = setTimeout(resolve, 5e3)),
        );
      }
    };
    loop();
  }

  async compareData() {
    return (
      this.lastBlocksJson === JSON.stringify((await this.editor!.save()).blocks)
    );
  }

  /**
   * Loads class for working with Editor
   */
  async loadEditor() {
    const { default: Editor } = await import(
      /* webpackChunkName: "editor" */ '../classes/editor'
    );

    const editorConfig = this.page ? { data: this.page.body } : {};

    return new Editor(editorConfig, {
      headerPlaceholder: this.locales.enter_title,
      i18n: this.editorjs_i18n,
    });
  }

  /**
   * Returns all writing form data
   * @throws {Error} - validation error
   */
  async getData() {
    const editorData = await this.editor!.save();

    const firstBlock = editorData.blocks.length ? editorData.blocks[0] : null;
    const title =
      firstBlock && firstBlock.type === 'header' ? firstBlock.data.text : null;

    let uri = '';
    if (this.nodes.uriInput && this.nodes.uriInput.value) {
      if (this.nodes.uriInput.value.match(/^[a-z0-9'-]+$/i)) {
        uri = this.nodes.uriInput.value;
      } else {
        throw new Error(this.locales.wrong_uri);
      }
    }

    if (!title) {
      throw new Error(this.locales.wrong_title_block);
    }

    /** get ordering selector value */
    let putAbovePageId: string | null = null;
    if (this.nodes.putAboveIdSelector) {
      putAbovePageId = this.nodes.putAboveIdSelector.value;
    }

    return {
      parent: this.nodes.parentIdSelector!.value,
      putAbovePageId,
      uri,
      body: editorData,
    };
  }

  /**
   * Handler for clicks on the Save button
   */
  async saveButtonClicked(isAuto = false) {
    try {
      const writingData = await this.getData();

      const endpoint = this.page
        ? `${this.basePath}/api/page/` + this.page._id
        : `${this.basePath}/api/page`;

      try {
        let response = await fetch(endpoint, {
          method: this.page ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(writingData),
        }).then((res) => res.json());

        if (response.success) {
          this.lastBlocksJson = JSON.stringify(writingData.body.blocks);
          this.nodes.saveButton!.classList.remove('pulse');
          if (this.lastSaveAt) {
            this.lastSaveAt.textContent = new Date().toLocaleString();
          }

          if (!this.page || !isAuto) {
            // if first create page, reload with this result
            window.location.pathname = response.result.uri
              ? `${this.basePath}/${response.result.uri}`
              : `${this.basePath}/page/` + response.result._id;
          }
        } else {
          alert(response.error);
          console.log('Validation failed:', response.error);
        }
      } catch (sendingError) {
        console.log('Saving request failed:', sendingError);
      }
    } catch (savingError) {
      alert(savingError);
      console.log('Saving error: ', savingError);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async removeButtonClicked() {
    try {
      const endpoint = this.page
        ? `${this.basePath}/api/page/` + this.page._id
        : '';

      let response = await fetch(endpoint, {
        method: 'DELETE',
      }).then((res) => res.json());

      if (response.success) {
        if (response.result && response.result._id) {
          document.location = `${this.basePath}/page/` + response.result._id;
        } else {
          document.location = this.basePath || '/';
        }
      } else {
        alert(response.error);
        console.log('Server fetch failed:', response.error);
      }
    } catch (e) {
      console.log('Server fetch failed due to the:', e);
    }
  }
}

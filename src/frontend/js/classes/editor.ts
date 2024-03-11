import EditorJS, { EditorConfig, I18nDictionary } from '@editorjs/editorjs';

/**
 * Block Tools for the Editor
 */
import Header from '@editorjs/header';
import Image from '@editorjs/image';
import CodeTool from '@editorjs/code';
import List from '@editorjs/list';
import Delimiter from '@editorjs/delimiter';
import Table from '@editorjs/table';
import Warning from '@editorjs/warning';
import Checklist from '@editorjs/checklist';
import RawTool from '@editorjs/raw';
import Embed from '@editorjs/embed';
import Quote from '@editorjs/quote';
import ToggleBlock from 'editorjs-toggle-block';
import ImageGallery from 'editorjs-gallery';

/**
 * Inline Tools for the Editor
 */
import LinkTool from '@editorjs/link';
import Hyperlink from 'editorjs-hyperlink';
import InlineCode from '@editorjs/inline-code';
// import Marker from '@editorjs/marker';
import Underline from '@editorjs/underline';
import Strikethrough from '@sotaproject/strikethrough';

/**
 * Plugins
 */
// import Undo from 'editorjs-undo';
import DragDrop from 'editorjs-drag-drop';
import ColorPlugin from 'editorjs-text-color-plugin';

export class FixHyperlink extends Hyperlink {
  iconSvg(name: string, width = 14, height = 14) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon', 'icon--' + name);
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    if (name == 'link') {
      svg.innerHTML = `
        <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M7.69998 12.6L7.67896 12.62C6.53993 13.7048 6.52012 15.5155 7.63516 16.625V16.625C8.72293 17.7073 10.4799 17.7102 11.5712 16.6314L13.0263 15.193C14.0703 14.1609 14.2141 12.525 13.3662 11.3266L13.22 11.12"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16.22 11.12L16.3564 10.9805C17.2895 10.0265 17.3478 8.5207 16.4914 7.49733V7.49733C15.5691 6.39509 13.9269 6.25143 12.8271 7.17675L11.3901 8.38588C10.0935 9.47674 9.95706 11.4241 11.0888 12.6852L11.12 12.72"></path>
      `;
    } else {
      svg.innerHTML = `
        <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M15.7795 11.5C15.7795 11.5 16.053 11.1962 16.5497 10.6722C17.4442 9.72856 17.4701 8.2475 16.5781 7.30145V7.30145C15.6482 6.31522 14.0873 6.29227 13.1288 7.25073L11.8796 8.49999"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M8.24517 12.3883C8.24517 12.3883 7.97171 12.6922 7.47504 13.2161C6.58051 14.1598 6.55467 15.6408 7.44666 16.5869V16.5869C8.37653 17.5731 9.93744 17.5961 10.8959 16.6376L12.1452 15.3883"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M17.7802 15.1032L16.597 14.9422C16.0109 14.8624 15.4841 15.3059 15.4627 15.8969L15.4199 17.0818"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6.39064 9.03238L7.58432 9.06668C8.17551 9.08366 8.6522 8.58665 8.61056 7.99669L8.5271 6.81397"></path><line x1="12.1142" x2="11.7" y1="12.2" y2="11.7858" stroke="currentColor" stroke-linecap="round" stroke-width="2"></line>
      `;
    }
    return svg;
  }
}

type OptionsType = {
  headerPlaceholder?: string;
  i18n?: {
    messages: I18nDictionary;
  } | null;
};

/**
 * Class for working with Editor.js
 */
export default class Editor {
  basePath = window.config.basePath || '';

  editor: EditorJS;

  /**
   * Creates Editor instance
   *
   * @param {object} editorConfig - configuration object for Editor.js
   * @param {object} data.blocks - data to start with
   * @param {object} options
   * @param {string} options.headerPlaceholder - placeholder for Header tool
   */
  constructor(
    editorConfig: { data?: { blocks: any[] } } = {},
    options: OptionsType = {},
  ) {
    const defaultConfig: EditorConfig = {
      onReady: () => this.handleReady(),
      tools: {
        header: {
          class: Header,
          inlineToolbar: ['marker', 'inlineCode', 'underline', 'strikethrough'],
          config: {
            placeholder: options.headerPlaceholder || '',
          },
          shortcut: 'CMD+SHIFT+H',
        },

        strikethrough: Strikethrough,
        underline: Underline,

        Color: {
          class: ColorPlugin,
          config: {
            colorCollections: [
              // 'var(--color-button-primary)',
              // 'var(--color-button-secondary)',
              // 'var(--color-line-gray)',
              '#EC7878',
              '#9C27B0',
              '#673AB7',
              '#3F51B5',
              '#0070FF',
              '#03A9F4',
              '#00BCD4',
              '#4CAF50',
              '#8BC34A',
              '#CDDC39',
              '#FFF',
            ],
            defaultColor: '#FF1300',
            type: 'text',
            // add a button to allow selecting any colour
            customPicker: true,
          },
        },
        marker: {
          // class: Marker,
          class: ColorPlugin,
          config: {
            defaultColor: '#FFBF00',
            type: 'marker',
            icon: `<svg fill="currentColor" height="200px" width="200px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M17.6,6L6.9,16.7c-0.2,0.2-0.3,0.4-0.3,0.6L6,23.9c0,0.3,0.1,0.6,0.3,0.8C6.5,24.9,6.7,25,7,25c0,0,0.1,0,0.1,0l6.6-0.6 c0.2,0,0.5-0.1,0.6-0.3L25,13.4L17.6,6z"></path> <path d="M26.4,12l1.4-1.4c1.2-1.2,1.1-3.1-0.1-4.3l-3-3c-0.6-0.6-1.3-0.9-2.2-0.9c-0.8,0-1.6,0.3-2.2,0.9L19,4.6L26.4,12z"></path> </g> <g> <path d="M28,29H4c-0.6,0-1-0.4-1-1s0.4-1,1-1h24c0.6,0,1,0.4,1,1S28.6,29,28,29z"></path> </g> </g></svg>`,
          },
          shortcut: 'CMD+SHIFT+M',
        },

        // hyperlink: {
        link: {
          class: FixHyperlink as any,
          config: {
            shortcut: 'CMD+L',
            target: '_blank',
            rel: 'nofollow',
            availableTargets: ['_blank', '_self'],
            availableRels: ['author', 'noreferrer', 'nofollow'],
            validate: false,
          },
        },

        gallery: {
          class: ImageGallery,
          config: {
            endpoints: {
              byFile: `${this.basePath}/api/transport/image`,
            },
          },
        },

        image: {
          class: Image,
          inlineToolbar: true,
          config: {
            types: 'image/*, video/mp4',
            endpoints: {
              byFile: `${this.basePath}/api/transport/image`,
              byUrl: `${this.basePath}/api/transport/fetch`,
            },
          },
        },

        linkTool: {
          class: LinkTool,
          config: {
            endpoint: `${this.basePath}/api/fetchUrl`,
          },
        },

        code: {
          class: CodeTool,
          shortcut: 'CMD+SHIFT+D',
        },

        list: {
          class: List,
          inlineToolbar: true,
          shortcut: 'CMD+SHIFT+L',
        },

        table: {
          class: Table,
          inlineToolbar: true,
          shortcut: 'CMD+ALT+T',
        },

        checklist: {
          class: Checklist,
          inlineToolbar: true,
        },

        toggle: {
          class: ToggleBlock,
          inlineToolbar: true,
        },

        delimiter: Delimiter,

        warning: {
          class: Warning,
          inlineToolbar: true,
        },

        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: "Quote's author",
          },
          shortcut: 'CMD+SHIFT+O',
        },

        /**
         * Inline Tools
         */
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+C',
        },

        raw: RawTool,

        embed: Embed,
      },
      data: {
        blocks: [
          {
            type: 'header',
            data: {
              text: '',
              level: 2,
            },
          },
        ],
      },
      ...(options.i18n ? { i18n: options.i18n } : {}),
    };

    this.editor = new EditorJS(Object.assign(defaultConfig, editorConfig));
  }

  /**
   * Init plugins on ready state
   */
  handleReady() {
    const editor = this.editor;
    // new Undo({ editor });
    new DragDrop(editor);
  }

  /**
   * Return Editor data
   */
  save() {
    return this.editor.saver.save();
  }
}

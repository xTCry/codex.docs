import EditorJS from '@editorjs/editorjs';

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
import LinkTool from '@editorjs/link';
import RawTool from '@editorjs/raw';
import Embed from '@editorjs/embed';
import ToggleBlock from 'editorjs-toggle-block';

/**
 * Inline Tools for the Editor
 */
import InlineCode from '@editorjs/inline-code';
import Marker from '@editorjs/marker';

/**
 * Plugins
 */
import Undo from 'editorjs-undo';
import DragDrop from 'editorjs-drag-drop';

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
    options: { headerPlaceholder?: string } = {},
  ) {
    const defaultConfig = {
      onReady: () => this.handleReady(),
      tools: {
        header: {
          class: Header,
          inlineToolbar: ['marker', 'inlineCode'],
          config: {
            placeholder: options.headerPlaceholder || '',
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
        },

        table: {
          class: Table,
          inlineToolbar: true,
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

        /**
         * Inline Tools
         */
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+C',
        },

        marker: {
          class: Marker,
          shortcut: 'CMD+SHIFT+M',
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
    };

    this.editor = new EditorJS(Object.assign(defaultConfig, editorConfig));
  }

  /**
   * Init plugins on ready state
   */
  handleReady() {
    const editor = this.editor;
    new Undo({ editor });
    new DragDrop(editor);
  }

  /**
   * Return Editor data
   */
  save() {
    return this.editor.saver.save();
  }
}

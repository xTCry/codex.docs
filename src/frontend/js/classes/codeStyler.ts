import type { LanguageFn } from 'highlight.js';
import hljs from 'highlight.js/lib/common';

import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';

import 'highlight.js/styles/github.css';

import '../../styles/diff.pcss';

/**
 * @class CodeStyles
 * @classdesc Provides styling for code blocks
 */
export default class CodeStyler {
  codeBlocksSelector: string;
  languages: string[];

  langsAvailable: Record<string, LanguageFn> = { javascript, xml, json, css };

  constructor(options: {
    /** CSS selector for code blocks */
    selector: string;
    /** list of languages to highlight, see hljs.listLanguages() */
    languages?: string[];
  }) {
    const { selector, languages = ['javascript', 'xml', 'json', 'css'] } =
      options;

    this.codeBlocksSelector = selector;
    this.languages = languages;

    this.init();
  }

  /**
   * Start to highlight
   */
  init() {
    const codeBlocks = document.querySelectorAll(this.codeBlocksSelector);

    if (!codeBlocks.length) {
      return;
    }

    this.languages.forEach((lang) => {
      hljs.registerLanguage(lang, this.langsAvailable[lang]);
    });

    hljs.configure({
      languages: this.languages,
    });

    Array.from(codeBlocks).forEach((block) => {
      hljs.highlightBlock(block as HTMLElement);
      this.highlightDiffs(block);
    });
  }

  /**
   * Highlight lines started from + or -
   */
  highlightDiffs(block: Element) {
    const lines = block.innerHTML.split('\n').map((line) => {
      return line
        .replace(/^\+(.*)$/gi, '<span class="diff diff--added">$1</span>')
        .replace(/^-(.*)$/gi, '<span class="diff diff--removed">$1</span>');
    });

    block.innerHTML = lines.join('\n');
  }
}

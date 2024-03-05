// No inspection for unused var `css` because it's used for css bundle
// eslint-disable-next-line no-unused-vars
import '../styles/main.pcss';

/**
 * Module Dispatcher
 *
 * @see {@link https://github.com/codex-team/moduleDispatcher}
 * @author CodeX
 */
import ModuleDispatcher from 'module-dispatcher';
import HawkCatcher from '@hawk.so/javascript';

/**
 * Import modules
 */
import Writing from './modules/writing';
import Page from './modules/page';
import Extensions from './modules/extensions';
import Sidebar from './modules/sidebar';

/**
 * Main app class
 */
class Docs {
  writing = new Writing();
  page = new Page();
  extensions = new Extensions();
  sidebar = new Sidebar();

  hawk: HawkCatcher | null = null;
  moduleDispatcher: ModuleDispatcher | null = null;

  /**
   * @class
   */
  constructor() {
    if (window.config.hawkClientToken) {
      this.hawk = new HawkCatcher(window.config.hawkClientToken);
    }

    document.addEventListener('DOMContentLoaded', (event) => {
      this.docReady();
    });

    console.log('CodeX Docs initialized', new Date().toLocaleString());
  }

  /**
   * Document is ready
   */
  docReady() {
    this.moduleDispatcher = new ModuleDispatcher({ Library: this });
  }
}

export default new Docs();

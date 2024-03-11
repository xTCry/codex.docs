import Misprints from '@codexteam/misprints';
import { tns } from 'tiny-slider';
import { Fancybox } from '@fancyapps/ui';

import 'tiny-slider/dist/tiny-slider.css';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

import { Storage } from '../utils/storage';

window.tns = tns;

/**
 * Local storage key
 */
const THEME_STORAGE_KEY = 'theme_mode';

/**
 * @class Extensions
 * @classdesc Class for extensions module
 */
export default class Extensions {
  misprints = new Misprints({
    chatId: window.config.misprintsChatId,
  });

  themeMode: string = 'light';

  /**
   * Initialize extensions
   */
  constructor() {
    if (window.config.allowChangeTheme) {
      this.initTheme();
    }

    Fancybox.bind('[data-fancybox]', {
      // options...
    });
  }

  initTheme() {
    const updateButtons = (isDark: boolean) => {
      const buttons = document.querySelectorAll<HTMLElement>(
        '[name="theme-toggle"]',
      );
      for (const button of buttons) {
        const label = `Change to ${isDark ? 'dark' : 'light'} theme`;
        button.setAttribute('title', label);
        button.setAttribute('aria-label', label);
        // button.innerText = label;
      }
    };

    const updateTheme = (theme: string) => {
      updateButtons(theme === 'dark');
      document.querySelector('html')!.setAttribute('data-theme', theme);
    };

    const changeTheme = (theme?: string) => {
      this.themeMode = theme || (this.themeMode === 'dark' ? 'light' : 'dark');
      themeModeStorage.set(this.themeMode);
      updateTheme(this.themeMode);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const themeModeStorage = new Storage(THEME_STORAGE_KEY);
    this.themeMode =
      themeModeStorage.get() || (mediaQuery.matches ? 'dark' : 'light');

    mediaQuery.addEventListener('change', (event) => {
      changeTheme(event.matches ? 'dark' : 'light');
    });

    const headerWrapper = document.querySelector('.docs-header')!;
    headerWrapper.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[name="theme-toggle"]')) {
        changeTheme();
      }
    });

    updateTheme(this.themeMode);
  }
}

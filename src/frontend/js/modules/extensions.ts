import Misprints from '@codexteam/misprints';

/**
 * @class Extensions
 * @classdesc Class for extensions module
 */
export default class Extensions {
  misprints = new Misprints({
    chatId: window.config.misprintsChatId,
  });

  /**
   * Initialize extensions
   */
  constructor() {}
}

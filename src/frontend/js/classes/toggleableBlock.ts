/**
 * @class CodeStyles
 * @classdesc Provides styling for code blocks
 */
export default class ToggleableBlock {
  idAttrName = 'data-id';
  statusAttrName = 'data-status';
  itemsAttrName = 'data-items';
  fkAttrName = 'data-fk';

  toggleBlockSelector: string;
  selectorClass: string;
  selectorItemClass: string;
  selectorOpenClass: string;

  /**
   * @param {string} selector - CSS selector for toggle blocks
   */
  constructor(options: { selector: string }) {
    const { selector } = options;
    this.toggleBlockSelector = selector;

    this.selectorClass = this.toggleBlockSelector.replace('.', '');
    this.selectorItemClass = `${this.selectorClass}__item`;
    this.selectorOpenClass = `${this.selectorClass}--open`;

    this.init();
  }

  init() {
    const toggleBlocks = document.querySelectorAll(this.toggleBlockSelector);

    if (!toggleBlocks.length) return;

    Array.from(toggleBlocks).forEach((block) => this.initToggleBlock(block));
  }

  initToggleBlock(block: Element) {
    const id = block.getAttribute(this.idAttrName)!;
    const status = block.getAttribute(this.statusAttrName)!;
    const items = block.getAttribute(this.itemsAttrName);

    if (!items) return;

    this.bindToggleAction(block);
    this.wrapChildItems(block.parentNode as Element, id, +items);

    this.updateToggleState(block, status);
  }

  bindToggleAction(block: Element) {
    const icon = block.querySelector('svg')!;

    icon.style.cursor = 'pointer';
    icon.addEventListener('click', (event: any) => {
      this.resolveToggleAction(event.currentTarget.parentNode);
    });
  }

  wrapChildItems(currentWrapper: Element, id: string, items: number) {
    let currentEdtorWrapper = currentWrapper;

    for (let i = 0; i < items; i++) {
      currentEdtorWrapper = currentEdtorWrapper.nextElementSibling as Element;
      currentEdtorWrapper.classList.add(this.selectorItemClass);
      currentEdtorWrapper.setAttribute(this.fkAttrName, id);
    }
  }

  resolveToggleAction(block: Element) {
    let status = block.getAttribute(this.statusAttrName);

    if (status === 'open') {
      status = 'closed';
    } else {
      status = 'open';
    }

    this.updateToggleState(block, status);
  }

  updateToggleState(block: Element, status: string) {
    const id = block.getAttribute(this.idAttrName)!;

    this.updateBlockState(block, status);
    this.hideAndShowBlocks(id, status);
  }

  updateBlockState(block: Element, status: string) {
    if (status === 'open') {
      block.classList.add(this.selectorOpenClass);
    } else {
      block.classList.remove(this.selectorOpenClass);
    }

    block.setAttribute(this.statusAttrName, status);
  }

  hideAndShowBlocks(fk: string, status: string) {
    const children = document.querySelectorAll(`div[${this.fkAttrName}=${fk}]`);

    if (!children.length) return;

    Array.from(children).forEach(
      (child) => ((child as HTMLElement).hidden = status === 'closed'),
    );
  }
}

import Shortcut from '@codexteam/shortcuts';

import { Storage } from '../utils/storage';
import SidebarFilter from '../classes/sidebar-filter';
/**
 * Local storage key
 */
const LOCAL_STORAGE_KEY = 'docs_sidebar_state';
const SIDEBAR_VISIBILITY_KEY = 'docs_sidebar_visibility';

/**
 * Section list item height in px
 */
const ITEM_HEIGHT = 31;

type ENodes = 'sidebar' | 'sidebarContent' | 'toggler' | 'slider';

/**
 * Sidebar module
 */
export default class Sidebar {
  sidebarStorage = new Storage(LOCAL_STORAGE_KEY);
  sectionsState: Record<string, any> = {};

  // Sidebar filter module
  filter = new SidebarFilter();

  // Initialize localStorage that contains sidebar visibility
  sidebarVisibilityStorage = new Storage(SIDEBAR_VISIBILITY_KEY);

  // Sidebar visibility
  isVisible: boolean = false;

  nodeSearch: HTMLInputElement | null = null;

  /**
   * Stores refs to HTML elements needed for correct sidebar work
   */
  nodes: Record<ENodes, HTMLElement | null> = {
    sidebar: null,
    sidebarContent: null,
    toggler: null,
    slider: null,
  };

  nodeSections: HTMLElement[] = [];

  /**
   * Creates base properties
   */
  constructor() {
    const storedState = this.sidebarStorage.get();
    this.sectionsState = storedState ? JSON.parse(storedState) : {};

    // Get current sidebar visibility from storage
    const storedVisibility = this.sidebarVisibilityStorage.get();
    this.isVisible = storedVisibility !== 'false';
  }

  /**
   * CSS classes
   *
   * @returns {Record<string, string>}
   */
  static get CSS() {
    return {
      toggler: 'docs-sidebar__section-toggler',
      section: 'docs-sidebar__section',
      sectionCollapsed: 'docs-sidebar__section--collapsed',
      sectionAnimated: 'docs-sidebar__section--animated',
      sectionTitle: 'docs-sidebar__section-title',
      sectionTitleActive: 'docs-sidebar__section-title--active',
      sectionList: 'docs-sidebar__section-list',
      sectionListItemActive: 'docs-sidebar__section-list-item--active',
      sidebarToggler: 'docs-sidebar__toggler',
      sidebarSlider: 'docs-sidebar__slider',
      sidebarCollapsed: 'docs-sidebar--collapsed',
      sidebarAnimated: 'docs-sidebar--animated',
      sidebarContent: 'docs-sidebar__content',
      sidebarContentVisible: 'docs-sidebar__content--visible',
      sidebarContentInvisible: 'docs-sidebar__content--invisible',
      sidebarSearch: 'docs-sidebar__search',
    };
  }

  /**
   * Called by ModuleDispatcher to initialize module from DOM
   *
   * @param {object} settings - module settings
   * @param {HTMLElement} moduleEl - module element
   */
  init(settings: any, moduleEl: HTMLElement) {
    this.nodes.sidebar = moduleEl;
    this.nodeSections = Array.from(
      moduleEl.querySelectorAll('.' + Sidebar.CSS.section),
    );
    this.nodeSections.forEach((section) => this.initSection(section));
    this.nodes.sidebarContent = moduleEl.querySelector(
      '.' + Sidebar.CSS.sidebarContent,
    );

    this.nodes.toggler = moduleEl.querySelector(
      '.' + Sidebar.CSS.sidebarToggler,
    );
    this.nodes.toggler!.addEventListener('click', () => this.toggleSidebar());

    this.nodes.slider = moduleEl.querySelector('.' + Sidebar.CSS.sidebarSlider);
    this.nodes.slider!.addEventListener('click', () =>
      this.handleSliderClick(),
    );

    this.nodeSearch = moduleEl.querySelector('.' + Sidebar.CSS.sidebarSearch);
    this.filter.init(
      this.nodeSections,
      this.nodes.sidebarContent!,
      this.nodeSearch!,
      this.setSectionCollapsed,
    );

    this.ready();
  }

  /**
   * Initializes sidebar sections: applies stored state and adds event listeners
   */
  initSection(section: HTMLElement) {
    const id = section.dataset.id;
    const togglerEl = section.querySelector('.' + Sidebar.CSS.toggler);

    if (!togglerEl || !id) {
      return;
    }

    togglerEl.addEventListener('click', (e) =>
      this.handleSectionTogglerClick(id, section, e as MouseEvent),
    );

    if (typeof this.sectionsState[id] === 'undefined') {
      this.sectionsState[id] = false;
    }
    if (this.sectionsState[id]) {
      this.setSectionCollapsed(section, true, false);
    }

    /**
     * Calculate and set sections list max height for smooth animation
     */
    const sectionList = section.querySelector(
      '.' + Sidebar.CSS.sectionList,
    ) as HTMLElement;

    if (!sectionList) {
      return;
    }

    // const itemsCount = sectionList.children.length;
    // sectionList.style.maxHeight = `${itemsCount * ITEM_HEIGHT}px`;
  }

  /**
   * Toggles section expansion
   *
   * @param {number} sectionId - id of the section to toggle
   * @param {HTMLElement} sectionEl - section html element
   * @param {MouseEvent} event - click event
   * @returns {void}
   */
  handleSectionTogglerClick(
    sectionId: string,
    sectionEl: HTMLElement,
    event: MouseEvent,
  ) {
    event.preventDefault();
    this.sectionsState[sectionId] = !this.sectionsState[sectionId];
    this.sidebarStorage.set(JSON.stringify(this.sectionsState));
    this.setSectionCollapsed(sectionEl, this.sectionsState[sectionId]);
  }

  /**
   * Updates section's collapsed state
   *
   * @param {HTMLElement} sectionEl - element of the section to toggle
   * @param {boolean} collapsed - new collapsed state
   * @param {boolean} [animated] - true if state should change with animation
   */
  setSectionCollapsed(
    sectionEl: HTMLElement,
    collapsed: boolean,
    animated: boolean = true,
  ) {
    const sectionList = sectionEl.querySelector('.' + Sidebar.CSS.sectionList);

    if (!sectionList) {
      return;
    }
    sectionEl.classList.toggle(Sidebar.CSS.sectionAnimated, animated);
    sectionEl.classList.toggle(Sidebar.CSS.sectionCollapsed, collapsed);

    /**
     * Highlight section item as active if active child item is collapsed.
     */
    const activeSectionListItem = sectionList.querySelector(
      '.' + Sidebar.CSS.sectionListItemActive,
    );
    const sectionTitle = sectionEl.querySelector(
      '.' + Sidebar.CSS.sectionTitle,
    );

    if (!activeSectionListItem) {
      return;
    }
    if (collapsed && animated) {
      /**
       * Highlights section title as active with a delay to let section collapse animation finish first
       */
      setTimeout(() => {
        sectionTitle!.classList.toggle(
          Sidebar.CSS.sectionTitleActive,
          collapsed,
        );
      }, 200);
    } else {
      sectionTitle!.classList.toggle(Sidebar.CSS.sectionTitleActive, collapsed);
    }
  }

  /**
   * Toggles sidebar visibility
   *
   * @returns {void}
   */
  toggleSidebar() {
    this.nodes.sidebarContent!.classList.toggle(
      Sidebar.CSS.sidebarContentVisible,
    );
  }

  /**
   * Initializes sidebar
   *
   * @returns {void}
   */
  initSidebar() {
    if (!this.isVisible) {
      this.nodes.sidebar!.classList.add(Sidebar.CSS.sidebarCollapsed);
    }

    /**
     * prevent sidebar animation on page load
     * Since animated class contains transition, hiding will be animated with it
     * To prevent awkward animation when visibility is set to false, we need to remove animated class
     */
    setTimeout(() => {
      this.nodes.sidebar!.classList.add(Sidebar.CSS.sidebarAnimated);
    }, 200);

    // add event listener to execute keyboard shortcut
    // eslint-disable-next-line no-new
    new Shortcut({
      name: 'CMD+.',
      on: document.body,
      callback: () => this.handleSliderClick(),
    });

    // Add event listener to focus search input on Ctrl+P or ⌘+P is pressed.
    // eslint-disable-next-line no-new
    new Shortcut({
      name: 'CMD+P',
      on: document.body,
      callback: (e: Event) => {
        // If sidebar is not visible.
        if (!this.isVisible) {
          // make sidebar visible.
          this.handleSliderClick();
        }
        // focus search input.
        this.nodeSearch!.focus();
        // Stop propagation of event.
        e.stopPropagation();
        e.preventDefault();
      },
    });
  }

  /**
   * Slides sidebar
   *
   * @returns {void}
   */
  handleSliderClick() {
    this.isVisible = !this.isVisible;
    this.sidebarVisibilityStorage.set(String(this.isVisible));
    this.nodes.sidebar!.classList.toggle(Sidebar.CSS.sidebarCollapsed);
  }

  /**
   * Displays sidebar when ready
   *
   * @returns {void}
   */
  ready() {
    this.initSidebar();
    this.nodes.sidebarContent!.classList.remove(
      Sidebar.CSS.sidebarContentInvisible,
    );
  }
}

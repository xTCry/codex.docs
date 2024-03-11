import NodeCache from 'node-cache';
import Page from './page';
import PageOrder from './pageOrder';
import { EntityId } from '../database/types';
import { isEqualIds } from '../database/index';
import appConfig from '../utils/appConfig';

// Create cache for flat array
const cache = new NodeCache({ stdTTL: 120 });

const cacheKey = 'pagesFlatArray';

/**
 * Element for pagesFlatArray
 */
export interface PagesFlatArrayData {
  /**
   * Page id
   */
  _id: EntityId;
  /**
   * Page id
   */
  id: EntityId;

  /**
   * Page parent id
   */
  parentId?: EntityId;

  /**
   * id of parent with parent id '0'
   */
  rootId: string;

  /**
   * Page level in sidebar view
   */
  level: number;

  /**
   * Page title
   */
  title: string;

  /**
   * Page locale
   */
  locale: string;

  /**
   * Is page multi-locale
   */
  isMultiLocale: boolean;

  /**
   * Is private page
   */
  isPrivate: boolean;

  /**
   * Page uri
   */
  uri?: string;
}

const checkPage = <
  T extends {
    _id?: EntityId;
    locale?: string;
    isMultiLocale?: boolean;
    isPrivate?: boolean;
  },
>(
  page: T,
  id: EntityId,
  locale?: string,
  isAuthorized = false,
) =>
  isEqualIds(page._id, id) &&
  (!locale ||
    (locale &&
      (page.locale === locale ||
        page.isMultiLocale ||
        (!page.locale && !page.isMultiLocale)))) &&
  (isAuthorized || !page.isPrivate);

/**
 * @class PagesFlatArray model - flat array of pages, which are ordered like in sidebar
 */
class PagesFlatArray {
  /**
   * Returns pages flat array
   *
   * @param nestingLimit - number of flat array nesting, set null to dismiss the restriction, default nesting 2
   * @returns {Promise<Array<PagesFlatArrayData>>}
   */
  public static async get(
    nestingLimit: number | null = 2,
    locale?: string,
    isAuthorized = false,
  ): Promise<Array<PagesFlatArrayData>> {
    // Get flat array from cache
    let arr = cache.get(
      cacheKey + locale + ':' + isAuthorized,
    ) as Array<PagesFlatArrayData>;

    // Check is flat array consists in cache
    if (!arr) {
      arr = await this.regenerate(locale, isAuthorized);
    }

    if (!nestingLimit) {
      return arr;
    }

    return arr.filter((item) => item.level < nestingLimit);
  }

  /**
   * Generates new flat array, saves it to cache, returns it
   * Calls, when there is no pages flat array data in cache or when page or pageOrder data updates
   *
   * @returns {Promise<Array<PagesFlatArrayData>>}
   */
  public static async regenerate(
    locale?: string,
    isAuthorized = false,
  ): Promise<Array<PagesFlatArrayData>> {
    if (!locale && appConfig.frontend.availableLocales.length > 1) {
      for (const locale of appConfig.frontend.availableLocales) {
        await this.regenerate(locale);
      }
      return [];
    }

    const pages = await Page.getAll({
      $and: [
        ...(locale
          ? [
              {
                $or: [
                  { locale },
                  { isMultiLocale: true },
                  {
                    locale: { $exists: false },
                    isMultiLocale: { $exists: false },
                  },
                ],
              },
            ]
          : []),
        ...(!isAuthorized
          ? [{ $or: [{ isPrivate: false }, { isPrivate: { $exists: false } }] }]
          : []),
      ],
    });
    const pagesOrders = await PageOrder.getAll();

    let arr = new Array<PagesFlatArrayData>();

    // Get root order
    const rootOrder = pagesOrders.find((order) => order.page == '0');

    // Check is root order is not empty
    if (!rootOrder) {
      return [];
    }

    for (const pageId of rootOrder.order) {
      const childPages = this.getChildrenFlatArray(
        pageId,
        0,
        pages,
        pagesOrders,
        locale,
        isAuthorized,
      );
      console.log('childPages', childPages);

      arr = [...arr, ...childPages];
    }

    arr = arr.filter((p) => arr.some((e) => e._id === p.parentId));

    // Save generated flat array to cache
    cache.set(cacheKey + locale + ':' + isAuthorized, arr);

    return arr;
  }

  /**
   * Returns previous page
   *
   * @param pageId - page id
   * @returns {Promise<PagesFlatArrayData | undefined>}
   */
  public static async getPageBefore(
    pageId: EntityId,
    locale?: string,
    isAuthorized = false,
  ): Promise<PagesFlatArrayData | undefined> {
    const arr = await this.get(
      appConfig.frontend.maxMenuLevel,
      locale,
      isAuthorized,
    );

    const pageIndex = arr.findIndex((item) =>
      checkPage(item, pageId, locale, isAuthorized),
    );

    // Check if index is not the first
    if (pageIndex > 0) {
      // Return previous element from array
      return arr[pageIndex - 1];
    }
  }

  /**
   * Returns next page
   *
   * @param pageId - page id
   * @returns {Promise<PagesFlatArrayData | undefined>}
   */
  public static async getPageAfter(
    pageId: EntityId,
    locale?: string,
    isAuthorized = false,
  ): Promise<PagesFlatArrayData | undefined> {
    const arr = await this.get(
      appConfig.frontend.maxMenuLevel,
      locale,
      isAuthorized,
    );

    const pageIndex = arr.findIndex((item) =>
      checkPage(item, pageId, locale, isAuthorized),
    );

    // Check if index is not the last
    if (pageIndex < arr.length - 1) {
      // Return next element from array
      return arr[pageIndex + 1];
    }
  }

  /**
   * Returns child pages array
   *
   * @param pageId - parent page id
   * @param level - page level in sidebar
   * @param pages - all pages
   * @param orders - all page orders
   * @returns {Promise<Array<PagesFlatArrayData>>}
   */
  private static getChildrenFlatArray(
    pageId: EntityId,
    level: number,
    pages: Array<Page>,
    orders: Array<PageOrder>,
    locale?: string,
    isAuthorized = false,
  ): Array<PagesFlatArrayData> {
    let arr: Array<PagesFlatArrayData> = new Array<PagesFlatArrayData>();

    const page = pages.find((item) =>
      checkPage(item, pageId, locale, isAuthorized),
    );

    // Add element to child array
    if (page) {
      arr.push({
        _id: page._id!,
        id: page._id!,
        level: level,
        parentId: page._parent,
        rootId: '0',
        title: page.title!,
        locale: page.locale!,
        isMultiLocale: page.isMultiLocale || false,
        isPrivate: page.isPrivate || false,
        uri: page.uri,
      });
    }

    const order = orders.find((item) => isEqualIds(item.page, pageId));

    if (order) {
      for (const childPageId of order.order) {
        arr = arr.concat(
          this.getChildrenFlatArray(
            childPageId,
            level + 1,
            pages,
            orders,
            locale,
            isAuthorized,
          ),
        );
      }
    }

    return arr;
  }
}

export default PagesFlatArray;

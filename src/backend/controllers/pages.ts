import PagesOrder from './pagesOrder';
import { EntityId } from '../database/types';
import { isEqualIds } from '../database/index';
import Alias from '../models/alias';
import PagesFlatArray from '../models/pagesFlatArray';
import Page, { PageData } from '../models/page';

type PageDataFields = keyof PageData;

/**
 * @class Pages
 * @classdesc Pages controller
 */
class Pages {
  /**
   * Fields required for page model creation
   *
   * @returns {['title', 'body']}
   */
  public static get REQUIRED_FIELDS(): Array<PageDataFields> {
    return ['body'];
  }

  /**
   * Find and return page model with passed id
   *
   * @param {string} id - page id
   * @returns {Promise<Page>}
   */
  public static async get(id: EntityId, isAuthorized = false): Promise<Page> {
    const page = await Page.get(id, isAuthorized);

    if (!page._id) {
      throw new Error('Page with given id does not exist');
    }

    return page;
  }

  /**
   * Return all pages
   *
   * @returns {Promise<Page[]>}
   */
  public static async getAllPages(
    locale?: string,
    reqIds: EntityId[] = [],
    isAuthorized = false,
  ): Promise<Page[]> {
    return Page.getAll({
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
                  ...(reqIds.length > 0 ? [{ _id: { $in: reqIds } }] : []),
                ],
              },
            ]
          : []),
        ...(!isAuthorized
          ? [{ $or: [{ isPrivate: false }, { isPrivate: { $exists: false } }] }]
          : []),
      ],
    });
  }

  /**
   * Return all pages without children of passed page
   *
   * @param {string} parent - id of current page
   * @returns {Promise<Page[]>}
   */
  public static async getAllExceptChildren(
    parent: EntityId,
    locale?: string,
    isAuthorized = false,
  ): Promise<Page[]> {
    const pagesAvailable = this.removeChildren(
      await Pages.getAllPages(locale, [], isAuthorized),
      parent,
    );

    const nullFilteredPages: Page[] = [];
    for (const item of pagesAvailable) {
      if (item instanceof Page) {
        nullFilteredPages.push(item);
      }
    }

    return nullFilteredPages;
  }

  /**
   * Helper to get all pages as map
   */
  private static async getPagesMap(): Promise<Map<string, Page>> {
    const pages = await Pages.getAllPages(undefined, [], true);
    const pagesMap = new Map<string, Page>();

    pages.forEach((page) => {
      if (!page._id) {
        throw new Error('Page id is not defined');
      }
      pagesMap.set(page._id.toString(), page);
    });

    return pagesMap;
  }

  /**
   * Group all pages by their parents
   * If the pageId is passed, it excludes passed page from result pages
   *
   * @param {string} pageId - pageId to exclude from result pages
   * @returns {Page[]}
   */
  public static async groupByParent(pageId = '' as EntityId): Promise<Page[]> {
    const rootPageOrder = await PagesOrder.getRootPageOrder(); // get order of the root pages
    const childPageOrder = await PagesOrder.getChildPageOrder(); // get order of the all other pages

    /**
     * If there is no root and child page order, then it returns an empty array
     */
    if (!rootPageOrder || (!rootPageOrder && childPageOrder.length <= 0)) {
      return [];
    }

    const pagesMap = await this.getPagesMap();
    const idsOfRootPages = rootPageOrder.order;

    const getChildrenOrder = (pageId: EntityId): EntityId[] => {
      const order =
        childPageOrder.find((order) => isEqualIds(order.page, pageId))?.order ||
        [];

      if (order.length === 0) {
        return [];
      }
      const expandedOrder = order.map((id) => [id, ...getChildrenOrder(id)]);

      return expandedOrder.flat();
    };

    const orderGroupedByParent = idsOfRootPages.reduce(
      (acc, curr) => {
        const pageOrder = getChildrenOrder(curr);

        acc[curr.toString()] = [curr, ...pageOrder];

        return acc;
      },
      {} as Record<string, EntityId[]>,
    );

    /**
     * It converts grouped pages(object) to array
     */
    const result = Object.values(orderGroupedByParent)
      .flatMap((ids) => [...ids])
      .map((id) => pagesMap.get(id.toString())!);

    /**
     * If the pageId passed, it excludes itself from result pages
     * Otherwise just returns result itself
     */
    if (pageId) {
      return this.removeChildren(result, pageId).reduce(
        (prev, curr) => [...prev, ...(curr instanceof Page ? [curr] : [])],
        Array<Page>(),
      );
    }

    return result;
  }

  /**
   * Set all children elements to null
   *
   * @param {Array<Page|null>} [pagesAvailable] - Array of all pages
   * @param {string} parent - id of parent page
   * @returns {Array<?Page>}
   */
  public static removeChildren(
    pagesAvailable: Array<Page | null>,
    parent: EntityId | undefined,
  ): Array<Page | null> {
    pagesAvailable.forEach(async (item, index) => {
      if (!item || !isEqualIds(item._parent, parent)) {
        return;
      }
      pagesAvailable[index] = null;
      pagesAvailable = Pages.removeChildren(pagesAvailable, item._id);
    });
    PagesFlatArray.regenerate();

    return pagesAvailable;
  }

  /**
   * Create new page model and save it in the database
   *
   * @param {PageData} data - info about page
   * @returns {Promise<Page>}
   */
  public static async insert(data: PageData): Promise<Page> {
    try {
      Pages.validate(data);

      const page = new Page(data);

      const insertedPage = await page.save();

      if (insertedPage.uri) {
        const alias = new Alias(
          {
            id: insertedPage._id,
            type: Alias.types.PAGE,
          },
          insertedPage.uri,
        );

        alias.save();
      }
      await PagesFlatArray.regenerate();

      return insertedPage;
    } catch (e) {
      throw new Error('validationError');
    }
  }

  /**
   * Update page with given id in the database
   *
   * @param {string} id - page id
   * @param {PageData} data - info about page
   * @returns {Promise<Page>}
   */
  public static async update(id: EntityId, data: PageData): Promise<Page> {
    const page = await Page.get(id, true);
    const previousUri = page.uri;

    if (!page._id) {
      throw new Error('Page with given id does not exist');
    }

    if (data.uri && !data.uri.match(/^[a-z0-9'\-\/]+$/i)) {
      throw new Error('Uri has unexpected characters');
    }

    page.data = data;
    const updatedPage = await page.save();

    if (updatedPage.uri !== previousUri) {
      if (updatedPage.uri) {
        const alias = new Alias(
          {
            id: updatedPage._id,
            type: Alias.types.PAGE,
          },
          updatedPage.uri,
        );

        await alias.save();
      }

      if (previousUri) {
        Alias.markAsDeprecated(previousUri);
      }
    }
    await PagesFlatArray.regenerate();

    return updatedPage;
  }

  /**
   * Remove page with given id from the database
   *
   * @param {string} id - page id
   * @returns {Promise<Page>}
   */
  public static async remove(id: EntityId): Promise<Page> {
    const page = await Page.get(id, true);

    if (!page._id) {
      throw new Error('Page with given id does not exist');
    }

    if (page.uri) {
      const aliases = await Alias.getAll({ id: page._id });
      for (const alias of aliases) {
        await alias.destroy();
      }
    }
    const removedPage = page.destroy();

    await PagesFlatArray.regenerate();

    return removedPage;
  }

  /**
   * Check PageData object for required fields
   *
   * @param {PageData} data - info about page
   * @throws {Error} - validation error
   */
  private static validate(data: PageData): void {
    const allRequiredFields = Pages.REQUIRED_FIELDS.every(
      (field) => typeof data[field] !== 'undefined',
    );

    if (!allRequiredFields) {
      throw new Error('Some of required fields is missed');
    }

    const hasBlocks =
      data.body &&
      data.body.blocks &&
      Array.isArray(data.body.blocks) &&
      data.body.blocks.length > 0;

    if (!hasBlocks) {
      throw new Error('Page body is invalid');
    }

    const hasHeaderAsFirstBlock = data.body.blocks[0].type === 'header';

    if (!hasHeaderAsFirstBlock) {
      throw new Error('First page Block must be a Header');
    }

    const headerIsNotEmpty =
      data.body.blocks[0].data.text.replace('<br>', '').trim() !== '';

    if (!headerIsNotEmpty) {
      throw new Error('Please, fill page Header');
    }
  }
}

export default Pages;

import { EntityId } from '../database/types';
import Page from '../models/page';
import PageOrder from '../models/pageOrder';
import { isEqualIds } from '../database/index';

/**
 * Process one-level pages list to parent-children list
 *
 * @param parentPageId - parent page id
 * @param pages - list of all available pages
 * @param pagesOrder - list of pages order
 * @param level - max level recursion
 * @param currentLevel - current level of element
 */
export function createMenuTree(
  parentPageId: EntityId,
  pages: Page[],
  pagesOrder: PageOrder[],
  isAuthorized = false,
  level = 1,
  currentLevel = 1,
): Page[] {
  const childrenOrder = pagesOrder.find((order) =>
    isEqualIds(order.data.page, parentPageId),
  );

  /**
   * branch is a page children in tree
   * if we got some children order on parents tree, then we push found pages in order sequence
   * otherwise just find all pages includes parent tree
   */
  let ordered: any[] = [];

  if (childrenOrder) {
    ordered = childrenOrder.order.map((pageId: EntityId) => {
      return pages.find((page) => isEqualIds(page._id, pageId));
    });
  }

  const unordered = pages.filter((page) =>
    isEqualIds(page._parent, parentPageId),
  );
  const branch = Array.from(new Set([...ordered, ...unordered]));

  /**
   * stop recursion when we got the passed max level
   */
  if (currentLevel === level + 1) {
    return [];
  }

  /**
   * Each parents children can have subbranches
   */
  return branch
    .filter((page) => page && page._id && (isAuthorized || !page.isPrivate))
    .map((page) => ({
      children: createMenuTree(
        page._id,
        pages,
        pagesOrder,
        isAuthorized,
        level,
        currentLevel + 1,
      ),
      ...page.data,
    }));
}

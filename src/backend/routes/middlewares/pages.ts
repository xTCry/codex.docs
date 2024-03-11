import { NextFunction, Request, Response } from 'express';
import Pages from '../../controllers/pages';
import PagesOrder from '../../controllers/pagesOrder';
import { EntityId } from '../../database/types';
import Page from '../../models/page';
import appConfig from '../../utils/appConfig';
import asyncMiddleware from '../../utils/asyncMiddleware';
import { createMenuTree } from '../../utils/menu';

export const loadMenu = async (
  req: Request,
  res: Response,
  deepPage?: Page,
) => {
  /** Pages without parent */
  const parentIdOfRootPages = '0' as EntityId;

  try {
    const pagesOrder = await PagesOrder.getAll();
    let reqIds: EntityId[] = [];
    if (deepPage) {
      let prevId = deepPage._id!;
      reqIds.push(prevId);
      for (let i = 0; i < appConfig.frontend.maxMenuLevel; i++) {
        const pageOrder = pagesOrder.find((p) => p.order.includes(prevId));
        if (!pageOrder) {
          break;
        }
        prevId = pageOrder.page!;
        reqIds.push(prevId);
      }
    }

    const pages = await Pages.getAllPages(
      req.locale,
      reqIds,
      res.locals.isAuthorized,
    );

    for (const page of pages) {
      if (page.isPrivate) {
        page.title = '🔐 ' + page.title;
      }
    }

    res.locals.menu = createMenuTree(
      parentIdOfRootPages,
      pages,
      pagesOrder,
      res.locals.isAuthorized,
      appConfig.frontend.maxMenuLevel,
    );
  } catch (error) {
    console.log('Can not load menu:', error);
  }
};

/**
 * Middleware for all /page/... routes
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export default asyncMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    await loadMenu(req, res);
    next();
  },
);

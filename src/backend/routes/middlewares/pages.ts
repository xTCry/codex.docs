import { NextFunction, Request, Response } from 'express';
import Pages from '../../controllers/pages';
import PagesOrder from '../../controllers/pagesOrder';
import asyncMiddleware from '../../utils/asyncMiddleware';
import { EntityId } from '../../database/types';
import { createMenuTree } from '../../utils/menu';

/**
 * Middleware for all /page/... routes
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export default asyncMiddleware(
  async (req: Request, res: Response, next: NextFunction) => {
    /**
     * Pages without parent
     *
     * @type {string}
     */
    const parentIdOfRootPages = '0' as EntityId;

    try {
      const pages = await Pages.getAllPages();
      const pagesOrder = await PagesOrder.getAll();

      res.locals.menu = createMenuTree(
        parentIdOfRootPages,
        pages,
        pagesOrder,
        2,
      );
    } catch (error) {
      console.log('Can not load menu:', error);
    }
    next();
  },
);

import express, { NextFunction, Request, Response } from 'express';
import Pages from '../controllers/pages';
import PagesOrder from '../controllers/pagesOrder';
import verifyToken from './middlewares/token';
import allowEdit from './middlewares/locals';
import { loadMenu } from './middlewares/pages';
import PagesFlatArray from '../models/pagesFlatArray';
import Page from '../models/page';
import { toEntityId } from '../database/index';
import HttpException from '../exceptions/httpException';

const router = express.Router();

/**
 * Create new page form
 */
router.get(
  '/page/new',
  verifyToken,
  allowEdit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagesAvailableGrouped = await Pages.groupByParent();

      res.render('pages/form', {
        pagesAvailableGrouped,
        page: null,
      });
    } catch (error) {
      res.status(404);
      next(error);
    }
  },
);

/**
 * Edit page form
 */
router.get(
  '/page/edit/:id',
  verifyToken,
  allowEdit,
  async (req: Request, res: Response, next: NextFunction) => {
    const pageId = toEntityId(req.params.id);

    try {
      const menu = res.locals.menu as Page[];
      const page = await Pages.get(pageId, res.locals.isAuthorized);
      if (!menu.find((m) => m._id === page._id)) {
        await loadMenu(req, res, page);
      }

      const pagesAvailable = await Pages.getAllExceptChildren(
        pageId,
        req.locale,
        res.locals.isAuthorized,
      );
      const pagesAvailableGrouped = await Pages.groupByParent(pageId);

      if (!page._parent) {
        throw new Error('Parent not found');
      }

      const parentsChildrenOrdered = await PagesOrder.getOrderedChildren(
        pagesAvailable,
        pageId,
        page._parent,
        true,
        req.locale,
      );

      res.render('pages/form', {
        page,
        parentsChildrenOrdered,
        pagesAvailableGrouped,
      });
    } catch (error) {
      res.status(404);
      next(error);
    }
  },
);

/**
 * View page
 */
router.get(
  '/page/:id',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    const pageId = toEntityId(req.params.id);

    try {
      const menu = res.locals.menu as Page[];
      const page = await Pages.get(pageId, res.locals.isAuthorized);
      if (!menu.find((m) => m._id === page._id)) {
        await loadMenu(req, res, page);
      }

      const pageParent = await page.getParent();

      const previousPage = await PagesFlatArray.getPageBefore(
        pageId,
        req.locale,
        res.locals.isAuthorized,
      );
      const nextPage = await PagesFlatArray.getPageAfter(
        pageId,
        req.locale,
        res.locals.isAuthorized,
      );

      res.render('pages/page', {
        page,
        pageParent,
        previousPage,
        nextPage,
        config: req.app.locals.config,
      });
    } catch (error) {
      if ((error as Error).message === 'Page with given id does not exist') {
        error = new HttpException(404, 'Page not found');
      }
      next(error);
    }
  },
);

export default router;

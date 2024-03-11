import express, { NextFunction, Request, Response } from 'express';
import Aliases from '../controllers/aliases';
import Pages from '../controllers/pages';
import verifyToken from './middlewares/token';
import { loadMenu } from './middlewares/pages';
import Alias from '../models/alias';
import PagesFlatArray from '../models/pagesFlatArray';
import Page from '../models/page';
import HttpException from '../exceptions/httpException';
import appConfig from '../utils/appConfig';

const router = express.Router();

/**
 * GET /*
 *
 * Return document with given alias
 */
router.get(
  '*',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let url = req.originalUrl.slice(appConfig.frontend.basePath.length + 1); // Cuts base route path
      const queryParamsIndex = url.indexOf('?');

      if (queryParamsIndex !== -1) {
        url = url.slice(0, queryParamsIndex); // Cuts off query params
      }

      const alias = await Aliases.get(url);

      if (alias.id === undefined) {
        throw new HttpException(404, 'Alias not found');
      }
      switch (alias.type) {
        case Alias.types.PAGE: {
          const menu = res.locals.menu as Page[];
          const page = await Pages.get(alias.id, res.locals.isAuthorized);
          if (!menu.find((m) => m._id === page._id)) {
            await loadMenu(req, res, page);
          }

          const pageParent = await page.getParent();

          const previousPage = await PagesFlatArray.getPageBefore(
            alias.id,
            req.locale,
            res.locals.isAuthorized,
          );
          const nextPage = await PagesFlatArray.getPageAfter(
            alias.id,
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
        }
      }
    } catch (error) {
      if ((error as Error).message === 'Page with given id does not exist') {
        error = new HttpException(404, 'Page not found');
      }
      next(error);
    }
  },
);

export default router;

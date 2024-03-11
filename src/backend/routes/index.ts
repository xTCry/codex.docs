import express from 'express';
import home from './home';
import pages from './pages';
import auth from './auth';
import aliases from './aliases';
import api from './api/index';
import pagesMiddleware from './middlewares/pages';
import verifyToken from './middlewares/token';
import allowEdit from './middlewares/locals';

const router = express.Router();

router.use(verifyToken);
router.use('/', pagesMiddleware, home, pages, auth);
router.use('/api', allowEdit, api);
router.use('/', aliases);

export default router;

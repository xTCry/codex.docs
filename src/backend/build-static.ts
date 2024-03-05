import twig from 'twig';
import path from 'path';
import mkdirp from 'mkdirp';
import fs from 'fs-extra';

import './utils/twig';
import Page from './models/page';
import PagesFlatArray from './models/pagesFlatArray';
import { createMenuTree } from './utils/menu';
import { EntityId } from './database/types';
import PagesOrder from './controllers/pagesOrder';
import appConfig from './utils/appConfig';
import Aliases from './controllers/aliases';
import Pages from './controllers/pages';

/**
 * Build static pages from database
 */
export default async function buildStatic(): Promise<void> {
  const config = appConfig.staticBuild;

  if (!config) {
    throw new Error('Static build config not found');
  }

  const cwd = process.cwd();
  const distPath = path.resolve(cwd, config.outputDir);

  /**
   * Render template with twig by path
   *
   * @param filePath - path to template
   * @param data - data to render template
   */
  function renderTemplate(
    filePath: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      twig.renderFile(path.resolve(__dirname, filePath), data, (err, html) => {
        if (err) {
          reject(err);
        }
        resolve(html);
      });
    });
  }

  if (config.overwrite) {
    console.log('Removing old static files');
    await fs.remove(distPath);
  }

  console.log('Building static files');
  const pagesOrder = await PagesOrder.getAll();
  const allPages = await Page.getAll();

  await mkdirp(distPath);

  /**
   * Renders single page
   *
   * @param page - page to render
   * @param isIndex - is this page index page
   */
  async function renderPage(page: Page, isIndex?: boolean): Promise<void> {
    console.log(`Rendering page ${page.uri}`);
    const pageParent = await page.getParent();
    const pageId = page._id;

    if (!pageId) {
      throw new Error('Page id is not defined');
    }
    const parentIdOfRootPages = '0' as EntityId;
    const previousPage = await PagesFlatArray.getPageBefore(pageId);
    const nextPage = await PagesFlatArray.getPageAfter(pageId);
    const menu = createMenuTree(parentIdOfRootPages, allPages, pagesOrder, 2);
    const result = await renderTemplate('./views/pages/page.twig', {
      page,
      pageParent,
      previousPage,
      nextPage,
      menu,
      config: appConfig.frontend,
    });

    const filename =
      isIndex || page.uri === '' ? 'index.html' : `${page.uri}.html`;

    await fs.writeFile(path.resolve(distPath, filename), result);
    console.log(`Page ${page.uri} rendered`);
  }

  /**
   * Render index page
   *
   * @param indexPageUri - uri of index page
   */
  async function renderIndexPage(indexPageUri: string): Promise<void> {
    const alias = await Aliases.get(indexPageUri);

    if (!alias.id) {
      throw new Error(`Alias ${indexPageUri} not found`);
    }

    const page = await Pages.get(alias.id);

    await renderPage(page, true);
  }

  /**
   * Render all pages
   */
  for (const page of allPages) {
    await renderPage(page);
  }

  // Check if index page is enabled
  if (config.indexPage.enabled) {
    await renderIndexPage(config.indexPage.uri);
  }
  console.log('Static files built');

  console.log('Copy public directory');
  const publicDir = path.resolve(__dirname, '../../public');

  console.log(`Copy from ${publicDir} to ${distPath}`);

  try {
    await fs.copy(publicDir, distPath);
    console.log('Public directory copied');
  } catch (e) {
    console.log('Error while copying public directory');
    console.error(e);
  }

  if (appConfig.uploads.driver === 'local') {
    console.log('Copy uploads directory');
    await fs.copy(
      path.resolve(cwd, appConfig.uploads.local.path),
      path.resolve(distPath, 'uploads'),
    );
    console.log('Uploads directory copied');
  }
}

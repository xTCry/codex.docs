#!/usr/bin/env node
/**
 * Module dependencies.
 */
import Debug from 'debug';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import crypto from 'crypto';
import http from 'http';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import i18n from 'i18n';
import yaml from 'yaml';
import HawkCatcher from '@hawk.so/nodejs';
import favicon from 'serve-favicon';

import appConfig from './utils/appConfig';
import { drawBanner } from './utils/banner';
import { downloadFavicon, FaviconData } from './utils/downloadFavicon';
import routes from './routes/index';
import HttpException from './exceptions/httpException';

const debug = Debug.debug('codex.docs:server');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(appConfig.port.toString() || '3000');

/**
 * Create Express server
 */
async function createApp() {
  const cwd = process.cwd();

  const app = express();
  const localConfig = appConfig.frontend;

  let bundleRevisionJs: string = '0';
  let bundleRevisionCss: string = '0';
  try {
    bundleRevisionJs = crypto
      .createHash('md5')
      .update(
        await fs.readFile(
          path.join(__dirname, '../../public/dist/main.bundle.js'),
        ),
      )
      .digest('hex');
    bundleRevisionCss = crypto
      .createHash('md5')
      .update(
        await fs.readFile(path.join(__dirname, '../../public/dist/main.css')),
      )
      .digest('hex');
  } catch (err) {
    console.error(err);
  }

  i18n.configure({
    locales: localConfig.availableLocales,
    directory: path.join(cwd, appConfig.localesPath),
    defaultLocale: localConfig.availableLocales[0] || 'en',
    cookie: `${localConfig.appName}Locale`,
    extension: '.yml',
    parser: yaml,
    objectNotation: true,
    autoReload: true, // defaults to false
    updateFiles: false, // defaults to true
  });

  // Initialize the backend error tracking catcher.
  if (appConfig.hawk?.backendToken) {
    HawkCatcher.init(appConfig.hawk.backendToken);
  }

  // Get url to upload favicon from config
  const faviconPath = appConfig.favicon;

  app.locals.config = localConfig;
  // Set client error tracking token as app local.
  if (appConfig.hawk?.frontendToken) {
    app.locals.config.hawkClientToken = appConfig.hawk.frontendToken;
  }

  // view engine setup
  app.set('views', path.join(__dirname, './', 'views'));
  app.set('view engine', 'twig');
  import('./utils/twig');

  const downloadedFaviconFolder = path.join(os.tmpdir(), 'codex.docs');
  await fs.ensureDir(downloadedFaviconFolder);

  // Check if favicon is not empty
  if (faviconPath) {
    // Upload favicon by url, it's path on server is '/temp/codex.docs/favicon.{format}'
    await downloadFavicon(faviconPath, downloadedFaviconFolder)
      .then((res) => {
        app.locals.favicon = res;
        console.log('Favicon successfully uploaded', app.locals.favicon);
      })
      .catch((err) => {
        console.log('Favicon has not uploaded');
        console.error(err);
      });
  }
  if (!app.locals.favicon) {
    app.locals.favicon = {
      filename: 'favicon.png',
      destination: localConfig.basePath + '/favicon.png',
      type: 'image/png',
    } as FaviconData;
    console.log('Favicon is empty, using default path', app.locals.favicon);
  }

  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(i18n.init);
  app.use((req, res, next) => {
    if (!req.cookies[`${localConfig.appName}Locale`]) {
      const languages = req.headers['accept-language'];
      const lang = languages
        ? languages.split(',')[0]
        : localConfig.availableLocales[0];

      if (localConfig.availableLocales.includes(lang)) {
        res.cookie(`${localConfig.appName}Locale`, lang, {
          maxAge: 2 * 365 * 24 * 3600e3,
          httpOnly: true,
        });
        req.setLocale(lang);
      }
    }

    next();
  });

  /**
   * Deliver favicon.ico by /favicon.ico route
   */
  const faviconMiddleware = favicon(
    faviconPath
      ? path.join(downloadedFaviconFolder, app.locals.favicon.filename)
      : path.join(__dirname, '../../public/', app.locals.favicon.filename),
  );
  app.use(faviconMiddleware);

  const baseRouter = express.Router();
  baseRouter.use(faviconMiddleware);
  baseRouter.use(express.static(path.join(__dirname, '../../public')));
  if (faviconPath) {
    baseRouter.use('/favicon', express.static(downloadedFaviconFolder));
  }
  if (appConfig.uploads.driver === 'local') {
    const uploadsPath = path.join(cwd, appConfig.uploads.local.path);
    baseRouter.use('/uploads', express.static(uploadsPath));
  }

  baseRouter.get('/set-lang/:lang', (req, res) => {
    // ? Check CORS
    // if (!req.headers.referer) {
    //   return res.end('No referer');
    // }
    const { lang } = req.params;
    if (localConfig.availableLocales.includes(lang)) {
      res.cookie(`${localConfig.appName}Locale`, lang, {
        maxAge: 2 * 365 * 24 * 3600e3,
        httpOnly: true,
      });
    }
    res.redirect(req.headers.referer || localConfig.basePath || '/');
  });

  /**
   * Set current static bundle revision and pass it to the templates
   */
  baseRouter.use(function (req, res, next) {
    res.locals.bundleRevisionJs = bundleRevisionJs;
    res.locals.bundleRevisionCss = bundleRevisionCss;
    next();
  });

  baseRouter.use(routes);
  app.use(localConfig.basePath || '/', baseRouter);

  // global error handler
  app.use(function (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    // send any type of error to hawk server.
    if (appConfig.hawk?.backendToken && err instanceof Error) {
      HawkCatcher.send(err);
    }

    // only send Http based exception to client.
    if (err instanceof HttpException) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};
      // render the error page
      res.status(err.status || 500);
      res.render('error');
      return;
    }
    next(err);
  });

  return app;
}

/**
 * Create and run HTTP server.
 */
export default async function runHttpServer() {
  const app = await createApp();

  app.set('port', port);

  /**
   * Create HTTP server.
   */
  const server = http.createServer(app);

  /**
   * Event listener for HTTP server 'listening' event.
   */
  function onListening(): void {
    const addr = server.address();

    if (addr === null) {
      debug('Address not found');
      process.exit(1);
    }

    const bind =
      typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

    debug('Listening on ' + bind);

    drawBanner([
      `CodeX Docs server is running`,
      ``,
      `Main page: http://localhost:${port}${appConfig.frontend.basePath}`,
    ]);
  }

  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
}

/**
 * Normalize a port into a number, string, or false.
 *
 * @param val
 */
function normalizePort(val: string): number | string | false {
  const value = parseInt(val, 10);

  if (isNaN(value)) {
    // named pipe
    return val;
  }

  if (value >= 0) {
    // port number
    return value;
  }

  return false;
}

/**
 * Event listener for HTTP server 'error' event.
 *
 * @param error
 */
function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

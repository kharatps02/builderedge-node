import * as bodyParser from "body-parser";
import * as errorHandler from "errorhandler";
import * as express from "express";
import * as cookieParser from "cookie-parser";
import * as logger from "morgan";
import * as path from "path";

import { BaseRoutes } from './config/routes/base.routes';
import { SyncController } from "./app/db-sync/sync-controller";

/**
 * The server.
 *
 * @class Server
 */
export class Server {
  public app: express.Application;

  /**
   * Bootstrap the application.
   *
   * @class Server
   * @method bootstrap
   * @static
   * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    // create expressjs application
    this.app = express();

    // configure application
    this.config();

    // add routes
    this.routes();

    // Start the sub controller. This subscribes the salesforce endpoints event.
    new SyncController().init();
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  public config() {
    this.app.use(cookieParser());
    this.app.engine('pug', require('pug').__express);
    // add static paths
    // configure pug
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set('view engine', 'pug');

    this.app.use(express.static(path.join(__dirname, "public")));
    // this.app.use(express.static(path.join(__dirname, "../data")));
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization, session-id, org-id');
      next();
    });
    // mount logger
    this.app.use(logger("dev"));

    // mount json form parser
    this.app.use(bodyParser.json());

    // mount query string parser
    this.app.use(bodyParser.urlencoded({
      extended: true,
    }));

    // catch 404 and forward to error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      err.status = 404;
      next(err);
    });

    // error handling
    this.app.use(errorHandler());
  }

  /**
   * Create and return Router.
   *
   * @class Server
   * @method config
   * @return void
   */
  private routes() {
    // use router middleware
    this.app.use(new BaseRoutes().routes);
  }

}

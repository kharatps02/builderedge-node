import * as express from "express";
import { ProjectRoutes } from '../../app/project/project.routes';
import { RegisterOrgRoutes } from "../../app/registration/register-org.routes";

const app = express();
/**
 * @description Sets the base routes for the app.
 */
export class BaseRoutes {
  /**
   * Gets the initial routes
   */
  get routes() {
    app.use('/', new RegisterOrgRoutes().routes);
    app.use('/', new ProjectRoutes().routes);
    app.use('/', (req, res) => {
      res.render('index', { title: "Builderedge Node Js App" });
    });
    return app;
  }
}

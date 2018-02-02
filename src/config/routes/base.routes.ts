import * as express from "express";
import { ProjectRoutes } from '../../app/project/project.routes';

let app = express();
export class BaseRoutes {
  get routes() {    
    app.use('/', new ProjectRoutes().routes);
    app.use('/', (req, res) => {
      res.render('index', { title: "Builderedge Node Js App" });
    });
    return app;
  }
}
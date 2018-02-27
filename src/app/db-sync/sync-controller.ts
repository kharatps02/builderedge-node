import { ProjectSfModel } from './../project/project.sfmodel';
import { ISFResponse, SFResponse } from "./sf-response";
import { SyncDataModel } from "./sync.datamodel";
import { IProjectDetails } from "./../project/project.model";
import { ISseResponse, sse } from "@toverux/expresse";
import { OrgMasterModel } from "../org-master/org-master.model";
import { SubService } from "./sub-service";
import * as express from "express";
import * as request from "request";
import * as rp from "request-promise";
import { Enums } from "../../config/enums";
import { formatProjectAndTaskDetails } from "../project/project.helper";
import { Constants } from "../../config/constants";
import { EventEmitter } from "events";
import { IOrgMaster } from "../../core/models/org-master";

/**
 * @description It gets all orgs and its integration user OAuth Token to be used for the subscription.
 */
export class SyncController {
  private projectSfModel: ProjectSfModel;
  private syncDataModel: SyncDataModel;
  private subscribers: Map<string, SubService>;
  private orgMasterModel: OrgMasterModel;
  private eventBus: EventEmitter = new EventEmitter();
  constructor() {
    this.subscribers = new Map();
    this.orgMasterModel = new OrgMasterModel();
    this.syncDataModel = new SyncDataModel();
    this.projectSfModel = new ProjectSfModel();
    this.eventBus.addListener("orgSynched", (data: any) => {
      console.log("Subscribing to the new org", data);
      this.addNewOrgToSubscribers(data);
    });
    this.eventBus.addListener("error", (data: any) => {
      console.log("Subscribing to error");
      this.addNewOrgToSubscribers(data);
    });

  }
  /**
   * events
   */
  public events(
    req: express.Request,
    res: ISseResponse,
    next: express.NextFunction
  ) {
    res.sse.event('hello', 'hello');
    this.eventBus.addListener(
      "sendEvent",
      (args: { event: string; data: any }) => {
        res.sse.event(args.event, args.data);
      }
    );
  }
  /**
   * @description Initializes the SubService instances for all the registered orgs.
   */
  public init() {
    this.orgMasterModel.getAllOrgDetails((error1, results) => {
      if (error1) {
        return;
      }
      results.forEach((org) => {
        this.subscribers.set(org.org_id, new SubService(org));
      });
    });
  }
  /**
   * addNewOrgToSubscribers
   */
  public addNewOrgToSubscribers(vanityId: string) {
    this.orgMasterModel.getOrgConfigByVanityId(vanityId, (error, config) => {
      if (config) {
        this.subscribers.set(config.org_id, new SubService(config));
      }
    });
  }
  /**
   * @description Retrives the specific instance of SubService when needed.
   * @param id OrgId
   */
  public getInstance(id: string) {
    if (this.subscribers.has(id)) {
      return this.subscribers.get(id);
    }
  }

  public async syncDataInitial(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    const accessToken = req.body.accessToken;
    const vanityKey = req.params.vanityKey;
    const appUrl = req.body.appUrl;
    try {
      const projects = await this.projectSfModel.getAllProjectsAndTasks(
        accessToken,
        vanityKey,
      );
      const formatedProjects = formatProjectAndTaskDetails(
        projects.records
      );

      const done = await this.syncDataModel.syncSalesforceUserDetails({ vanity_id: vanityKey, session_id: accessToken }, formatedProjects);

      if (done) {
        this.eventBus.emit("orgSynched", { appUrl, vanityKey });
        res.render("data-sync", { appUrl });
        return;
      } else {
        this.eventBus.emit("error", formatedProjects);
        res.render("data-sync", { appUrl });
        return;
        // reject('sync failed');

        // res.render('data-sync', { appUrl });
        //     res.render('data-sync', { appUrl }, (err, html) => {
        //     console.log(err, html);
        //     this.eventBus.emit('sendEvent', { event: 'initialSyncDone', data: { error: 'There was a problem synching your data.' } });
        //     return;
        // });
      }
      // res.render("data-sync", { appUrl });
    } catch (err) {
      res.render("error", { appUrl, err });
      return;
    }
  }

  /**
   * syncInitial
   */
  public index(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) { }
}

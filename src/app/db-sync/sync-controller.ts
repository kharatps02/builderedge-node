import { ProjectSfModel } from './../project/project.sfmodel';
import { SFResponse } from "./sf-response";
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
 * SyncController
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
      this.eventBus.emit('sendEvent', { event: 'initialSyncDone', data });
    });
    this.eventBus.addListener("error", (data: any) => {
      console.log("Subscribing to error");
      this.addNewOrgToSubscribers(data);
    });

  }
  /**
   * events
   * @description Send events to the page to indicate status of sync process.
   * @param req Express.js request
   * @param res ISseResponse that extends Express.js response
   * @param next Express.js next function
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
   * init
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
   * @description Adds newly registered org to Platform Events subscriptions list.
   * @param vanityId vanityId of the org.
   */
  public addNewOrgToSubscribers(vanityId: string) {
    this.orgMasterModel.getOrgConfigByVanityId(vanityId, (error, config) => {
      if (config) {
        this.subscribers.set(config.org_id, new SubService(config));
      }
    });
  }
  /**
   * getInstance
   * @description Retrives the specific instance of SubService when needed.
   * @param id OrgId
   */
  public getInstance(id: string) {
    if (this.subscribers.has(id)) {
      return this.subscribers.get(id);
    }
  }

  /**
   * syncDataInitial
   * @description handler function for initial data sync.
   * @param req Express.js request
   * @param res Express.js response
   * @param next Express.js next function
   */
  public async syncDataInitial(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    const accessToken = req.body.accessToken;
    const vanityKey = req.params.vanityKey;
    const appUrl = req.body.appUrl;
    try {
      // Render the data sync page and initiate sync.
      res.render("data-sync", { appUrl });
      const projects = await this.projectSfModel.getAllProjectsAndTasks(
        accessToken,
        vanityKey,
      );
      const formatedProjects = formatProjectAndTaskDetails(
        projects.records
      );

      const done = await this.syncDataModel.syncSalesforceUserDetails({ vanity_id: vanityKey, session_id: accessToken }, formatedProjects);

      if (done) {
        // Send SSE message.
        setTimeout(() => {
          // this.eventBus.emit("orgSynched", { appUrl, vanityKey });
        }, 5000);

      } else {

        setTimeout(() => {
          // this.eventBus.emit("error", formatedProjects);
        }, 5000);

      }
    } catch (err) {
      setTimeout(() => {
        this.eventBus.emit("error", err || 'There was a problem synching your data.');
      }, 5000);
    }
  }
}

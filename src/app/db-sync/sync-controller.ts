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
  private syncDataModel: SyncDataModel;
  private subscribers: Map<string, SubService>;
  private orgMasterModel: OrgMasterModel;
  private eventBus: EventEmitter = new EventEmitter();
  constructor() {
    this.subscribers = new Map();
    this.orgMasterModel = new OrgMasterModel();
    this.syncDataModel = new SyncDataModel();
    this.eventBus.addListener("orgSynched", (vanityId: string) => {
      console.log("Subscribing to the new org", vanityId);
      this.addNewOrgToSubscribers(vanityId);
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
      results.forEach(org => {
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
  /**
   * syncInitial
   * TODO: Make use of server events to perform the next action of synching.
   */
  public syncInitial(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const accessToken = req.body.accessToken;
    const vanityKey = req.params.vanityKey;
    const appUrl = req.body.appUrl;

    try {
      if (accessToken && vanityKey && appUrl) {
        // Get project details from salesforce api
        const requestHeader = {
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json"
          }
        };
        this.orgMasterModel.getOrgConfigByVanityId(
          vanityKey,
          (error, config) => {
            if (!error && config) {
              let sfResponsePerRequest: ISFResponse<
                IProjectDetails
              > = new SFResponse<IProjectDetails>();

              const url =
                sfResponsePerRequest.nextRecordsUrl ||
                config.api_base_url + Constants.SYNC_QUERIES.ALL;
              const func = (
                sfUrl: string,
                callbackFunc: (formattedStuff: any) => void
              ) => {
                request(url, requestHeader, (error1, sfResponse) => {
                  if (!error1) {
                    if (sfResponse.statusCode === 401) {
                      res.send({
                        status: Enums.RESPONSE_STATUS.ERROR,
                        message: sfResponse.body[0].message
                      });
                    } else {
                      if (sfResponse.body && sfResponse.body.length > 0) {
                        if (typeof sfResponse.body === "string") {
                          sfResponsePerRequest = JSON.parse(
                            sfResponse.body
                          ) as ISFResponse<IProjectDetails>;
                        } else {
                          sfResponsePerRequest = JSON.parse(sfResponse.body);
                        }

                        const formatedProjects = formatProjectAndTaskDetails(
                          sfResponsePerRequest.records
                        );

                        // res.send({ status: Enums.RESPONSE_STATUS.SUCCESS, message: '', projects: formatedProjects });
                      }
                    }
                  } else {
                    res.render("error", {
                      status: Enums.RESPONSE_STATUS.ERROR,
                      message: error1
                    });
                    // res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: error1 });
                  }
                });
              };
              func(url, (formatedProjects: any) => {
                formatedProjects.map((self: any) => {
                  self["OrgMaster_Ref_Id"] = config.vanity_id;
                });
                this.syncDataModel.syncSalesforceUserDetails(
                  { vanity_id: vanityKey, session_id: accessToken },
                  formatedProjects,
                  done => {
                    if (done && sfResponsePerRequest.done) {
                      this.eventBus.emit("orgSynched", vanityKey);
                      res.render("data-sync", { appUrl });
                      // resolve(vanityKey);
                      //     res.render('data-sync', { appUrl }, (err, html) => {
                      //     console.log(err, html);
                      //     this.eventBus.emit('sendEvent', { event: 'initialSyncDone', data: { appUrl } });
                      //     return;
                      // });
                      return;
                    } else if (done && !sfResponsePerRequest.done) {
                      func(
                        sfResponsePerRequest.nextRecordsUrl!,
                        (formattedStuff: any) => {
                          return;
                        }
                      );
                      // res.render('data-sync', { appUrl });
                      //     res.render('data-sync', { appUrl }, (err, html) => {
                      //     console.log(err, html);
                      //     this.eventBus.emit('sendEvent', { event: 'initialSyncDone', data: { error: 'There was a problem synching your data.' } });
                      //     return;
                      // });
                    } else {
                      res.render("data-sync", { appUrl });
                      return;
                      // reject('sync failed');
                    }
                  }
                );
              });
              // const fetchAndSyncDataPromise = new Promise((resolve, reject) => vanityKey1);
              // fetchAndSyncDataPromise.then((vanityKey1) => {
              //   console.log(vanityKey1);
              // }).catch((err) => {
              //   console.log(err);
              // });
            } else {
              res.render("error", {
                status: Enums.RESPONSE_STATUS.ERROR,
                message: error
              });
            }
          }
        );
      } else {
        res.render("error", {
          status: Enums.RESPONSE_STATUS.ERROR,
          message: Constants.MESSAGES.INVALID_REQUEST_PARAMS
        });
        // res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.INVALID_REQUEST_PARAMS });
      }
    } catch (e) {
      console.log(e);
      res.render("error", {
        status: Enums.RESPONSE_STATUS.ERROR,
        message: Constants.MESSAGES.SOMETHING_WENT_WRONG
      });
      // res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
    }
  }
  /**
   * getAllProjectsAndTasks
   */
  private async getAllProjectsAndTasks(
    vanityKey: string,
    accessToken: string
  ): Promise<ISFResponse<IProjectDetails>> {
    try {
      const config = await this.orgMasterModel.getOrgConfigByVanityId(
        vanityKey
      );
      let sfResponsePerRequest: ISFResponse<IProjectDetails> = new SFResponse<
        IProjectDetails
      >();
      const url =
        sfResponsePerRequest.nextRecordsUrl ||
        config.api_base_url + Constants.SYNC_QUERIES.ALL;
      sfResponsePerRequest = await this.getData<IProjectDetails>(
        url,
        accessToken
      );
      for (const element of sfResponsePerRequest.records) {
        element.Project_Task__c = await this.getData(
          element.Project_Task__c.nextRecordsUrl!,
          accessToken,
          element.Project_Task__c.records
        );
      }
      return sfResponsePerRequest;
    } catch (error) {
      throw error;
    }
  }

  public async syncDataInitial(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const accessToken = req.body.accessToken;
    const vanityKey = req.params.vanityKey;
    const appUrl = req.body.appUrl;
    const formatedProjects = await this.getAllProjectsAndTasks(
      vanityKey,
      accessToken
    );
    this.syncDataModel.syncSalesforceUserDetails(
      { vanity_id: vanityKey, session_id: accessToken },
      formatedProjects.records,
      done => {
        if (done) {
          this.eventBus.emit("orgSynched", vanityKey);
          res.render("data-sync", { appUrl });
          return;
        } else {
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
      }
    );
  }
  private async getData<T>(
    url: string,
    accessToken: string,
    records?: T[]
  ): Promise<ISFResponse<T>> {
    const requestHeader = {
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json"
      }
    };
    try {
      let partialData = new SFResponse<T>();
      const response = await rp.get(url, requestHeader);
      if (response.statusCode === 401) {
        throw response.body;
      } else {
        if (response.body && response.body.length > 0) {
          if (typeof response.body === "string") {
            partialData = JSON.parse(response.body) as ISFResponse<T>;
          } else {
            partialData = JSON.parse(response.body);
          }
          if (records && records.length > 0) {
            partialData.records.push(...records);
          }
          // Call the same function recursively to fetch whole data.
          if (!partialData.done) {
            return await this.getData(url, accessToken, partialData.records);
          } else {
            return partialData;
          }
        } else {
          return new SFResponse();
        }
      }
    } catch (error) {
      throw error;
    }
  }
  /**
   * syncInitial
   */
  public index(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) {}
}
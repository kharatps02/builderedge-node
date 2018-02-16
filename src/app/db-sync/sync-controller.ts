import { SyncDataModel } from './sync.datamodel';
import { IProjectDetails } from './../project/project.model';
import { ISseResponse, sse } from '@toverux/expresse';
import { OrgMasterModel } from '../org-master/org-master.model';
import { SubService } from './sub-service';
import * as express from 'express';
import * as request from 'request';
import { Enums } from '../../config/enums';
import { formatProjectAndTaskDetails } from '../project/project.helper';
import { Constants } from '../../config/constants';
import { EventEmitter } from 'events';
import { IOrgMaster } from '../../core/models/org-master';

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
  }
  /**
   * events
   */
  public events(req: express.Request, res: ISseResponse, next: express.NextFunction) {
    this.eventBus.addListener('sendEvent', (args: { event: string, data: any }) => {
      res.sse.event(args.event, args.data);
    });
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
  public syncInitial(req: express.Request, res: express.Response, next: express.NextFunction) {
    const accessToken = req.body.accessToken;
    const vanityKey = req.params.vanityKey;
    const appUrl = req.body.appUrl;

    try {
      if (accessToken && vanityKey && appUrl) {
        // Get project details from salesforce api
        const requestHeader = {
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
          },
        };
        this.orgMasterModel.getOrgConfigByVanityId(vanityKey, (error, config: IOrgMaster) => {
          if (!error && config) {

            request(config.api_base_url + Constants.SYNC_QUERIES.ALL, requestHeader, (error1, sfResponse) => {
              if (!error1) {
                if (sfResponse.statusCode === 401) {
                  res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: sfResponse.body[0].message });
                } else {
                  if (sfResponse.body && sfResponse.body.length > 0) {
                    let projectArray: { records: IProjectDetails[] } = sfResponse.body;
                    if (typeof sfResponse.body === 'string') {
                      projectArray = JSON.parse(sfResponse.body);
                    }
                    const formatedProjects = formatProjectAndTaskDetails(projectArray.records);
                    formatedProjects.map((self) => {
                      self['OrgMaster_Ref_Id'] = config.vanity_id;
                    });
                    this.syncDataModel.syncSalesforceUserDetails(
                      { vanity_id: vanityKey, session_id: accessToken }, formatedProjects, (done) => {
                        if (done) {
                          res.render('data-sync', { appUrl });
                          //     res.render('data-sync', { appUrl }, (err, html) => {
                          //     console.log(err, html);
                          //     this.eventBus.emit('sendEvent', { event: 'initialSyncDone', data: { appUrl } });
                          //     return;
                          // });

                        } else {
                          res.render('data-sync', { appUrl });
                          //     res.render('data-sync', { appUrl }, (err, html) => {
                          //     console.log(err, html);
                          //     this.eventBus.emit('sendEvent', { event: 'initialSyncDone', data: { error: 'There was a problem synching your data.' } });
                          //     return;
                          // });
                        }

                      });
                    // res.send({ status: Enums.RESPONSE_STATUS.SUCCESS, message: '', projects: formatedProjects });
                  }
                }
              } else {
                res.render('error', { status: Enums.RESPONSE_STATUS.ERROR, message: error1 });
                // res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: error1 });
              }
            });
          } else {
            res.render('error', { status: Enums.RESPONSE_STATUS.ERROR, message: error });
          }
        });

      } else {
        res.render('error', { status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.INVALID_REQUEST_PARAMS });
        // res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.INVALID_REQUEST_PARAMS });
      }
    } catch (e) {
      console.log(e);
      res.render('error', { status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
      // res.send({ status: Enums.RESPONSE_STATUS.ERROR, message: Constants.MESSAGES.SOMETHING_WENT_WRONG });
    }
  }
  /**
   * syncInitial
   */
  public index(request: express.Request, response: express.Response, next: express.NextFunction) {

  }
}

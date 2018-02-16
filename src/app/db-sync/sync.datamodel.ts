import { IOrgMaster } from './../../core/models/org-master';
import { ProjectModel, IProjectDetails, ITaskDetails } from './../project/project.model';

import * as request from "request";
import { OrgMasterModel } from '../org-master/org-master.model';
import { buildInsertStatements } from '../project/project.helper';

export class SyncDataModel {
    private projectModel: ProjectModel;
    private orgMasterModel: OrgMasterModel;
    constructor() {
        this.projectModel = new ProjectModel();
        this.orgMasterModel = new OrgMasterModel();
    }
    /**
     * @description Insert all project and tasks into postgres database and
     * call salesforce endpoints to updates salesforce record external_id__c with postgres record id
     * @param params
     * @param salesforceResponseArray
     */
    public syncSalesforceUserDetails(params: { vanity_id: string, session_id: string }, salesforceResponseArray: any[], callback: (done: boolean) => void) {
        const that = this;
        try {
            const projectRecords = JSON.parse(JSON.stringify(salesforceResponseArray));

            // Filter newly added projects, those records which hasn't external_id__c
            // projectRecords = projectRecords.filter((self) => {
            //     if (!self['External_Id__c']) {
            //         return true;
            //     }
            // });

            if (projectRecords && projectRecords.length > 0) {
                const queryConfig = buildInsertStatements(projectRecords, ['"Id"', '"External_Id__c"'], true);
                console.log("query statement", queryConfig);
                // Insert Projects records
                that.projectModel.insertManyStatements(queryConfig, (error, projectResult) => {
                    if (!error) {
                        // console.log('In execMultipleStatment projectResult>>', projectResult);
                        const salesforceRequestObj: { ProjectTasks: any[], Projects: any[] } = { ProjectTasks: [], Projects: [] };
                        const pksExternalPksMap: { [key: string]: any } = {};
                        const taskRecords: ITaskDetails[] = [];

                        // Prepared  object to update postgres id into salesforce databse
                        projectResult.rows.forEach((row: IProjectDetails) => {
                            pksExternalPksMap[row.External_Id__c + ''] = row.Id;
                            salesforceRequestObj.Projects.push({ Id: row.External_Id__c, External_Id__c: row.Id });
                        });

                        salesforceResponseArray.forEach((projectRecord) => {
                            const projectId = pksExternalPksMap[projectRecord['Id']] || projectRecord['External_Id__c'];
                            if (projectRecord.series && projectRecord.series.length > 0 && projectId) {
                                projectRecord.series.forEach((taskRecord: ITaskDetails) => {
                                    taskRecord['Project__c'] = projectId;
                                    taskRecords.push(taskRecord);
                                });
                            }
                        });

                        if (taskRecords && taskRecords.length) {
                            const tasksQueryConfig = buildInsertStatements(taskRecords, ['"Id"', '"External_Id__c"'], false);
                            that.projectModel.insertManyStatements(tasksQueryConfig, (error1, taskResult) => {
                                if (!error1) {
                                    // console.log('In execMultipleStatment task taskResult>>', taskResult);

                                    // Prepared  object to update postgres id into salesforce databse
                                    taskResult.rows.forEach((row: ITaskDetails) => {
                                        salesforceRequestObj.ProjectTasks.push({ Id: row.External_Id__c, External_Id__c: row.Id });
                                    });
                                } else {
                                    console.log('In execMultipleStatment task error>>', error1);
                                }

                                // call salesforce endpoints to update postgres id into salesforce databse
                                if (salesforceRequestObj.Projects && salesforceRequestObj.Projects.length > 0 ||
                                    salesforceRequestObj.ProjectTasks && salesforceRequestObj.ProjectTasks.length > 0) {
                                    const requestData = {
                                        Data__c: JSON.stringify(salesforceRequestObj),
                                    };
                                    if (params.session_id) {
                                        that.postRequestOnSalesforce(params, requestData);
                                        callback(true);
                                    }
                                }
                            });
                        } else {
                            // call salesforce endpoints to update postgres id into salesforce databse
                            if (salesforceRequestObj.Projects && salesforceRequestObj.Projects.length > 0) {
                                const requestData = {
                                    Data__c: JSON.stringify(salesforceRequestObj),
                                };
                                if (params.session_id) {
                                    that.postRequestOnSalesforce(params, requestData);
                                    callback(true);
                                }
                            }
                        }
                    } else {
                        console.log('In execMultipleStatment error>>', error);
                        callback(false);
                    }
                });
            } else {
                console.log('Nothing to sync..');
                callback(true);
            }
        } catch (e) {
            console.log(e);
            callback(false);
        }

    }
    /**
     * @description Sent post request on salesforce endpoints
     * @param params
     * @param data
     * @param callback
     */
    public postRequestOnSalesforce(params: { vanity_id: string, session_id: string }, data: any, callback?: (error: Error, results: any) => void) {
        this.orgMasterModel.getOrgConfigByVanityId(params.vanity_id, (error, config?: IOrgMaster) => {
            if (!error && config) {
                const requestObj = {
                    url: config.api_base_url + '/services/data/v40.0/sobjects/ProjectTaskService__e',
                    headers: {
                        'Authorization': 'Bearer ' + params.session_id,
                        'Content-Type': 'application/json',
                    },
                    json: true,
                    body: data,
                };
                console.log('In postRequestOnSalesforce requestObj - ', requestObj);

                request.post(requestObj, (error1, response) => {
                    console.log('In postRequestOnSalesforce', error1, response.body);
                    if (callback) {
                        callback(error1, response);
                    }
                });
            }
        });
    }
}

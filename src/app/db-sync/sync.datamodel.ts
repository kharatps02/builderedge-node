import { IOrgMaster } from './../../core/models/org-master';
import { ProjectModel, IProjectDetails, ITaskDetails } from './../project/project.model';
import * as _ from 'lodash';
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
    public async syncSalesforceUserDetails(params: { vanity_id: string, session_id: string }, salesforceResponseArray: any[], callback?: (done: boolean, error?: any) => void): Promise<boolean> {

        try {
            const projectRecords = JSON.parse(JSON.stringify(salesforceResponseArray));

            // Filter newly added projects, those records which hasn't external_id__c
            // projectRecords = projectRecords.filter((self) => {
            //     if (!self['External_Id__c']) {
            //         return true;
            //     }
            // });

            if (projectRecords && projectRecords.length > 0) {
                const queryConfig = buildInsertStatements(projectRecords, ['"Id"', '"External_Id__c"'], true, params.vanity_id);
                console.log("query statement", queryConfig);
                // Insert Projects records
                const projectResult = await this.projectModel.insertManyStatements(queryConfig);

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
                    const taskChunks = _.chunk(taskRecords, 34464 / 12);
                    try {
                        for (const chunk of taskChunks) {

                            const tasksQueryConfig = buildInsertStatements(chunk, ['"Id"', '"External_Id__c"'], false);
                            const taskResult = await this.projectModel.insertManyStatements(tasksQueryConfig);
                            taskResult.rows.forEach((row: ITaskDetails) => {
                                salesforceRequestObj.ProjectTasks.push({ Id: row.External_Id__c, External_Id__c: row.Id });
                            });
                            if (salesforceRequestObj.Projects && salesforceRequestObj.Projects.length > 0 ||
                                salesforceRequestObj.ProjectTasks && salesforceRequestObj.ProjectTasks.length > 0) {
                                const requestData = {
                                    Data__c: JSON.stringify(salesforceRequestObj),
                                };
                                if (params.session_id) {
                                    this.postRequestOnSalesforce(params, requestData);
                                }
                            }
                        }
                        if (callback) {
                            callback(true);
                        }
                        return true;
                    } catch (error) {
                        console.log('In execMultipleStatment task error>>', error);
                        if (callback) {
                            callback(false, error);
                        }
                        return false;
                    }

                    // Chunking logic without lodash.
                    // let i, j, temparray: any[], chunk = 34464 / 12;
                    // for (i = 0, j = taskRecords.length; i < j; i += chunk) {
                    //     temparray = taskRecords.slice(i, i + chunk);
                    //     // do whatever
                    // }

                    // taskRecords.slice(34464 / 12)
                } else {
                    // call salesforce endpoints to update postgres id into salesforce database
                    if (salesforceRequestObj.Projects && salesforceRequestObj.Projects.length > 0) {
                        const requestData = {
                            Data__c: JSON.stringify(salesforceRequestObj),
                        };
                        if (params.session_id) {
                            this.postRequestOnSalesforce(params, requestData);
                            if (callback) {
                                callback(true);
                            }
                            return true;
                        }
                    }
                }

            } else {
                console.log('Nothing to sync..');
                if (callback) {
                    callback(true);
                }
                return true;
            }
        } catch (e) {
            console.log(e);
            if (callback) {
                callback(false, e);
            }
            return true;
        }
        return false;
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

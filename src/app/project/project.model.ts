import { ISFEntity } from './../../core/models/sf-entity';
import { SFResponse } from './../db-sync/sf-response';
import { Client, QueryResult, QueryConfig } from 'pg';
import { error } from 'util';
import * as async from 'async';

import { Constants } from '../../config/constants';
import { buildUpdateStatements } from './project.helper';

export class ProjectModel {
    private pgClient!: Client;
    constructor() {

    }
    /**
     * updateProjectsAndTasksAsync
     * @description Updates the projects/tasks parallely.
     * @param projectTaskQueryArray array of query configs for the projects/tasks to be updated.
     */
    public async updateProjectsAndTasksAsync(projectTaskQueryArray: QueryConfig[]) {
        const tasks: Array<Promise<QueryResult>> = [];
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        projectTaskQueryArray.forEach((queryConfig) => {
            tasks.push(pgClient.query(queryConfig));
        });
        return await Promise.all(tasks).then(r => {
            try {
                pgClient.end();
            } finally { }
            return r;
        });
    }
    /**
     * insertManyStatements
     * @description Executes the given prepared statements in the query config, calls the callback and returns the promise with the result.
     * @param queryConfig Query config object
     * @param callback callback
     */
    public async insertManyStatements(queryConfig: QueryConfig, callback?: (error?: Error, results?: any) => void): Promise<QueryResult> {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        try {
            pgClient.connect();
            const result = await pgClient.query(queryConfig);
            if (callback) {
                callback(undefined, result);
            }
            return result;
        } catch (error) {
            try {
                pgClient.end();
            } finally { }
            if (callback) {
                callback(error, undefined);
            }
            throw error;
        } finally {
            pgClient.end();
        }
    }

    /**
     * getProjectExternalIdMap
     * @description Gets a map of SF ids and Database Ids for Project
     * @param callback returns the project ids.
     */
    public getProjectExternalIdMap(callback: (projectIds: ISFEntity[]) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        pgClient.query('SELECT "Id", "External_Id__c" from "Project__c"', (err, results) => {
            pgClient.end();
            callback(results.rows);
        });
    }

    /**
     * getProjectIdByExternalId
     * @description Gets database project Id by Salesforce project Id.
     * @param externalId Salesforce Project Id
     * @param callback callback
     */
    public getProjectIdByExternalId(externalId: string, callback: (projectId: number) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        pgClient.query('SELECT "Id" from "Project__c" WHERE "External_Id__c" = $1', [externalId], (err, results) => {
            pgClient.end();
            callback(results.rows[0].Id);
        });
    }

    /**
     * getAllProjectsAsync
     * @description Gets all projects by project Ids. Returns a JSON formatted object from the database itself.
     * For performance reasons the JSON transform is at PostgreSQL side. It can also be done in Node.js easily. MongoDB will give a right json out of the box.
     * @param projectIds Project ids from salesforce.
     */
    public async getAllProjectsAsync(projectIds?: string[]): Promise<IProjectDetails[]> {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        try {
            pgClient.connect();
            let result: QueryResult;
            if (projectIds && projectIds.length > 0) {
                result = await pgClient.query('select * from public.get_project_tasks_json($1)', [projectIds]);
            } else {
                result = await pgClient.query('select * from public.get_project_tasks_json()');
            }
            pgClient.end();
            if (result.rows && result.rows.length > 0) {
                return result.rows[0].get_project_tasks_json.projects;
            }
            return [];
        } catch (error) {
            try {
                await pgClient.end();
            } finally { }
            throw error;
        }
    }
}
/**
 * Project type interface
 */
export interface IProjectDetails {
    Id?: string;
    External_Id__c?: string;
    Name: string;
    // for Gannt
    start?: Date;
    // for Gannt
    end?: Date;
    Start_Date__c: Date;
    End_Date__c: Date;
    Completion_Percentage__c?: number;
    Description__c?: string;
    Status__c?: string;
    CreatedById: string;
    LastModifiedById: string;
    CreatedDate?: Date;
    LastModifiedDate?: Date;
    OrgMaster_Ref_Id?: string;
    Project_Tasks__r: SFResponse<ITaskDetails>;
    // for Gannt
    records?: ITaskDetails[];
}
/**
 * Task type interface
 */
export interface ITaskDetails extends IProjectDetails {
    Project__c: string;
}

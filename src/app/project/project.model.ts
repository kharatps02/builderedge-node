import { SFResponse } from './../db-sync/sf-response';
import { Client, QueryResult } from 'pg';
import { error } from 'util';
import * as async from 'async';

import { Constants } from '../../config/constants';
import { buildUpdateStatements } from './project.helper';
// import *  as pg from 'pg';

export class ProjectModel {
    private pgClient!: Client;
    constructor() {

    }
    // Not being used.
    public create(params: IProjectRequest, callback: (error: Error, results: any) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        const addQueryString = 'INSERT INTO PROJECT(name, start_date, end_date, completion_per, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6)';
        const addQueryValues = [params.name, params.start_date, params.end_date, params.completion_per, params.created_by, params.updated_by];
        pgClient.query(addQueryString, addQueryValues, (err, results) => {
            callback(err, results);
            pgClient.end();
        });
    }

    public updateProjectsOrTasks(projectTaskQueryArray: any[], callback: (error: Error, results: any) => void) {
        const asyncTasks: Array<async.AsyncFunction<any, any>> = [];
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();

        projectTaskQueryArray.forEach((queryConfig) => {
            asyncTasks.push((callback1) => {
                console.log(queryConfig);
                pgClient.query(queryConfig, callback1);
            });
        });
        async.parallel(asyncTasks, (error1: Error, results) => {
            pgClient.end();
            callback(error1, results);
        });
    }

    public async insertManyStatements(queryObj: { text: string, values: any[] }, callback?: (error?: Error, results?: any) => void): Promise<QueryResult> {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        try {
            pgClient.connect();
            const result= await pgClient.query(queryObj);
            if(callback) {
                callback(undefined, result);
            }
            return result;
        } catch (error) {
            if(callback) {
                callback(error, undefined);
            }
            throw error;
        } finally {
            pgClient.end();            
        }
    }

    /**
     * getProjectExternalIdMap
     */
    public getProjectExternalIdMap(callback: (projectId: any[]) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        pgClient.query('SELECT "Id", "External_Id__c" from "Project__c"', (err, results) => {
            pgClient.end();
            callback(results.rows);
        });
    }

    /**
     * getProjectId
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
     * getProjectExternalIdMap
     */
    public async getAllProjectsAsync(projectIds?: string[]): Promise<IProjectDetails[]> {
        try {
            const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
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
            throw error;
        }
    }
}

export interface IProjectRequest {
    name: string;
    start_date: Date;
    end_date: Date;
    completion_per: number;
    created_by: string;
    updated_by: string;
}
// "External_Id__c", "Name", "Description__c", "Start_Date__c", "End_Date__c", "Completion_Percentage__c", "Status__c",
// "CreatedById", "LastModifiedById", "CreatedDate", "LastModifiedDate", "Project__c"
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

export interface ITaskDetails extends IProjectDetails {
    Project__c: string;
}

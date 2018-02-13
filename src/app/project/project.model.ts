import { Client, QueryResult } from 'pg';
import { error } from 'util';
import * as async from 'async';

import { Constants } from '../../config/constants';
import { buildUpdateStatements } from './project.helper';
// import *  as pg from 'pg';

export class ProjectModel {
    private pgClient: Client;
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
        const asyncTasks = [];
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

    public insertManyStatements(queryObj: { text: string, values: any[] }, callback: (error: Error, results: any) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        pgClient.query(queryObj, (err, results) => {
            pgClient.end();
            callback(err, results);
        });
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
    public getProjectIdByExternalId(externalId: string, callback: (projectId) => void) {
        const pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        pgClient.query('SELECT "Id" from "Project__c" WHERE "External_Id__c" = $1', [externalId], (err, results) => {
            pgClient.end();
            callback(results[0]);
        });
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
    // for Gannt
    records?: ITaskDetails[];
}

export interface ITaskDetails extends IProjectDetails {
    Project__c: string;
}

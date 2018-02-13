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
        pgClient.query('SELECT _id, external_id from projects', (err, results) => {
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
        pgClient.query('SELECT _id from projects WHERE external_id = $1', [externalId], (err, results) => {
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
export interface IProjectDetails {
    id?: string;
    external_id__c?: string;
    name: string;
    start?: Date;
    end?: Date;
    start_date__c: Date;
    end_date__c: Date;
    completion_percentage__c?: number;
    description__c?: string;
    status__c?: string;
    is_syc?: boolean;
    createdbyid: string;
    lastmodifiedbyid: string;
    createddate?: Date;
    lastmodifieddate?: Date;
    project_ref_id?: string;
    records?: ITaskDetails[];
}

export interface ITaskDetails extends IProjectDetails {
    project__c: string;
}

import { Client } from 'pg';
import { error } from 'util';
import * as async from 'async';

import { Constants } from '../../config/constants';
import { buildUpdateStatements } from './project.helper';
// import *  as pg from 'pg';

export class ProjectModel {
    private pgClient: Client
    constructor() {

    }

    create(params: IProjectRequest, callback: (error: Error, results: any) => void) {
        let pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        let addQueryString = 'INSERT INTO PROJECT(name, start_date, end_date, completion_per, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6)';
        let addQueryValues = [params.name, params.start_date, params.end_date, params.completion_per, params.created_by, params.updated_by];
        pgClient.query(addQueryString, addQueryValues, (err, results) => {
            callback(err, results);
            pgClient.end();
        });
    }

    updateProjectsOrTasks(projectTasks: Array<any>, isProject = true, callback: (error: Error, results: any) => void) {
        let asyncTasks = [];
        let pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();

        projectTasks.forEach((task) => {
            asyncTasks.push(function (callback) {
                let queryConfig = buildUpdateStatements(task, isProject);
                console.log(queryConfig);
                pgClient.query(queryConfig, callback);
            });
        });
        async.parallel(asyncTasks, (error, results) => {
            pgClient.end();
            callback(error, results);
        });
    }


    insertManyStatements(queryObj: { text: string, values: Array<any> }, callback: (error: Error, results: any) => void) {
        let pgClient = new Client(Constants.POSTGRES_DB_CONFIG);
        pgClient.connect();
        pgClient.query(queryObj, (err, results) => {
            pgClient.end();
            callback(err, results);
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
    external_id?: string;
    name: string;
    start?: Date;
    end?: Date;
    start_date: Date;
    end_date: Date;
    completion_per?: number;
    description?: string;
    status?: string;
    is_syc?: boolean;
    created_by: string;
    updated_by: string;
    created_at?: Date;
    updated_at?: Date;
    project_ref_id?: string;
    records?: Array<ITaskDetails>;
};

export interface ITaskDetails extends IProjectDetails {
    project_ref_id: string;
};
const { Client } = require('pg');
import { Constants } from '../../config/constants';
import { error } from 'util';


export class ProjectModel {
    constructor() {

    }

    create(params: IProjectRequest, callback: (error: Error, results: any) => void) {
        let pgClienet = new Client({ connectionString: Constants.DB_CONNECTION_STRING, ssl: true });

        pgClienet.connect((error, client, done) => {
            let addQueryString = 'INSERT INTO PROJECT(name, start_date, end_date, completion_per, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6)';
            let addQueryValues = [params.name, params.start_date, params.end_date, params.completion_per, params.created_by, params.updated_by];
            client.query(addQueryString, addQueryValues, (err, results) => {
                done();
                callback(err, results);
            });
        });
    }

    getalldetails(params: IProjectRequest, callback: (error: Error, results: any) => void) {
        let pgClienet = new Client({ connectionString: Constants.DB_CONNECTION_STRING, ssl: true });

        pgClienet.connect((error, client, done) => {
            let addQueryString = 'INSERT INTO PROJECT(name, start_date, end_date, completion_per, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6)';
            let addQueryValues = [params.name, params.start_date, params.end_date, params.completion_per, params.created_by, params.updated_by];
            client.query(addQueryString, addQueryValues, (err, results) => {
                done();
                callback(err, results);
            });
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
    start: Date;
    end: Date;
    completion_per?: number;
    description?: string;
    status?: string;
    is_syc?: boolean;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
    records?: Array<ITaskDetails>;
};

export interface ITaskDetails extends IProjectDetails {
    project_ref_id: string;
};
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
                //  done();
                callback(err, results);
            });
        });
    }

    update(params: any, callback: (error: Error, results: any) => void) {

        let queryValues = [];

        if (params.name) {
            queryValues.push(params.name);
        }
        if (params.start_date) {
            queryValues.push(params.start_date);
        }
        if (params.end_date) {
            queryValues.push(params.end_date);
        }
        if (params.completion_per) {
            queryValues.push(params.completion_per);
        }
        if (params.status) {
            queryValues.push(params.status);
        }
        if (params.external_id) {
            queryValues.push(params.external_id);
        }
        if (params.project_ref_id) {
            queryValues.push(params.project_ref_id);
        }

        let queryValuesLength = queryValues.length;
        let updateQueryString = "UPDATE PROJECT SET ";// = $1 WHERE created_by = $2";
        queryValues.forEach((columnName, index) => {
            updateQueryString += columnName + ' = $' + (index + 1);
            if ((index + 1) < queryValuesLength) {
                updateQueryString + ', ';
            }
        });

        updateQueryString += ' WHERE id=$' + (queryValuesLength + 1) + ' AND created_by=$' + (queryValuesLength + 2);
        queryValues.push(params.id);
        queryValues.push(params.created_by);


        let pgClienet = new Client({ connectionString: Constants.DB_CONNECTION_STRING, ssl: true });
        pgClienet.connect((error, client, done) => {
            client.query(updateQueryString, queryValues, (err, results) => {
                done();
                callback(err, results);
            });
        });
    }

    execMultipleStatment(queryObj: { text: string, values: Array<any> }, callback: (error: Error, results: any) => void) {
        let pgClienet = new Client({ connectionString: Constants.DB_CONNECTION_STRING, ssl: true });
        pgClienet.connect();
        pgClienet.query(queryObj, (err, results) => {           
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
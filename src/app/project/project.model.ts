import { Client } from 'pg';
import { Constants } from '../../config/constants';
import { error } from 'util';



export class ProjectModel {
    private pgClient: Client
    constructor() {
        this.pgClient = new Client({ connectionString: Constants.DB_CONNECTION_STRING, ssl: true });
        this.pgClient.connect();

    }

    create(params: IProjectRequest, callback: (error: Error, results: any) => void) {
        let pgClienet = new Client({ connectionString: Constants.DB_CONNECTION_STRING, ssl: true });
        let addQueryString = 'INSERT INTO PROJECT(name, start_date, end_date, completion_per, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6)';
        let addQueryValues = [params.name, params.start_date, params.end_date, params.completion_per, params.created_by, params.updated_by];
        this.pgClient.query(addQueryString, addQueryValues, (err, results) => {
            callback(err, results);
        });
    }

    getalldetails(params: IProjectRequest, callback: (error: Error, results: any) => void) {
        let addQueryString = 'INSERT INTO PROJECT(name, start_date, end_date, completion_per, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6)';
        let addQueryValues = [params.name, params.start_date, params.end_date, params.completion_per, params.created_by, params.updated_by];
        this.pgClient.query(addQueryString, addQueryValues, (err, results) => {
            //  done();
            callback(err, results);
        });
    }

    updateProjectOrTask(params: any, isProject = true, callback: (error: Error, results: any) => void) {
        let queryValues = [];
        const valueClause = [];

        if (params.name) {
            queryValues.push(params.name);
            valueClause.push(' name= $' + queryValues.length);
        }
        if (params.start_date) {
            queryValues.push(params.start_date);
            valueClause.push(' start_date= $' + queryValues.length);
        }
        if (params.end_date) {
            queryValues.push(params.end_date);
            valueClause.push(' end_date= $' + queryValues.length);
        }
        if (params.completion_per) {
            queryValues.push(params.completion_per);
            valueClause.push(' completion_per= $' + queryValues.length);
        }

        if (params.description) {
            queryValues.push(params.description);
            valueClause.push(' description= $' + queryValues.length);
        }

        if (params.status) {
            queryValues.push(params.status);
            valueClause.push(' status= $' + queryValues.length);
        }

        if (params.updated_by) {
            queryValues.push(params.updated_by);
            valueClause.push(' updated_by= $' + queryValues.length);
        }

        queryValues.push(params.id);
        // queryValues.push(params.created_by);
        let updateQueryString = 'UPDATE PROJECTS';
        if (!isProject) {
            updateQueryString = 'UPDATE PROJECT_TASKS';
        }
        updateQueryString += '  SET ' + valueClause.join(', ') + ' WHERE _id=$' + (valueClause.length + 1);
        // + ' AND created_by=$' + (valueClause.length + 2);
        console.log('updateQueryString', updateQueryString, queryValues);
        this.pgClient.query(updateQueryString, queryValues, (err, results) => {
            console.log(err, results)
            callback(err, results);
        });
    }

    execMultipleStatment(queryObj: { text: string, values: Array<any> }, callback: (error: Error, results: any) => void) {
        this.pgClient.query(queryObj, (err, results) => {
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
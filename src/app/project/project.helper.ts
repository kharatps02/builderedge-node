import { QueryConfig } from 'pg';
import { ITaskDetails, IProjectDetails } from './project.model';

/**
 * formatProjectAndTaskDetails
 * @description This function is formatting data as per Gantt chart
 * @param projectArray
 */
export function formatProjectAndTaskDetails(projectArray: any[]) {
    const newProjectArray: any[] = [];
    projectArray.forEach((project: any) => {
        let newProject: { [key: string]: any, series: any[] } = { series: [] };
        newProject = formatProjectDetails(project);
        newProject['series'] = [];
        if (project.Project_Tasks__r && project.Project_Tasks__r.records
            && project.Project_Tasks__r.records.length > 0) {
            project.Project_Tasks__r.records.forEach((task: any) => {
                let newTask: { [key: string]: any } = {};
                newTask = formatTaskDetails(task);
                newProject.series.push(newTask);
            });
        }
        newProjectArray.push(newProject);
    });
    return newProjectArray;
}
/**
 * formatTaskDetails
 * @description Formats task details for gantt.
 * @param task 
 */
export function formatTaskDetails(task: { [key: string]: any }) {
    const newTask = task;
    newTask['name'] = task['Name'] || '';
    newTask['start'] = new Date(task['Start_Date__c']).getTime();
    newTask['end'] = new Date(task['End_Date__c']).getTime();
    return newTask;
}
/**
 * formatProjectDetails
 * @description Formats project details for gantt
 * @param project 
 */
export function formatProjectDetails(project: { [key: string]: any, series: any[] }) {
    const newProject = project;
    newProject['name'] = project['Name'] || '';
    newProject['start'] = new Date(project['Start_Date__c']).getTime();
    newProject['end'] = new Date(project['End_Date__c']).getTime();
    return newProject;
}

/**
 * buildInsertStatements
 * @description Builds statements for insert projects or tasks.
 * @param rows array of project or task.
 * @param returnFieldArr returns fields
 * @param isProjectRequest Indicate if it's a project or task array. based on project or tasks request.
 * @param internalOrgId (Optional) internal org id.
 */
export function buildInsertStatements(rows: any[], returnFieldArr: any[] = [], isProjectRequest: boolean = true, internalOrgId?: string) {
    const params: any[] = [];
    const chunks: any[] = [];
    const valueStr = '';
    let insertQueryStr = '';
    let returning = '';

    // tslint:disable-next-line:max-line-length
    insertQueryStr = `INSERT INTO "Project__c" ( "External_Id__c", "Name", "Description__c", "Start_Date__c", "End_Date__c", "Completion_Percentage__c", "Status__c", "CreatedById", "LastModifiedById", "CreatedDate", "LastModifiedDate", "OrgMaster_Ref_Id" ) VALUES `;

    if (!isProjectRequest) {
        // tslint:disable-next-line:max-line-length
        insertQueryStr = `INSERT INTO "Project_Task__c" ( "External_Id__c", "Name", "Description__c", "Start_Date__c", "End_Date__c", "Completion_Percentage__c", "Status__c", "CreatedById", "LastModifiedById", "CreatedDate", "LastModifiedDate", "Project__c" ) VALUES `;
    }

    if (returnFieldArr.length !== 0) {
        returning = ' RETURNING ' + returnFieldArr.toString();
    }

    rows.forEach((row) => {
        const valueClause = [];

        params.push(row.Id);
        valueClause.push('$' + params.length);

        params.push(row.Name);
        valueClause.push('$' + params.length);

        params.push(row.Description__c);
        valueClause.push('$' + params.length);

        params.push(row.Start_Date__c);
        valueClause.push('$' + params.length);

        params.push(row.End_Date__c);
        valueClause.push('$' + params.length);

        params.push(row.Completion_Percentage__c);
        valueClause.push('$' + params.length);

        params.push(row.Status__c);
        valueClause.push('$' + params.length);

        params.push(row.CreatedById);
        valueClause.push('$' + params.length);

        params.push(row.LastModifiedById);
        valueClause.push('$' + params.length);

        params.push(row.CreatedDate);
        valueClause.push('$' + params.length);

        params.push(row.LastModifiedDate);
        valueClause.push('$' + params.length);

        if (!isProjectRequest) {
            params.push(row.Project__c);
            valueClause.push('$' + params.length);
        } else {
            params.push(row.OrgMaster_Ref_Id || internalOrgId);
            valueClause.push('$' + params.length);
        }

        chunks.push('(' + valueClause.join(', ') + ')');
    });

    return {
        text: insertQueryStr + chunks.join(', ') + returning,
        values: params,
    };
}

export function swapSfId(item: { [key: string]: any }) {
    const externalId = item['External_Id__c'];
    item['External_Id__c'] = item['Id'];
    item['Id'] = externalId;
}
/**
 * buildUpdateStatements
 * @description Builds update query config for projects or tasks.
 * @param params Array of project or tasks
 * @param isProject recognize if it's a project or task array
 */
export function buildUpdateStatements(params: ITaskDetails | IProjectDetails, isProject: boolean): QueryConfig {
    const queryValues = [];
    const valueClause = [];

    if (params.Name) {
        queryValues.push(params.Name);
        valueClause.push(' "Name"= $' + queryValues.length);
    }
    if (params.Start_Date__c) {
        queryValues.push(params.Start_Date__c);
        valueClause.push(' "Start_Date__c"= $' + queryValues.length);
    }
    if (params.End_Date__c) {
        queryValues.push(params.End_Date__c);
        valueClause.push(' "End_Date__c"= $' + queryValues.length);
    }
    if (params.Completion_Percentage__c) {
        queryValues.push(params.Completion_Percentage__c);
        valueClause.push(' "Completion_Percentage__c"= $' + queryValues.length);
    }

    if (params.Description__c) {
        queryValues.push(params.Description__c);
        valueClause.push(' "Description__c"= $' + queryValues.length);
    }

    if (params.Status__c) {
        queryValues.push(params.Status__c);
        valueClause.push(' "Status__c"= $' + queryValues.length);
    }

    if (params.LastModifiedById) {
        queryValues.push(params.LastModifiedById);
        valueClause.push(' "LastModifiedById"= $' + queryValues.length);
    }

    queryValues.push(params.Id);
    let updateQueryString = 'UPDATE "Project__c"';
    if (!isProject) {
        updateQueryString = 'UPDATE "Project_Task__c"';
    }
    updateQueryString += '  SET ' + valueClause.join(', ') + ' WHERE "Id"=$' + (valueClause.length + 1);
    return {
        text: updateQueryString,
        values: queryValues,
    };
}

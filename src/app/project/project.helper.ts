import { ITaskDetails } from './project.model';
/**
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

export function formatTaskDetails(task) {
    const newTask = task;
    // newTask['id'] = task['Id'];
    newTask['name'] = task['Name'] || '';
    newTask['start'] = new Date(task['Start_Date__c']).getTime();
    newTask['end'] = new Date(task['End_Date__c']).getTime();

    // newTask['description'] = task['Description__c'] || '';
    // newTask['start_date'] = task['Start_Date__c'];
    // newTask['end_date'] = task['End_Date__c'];
    // newTask['completion_per'] = task['Completion_Percentage__c'];
    // newTask['status'] = task['Status__c'];
    // newTask['created_by'] = task['CreatedById'];
    // newTask['updated_by'] = task['LastModifiedById'];
    // newTask['created_at'] = task['CreatedDate'];
    // newTask['updated_at'] = task['LastModifiedDate'];
    // newTask['external_id'] = task['External_Id__c'];
    // newTask['project_ref_id'] = task['Project__c'];
    return newTask;
}
export function formatProjectDetails(project) {
    const newProject = project;
    // newProject['id'] = project['Id'];
    newProject['name'] = project['Name'] || '';
    newProject['start'] = new Date(project['Start_Date__c']).getTime();
    newProject['end'] = new Date(project['End_Date__c']).getTime();

    // newProject['description'] = project['Description__c'] || '';
    // newProject['start_date'] = project['Start_Date__c'];
    // newProject['end_date'] = project['End_Date__c'];
    // newProject['completion_per'] = project['Completion_Percentage__c'];
    // newProject['status'] = project['Status__c'];
    // newProject['created_by'] = project['CreatedById'];
    // newProject['updated_by'] = project['LastModifiedById'];
    // newProject['created_at'] = project['CreatedDate'];
    // newProject['updated_at'] = project['LastModifiedDate'];
    // newProject['external_id'] = project['External_Id__c'];
    return newProject;
}

export function buildInsertStatements(rows, returnFieldArr = [], isProjectRequest: boolean = true) {
    const params = [];
    const chunks = [];
    const valueStr = '';
    let insertQueryStr = '';
    let returning = '';

    insertQueryStr = `INSERT INTO "Project__c" ( "External_Id__c", "Name", "Description__c", "Start_Date__c", "End_Date__c", "Completion_Percentage__c", "Status__c", "CreatedById", "LastModifiedById", "CreatedDate", "LastModifiedDate", "OrgMaster_Ref_Id" ) VALUES `;

    if (!isProjectRequest) {
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
            params.push(row.OrgMaster_Ref_Id);
            valueClause.push('$' + params.length);
        }

        chunks.push('(' + valueClause.join(', ') + ')');
    });

    return {
        text: insertQueryStr + chunks.join(', ') + returning,
        values: params,
    };
}

// Not being used.
export function formatSalesForceObject(params) {

    const record = {};

    if (params.name) {
        record['Name'] = params.name;
    }
    if (params.description) {
        record['Description__c'] = params.description;
    }
    if (params.start_date) {
        record['Start_Date__c'] = params.start_date;
    }
    if (params.end_date) {
        record['End_Date__c'] = params.end_date;
    }
    if (params.completion_per) {
        record['Completion_Percentage__c'] = params.completion_per;
    }
    if (params.status) {
        record['Status__c'] = params.status;
    }

    if (params.id) {
        record['External_Id__c'] = params.id;
    }

    if (params.external_id) {
        record['Id'] = params.external_id;
    }

    if (params.project_ref_id) {
        record['Project__c'] = params.project_ref_id;
    }
    return record;
}
export function swapSfId(item) {
    const externalId = item['External_Id__c'];
    item['External_Id__c'] = item['Id'];
    item['Id'] = externalId;
}
export function buildUpdateStatements(params: ITaskDetails, isProject): { text: string, values: any[] } {
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
    // console.log('updateQueryString', updateQueryString, queryValues);
    return {
        text: updateQueryString,
        values: queryValues,
    };
}

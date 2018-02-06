export function formatProjectDetails(projectArray) {
    let newProjectArray = [];
    projectArray.forEach(project => {
        let newProject = { series: [] };
        newProject['id'] = project['Id'];
        newProject['name'] = project['Name'] || '';
        newProject['description'] = project['Description__c'] || '';
        newProject['start'] = new Date(project['Start_Date__c']).getTime();
        newProject['end'] = new Date(project['End_Date__c']).getTime();
        newProject['start_date'] = project['Start_Date__c'];
        newProject['end_date'] = project['End_Date__c'];
        newProject['completion_per'] = project['Completion_Percentage__c'];
        newProject['status'] = project['Status__c'];
        newProject['created_by'] = project['CreatedById'];
        newProject['updated_by'] = project['LastModifiedById'];
        newProject['created_at'] = project['CreatedDate'];
        newProject['updated_at'] = project['LastModifiedDate'];
        newProject['external_id'] = project['External_Id__c'];

        if (project.Project_Tasks__r && project.Project_Tasks__r.records && project.Project_Tasks__r.records.length > 0) {
            project.Project_Tasks__r.records.forEach(task => {
                let newTask = {};

                newTask['id'] = task['Id'];
                newTask['name'] = task['Name'] || '';
                newTask['description'] = task['Description__c'] || '';
                newTask['start'] = new Date(task['Start_Date__c']).getTime();
                newTask['end'] = new Date(task['End_Date__c']).getTime();
                newTask['start_date'] = project['Start_Date__c'];
                newTask['end_date'] = project['End_Date__c'];
                newTask['completion_per'] = task['Completion_Percentage__c'];
                newTask['status'] = task['Status__c'];
                newTask['created_by'] = task['CreatedById'];
                newTask['updated_by'] = task['LastModifiedById'];
                newTask['created_at'] = task['CreatedDate'];
                newTask['updated_at'] = task['LastModifiedDate'];
                newTask['external_id'] = task['External_Id__c'];
                newTask['project_ref_id'] = task['Project__c'];
                newProject.series.push(newTask);
            });
        }
        newProjectArray.push(newProject);
    });

    return newProjectArray;
}

export function buildInsertStatements(rows, returnFieldArr = [], isProjectRequest: boolean = true) {
    const params = [];
    const chunks = [];
    let valueStr = '', insertQueryStr = '', returning = '';

    insertQueryStr = "INSERT INTO PROJECTS ( external_id, name,description, start_date, end_date, completion_per, status, created_by, updated_by, created_at, updated_at ) VALUES "

    if (!isProjectRequest) {
        insertQueryStr = "INSERT INTO project_tasks ( external_id, name,description, start_date, end_date, completion_per, status, created_by, updated_by, created_at, updated_at, project_ref_id ) VALUES "
    }

    if (returnFieldArr.length !== 0) {
        returning = ' RETURNING ' + returnFieldArr.toString();
    }

    rows.forEach(row => {
        const valueClause = [];

        params.push(row.id);
        valueClause.push('$' + params.length);

        params.push(row.name);
        valueClause.push('$' + params.length);

        params.push(row.description);
        valueClause.push('$' + params.length);

        params.push(row.start_date);
        valueClause.push('$' + params.length);

        params.push(row.end_date);
        valueClause.push('$' + params.length);

        params.push(row.completion_per);
        valueClause.push('$' + params.length);

        params.push(row.status);
        valueClause.push('$' + params.length);

        params.push(row.created_by);
        valueClause.push('$' + params.length);

        params.push(row.updated_by);
        valueClause.push('$' + params.length);

        params.push(row.created_at);
        valueClause.push('$' + params.length);

        params.push(row.updated_at);
        valueClause.push('$' + params.length);


        if (!isProjectRequest) {
            params.push(row.project_ref_id);
            valueClause.push('$' + params.length);
        }

        chunks.push('(' + valueClause.join(', ') + ')')
    });
    return {
        text: insertQueryStr + chunks.join(', ') + returning,
        values: params
    }
}

export function formatSalesForceObject(params) {

    let record = {};

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


export function buildUpdateStatements(params, isProject): { text: string, values: Array<any> } {
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
    let updateQueryString = 'UPDATE PROJECTS';
    if (!isProject) {
        updateQueryString = 'UPDATE PROJECT_TASKS';
    }
    updateQueryString += '  SET ' + valueClause.join(', ') + ' WHERE _id=$' + (valueClause.length + 1);
    // console.log('updateQueryString', updateQueryString, queryValues);
    return {
        text: updateQueryString,
        values: queryValues
    };
}


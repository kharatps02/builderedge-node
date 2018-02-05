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
                newTask['project_ref_id'] = project['Id'];
                newProject.series.push(newTask);
            });
        }
        newProjectArray.push(newProject);
    });

    return newProjectArray;
}

export function buildProjectTasksStatement(rows, returnFieldArr = []) {
    const params = [];
    const chunks = [];
    let valueStr = '', insertQueryStr = '', returning = '';

    valueStr = "external_id, name,description, start_date, end_date, completion_per, status, created_by, updated_by, created_at, updated_at, project_ref_id";

    insertQueryStr = "INSERT INTO project_tasks ( " + valueStr + " ) VALUES "

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

        params.push(row.project_ref_id);
        valueClause.push('$' + params.length);

        chunks.push('(' + valueClause.join(', ') + ')')
    });
    return {
        text: insertQueryStr + chunks.join(', ') + returning,
        values: params
    }
}


export function buildProjectStatement(rows, returnFieldArr = []) {
    const params = [];
    const chunks = [];
    let valueStr = '', insertQueryStr = '', returning = '';

    valueStr = "external_id, name,description, start_date, end_date, completion_per, status, created_by, updated_by, created_at, updated_at";

    insertQueryStr = "INSERT INTO PROJECTS ( " + valueStr + " ) VALUES "

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

        // params.push(row.project_ref_id);
        // valueClause.push('$' + params.length);

        chunks.push('(' + valueClause.join(', ') + ')')
    });
    return {
        text: insertQueryStr + chunks.join(', ') + ' ON CONFLICT DO NOTHING ' + returning,
        values: params
    }
}
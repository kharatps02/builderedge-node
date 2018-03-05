-- FUNCTION: public.get_project_tasks_json()

-- DROP FUNCTION public.get_project_tasks_json();

CREATE OR REPLACE FUNCTION public.get_project_tasks_json(
	)
    RETURNS json
    LANGUAGE 'sql'

    COST 100
    VOLATILE 
AS $BODY$

-- ====================================================================================
  	-- Author		: Rushikesh Kshirsagar
    -- Create date	: 2018-02-22
    -- Description	: To fetch all projects and their tasks from the database.
	-- Execution	: select * from public.get_project_tasks_json() 
    -- Revision		:		
-- ====================================================================================
select
    json_build_object(
        'projects', json_agg(
            json_build_object(
                'Id', p."External_Id__c",
                'External_Id__c', p."Id",
				'name', p."Name",
                'series', tasks
            )
        )
    ) projects
from "Project__c" p
left join (
    select 
        "Project__c",
        json_agg(
            json_build_object(
                'Id', c."External_Id__c",
				'External_Id__c', c."Id",																								
				'name', c."Name",
				'start', extract ('epoch' from c."Start_Date__c"),
				'end', extract ('epoch' from c."End_Date__c")
                )
            ) tasks
    from
        "Project_Task__c" c
    group by "Project__c"
) c on p."Id" = c."Project__c";

$BODY$;



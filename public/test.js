$(function () {
    $("#test").click(e => {
        NodeZipdata('');
    });

    function NodeZipdata(projId) {
        $.ajax({
            url: 'http://localhost:4300/api/project/data/a007F00000BRTkvQAH', //HerokuAppURL+"/api/project/data/"+projId,
            type: "GET",
            success: function (responseBody, status, xhr) {
                var data = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                console.log('Total tasks are', data.tasks.rows.length);
            },
            error: function (xhr, status, error) {
                console.log(error);
                //var e = JSON.parse(error.response);                                            
                //alert(error.message);
            }
        });
    }
});
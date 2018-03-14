$(function () {
    $("#test").click(e => {
        NodeZipdata('');
    });

    function NodeZipdata(projId) {
        $.ajax({
            url: 'http://localhost:4300/api/project/data/a007F00000BRTkvQAH ', //HerokuAppURL+"/api/project/data/"+projId,
            type: "GET",
            beforeSend: function (xhr) {
                // xhr.setRequestHeader('Content-Type', 'application/zip');
                xhr.setRequestHeader('Accept-Encoding', 'gzip');
                // xhr.overrideMimeType("text/plain; charset=x-user-defined");
                // xhr.responseType = 'blob';
            },
            success: function (responseBody, status, xhr) {
                loadGanttChart(responseBody, status, xhr);
            },
            error: function (xhr, status, error) {
                console.log(error);
                //var e = JSON.parse(error.response);                                            
                //alert(error.message);
            }
        });
    }

    function loadGanttChart(responseBody, status, xhr) {
        console.log('ganttchart zip data');
        var zipfileReader = new JSZip();
        // var blob = new Blob([responseBody], {
        //     type: "application/zip"
        // });
        var zipFileNew = zipfileReader.loadAsync(responseBody, {
                optimizedBinaryString: true,
                checkCRC32: true
            })
            .then(function (FileData) {
                FileData.file("file.json").async("string").then(function (data) {
                    console.log('binary upzip data');

                    console.log(JSON.parse(data));
                }).catch(err => {
                    console.log(err);
                });
            }).catch(err => {
                console.log(err);
            });
    }
});
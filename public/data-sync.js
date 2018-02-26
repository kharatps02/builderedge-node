var source = new EventSource("/events");
source.onmessage = function (event) {
    console.log(event);
    if (event.type === "initialSyncDone") {
        if (event.data && event.data.appUrl) {
            console.log('Sync successful.', event);
            alert('Sync successful.');
            window.location = event.data.appUrl;
        } else {
            alert("Sync failed. Error fetching App URL");
            console.log('Sync failed.', event);
        }
    }
    if (event.type === "error") {
        alert("Sync failed. See console for more details");
        console.log('Sync failed.', event);
    }
};
window.location = document.getElementById("appUrl").value;
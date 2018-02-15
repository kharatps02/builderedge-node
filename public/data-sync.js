var source = new EventSource("/events");
source.onmessage = function (event) {
    console.log(event);
    if (event.type === "initialSyncDone") {
        if (event.data.appUrl) {
            window.location = event.data.appUrl;
        } else {
            console.log('There was a problem', event);
        }
    }
};
window.location = document.getElementById("appUrl").value;
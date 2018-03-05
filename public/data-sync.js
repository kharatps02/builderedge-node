var source = new EventSource("/events");
source.addEventListener('initialSyncDone', (event) => {
    console.log(event);
    if (event.type === "initialSyncDone") {
        const data = JSON.parse(event.data);
        if (data && data.appUrl) {
            console.log('Sync successful.', event);
            window.location = data.appUrl;
        } else {
            alert("Sync failed. Error fetching App URL");
            console.error('Sync failed.', event);
        }
    }
});
source.addEventListener('error', (event) => {
    console.log(event);
    if (event.type === "error") {
        console.error('Sync failed.', event);
    }
});
// window.location = document.getElementById("appUrl").value;
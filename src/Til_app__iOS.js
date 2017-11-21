document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('app.notify', function(event){
        window.webkit 
        && window.webkit.messageHandlers
        && window.webkit.messageHandlers.kurator.postMessage(event.detail);
    })
     
})
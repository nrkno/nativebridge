


var NativeApp = {
    dispatch: function(msg) {
        console.log("dispatching message: ", msg);
        if (window.webkit && window.webkit.messageHandlers) {
            window.webkit.messageHandlers.kurator.postMessage(msg);
        } else if (window.someAndroidAPI) {
            window.someAndroidAPI.callSomeMethod(msg);
        } else {
            console.log("no message handler context")
            update("oops")
        }
    },
    state: {count: 1},
    receive: function(state) {
        console.log("state updated ", state);
        this.state = state;
        // Notify observers/emit events, whatever
        update(this.state.count)
        return this.state
    }
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("initial state is ", NativeApp.state)
    update(NativeApp.state.count)
});

window.addEventListener('app.message', function(event){
    const message = event.detail;

    if(message.action === 'gaclient'){
        window.ga('client', message.id)
    }

    document.body.insertAdjacentHTML('beforeend', JSON.stringify(event.detail))
})

function update(value) {
    document.getElementById("count").innerText = value
}

document.addEventListener('nrknoapp', onMessage)

function onMessage(message) {
    console.log("onMessage called")
    console.log(message)
}

function buttonTapped(event) {
    //console.log(event.hello);
    jsInterface.test(JSON.stringify({hello: "hei"}));
    window.dispatchEvent(new CustomEvent('app.notify', {
        detail: {"action": "increment"}
    }))
}

document.addEventListener('click', function(event){
    document.body.insertAdjacentHTML('beforeend', event.target.id)
    if(event.target.id === 'button') {
        console.log('buttonClick')
        buttonTapped();
    }
})

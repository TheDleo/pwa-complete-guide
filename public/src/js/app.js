var deferredPrompt;

if(!window.Promise) {
    window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    .then(function() {
        console.log('service worker registered');
    });
}

window.addEventListener('beforeinstallprompt', function(e) {
    console.log('beforeinstallprompt fired');
    e.preventDefault();
    deferredPrompt = e;
    return false;
});

var promise = new Promise(function(res,rej) {
    setTimeout(() => {
        //res('this is executed once the timer is done');
        rej({ code: 500, message: 'an error occurred'});
        // console.log('this is called after SetTimeOut() expires');
    }, 3000);
    
});

fetch('https://httpbin.org/headers')
    .then((response) => {
        return response.json()
    })
    .then((data) => {
        console.log(data);
    })
    .catch((err) => {
        console.log(err);
    });

fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json' 
    },
    body: JSON.stringify( { message: 'does this work?' } )
})
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        console.log(data);
    })
    .catch((err) => {
        console.log(err);
    })

promise.then(function(text) {
    return text;    
}, function(err) {
    console.log(err.code, err.message);
    return false;
}).then(function(newText) {
    console.log(newText);
}).catch((e) => {
    console.table(e);
});

console.log('this is called after setTimeOut()');
const concurrently = require('concurrently');
concurrently([
    'npm:startServer', // shortcut to launch npm script startServer
    'npm:startClient', // shortcut to launch npm script startClient
], {
    killOthers: ['failure', 'success'],
    restartTries: 3,
}).then(() => {
    console.log('started');
}, () => {
    console.log('failure');
});
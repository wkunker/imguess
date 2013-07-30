var request = require('request');

request({method: 'POST', uri: 'http://127.0.0.1:4321', json: {search: 'test'}}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log('RESPONSE: ' + JSON.stringify(body));
    } else {
        console.log('RESPONSE ERROR: ' + response.statusCode);
    }
});

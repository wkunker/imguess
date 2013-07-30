/*
 * A fork of imgrelay customized for imguess.
 */

var restify = require('restify');
var request = require('request');
var $ = require('jquery');
var exec = require('child_process').exec;
var fs = require('fs');

var urls = [];
var accessHeaders = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '127.0.0.1'};
var autourl_running = 0;
var max_scrapes = 500;

var autoUrl = function() {
    if(urls.length < max_scrapes) {
        console.log('urls length: ' + urls.length);
        autourl_running++;
        genUrl(function(result, error) {
            if(error === undefined) {
                console.log('Pushing result to urls <' + result + '>');
                urls.push(result);
            } else {
                console.log('Scrape error: ' + error);
            }

            setTimeout(function() {
                autoUrl();
            }, 2000);
        });
    } else {
        // 5000 URLs have been scraped - Store the data in a file and stop for now.
        var dataStoreFile = 'data_' + Date.now() + '.json';
        fs.writeFileSync(dataStoreFile, JSON.stringify(urls));
        server.close();
    }
}

function genUrl(callback) {
    exec('./randsense.py', function (error, stdout, stderr) {
        var keyword = stdout.split('10: ')[1].replace(/ /g, '%20');

        console.log('stage keyword... ' + keyword);

        request('http://www.google.com/search?tbm=isch&hl=en&source=hp&biw=&bih=&q=' + keyword + '&btnG=Search+Images&gbv=1', function (error, response, body) {
            console.log('stage first_url... ' + response.statusCode.toString());

            if (!error && response.statusCode == 200) {
                var first_url = $(body).find('.images_table').find('a').attr('href');
                first_url = 'http://google.com' + first_url;

                request(first_url, function (err, rs, bd) {
                    console.log('stage second_url... ' + rs.statusCode.toString());

                    if (!err && rs.statusCode == 200) {
                        var final_url = $(bd).find('#thumbnail').attr('href');
                        callback(final_url); // Success.
                    } else {
                        callback(null, true); // Error.
                    }
                });
            } else if(response.statusCode == 503) {
                setTimeout(function() {
                    callback(null, response.statusCode)
                }, 8000);
            } else {
                setTimeout(function() {
                    callback(null, response.statusCode)
                }, 2000);
            }
        })
    });
};

var server = restify.createServer();

server.listen(8081, function() {
    console.log('%s listening at %s', server.name, server.url);

    for(var i = 0; i < 1; i++) {
        autoUrl();
    }
});

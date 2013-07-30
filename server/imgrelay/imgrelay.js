/*
 * A fork of imgrelay customized for imguess.
 */

var restify = require('restify');
var request = require('request');
var $ = require('jquery');
var exec = require('child_process').exec;
var fs = require('fs');
var config = require('./../../config.js');
var execSync = require('execSync');

var urls = [];
var accessHeaders = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '127.0.0.1'};
var iterator = 0; // Keep track of which URLs in the array have been read.
var dataLoc = config.publicData;
var publicDataLoc = 'data';

function local(req, res, next) {
	/*var net = require('net');
	var socket = net.connect({port:4321}, function () {
		socket.end('{search:"' + req.params.keywords + '"}');
	});
	
	socket.on('data', function(data) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(data);
	});*/


    if(urls.length > 0) {
        if(iterator < urls.length - 1) {
            iterator++;
        } else {
            iterator = 0;
        }

        res.writeHead(200, accessHeaders);
        res.end(urls[iterator]);

    } else {
        genUrl(function(result, error) {
            if(error === undefined) {
                res.writeHead(200, accessHeaders);
                res.end(result);
            } else {
                return next('FATAL ERROR');
            }
        });
    }



    return next();
}

var getDataList = function(data) {
	var cmdResult = execSync.exec('ls ' + data + ' | awk \' BEGIN { ORS = \"\"; print \"[\"; } { print \"\/\@\"$0\"\/\@\"; } END { print \"]\"; }\' | sed \"s^\\"^\\\\\\"^g;s^\/\@\/\@^\\", \\"^g;s^\/\@^\\"^g\"');
    list = JSON.parse(cmdResult.stdout);
    return list;
}

var server = restify.createServer();

server.get('/', local);
server.head('/', local);

server.listen(8081, function() {
    console.log('%s listening at %s', server.name, server.url);

    console.log('config.js relayDataLocation: ' + config.relayDataLocation);
    
    var dataList = getDataList(dataLoc);
    
    for(var i = 0; i < dataList.length; i++) {
		// Traverse through each data directory, adding them all to a
		// master list until a max number has been reached or a max is met.
		var images = getDataList(dataLoc + '/' + dataList[i]);
		for(var x = 0; x < images.length; x++) {
			urls.push(publicDataLoc + '/' + dataList[i] + '/' + images[x]);
		}
	}
	
	console.log('Finished loading data list (' + urls.length + ' images loaded).');
	console.log('Server now online.');

    //urls = JSON.parse(fs.readFileSync(config.relayDataLocation + '/data.json'));
});

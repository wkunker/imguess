/*
 * A fork of imgrelay customized for imguess.
 */

var restify = require('restify');
var request = require('request');
var $ = require('jquery');
var exec = require('child_process').exec;
var fs = require('fs');
var execSync = require('execSync');

var urls = [];
var accessHeaders = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '127.0.0.1'};
var autourl_running = 0;
var max_scrapes = 500;
var log_verbose = false;

var dataStoreFile = 'data_' + Date.now() + '.json';
var dataStoreDir = 'data_' + Date.now();

// Normal log message.
// If nobreak true -- write msg without line break.
var log = function(msg, nobreak) {
	if(nobreak) {
		process.stdout.write(msg)
	} else {
		console.log(msg)
	}
}

// Log message only if verbose mode enabled.
// If nobreak true -- write msg without line break.
var logVerbose = function(msg, nobreak) {
	if(log_verbose) {
		log(msg, nobreak)
	}
}

var autoUrl = function() {
    if(urls.length < max_scrapes) {
        logVerbose('urls length: ' + urls.length);
        autourl_running++;
        genUrl(function(result, error) {
            if(error === undefined) {
				result = result.replace(/\(/g, '%28').replace(/\)/g, '%29');
				
				var wgetSpiderOutput = execSync.exec('wget ' + result + ' -nc --random-wait --spider --server-response -O - 2>&1 | sed -ne "/Content-Length/{s/.*: //;p}"');
				
				try {
					if(wgetSpiderOutput !== undefined && wgetSpiderOutput !== '' && parseInt(wgetSpiderOutput.stdout) > 20000) {
						log('Pushing result to urls <' + result + '>... ', true);
						urls.push(result);
						log('OK');
						
						// Download image to the generated data directory
						var wgetOutput = execSync.exec('wget -P ' + dataStoreDir + ' ' + result);
						logVerbose('wgetOutput: ' + wgetOutput.stdout);
                        var r = result.split('/');
                        var convertOutput = execSync.exec('convert ' + dataStoreDir + '/' + r[r.length-1].replace(/%20/g, ' ') + ' -resize 420x420 ' + dataStoreDir + '/' + r[r.length-1].replace(/%20/g, ' '));
                        console.log(convertOutput.stdout);
					} else {
						log('Problem when probing image size -- image file size is too small.');
					}
				} catch(e) {
					log('Exception thrown while trying to crawl image - most likely cause is that the image can\'t be downloaded. Exception details: "' + e.message + '"');
				}
            } else {
                log('Scrape error: ' + error);
            }

            setTimeout(function() {
                autoUrl();
            }, 2000);
        });
    } else {
        // 5000 URLs have been scraped - Store the data in a file and stop for now.
        //fs.writeFileSync(dataStoreFile, JSON.stringify(urls));
        log('Attempting SCP to cloud... ')
        var scpOutput = execSync.exec('scp -r ' + dataStoreDir + ' awshost1:imguess/public/data');
        log('SCP output: ' + scpOutput);

        server.close();
        process.exit(0)
    }
}

function genUrl(callback) {
    exec('./randsense.py', function (err, stdout, stderr) {
		if(err) {log('Problem loading randsense.py... Terminating program.'); server.close(); process.exit(1)}
        var keyword = stdout.split('10: ')[1].replace(/ /g, '%20');

        logVerbose('stage keyword... ' + keyword);

        request('http://www.google.com/search?tbm=isch&hl=en&source=hp&biw=&bih=&q=' + keyword + '&btnG=Search+Images&gbv=1', function (error, response, body) {
            logVerbose('stage first_url... ' + response.statusCode.toString());

            if (!error && response.statusCode == 200) {
                var first_url = $(body).find('.images_table').find('a').attr('href');
                first_url = 'http://google.com' + first_url;

                request(first_url, function (err, rs, bd) {
                    logVerbose('stage second_url... ' + rs.statusCode.toString());

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

server.listen(8082, function() {
    console.log('%s listening at %s', server.name, server.url);
    
    var mkdirOutput = execSync.exec('mkdir ' + dataStoreDir);
    logVerbose('mkdirOutput: "' + mkdirOutput.stdout + '"');

    for(var i = 0; i < 1; i++) {
        autoUrl();
    }
});

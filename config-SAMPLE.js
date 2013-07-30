/*
 * Configuration script to define environment-specific properties/settings.
 */

var baseUrl = "127.0.0.1";
var relayDataLocation = "/home/denny/imguess/server/scraper";
var publicData = "/home/denny/imguess/public/data";

if(exports === undefined) {
    $('#baseUrl').html(baseUrl);
} else {
    exports.baseUrl = baseUrl;
    exports.relayDataLocation = relayDataLocation;
    exports.publicData = publicData
}


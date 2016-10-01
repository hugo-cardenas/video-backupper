
var google = require('googleapis');
var createProvider = require('./provider');
var jsonFile = require('jsonfile');

if (process.argv.length !== 4) {
    var message = 'Invalid number of arguments' + '\n'
        + 'usage: node cli.js <path-to-key-file> <playlist-id>' + '\n';
    console.log(message);
    return;
}

var key = jsonFile.readFileSync(process.argv[2]);
var playlistId = process.argv[3];

var provider = createProvider(google, key);

provider.getVideoItems(playlistId)
    .then(function (videoItems) {
        console.log(videoItems);
    });
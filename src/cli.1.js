var locator = require('./locator');

if (process.argv.length !== 4) {
    var message = 'Invalid number of arguments' + '\n'
        + 'usage: node cli.js <path-to-key-file> <playlist-id>' + '\n';
    console.log(message);
    return;
}

var backupper = locator.getBackupper();
backupper.run();

var playlistId = process.argv[3];

var provider = createProvider(google, key);

provider.getVideoItems(playlistId)
    .then(function (videoItems) {
        console.log(videoItems);
    });
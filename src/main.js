
var google = require('googleapis');
var key = require('./key.json');

var provider = require('./provider')(google, key);

var playlistId = 'PLAl0c_ZcA-yzMm1Qfh3Tfz3ChCtkhjyfl';

provider.getVideoItems(playlistId)
    .then(function (videoItems) {
        console.log(videoItems.length);
    });
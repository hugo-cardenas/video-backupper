var fs = require('fs');
var ytdl = require('ytdl-core');

function fetchVideo(id){
    var url = 'https://www.youtube.com/watch?v=' + id; 

    ytdl(url).pipe(fs.createWriteStream(id + '.flv'));
}
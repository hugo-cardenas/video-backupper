var fs = require('fs');
var aws = require('aws-sdk');
var ytdl = require('ytdl-core');
var s3 = new aws.S3();
var createStorage = require('./storage');
var bucket = 'video-backupper';
var storage = createStorage(s3, bucket);

var id = 'lI1Hn1yLTiU';
var url = 'https://www.youtube.com/watch?v=' + id; 
var stream = ytdl(url);

storage.save(stream, 'myvideo.flv')
  .then(function(){
    console.log('success');
  })
  .catch(function(err){
    console.log(err);
  });

return;

var params = {Bucket: bucket, Key: 'foobar.txt', Body: 'Foo bar'};
s3.upload(params, function(err, data) {
  //console.log(err, data);
});

s3.listObjects({Bucket: bucket}, function(err, data){
    console.log(err, data);
});

return;



var storage = require('./storage')(s3, bucket);

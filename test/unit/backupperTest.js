var test = require('blue-tape');
var createBackupper = require('./../../src/backupper');

test('run succeeds', function (t) {
    var playlistId = 'myPlaylist42';
    var bucket = 'myBucket';

    var videoId1 = 'foo42';
    var videoId2 = 'bar44';
    var videoItems = [
        { title: 'foo', resourceId: { kind: 'youtube#video', videoId: videoId1 } }
        /*{ title: 'bar', resourceId: { kind: 'youtube#video', videoId: videoId2 } }*/
    ];

    var stream1 = 'myStream42';
    var stream2 = 'myStream44';

    var provider = {
        getVideoItems: function (id) {
            t.equal(id, playlistId);
            return Promise.resolve(videoItems);
        }
    };

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';
    var expectedVideoUrl1 = baseVideoUrl + videoId1;
    var expectedVideoUrl1 = baseVideoUrl + videoId2;

    var ytdl = function (videoUrl) {
        t.equal(videoUrl, expectedVideoUrl1);
        return stream1;
    };

    var storage = {
        save: function (stream, name) {
            t.equal(stream, stream1);
            t.equal(stream, videoId1);
            return Promise.resolve();
        }
    };

    var config = {
        playlistId: playlistId,
        bucket: bucket  
    };

    var backupper = createBackupper(provider, ytdl, storage, config);
    return backupper.run()
        .then(function () {
            return Promise.resolve();
        })
});

test('run provider fails', function (t) {
    var playlistId = 'myPlaylist42';
    var bucket = 'myBucket';

    var errorMessage = 'Provider has failed';
    var provider = {
        getVideoItems: function (id) {
            t.equal(id, playlistId);
            return Promise.reject(new Error(errorMessage));
        }
    };

    var ytdl = function (videoUrl) {
        t.fail('Should not get called');
    };

    var storage = {};
    var config = {
        playlistId: playlistId,
        bucket: bucket
    }

    var backupper = createBackupper(provider, ytdl, storage, config);
    backupper.run()
    .catch(function(err){
        t.equal(err.message, errorMessage);
        return Promise.resolve();
    });
});

test('run ytdl fails, skips video', function (t) {
    var playlistId = 'myPlaylist42';
    var bucket = 'myBucket';

    var videoId1 = 'foo42';
    var videoId2 = 'bar44';
    var videoId3 = 'baz46';
    var videoItems = [
        { title: 'foo', resourceId: { kind: 'youtube#video', videoId: videoId1 } },
        { title: 'bar', resourceId: { kind: 'youtube#video', videoId: videoId2 } },
        { title: 'baz', resourceId: { kind: 'youtube#video', videoId: videoId3 } },
    ];

    var stream1 = 'myStream42';
    var stream2 = 'myStream44';
    var stream2 = 'myStream46';

    // TODO
    
    var provider = {
        getVideoItems: function (id) {
            t.equal(id, playlistId);
            return Promise.resolve(videoItems);
        }
    };

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';
    var expectedVideoUrl1 = baseVideoUrl + videoId1;
    var expectedVideoUrl1 = baseVideoUrl + videoId2;

    var errorMessage = 'ytdl has failed';
    var ytdl = function (videoUrl) {
        t.equal(videoUrl, expectedVideoUrl1);
        throw new Error(errorMessage);        
    };

    var storage = {};

    var config = {
        playlistId: playlistId,
        bucket: bucket  
    };

    var backupper = createBackupper(provider, ytdl, storage, config);
    return backupper.run()
        .then(function () {
            return Promise.resolve();
        })
});
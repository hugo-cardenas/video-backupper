var test = require('blue-tape');
var sinon = require('sinon');
var createBackupper = require('./../../src/backupper');

test('backupper - run - succeeds', function (t) {
    var playlistId = 'myPlaylist42';

    var videoId1 = 'foo42';
    var videoId2 = 'bar44';
    var videoItems = [
        { title: 'foo', resourceId: { kind: 'youtube#video', videoId: videoId1 } },
        { title: 'bar', resourceId: { kind: 'youtube#video', videoId: videoId2 } }
    ];

    var stream1 = 'myStream42';
    var stream2 = 'myStream44';

    var provider = {
        getVideoItems: sinon.stub()
            .withArgs(playlistId)
            .returns(Promise.resolve(videoItems))
    };

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';
    var expectedVideoUrl1 = baseVideoUrl + videoId1;
    var expectedVideoUrl2 = baseVideoUrl + videoId2;

    var ytdl = sinon.stub();
    ytdl.withArgs(expectedVideoUrl1).returns(stream1);
    ytdl.withArgs(expectedVideoUrl2).returns(stream2);

    var storage = { save: sinon.stub() };
    storage.save.withArgs(stream1, playlistId, videoId1).returns(Promise.resolve());
    storage.save.withArgs(stream2, playlistId, videoId2).returns(Promise.resolve());

    var backupper = createBackupper(provider, ytdl, storage);
    return backupper.run(playlistId)
        .then(function (errors) {
            t.ok(storage.save.calledWith(stream1, playlistId, videoId1));
            t.ok(storage.save.calledWith(stream2, playlistId, videoId2));

            t.deepEqual(errors, []);
            return Promise.resolve();
        });
});

test('backupper - run - provider fails', function (t) {
    var playlistId = 'myPlaylist42';

    var errorMessage = 'Provider has failed';
    var provider = {
        getVideoItems: function (id) {
            t.equal(id, playlistId);
            return Promise.reject(new Error(errorMessage));
        }
    };

    var ytdl = sinon.stub();

    var storage = {};

    var backupper = createBackupper(provider, ytdl, storage);
    return backupper.run(playlistId)
        .catch(function (err) {
            t.equal(err.message, errorMessage);
            t.notOk(ytdl.called);
            return Promise.resolve();
        });
});

test('backupper - run - ytdl fails, skips video', function (t) {
    var playlistId = 'myPlaylist42';

    var videoId1 = 'foo42';
    var videoId2 = 'bar44';
    var videoId3 = 'baz46';
    var videoItems = [
        { title: 'foo', resourceId: { kind: 'youtube#video', videoId: videoId1 } },
        { title: 'bar', resourceId: { kind: 'youtube#video', videoId: videoId2 } },
        { title: 'baz', resourceId: { kind: 'youtube#video', videoId: videoId3 } }
    ];

    var stream1 = 'myStream42';
    var stream2 = 'myStream44';
    var stream3 = 'myStream46';

    var provider = {
        getVideoItems: sinon.stub()
            .withArgs(playlistId)
            .returns(Promise.resolve(videoItems))
    };

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';
    var expectedVideoUrl1 = baseVideoUrl + videoId1;
    var expectedVideoUrl2 = baseVideoUrl + videoId2;
    var expectedVideoUrl3 = baseVideoUrl + videoId3;

    var errorMessage = 'ytdl has failed';
    var ytdl = sinon.stub();
    ytdl.withArgs(expectedVideoUrl1).returns(stream1);
    ytdl.withArgs(expectedVideoUrl2).throws(new Error(errorMessage));
    ytdl.withArgs(expectedVideoUrl3).returns(stream3);

    var storage = { save: sinon.stub() };
    storage.save.withArgs(stream1, playlistId, videoId1).returns(Promise.resolve());
    storage.save.withArgs(stream3, playlistId, videoId3).returns(Promise.resolve());

    var backupper = createBackupper(provider, ytdl, storage);
    return backupper.run(playlistId)
        .then(function (errors) {
            t.ok(storage.save.calledWith(stream1, playlistId, videoId1));
            t.ok(storage.save.neverCalledWith(stream2, playlistId, videoId2));
            t.ok(storage.save.calledWith(stream3, playlistId, videoId3));

            t.equal(errors.length, 1);
            t.ok(errors[0].message.includes(videoId2));
            t.ok(errors[0].message.includes(errorMessage));

            return Promise.resolve();
        });
});

test('backupper - run - storage fails, skips video', function (t) {
    var playlistId = 'myPlaylist42';

    var videoId1 = 'foo42';
    var videoId2 = 'bar44';
    var videoId3 = 'baz46';
    var videoItems = [
        { title: 'foo', resourceId: { kind: 'youtube#video', videoId: videoId1 } },
        { title: 'bar', resourceId: { kind: 'youtube#video', videoId: videoId2 } },
        { title: 'baz', resourceId: { kind: 'youtube#video', videoId: videoId3 } }
    ];

    var stream1 = 'myStream42';
    var stream2 = 'myStream44';
    var stream3 = 'myStream46';

    var provider = {
        getVideoItems: sinon.stub()
            .withArgs(playlistId)
            .returns(Promise.resolve(videoItems))
    };

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';
    var expectedVideoUrl1 = baseVideoUrl + videoId1;
    var expectedVideoUrl2 = baseVideoUrl + videoId2;
    var expectedVideoUrl3 = baseVideoUrl + videoId3;

    var ytdl = sinon.stub();
    ytdl.withArgs(expectedVideoUrl1).returns(stream1);
    ytdl.withArgs(expectedVideoUrl2).returns(stream2);
    ytdl.withArgs(expectedVideoUrl3).returns(stream3);

    var errorMessage = 'storage has failed';
    var storage = { save: sinon.stub() };
    storage.save.withArgs(stream1, playlistId, videoId1).returns(Promise.resolve());
    storage.save.withArgs(stream2, playlistId, videoId2).returns(Promise.reject(new Error(errorMessage)));
    storage.save.withArgs(stream3, playlistId, videoId3).returns(Promise.resolve());

    var backupper = createBackupper(provider, ytdl, storage);
    return backupper.run(playlistId)
        .then(function (errors) {
            t.ok(storage.save.calledWith(stream1, playlistId, videoId1));
            t.ok(storage.save.calledWith(stream2, playlistId, videoId2));
            t.ok(storage.save.calledWith(stream3, playlistId, videoId3));

            t.equal(errors.length, 1);
            t.ok(errors[0].message.includes(videoId2));
            t.ok(errors[0].message.includes(errorMessage), 'foobar');

            return Promise.resolve();
        });
});

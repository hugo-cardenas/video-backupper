var test = require('blue-tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createHandler = baserequire('src/queue/handler/handler');

test('handler - handle - succeeds', function (t) {
    var playlistId = 'playlist42';
    var videoId = 'foo42';
    var stream = 'myStream42';

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';
    var expectedVideoUrl = baseVideoUrl + videoId;

    var ytdl = sinon.stub()
        .withArgs(expectedVideoUrl)
        .returns(stream);

    var storage = { save: sinon.stub() };
    storage.save
        .withArgs(stream, playlistId, videoId)
        .returns(Promise.resolve());

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var job = {
        data: {
            videoId: videoId,
            playlistId: playlistId
        }
    };

    var handler = createHandler(ytdl, storage, displayOutput);
    return handler.handle(job)
        .then(function () {
            t.ok(storage.save.calledWith(stream, playlistId, videoId));
            t.ok(displayOutput.outputLine.calledWith(sinon.match(/Saved video foo42/)));
        });
});

var invalidJobs = [
    {},
    { foo: 123 },
    { data: {} },
    { data: { playlistId: 42 } },
    { data: { videoId: 44 } }
];

invalidJobs.forEach(function (job, index) {
    test('handler - handle - invalid job #' + index, function (t) {
        var ytdl = sinon.stub();

        var storage = { save: sinon.stub() };
        var displayOutput = { outputLine: sinon.stub() };

        var handler = createHandler(ytdl, storage, displayOutput);
        return handler.handle(job)
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes(JSON.stringify(job)));
                t.ok(displayOutput.outputLine.calledWith(err.message));
            });
    });
});

test('handler - handle - ytdl fails', function (t) {
    var playlistId = 'playlist42';
    var videoId = 'foo42';

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';
    var expectedVideoUrl = baseVideoUrl + videoId;

    var errorMessage = 'Ytdl failed';
    var ytdl = sinon.stub()
        .withArgs(expectedVideoUrl)
        .throws(new Error(errorMessage));

    var storage = { save: sinon.stub() };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var job = {
        data: {
            videoId: videoId,
            playlistId: playlistId
        }
    };

    var handler = createHandler(ytdl, storage, displayOutput);
    return handler.handle(job)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(JSON.stringify(job)));
            t.ok(err.message.includes(errorMessage));
            t.ok(displayOutput.outputLine.calledWith(err.message));
        });
});

test('handler - handle - storage fails', function (t) {
    var playlistId = 'playlist42';
    var videoId = 'foo42';
    var stream = 'myStream42';

    var baseVideoUrl = 'https://www.youtube.com/watch?v=';
    var expectedVideoUrl = baseVideoUrl + videoId;

    var ytdl = sinon.stub()
        .withArgs(expectedVideoUrl)
        .returns(stream);

    var errorMessage = 'Storage failed';
    var storage = { save: sinon.stub() };
    storage.save
        .withArgs(stream, playlistId, videoId)
        .returns(Promise.reject(new Error(errorMessage)));

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var job = {
        data: {
            videoId: videoId,
            playlistId: playlistId
        }
    };

    var handler = createHandler(ytdl, storage, displayOutput);
    return handler.handle(job)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(JSON.stringify(job)));
            t.ok(err.message.includes(errorMessage));
            t.ok(displayOutput.outputLine.calledWith(err.message));
        });
});

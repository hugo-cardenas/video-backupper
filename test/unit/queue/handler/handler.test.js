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
        videoId: videoId,
        playlistId: playlistId
    };

    var handler = createHandler(ytdl, storage, displayOutput);
    return handler.handle(job)
        .then(function () {
            t.ok(storage.save.calledWith(stream, playlistId, videoId));
            t.ok(displayOutput.outputLine.calledWith(sinon.match(/Saved video foo42/)));
        });
});

test('handler - handle - invalid job', function (t) {

});

test('handler - handle - ytdl fails', function (t) {

});

test('handler - handle - storage fails', function (t) {

});

var test = require('blue-tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createHandler = baserequire('src/queue/handler/handler');

test('handler - handle - succeeds', function (t) {
    var id = 'foo42';
    var url = 'url42';

    var stream = 'myStream42';
    var videoItem = { id, url };

    var ytdl = sinon.stub();
    ytdl.withArgs(url).returns(stream);

    var storage = { save: sinon.stub() };
    storage.save
        .withArgs(stream, videoItem)
        .returns(Promise.resolve());

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var job = {
        data: videoItem
    };

    var handler = createHandler(ytdl, storage, displayOutput);
    return handler.handle(job)
        .then(function () {
            t.ok(storage.save.calledWith(stream, videoItem), `Should call storage with (${stream}, ${JSON.stringify(videoItem)})`);
            t.ok(displayOutput.outputLine.calledWith(sinon.match(/Saved video foo42/)));
        });
});

var invalidJobs = [
    {},
    { foo: 123 },
    { data: {} },
    { data: {id: 123} }, // Missing url
    { data: {url: 456} } // Missing id
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
                t.ok(err.message.includes('Missing properties'));
                t.ok(err.message.includes(JSON.stringify(job)));
            });
    });
});

test('handler - handle - ytdl fails', function (t) {
    var id = 'foo42';
    var url = 'url42';
    var videoItem = { id, url };

    var errorMessage = 'Ytdl failed';
    var ytdl = sinon.stub();
    ytdl.withArgs(url).throws(new Error(errorMessage));

    var storage = { save: sinon.stub() };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var job = {
        data: videoItem
    };

    var handler = createHandler(ytdl, storage, displayOutput);
    return handler.handle(job)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(JSON.stringify(job)));
            t.ok(err.message.includes(errorMessage));
        });
});

test('handler - handle - storage fails', function (t) {
    var id = 'foo42';
    var url = 'url42';

    var stream = 'myStream42';
    var videoItem = { id, url };

    var ytdl = sinon.stub();
    ytdl.withArgs(url).returns(stream);

    var errorMessage = 'Storage failed';
    var storage = { save: sinon.stub() };
    storage.save
        .withArgs(stream, videoItem)
        .returns(Promise.reject(new Error(errorMessage)));

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var job = {
        data: videoItem
    };

    var handler = createHandler(ytdl, storage, displayOutput);
    return handler.handle(job)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(JSON.stringify(job)));
            t.ok(err.message.includes(errorMessage));
        });
});

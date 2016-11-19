var test = require('blue-tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createBackupper = baserequire('src/backupper/queueBackupper');

test('queueBackupper - run - succeeds', function (t) {
    var playlistId = 'myPlaylist42';

    var videoItems = [
        { videoId: 'foo42' },
        { videoId: 'bar44' }
    ];

    var provider = {
        getVideoItems: sinon.stub()
            .withArgs(playlistId)
            .returns(Promise.resolve(videoItems))
    };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queueJob1 = { save: function () {} };
    var queueJob2 = { save: function () {} };

    var queueJob1Exp = sinon.mock(queueJob1).expects('save');
    var queueJob2Exp = sinon.mock(queueJob2).expects('save');

    var queue = {
        createJob: sinon.stub()
    };

    queue.createJob
        .withArgs(videoItems[0])
        .returns(queueJob1);
    queue.createJob
        .withArgs(videoItems[1])
        .returns(queueJob2);

    var backupper = createBackupper(provider, queue, displayOutput);
    return backupper.run(playlistId)
        .then(function () {
            queueJob1Exp.verify();
            queueJob2Exp.verify();
        });
});

test('queueBackupper - run - empty video list', function (t) {
    var playlistId = 'myPlaylist42';

    var videoItems = [];

    var provider = {
        getVideoItems: sinon.stub()
            .withArgs(playlistId)
            .returns(Promise.resolve(videoItems))
    };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queue = {
        createJob: sinon.stub()
    };

    var backupper = createBackupper(provider, queue, displayOutput);
    return backupper.run(playlistId)
        .then(function () {
            t.notOk(queue.createJob.called);
        });
});

test('queueBackupper - run - provider fails', function (t) {
    var playlistId = 'myPlaylist42';

    var errorMessage = 'Provider has failed';
    var provider = {
        getVideoItems: sinon.stub()
    };
    provider.getVideoItems
        .withArgs(playlistId)
        .returns(Promise.reject(new Error(errorMessage)));

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queue = {
        createJob: sinon.stub()
    };

    var backupper = createBackupper(provider, queue, displayOutput);
    return backupper.run(playlistId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(errorMessage));
            t.notOk(queue.createJob.called);
        });
});

test('queueBackupper - run - queue fails', function (t) {
    var playlistId = 'myPlaylist42';

    var videoItems = [
        { videoId: 'foo42' },
        { videoId: 'bar44' }
    ];

    var provider = {
        getVideoItems: sinon.stub()
            .withArgs(playlistId)
            .returns(Promise.resolve(videoItems))
    };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var errorMessage = 'Queue has failed';
    var queue = {
        createJob: sinon.stub()
    };
    queue.createJob
        .withArgs(videoItems[0])
        .throws(new Error(errorMessage));

    var backupper = createBackupper(provider, queue, displayOutput);
    return backupper.run(playlistId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(playlistId));
            t.ok(err.message.includes(errorMessage));
        });
});

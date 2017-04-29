var test = require('blue-tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createBackupper = baserequire('src/backupper/queueBackupper');

test('queueBackupper - backupPlaylist - succeeds', function (t) {
    var videoItems = [
        createProviderVideoItem('videoId1', 'videoName1', 'playlistName1', 'url1'),
        createProviderVideoItem('videoId2', 'videoName2', 'playlistName2', 'url2'),
        createProviderVideoItem('videoId3', 'videoName3', 'playlistName3', 'url3'),
        createProviderVideoItem('videoId4', 'videoName4', 'playlistName4', 'url4')
    ];

    var storedVideoItems = [
        // Should compare by playlist name + video id
        createVideoItem('videoId1', '', ''),
        createVideoItem('videoId2', '', 'playlistName2'), // Match
        createVideoItem('videoId3', '', 'foo'),
        createVideoItem('videoId4', '', 'playlistName4'), // Match
        createVideoItem('videoId10', '', ''),
        createVideoItem('videoId11', '', 'playlistName1')
    ];

    var storage = {
        getAllVideoItems: sinon.stub()
            .returns(Promise.resolve(storedVideoItems))
    };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queueJob1 = { save: sinon.stub() };
    var queueJob2 = { save: sinon.stub() };

    var queue = {
        createJob: sinon.stub()
    };

    queue.createJob
        .withArgs(videoItems[0])
        .returns(queueJob1);
    queue.createJob
        .withArgs(videoItems[2])
        .returns(queueJob2);

    var backupper = createBackupper(storage, queue, displayOutput);
    return backupper.backupVideos(videoItems)
        .then(function () {
            t.ok(queueJob1.save.calledOnce);
            t.ok(queueJob2.save.calledOnce);
        });
});

var videoItemsWithInvalidChars = [{
    original: createProviderVideoItem('videoIdIrrelevant', '/', '/', 'urlIrrelevant'),
    formatted: createProviderVideoItem('videoIdIrrelevant', '-', '-', 'urlIrrelevant')
}, {
    original: createProviderVideoItem('videoIdIrrelevant', '\\', '\\', 'urlIrrelevant'),
    formatted: createProviderVideoItem('videoIdIrrelevant', '-', '-', 'urlIrrelevant')
}, {
    original: createProviderVideoItem('videoIdIrrelevant', '/video//name///', '/playlist//name///', 'urlIrrelevant'),
    formatted: createProviderVideoItem('videoIdIrrelevant', '-video--name---', '-playlist--name---', 'urlIrrelevant')
}];

videoItemsWithInvalidChars.forEach(function (videos, index) {
    test('queueBackupper - backupPlaylist - formats videoName and playlistName, replacing invalid chars #' + index, function (t) {
        var originalVideoItem = videos.original;
        var formattedVideoItem = videos.formatted;

        var videoItems = [originalVideoItem];
        var storedVideoItems = [];

        var storage = {
            getAllVideoItems: sinon.stub()
                .returns(Promise.resolve(storedVideoItems))
        };

        var displayOutput = {
            outputLine: sinon.stub()
        };

        var queueJob1 = { save: sinon.stub() };

        var queue = {
            createJob: sinon.stub()
        };

        queue.createJob
            .withArgs(formattedVideoItem)
            .returns(queueJob1);

        var backupper = createBackupper(storage, queue, displayOutput);
        return backupper.backupVideos(videoItems)
            .then(function () {
                t.ok(queueJob1.save.calledOnce);
            });
    });
});

videoItemsWithInvalidChars.forEach(function (videos, index) {
    test('queueBackupper - backupPlaylist - formats videoName and playlistName before filtering stored videos #' + index, function (t) {
        var originalVideoItem = videos.original;
        var formattedVideoItem = videos.formatted;

        var videoItems = [
            originalVideoItem,
            createProviderVideoItem('videoId1', 'videoName1', 'playlistName1', 'url1') // Other random video to be stored
        ];
        var storedVideoItems = [
            formattedVideoItem
        ];

        var storage = {
            getAllVideoItems: sinon.stub()
                .returns(Promise.resolve(storedVideoItems))
        };

        var displayOutput = {
            outputLine: sinon.stub()
        };

        var queueJob1 = { save: sinon.stub() };

        var queue = {
            createJob: sinon.stub()
        };

        queue.createJob
            .withArgs(videoItems[1]) // Called only with 2nd video item, 1st is filtered
            .returns(queueJob1);

        var backupper = createBackupper(storage, queue, displayOutput);
        return backupper.backupVideos(videoItems)
            .then(function () {
                t.ok(queueJob1.save.calledOnce);
            });
    });
});

test('queueBackupper - backupPlaylist - succeeds, no stored items', function (t) {
    var videoItems = [
        createProviderVideoItem('videoId1', 'videoName1', 'playlistName1', 'url1'),
        createProviderVideoItem('videoId2', 'videoName2', 'playlistName2', 'url2')
    ];
    var storedVideoItems = [];

    var storage = {
        getAllVideoItems: sinon.stub()
            .returns(Promise.resolve(storedVideoItems))
    };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queueJob1 = { save: sinon.stub() };
    var queueJob2 = { save: sinon.stub() };

    var queue = {
        createJob: sinon.stub()
    };

    queue.createJob
        .withArgs(videoItems[0])
        .returns(queueJob1);
    queue.createJob
        .withArgs(videoItems[1])
        .returns(queueJob2);

    var backupper = createBackupper(storage, queue, displayOutput);
    return backupper.backupVideos(videoItems)
        .then(function () {
            t.ok(queueJob1.save.calledOnce);
            t.ok(queueJob2.save.calledOnce);
        });
});

test('queueBackupper - backupPlaylist - succeeds, no filtered items', function (t) {
    var videoItems = [
        createProviderVideoItem('videoId1', 'videoName1', 'playlistName1', 'url1'),
        createProviderVideoItem('videoId2', 'videoName2', 'playlistName2', 'url2')
    ];

    var storedVideoItems = [
        createVideoItem('videoId3', '', 'playlistName2')
    ];

    var storage = {
        getAllVideoItems: sinon.stub()
            .returns(Promise.resolve(storedVideoItems))
    };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queueJob1 = { save: sinon.stub() };
    var queueJob2 = { save: sinon.stub() };

    var queue = {
        createJob: sinon.stub()
    };

    queue.createJob
        .withArgs(videoItems[0])
        .returns(queueJob1);
    queue.createJob
        .withArgs(videoItems[1])
        .returns(queueJob2);

    var backupper = createBackupper(storage, queue, displayOutput);
    return backupper.backupVideos(videoItems)
        .then(function () {
            t.ok(queueJob1.save.calledOnce);
            t.ok(queueJob2.save.calledOnce);
        });
});

test('queueBackupper - backupPlaylist - succeeds, all items filtered', function (t) {
    var videoItems = [
        createProviderVideoItem('videoId1', 'videoName1', 'playlistName1', 'url1'),
        createProviderVideoItem('videoId2', 'videoName2', 'playlistName2', 'url2')
    ];
    var storedVideoItems = [
        createVideoItem('videoId1', '', 'playlistName1'),
        createVideoItem('videoId2', '', 'playlistName2'),
        createVideoItem('videoId3', '', 'playlistName3')
    ];

    var storage = {
        getAllVideoItems: sinon.stub()
            .returns(Promise.resolve(storedVideoItems))
    };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queue = {
        createJob: sinon.stub()
    };

    var backupper = createBackupper(storage, queue, displayOutput);
    return backupper.backupVideos(videoItems)
        .then(function () {
            t.notOk(queue.createJob.called);
        });
});

test('queueBackupper - backupPlaylist - empty video list', function (t) {
    var videoItems = [];

    var storage = {};

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queue = {
        createJob: sinon.stub()
    };

    var backupper = createBackupper(storage, queue, displayOutput);
    return backupper.backupVideos(videoItems)
        .then(function () {
            t.notOk(queue.createJob.called);
        });
});

var invalidVideoItems = [
    {},
    {
        // id: 'id',
        name: 'name',
        playlistName: 'playlistName',
        url: 'url'
    },
    {
        id: 'id',
        // name: 'name',
        playlistName: 'playlistName',
        url: 'url'
    },
    {
        id: 'id',
        name: 'name',
        // playlistName: 'playlistName',
        url: 'url'
    },
    {
        id: 'id',
        name: 'name',
        playlistName: 'playlistName'
        // url: 'url'
    }
];

invalidVideoItems.forEach(function (video, index) {
    test('queueBackupper - backupPlaylist - validates video items #' + index, function (t) {
        var videoItems = [
            createProviderVideoItem('videoId1', 'videoName1', 'playlistName1', 'url1'),
            video // 2nd video is invalid
        ];

        var storage = {};

        var displayOutput = {
            outputLine: sinon.stub()
        };

        var queue = {
            createJob: sinon.stub()
        };

        var backupper = createBackupper(storage, queue, displayOutput);
        return backupper.backupVideos(videoItems)
            .then(function () {
                t.fail();
            })
            .catch(function (err) {
                t.ok(err.message.includes(videoItems.length + ' videos'));
                t.ok(err.message.includes('Invalid video'));
                t.ok(err.message.includes(JSON.stringify(video)));
                t.notOk(queue.createJob.called);
            });
    });
});


test('queueBackupper - backupPlaylist - storage fails', function (t) {
    var videoItems = [
        createProviderVideoItem('videoId1', 'videoName1', 'playlistName1', 'url1'),
        createProviderVideoItem('videoId2', 'videoName2', 'playlistName2', 'url2')
    ];

    var errorMessage = 'Storage has failed';
    var storage = {
        getAllVideoItems: sinon.stub()
            .returns(Promise.reject(new Error(errorMessage)))
    };

    var displayOutput = {
        outputLine: sinon.stub()
    };

    var queue = {
        createJob: sinon.stub()
    };

    var backupper = createBackupper(storage, queue, displayOutput);
    return backupper.backupVideos(videoItems)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(videoItems.length + ' videos'));
            t.ok(err.message.includes(errorMessage));
            t.notOk(queue.createJob.called);
        });
});

test('queueBackupper - backupPlaylist - queue fails', function (t) {
    var videoItems = [
        createProviderVideoItem('videoId1', 'videoName1', 'playlistName1', 'url1')
    ];

    var storedVideoItems = [];

    var storage = {
        getAllVideoItems: sinon.stub()
            .returns(Promise.resolve(storedVideoItems))
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

    var backupper = createBackupper(storage, queue, displayOutput);
    return backupper.backupVideos(videoItems)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(videoItems.length + ' videos'));
            t.ok(err.message.includes(errorMessage));
        });
});

/**
 * @param {string} id
 * @param {string} name
 * @param {string} playlistName
 * @param {string} url
 * @returns {Object}
 */
function createProviderVideoItem(id, name, playlistName, url) {
    return { id, name, playlistName, url };
}

/**
 * @param {string} id
 * @param {string} name
 * @param {string} playlistName
 * @returns {Object}
 */
function createVideoItem(id, name, playlistName) {
    return { id, name, playlistName };
}

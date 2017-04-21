const test = require('blue-tape');
const sinon = require('sinon');
const baserequire = require('base-require');
const createBackupper = baserequire('src/backupper/backupper');

test('backupper - backupPlaylist - succeeds', function (t) {
    const playlistId = 'playlistId';
    const videos = [
        { id: 'id1' },
        { id: 'id2' }
    ];
    const provider = {
        getPlaylistVideoItems: sinon.stub()
    };
    const queueBackupper = {
        backupVideos: sinon.stub()
    };

    provider.getPlaylistVideoItems
        .withArgs(playlistId)
        .returns(Promise.resolve(videos));
    queueBackupper.backupVideos
        .returns(Promise.resolve());

    const backupper = createBackupper(provider, queueBackupper);
    return backupper.backupPlaylist(playlistId)
        .then(function () {
            t.ok(queueBackupper.backupVideos.calledWith(videos));
        });
});

test('backupper - backupPlaylist - provider fails', function (t) {
    const playlistId = 'playlistId';
    const provider = {
        getPlaylistVideoItems: sinon.stub()
    };
    const queueBackupper = {};

    const errorMessage = 'Provider failed';
    provider.getPlaylistVideoItems
        .withArgs(playlistId)
        .returns(Promise.reject(new Error(errorMessage)));

    const backupper = createBackupper(provider, queueBackupper);
    return backupper.backupPlaylist(playlistId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(`Failed to backup playlist ${playlistId}`));
            t.ok(err.message.includes(errorMessage));
        });
});

test('backupper - backupPlaylist - queue backupper fails', function (t) {
    const playlistId = 'playlistId';
    const videos = [
        { id: 'id1' },
        { id: 'id2' }
    ];
    const provider = {
        getPlaylistVideoItems: sinon.stub()
    };
    const queueBackupper = {
        backupVideos: sinon.stub()
    };

    const errorMessage = 'Queue backupper failed';
    provider.getPlaylistVideoItems
        .withArgs(playlistId)
        .returns(Promise.resolve(videos));
    queueBackupper.backupVideos
        .withArgs(videos)
        .returns(Promise.reject(new Error(errorMessage)));

    const backupper = createBackupper(provider, queueBackupper);
    return backupper.backupPlaylist(playlistId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(`Failed to backup playlist ${playlistId}`));
            t.ok(err.message.includes(errorMessage));
        });
});

test('backupper - backupChannel - succeeds', function (t) {
    const channelId = 'playlistId';
    const videos = [
        { id: 'id1' },
        { id: 'id2' }
    ];
    const provider = {
        getChannelVideoItems: sinon.stub()
    };
    const queueBackupper = {
        backupVideos: sinon.stub()
    };

    provider.getChannelVideoItems
        .withArgs(channelId)
        .returns(Promise.resolve(videos));
    queueBackupper.backupVideos
        .returns(Promise.resolve());

    const backupper = createBackupper(provider, queueBackupper);
    return backupper.backupChannel(channelId)
        .then(function () {
            t.ok(queueBackupper.backupVideos.calledWith(videos));
        });
});

test('backupper - backupChannel - provider fails', function (t) {
    const channelId = 'ChannelId';
    const provider = {
        getChannelVideoItems: sinon.stub()
    };
    const queueBackupper = {};

    const errorMessage = 'Provider failed';
    provider.getChannelVideoItems
        .withArgs(channelId)
        .returns(Promise.reject(new Error(errorMessage)));

    const backupper = createBackupper(provider, queueBackupper);
    return backupper.backupChannel(channelId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(`Failed to backup channel ${channelId}`));
            t.ok(err.message.includes(errorMessage));
        });
});

test('backupper - backupChannel - queue backupper fails', function (t) {
    const channelId = 'channelId';
    const videos = [
        { id: 'id1' },
        { id: 'id2' }
    ];
    const provider = {
        getChannelVideoItems: sinon.stub()
    };
    const queueBackupper = {
        backupVideos: sinon.stub()
    };

    const errorMessage = 'Queue backupper failed';
    provider.getChannelVideoItems
        .withArgs(channelId)
        .returns(Promise.resolve(videos));
    queueBackupper.backupVideos
        .withArgs(videos)
        .returns(Promise.reject(new Error(errorMessage)));

    const backupper = createBackupper(provider, queueBackupper);
    return backupper.backupChannel(channelId)
        .then(function () {
            t.fail();
        })
        .catch(function (err) {
            t.ok(err.message.includes(`Failed to backup channel ${channelId}`));
            t.ok(err.message.includes(errorMessage));
        });
});

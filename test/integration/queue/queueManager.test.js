var test = require('tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var baseTest = baserequire('test/integration/baseTest');
var createQueueManager = baserequire('src/queue/queueManager');
var configLocator = baserequire('src/config/configLocator');

var options = {
    skip: !baseTest.isIntegrationTestEnabled()
};

/**
 * This is partially an integration test only due to the Queue object,
 * which connects to Redis on creation
 */

test('queueManager - getWorker - succeeds', options, function (t) {
    var config = {
        get: sinon.stub()
    };
    config.get
        .withArgs('queue')
        .returns(getConfigValue('queue'));

    var ytdl = { name: 'ytdl' };
    var storage = {};

    var displayOutput = { name: 'displayOutput' };

    var queueManager = createQueueManager(config, ytdl, storage, displayOutput);
    var worker = queueManager.getWorker();

    t.ok(worker.hasOwnProperty('run'));
    t.ok(config.get.calledWith('queue'));

    // Need to close the queue
    queueManager.getQueue().close();
    t.end();
});

test('queueManager - getWorker - missing config', options, function (t) {
    var config = {
        get: sinon.stub()
    };
    var errorMessage = 'Missing config key';
    config.get
        .withArgs('queue')
        .throws(new Error(errorMessage));

    var ytdl = { name: 'ytdl' };
    var storage = {};

    var displayOutput = { name: 'displayOutput' };

    var queueManager = createQueueManager(config, ytdl, storage, displayOutput);
    try {
        queueManager.getWorker();
        t.fail();
    } catch (err) {
        t.ok(err.message.includes('Unable to create queue worker'));
        t.ok(err.message.includes(errorMessage));
        t.end();
    }
});

test('queueManager - getQueue - succeeds', options, function (t) {
    var config = {
        get: sinon.stub()
    };
    config.get
        .withArgs('queue')
        .returns(getConfigValue('queue'));

    var ytdl = { name: 'ytdl' };

    var storageManager = {
        getStorage: sinon.stub()
    };

    var displayOutput = { name: 'displayOutput' };

    var queueManager = createQueueManager(config, ytdl, storageManager, displayOutput);
    var queue = queueManager.getQueue();
    t.equal(queue.name, 'video-backupper');
    // Need to close the queue
    queueManager.getQueue().close();
    t.end();
});

test('queueManager - getQueue - missing config', options, function (t) {
    var config = {
        get: sinon.stub()
    };
    var errorMessage = 'Invalid config key';
    config.get
        .withArgs('queue')
        .throws(new Error(errorMessage));

    var ytdl = { name: 'ytdl' };

    var storageManager = {
        getStorage: sinon.stub()
    };

    var displayOutput = { name: 'displayOutput' };

    var queueManager = createQueueManager(config, ytdl, storageManager, displayOutput);
    try {
        queueManager.getQueue();
        t.fail();
    } catch (err) {
        t.ok(err.message.includes('Unable to create queue'));
        t.ok(err.message.includes(errorMessage));
        t.end();
    }
});

/**
 * @param {string} key
 * @returns {number|string|boolean|Object}
 */
function getConfigValue(key) {
    return configLocator.getConfigManager().getConfig().get(key);
}

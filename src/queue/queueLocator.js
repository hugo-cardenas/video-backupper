var Queue = require('bee-queue');
var baserequire = require('base-require');
var configLocator = baserequire('src/config/configLocator');
var storageLocator = baserequire('src/storage/storageLocator');
var createDisplayOutput = baserequire('src/output/displayOutput');
var createWorker = baserequire('src/queue/worker/worker');
var createHandler = baserequire('src/queue/handler/handler');

var _ytdl;
var _displayOutput;
var _queue;
var _handler;
var _worker;

// TODO Move this to QueueManager
var CONFIG_BACKUPPER_STORAGE = 'backupper.storage';

/**
 * @returns {Object} Ytdl library method
 */
function getYtdl() {
    if (!_ytdl) {
        _ytdl = require('ytdl-core');
    }
    return _ytdl;
}

/**
 * @returns {Storage}
 */
function getStorage() {
    return storageLocator.getStorageManager().getStorage(
        // TODO Move to QueueManager
        getConfig().get(CONFIG_BACKUPPER_STORAGE)
    );
}

/**
 * @returns {Config}
 */
function getConfig() {
    return configLocator.getConfigManager().getConfig();
}

/**
 * @returns {DisplayOutput}
 */
function getDisplayOutput() {
    if (!_displayOutput) {
        _displayOutput = createDisplayOutput();
    }
    return _displayOutput;
}

/**
 * @param {DisplayOutput} displayOutput
 */
function setDisplayOutput(displayOutput) {
    _displayOutput = displayOutput;
}

function getHandler() {
    if (!_handler) {
        _handler = createHandler(getYtdl(), getStorage(), getDisplayOutput());
    }
    return _handler;
}

// TODO Move this to QueueManager and fetch Redis config from Config - setup dev and testing Redises
function getQueue() {
    if (!_queue) {
        _queue = new Queue('video-backupper');
    }
    return _queue;
}

function getWorker() {
    if (!_worker) {
        _worker = createWorker(getQueue(), getHandler(), getDisplayOutput());
    }
    return _worker;
}

module.exports = {
    getQueue: getQueue,
    getWorker: getWorker
};

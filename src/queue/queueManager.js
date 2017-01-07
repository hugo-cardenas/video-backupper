var VError = require('verror');
var Queue = require('bee-queue');
var baserequire = require('base-require');
var createHandler = baserequire('src/queue/handler/handler');
var createWorker = baserequire('src/queue/worker/worker');

module.exports = function (config, ytdl, storage, displayOutput) {
    const CONFIG_QUEUE = 'queue';
    const QUEUE_BACKUPPER = 'video-backupper';

    var queue;
    var worker;

    /**
     * @returns {Queue}
     */
    function getQueue() {
        if (!queue) {
            queue = _createQueue();
        }
        return queue;
    }

    function getWorker() {
        if (!worker) {
            worker = _createWorker();
        }
        return worker;
    }

    /**
     * @returns {Queue}
     */
    function _createQueue() {
        try {
            return new Queue(QUEUE_BACKUPPER, config.get(CONFIG_QUEUE));
        } catch (err) {
            throw createQueueError(err);
        }
    }

    /**
     * @returns {Object}
     */
    function _createWorker() {
        try {
            return createWorker(getQueue(), _createHandler(), displayOutput);
        } catch (err) {
            throw createWorkerError(err);
        }
    }

    /**
     * @returns {Object}
     */
    function _createHandler() {
        return createHandler(ytdl, storage, displayOutput);
    }

    /**
     * @param {Error} err
     * @returns {Error}
     */
    function createWorkerError(err) {
        return new VError(err, 'Unable to create queue worker');
    }

    /**
     * @param {Error} err
     * @returns {Error}
     */
    function createQueueError(err) {
        return new VError(err, 'Unable to create queue');
    }

    return {
        getQueue: getQueue,
        getWorker: getWorker
    };
};

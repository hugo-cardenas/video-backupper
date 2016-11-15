module.exports = function (queue, handler, displayOutput) {
    function run() {
        queue.process(processJob);
        /* TODO Why on('ready') does not trigger in test
        queue.on('ready', function () {
            queue.process(processJob);
        });
        */
    }

    /**
     * @param {Object} job
     * @param {function} done
     */
    function processJob(job, done) {
        outputLine('Processing job ' + job.id + ' ' + JSON.stringify(job.data));
        handler.handle(job)
            .then(function () {
                outputLine('Finished processing job ' + job.id + '\n');
                done();
            })
            .catch(function (err) {
                outputLine('Error processing job ' + job.id + ': ' + err.message + '\n');
                done(err);
            });
    }

    /**
     * @param {string} line
     */
    function outputLine(line) {
        displayOutput.outputLine(line);
    }

    return {
        run: run
    };
};

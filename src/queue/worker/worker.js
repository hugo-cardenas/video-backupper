module.exports = function (queue, handler, displayOutput, options) {
    function run() {
        while (true) {
            queue.process(processJob);
            // Sleep
            // TODO Test
        }
    }

    function processJob(job, done) {
        displayOutput.outputLine('Processing job ' + job.id);
        handler.handle(job)
            .then(function () {
                done();
            })
            .catch(function (err) {
                done(err);
            });
    }

    return {
        run: run
    };
};

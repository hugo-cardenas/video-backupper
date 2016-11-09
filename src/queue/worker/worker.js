module.exports = function (queue, handler, displayOutput) {
    function run() {
        console.log('Running');
        queue.process(processJob);
        /* TODO Why on('ready') does not trigger in test
        queue.on('ready', function () {
            console.log('READY');
            queue.process(processJob);
        });
        */
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

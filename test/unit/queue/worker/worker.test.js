var test = require('tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createWorker = baserequire('src/queue/worker/worker');

test.skip('worker - run - success', function (t) {
    var handler = {
        handle: sinon.stub()
    };
    var displayOutput = {
        outputInfo: sinon.stub()
    };
    var options = {
        maxJobs: 3
    };

    var worker = createWorker(queue, handler, displayOutput, options);
    worker.run();
});

test.skip('worker - run - fail handling one job', function (t) {

});

test.skip('worker - run - fail handling all jobs', function (t) {

});

test.skip('worker - run - queue fails', function (t) {

});

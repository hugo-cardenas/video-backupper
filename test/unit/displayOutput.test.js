var test = require('blue-tape');
var sinon = require('sinon');
var createDisplayOutput = require('./../../src/displayOutput');

test('displayOutput - outputLine - succeeds', function (t) {
    var stub = sinon.stub(console, 'log');
    var message = 'foo bar';

    var displayOutput = createDisplayOutput();
    displayOutput.outputLine(message);
    // Important to restore console.log before asserting anything, because assertion will print
    console.log.restore();

    t.ok(stub.calledWith(message));
    t.end();
});

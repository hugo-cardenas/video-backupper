var test = require('blue-tape');
var sinon = require('sinon');
var locator = require('./../../src/locator');

test('backupper - run - succeeds', function (t) {
    var backupper = locator.getBackupper();
    return backupper.run('foobar')
        .then(function(data){
            console.log(data);
            return Promise.resolve();
        })
        .catch(function(err){
            console.log(err);
            return Promise.reject(err);
        });
});
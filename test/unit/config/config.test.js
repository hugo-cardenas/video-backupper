var test = require('tape');
var baserequire = require('base-require');
var createConfig = baserequire('src/config/config');

test('config - get - succeeds', function (t) {
    var configArray = {
        'foo': 123,
        'bar': {
            'baz': 456,
            'foobar': ['a', 'b']
        }
    };

    var config = createConfig(configArray);
    t.equal(config.get('foo'), 123);
    t.deepEqual(config.get('bar'), {
        'baz': 456,
        'foobar': ['a', 'b']
    });
    t.equal(config.get('bar.baz'), 456);
    t.deepEqual(config.get('bar.foobar'), ['a', 'b']);

    // Numeric arrays are also accessible by index
    t.equal(config.get('bar.foobar.0'), 'a');
    t.equal(config.get('bar.foobar.1'), 'b');

    // Empty key returns whole config
    t.deepEqual(config.get(''), configArray);
    t.end();
});

test('config - get - succeeds with a numeric config array', function (t) {
    var configArray = [
        'foo', 'bar'
    ];

    var config = createConfig(configArray);
    t.equal(config.get('0'), 'foo');
    t.equal(config.get('1'), 'bar');
    t.deepEqual(config.get(''), configArray);
    t.end();
});

var falsyValues = [
    false,
    0,
    [],
    '',
    null
];

falsyValues.forEach(function (falsyValue, index) {
    test('config - get - returns falsy values #' + index, function (t) {
        var configArray = {
            'foo': {
                'bar': falsyValue
            }
        };

        var config = createConfig(configArray);
        t.equal(config.get('foo.bar'), falsyValue);
        t.end();
    });
});

var data = [
    'invalidConfigKey',
    'foobar',
    'foo.bar.baz.foobar',
    'foo.',
    'baz'
];

data.forEach(function (invalidKey, index) {
    test('config - get - not found #' + index, function (t) {
        var configArray = {
            'foo': 123,
            'bar': {
                'baz': 456
            }
        };

        var config = createConfig(configArray);
        try {
            config.get(invalidKey);
            t.fail('Should throw invalid key error');
        } catch (err) {
            t.ok(err.message.includes('key not found'));
            t.ok(err.message.includes(invalidKey));
            t.end();
        }
    });
});

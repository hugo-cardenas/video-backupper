var path = require('path');
var test = require('blue-tape');
var baserequire = require('base-require');
var createConfigManager = baserequire('src/config/configManager');

test('configManager - getConfig - succeeds', function (t) {
    process.env.VIDEOBACKUPPER_CONFIG = path.join(__dirname, 'test.config.json');

    var expectedConfig = {
        'foo': [42, 44, 46],
        'bar': {
            'baz': 48
        }
    };

    var configManager = createConfigManager();
    t.deepEqual(configManager.getConfig(), expectedConfig);

    delete process.env.VIDEOBACKUPPER_CONFIG;
    t.end();
});

test('configManager - getConfig - env var not set', function (t) {
    var configManager = createConfigManager();
    try {
        configManager.getConfig();
    } catch (e) {
        t.ok(e.message.includes('VIDEOBACKUPPER_CONFIG'));
        t.end();
    }
});

test('configManager - getConfig - file not found', function (t) {
    var invalidConfigPath = path.join(__dirname, 'not.found.config.json');
    process.env.VIDEOBACKUPPER_CONFIG = invalidConfigPath;

    var configManager = createConfigManager();
    try {
        configManager.getConfig();
        t.fail('Should throw error for file not found');
    } catch (e) {
        t.ok(e.message.includes('Unable to read config file'));
        t.ok(e.message.includes(invalidConfigPath));
        delete process.env.VIDEOBACKUPPER_CONFIG;
        t.end();
    }
});

test('configManager - getConfig - file is invalid json', function (t) {
    var configPath = path.join(__dirname, '/invalid.config.json');
    process.env.VIDEOBACKUPPER_CONFIG = configPath;

    var configManager = createConfigManager();
    try {
        configManager.getConfig();
        t.fail('Should throw error for invalid json');
    } catch (e) {
        console.log(e);
        t.ok(e.message.includes('Unable to read config file'));
        t.ok(e.message.includes(configPath));
        t.ok(e.message.includes('JSON input'));
        delete process.env.VIDEOBACKUPPER_CONFIG;
        t.end();
    }
});

var nonObjectJsonFiles = [
    'string.config.json'
];

nonObjectJsonFiles.forEach(function (fileName, index) {
    test('configManager - getConfig - json is not an object #' + index, function (t) {
        var configPath = path.join(__dirname, fileName);
        process.env.VIDEOBACKUPPER_CONFIG = configPath;

        var configManager = createConfigManager();
        try {
            configManager.getConfig();
            t.fail('Should throw error for non object json');
        } catch (e) {
            t.ok(e.message.includes(configPath));
            t.ok(e.message.includes('JSON is not an object'));
            delete process.env.VIDEOBACKUPPER_CONFIG;
            t.end();
        }
    });
});

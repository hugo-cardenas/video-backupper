var path = require('path');
var test = require('blue-tape');
var baserequire = require('base-require');
var createConfigManager = baserequire('src/config/configManager');

var _configEnv;

test('configManager - getConfig - succeeds', function (t) {
    setConfigEnv(path.join(__dirname, 'test.config.json'));

    var expectedConfig = {
        'foo': [42, 44, 46],
        'bar': {
            'baz': 48
        }
    };

    var configManager = createConfigManager();
    t.deepEqual(configManager.getConfig().get(''), expectedConfig);

    restoreConfigEnv();
    t.end();
});

test('configManager - getConfig - env var not set', function (t) {
    setConfigEnv(null);
    delete process.env.VIDEOBACKUPPER_CONFIG;

    var configManager = createConfigManager();
    try {
        configManager.getConfig();
    } catch (e) {
        t.ok(e.message.includes('VIDEOBACKUPPER_CONFIG'));
        restoreConfigEnv();
        t.end();
    }
});

test('configManager - getConfig - file not found', function (t) {
    var invalidConfigPath = path.join(__dirname, 'not.found.config.json');
    setConfigEnv(invalidConfigPath);

    var configManager = createConfigManager();
    try {
        configManager.getConfig();
        t.fail('Should throw error for file not found');
    } catch (e) {
        t.ok(e.message.includes('Unable to read config file'));
        t.ok(e.message.includes(invalidConfigPath));
        restoreConfigEnv();
        t.end();
    }
});

test('configManager - getConfig - file is invalid json', function (t) {
    var configPath = path.join(__dirname, '/invalid.config.json');
    setConfigEnv(configPath);

    var configManager = createConfigManager();
    try {
        configManager.getConfig();
        t.fail('Should throw error for invalid json');
    } catch (e) {
        t.ok(e.message.includes('Unable to read config file'));
        t.ok(e.message.includes(configPath));
        t.ok(e.message.includes('JSON input'));
        restoreConfigEnv();
        t.end();
    }
});

var nonObjectJsonFiles = [
    'string.config.json'
];

nonObjectJsonFiles.forEach(function (fileName, index) {
    test('configManager - getConfig - json is not an object #' + index, function (t) {
        var configPath = path.join(__dirname, fileName);
        setConfigEnv(configPath);

        var configManager = createConfigManager();
        try {
            configManager.getConfig();
            t.fail('Should throw error for non object json');
        } catch (e) {
            t.ok(e.message.includes(configPath));
            t.ok(e.message.includes('JSON is not an object'));
            restoreConfigEnv();
            t.end();
        }
    });
});

/**
 * Set value of config environment variable. First time called, backup original value
 * @param {string} configEnv
 */
function setConfigEnv(configEnv) {
    if (!_configEnv && process.env.VIDEOBACKUPPER_CONFIG) {
        _configEnv = process.env.VIDEOBACKUPPER_CONFIG;
    }
    process.env.VIDEOBACKUPPER_CONFIG = configEnv;
}

/**
 * Restore original value of config environment variable, from before setConfigEnv was called
 */
function restoreConfigEnv() {
    process.env.VIDEOBACKUPPER_CONFIG = _configEnv;
    _configEnv = null;
}

var path = require('path');
var test = require('blue-tape');
var baserequire = require('base-require');
var createConfigManager = baserequire('src/config/configManager');

test('configManager - getConfig - succeeds', function (t) {
    process.env.VIDEOBACKUPPER_CONFIG = path.join(__dirname, '/test.config.json');

    var expectedConfig = {
        'foo': [42, 44, 46],
        'bar': {'baz': 48}
    };

    var configManager = createConfigManager();
    t.deepEqual(configManager.getConfig(), expectedConfig);

    delete process.env.VIDEOBACKUPPER_CONFIG;
    t.end();
});

test('configManager - getConfig - file not found', function (t) {
    var invalidConfigPath = path.join(__dirname, '/invalid.config.json');
    process.env.VIDEOBACKUPPER_CONFIG = invalidConfigPath;

    var configManager = createConfigManager();
    try {
        configManager.getConfig();
    } catch (e) {
        t.ok(e.message.includes(invalidConfigPath));
        delete process.env.VIDEOBACKUPPER_CONFIG;
        t.end();
    }
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

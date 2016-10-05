var test = require('blue-tape');
var createConfigManager = require('../../../src/config/configManager');

test('configManager - getConfig - succeeds', function (t) {
    process.env.VIDEOBACKUPPER_CONFIG = __dirname + '/test.config.json';

    var expectedConfig = {
        "foo": [42, 44, 46],
        "bar": { "baz": 48 }
    };

    var configManager = createConfigManager();
    t.deepEqual(configManager.getConfig(), expectedConfig);

    delete process.env.VIDEOBACKUPPER_CONFIG;
    t.end();
});

test('configManager - getConfig - file not found', function (t) {
    var invalidConfigPath = __dirname + '/invalid.config.json';
    process.env.VIDEOBACKUPPER_CONFIG = invalidConfigPath;

    var configManager = createConfigManager();
    try{
        configManager.getConfig();    
    } catch (e) {
        t.ok(e.message.includes(invalidConfigPath));
        delete process.env.VIDEOBACKUPPER_CONFIG;
        t.end();
    }
});
var test = require('tape');
var sinon = require('sinon');
var baserequire = require('base-require');
var createProviderManager = baserequire('src/provider/providerManager');

test('providerManager - getProvider - succeeds', function (t) {
    var google = {
        name: 'google'
    };
    var config = {
        get: sinon.stub()
    };
    var providerConfig = {
        email: 'foo',
        keyFile: 'bar'
    };
    config.get.withArgs('provider.youtube').returns(providerConfig);

    var providerManager = createProviderManager(google, config);
    var provider = providerManager.getProvider();
    t.ok(provider);
    t.ok(provider.hasOwnProperty('getPlaylistVideoItems'));
    t.ok(provider.hasOwnProperty('getChannelVideoItems'));
    t.end();
});

test('providerManager - getProvider - invalid config', function (t) {
    var google = {
        name: 'google'
    };
    var config = {
        get: sinon.stub()
    };

    var configErrorMessage = 'Config key not found';
    config.get.withArgs('provider.youtube').throws(new Error(configErrorMessage));

    var providerManager = createProviderManager(google, config);
    try {
        providerManager.getProvider();
        t.fail('Should throw error for invalid config');
    } catch (err) {
        t.ok(err.message.includes('Unable to create provider'));
        t.ok(err.message.includes(configErrorMessage));
        t.end();
    }
});

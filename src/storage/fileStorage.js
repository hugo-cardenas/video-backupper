const fs = require('fs-promise');

module.exports = function (path) {
    function getAllVideoItems() {
        return Promise.resolve([]);
    }

    return {
        getAllVideoItems
    };
};

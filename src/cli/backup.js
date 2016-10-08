var program = require('commander');
var locator = require('../locator');

function handleCommand(playlistId) {
    locator.getBackupper().run(playlistId)
        .then(function (errors) {
            if (errors.length > 0) {
                console.log('Errors:', errors);
            }
            console.log('Finished!');
        })
        .catch(function (err) {
            console.log('Error!', err);
        });
}

program
    .version('0.0.1')
    .description('Backup videos from a youtube playlist')
    .arguments('backup <playlist-id>')
    .action(handleCommand)
    .parse(process.argv);

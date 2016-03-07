const remote = require('electron').remote;
const dialog = remote.dialog;
const fs = require('fs');
const glob = require('glob');

const yearRegex =

function openFolder () {
    dialog.showOpenDialog({
        title: 'Test title',
        defaultPath: '/',
        properties: [ 'openDirectory' ]
    }, function (fileNames) {
        if (fileNames === undefined) return;

        console.log(fileNames);

        var yearsList = fs.readdir(fileNames, function(err, files) {
            if (err) throw err;
            console.log("List of years: ", files);

            files.forEach( function (item) {
                if
            });
        });
    });
};

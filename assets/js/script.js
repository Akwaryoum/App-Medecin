const remote = require('electron').remote;
const dialog = remote.dialog;
const fs = require('fs');
const glob = require('glob');
const slash = require('slash');

var isDataLoaded = false;
var trackList = [];
var currentTrack = 0;

function openFolder() {
    dialog.showOpenDialog({
        title: 'Test title',
        defaultPath: '/',
        properties: [ 'openDirectory' ]
    }, function (fileNames) {
        // TODO: Print an error
        if (fileNames === undefined) return;
        fileName = slash(fileNames[0]);

        console.log(fileName);

        glob("*/*-*/*h*.vwi", { cwd: fileName, nocase: true }, function (err, matches) {
            // TODO: Print an error
            if (matches === null) return;

            matches.forEach(function (match) {
                console.log("Treating: " + match);
                var year = match.substring(0, 4);
                var month = match.substring(5, 7);
                var day = match.substring(8, 10);
                var hour = match.substring(11, 13);
                var minutes = match.substring(14, 16);
                var date = new TrackDate(year, month, day, hour, minutes);
                
                

                var track = new Track(date, weight, level, duration, cardiac);
                trackList.push(track);
            });

            console.log(trackList.length + " items found.");
            trackList.forEach(function (item) {
                console.log(item.getString());
            });
        });
    });
};


function onPrevious() {
    if (isDataLoaded) {

    }
}

function onNext() {
    if (isDataLoaded) {

    }
}

function Track(date, weight, level, duration, cardiac) {
    this.date = date;
    this.weight = weight;
    this.level = level;
    this.duration = duration;
    this.cardiac = cardiac;
};

module.exports = Track;

function TrackDate(year, month, day, hour, minutes) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minutes = minutes;
};

TrackDate.prototype.getShortName = function () {

};

TrackDate.prototype.getString = function () {
    return "This is a track from the year " + this.year + ", on the " + this.day + " " + this.month + " at " + this.hour + "h" + this.minutes;
};

module.exports = TrackDate;
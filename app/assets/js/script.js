'use strict';
const remote = require('electron').remote;
const dialog = remote.dialog;
const fs = require('fs');
const glob = require('glob');
const slash = require('slash');
const path = require('path');
const Chart = require('chart.js');

/*
Chart.defaults.global = {
	animation: false
};*/

var isDataLoaded, trackList, currentTrack;

function openFolder() {
	isDataLoaded = false;
	trackList = [];
	currentTrack = 0;

    dialog.showOpenDialog({
        title: 'Test title',
        defaultPath: '/',
        properties: [ 'openDirectory' ]
    }, function (fileNames) {
		if (fileNames === undefined) {
			dialog.showErrorBox("Erreur", "Impossible de charger les données: aucun fichiers sélectionnés.");
			return;
		}
        var fileName = slash(fileNames[0]);
		
		// Get a list of matching files
        glob("*/*-*/*h*.vwi", { cwd: fileName, nocase: true }, function (err, matches) {
			if (matches.length == 0) {
				dialog.showErrorBox("Erreur", "Impossible de charger les données: aucun fichier trouvé ou structure de fichiers invalide.");
				return;
			}
			
			// Treat each file
            matches.forEach(function (match) {
                console.log("Treating: " + match);
                var year = match.substring(0, 4);
                var month = match.substring(5, 7);
                var day = match.substring(8, 10);
                var hour = match.substring(11, 13);
				var minutes = match.substring(14, 16);
				var date = new Date(year, month, day, hour, minutes, 0, 0);
				var weight, level, calories, duration, cardiac;
				
				// Parse each lines
				var lines = fs.readFileSync(path.join(fileName, match)).toString().split("\n");
				lines.forEach(function (line) {
					var keyValue = line.split(':');
					
					switch (keyValue[0]) {
						case "Weight":
							weight = parseInt(keyValue[1]);
							break;
						case "Level":
							level = parseInt(keyValue[1]);
							break;
						case "Calories":
							calories = parseInt(keyValue[1]);
							break;
						case "Duration":
							duration = parseInt(keyValue[1]);
							break;
						case "Cardiac":
							cardiac = keyValue[1].split(',').map(Number);
							break;
						default:
							console.log("add the track");
							// Create & add the track
							var track = new Track(date, weight, level, calories, duration, cardiac);
							trackList.push(track);
							break;
					}
				});

				console.log(trackList.length + " vs " + matches.length);
				if (trackList.length === matches.length) {
					// Finished processing files
					currentTrack = trackList.length-1;
					console.log(trackList.length + " items processed.");
					isDataLoaded = true;
					$("#no-file-loaded").css("display", "none");
					refreshPlot();
				}
			});
		});
    });
};

function onPrevious() {
	console.log("Previous clicked");
    if (isDataLoaded) {
		if (currentTrack > 0) {
			currentTrack--;
			refreshPlot();
		}
    }
};

function onNext() {
	console.log("Next clicked");
    if (isDataLoaded) {
		if (currentTrack < trackList.length-1) {
			currentTrack++;
			refreshPlot();
		}
    }
};

function refreshPlot() {
	console.log("Currently drawing new stuff.");
	console.log("Currently displayed data is from :" + trackList[currentTrack].getString());
	
	var track = trackList[currentTrack];
	
	// Set page title
	$("#page-title").html(track.date.toLocaleString("fr", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }));

	// Update table
	$("#weight").html(track.weight);
	$("#level").html(track.level);
	$("#calories").html(track.calories);
	$("#duration").html(track.duration);

	// Update chart
	var ctx = document.getElementById("line-chart").getContext("2d");
	var lineChart = new Chart(ctx).Line({
		labels: ["init"],
		datasets: [{
				label: "Fréquence cardiaque",
				fillColor: "rgba(220,0,0,0.2)",
				strokeColor: "rgba(220,0,0,1)",
				pointColor: "rgba(220,0,0,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: [0]
			}]
	},{
		animation: false,
		responsive: true,
		bezierCurve: false,
		showTooltips: false
	});
	
	lineChart.removeData();

	track.cardiac.forEach(function (item, index) {
		lineChart.addData([item], index<6 ? index*10 + " s" : Math.floor((index * 10)/60) + " min " + (index * 10)%60);
	});

};

$(document).keydown(function (event) {
	switch (event.which) {
		case 39:
			// Right arrow
			onNext();
			break;
		case 37:
			onPrevious();
			break;
		default: break;
	}
});

function Track(date, weight, level, calories, duration, cardiac) {
    this.date = date;
    this.weight = weight;
	this.level = level;
	this.calories = calories;
    this.duration = duration;
    this.cardiac = cardiac;
};

Track.prototype.getString = function () {
	return "Track from the " + this.date.toDateString() + " on the lvl " + this.level;
};

module.exports = Track;
'use strict';
const remote = require('electron').remote;
const dialog = remote.dialog;
const fs = require('fs');
const glob = require('glob');
const slash = require('slash');
const path = require('path');
const Chart = require('chart.js');
const i18n = require('i18n');

i18n.configure({
  defaultLocale: 'fr',
  locales: ['fr', 'en'],
  directory: __dirname + '/assets/locales'
});

var isDataLoaded, trackList, currentTrack;

var linechart;

$( document ).ready(function() {
	loadLanguage();
});

function openFolder() {
	isDataLoaded = false;
	trackList = [];
	currentTrack = 0;

    dialog.showOpenDialog({
        title: i18n.__('title.window.loading'),
        defaultPath: '/',
        properties: [ 'openDirectory' ]
    }, function (fileNames) {
		if (fileNames === undefined) {
			dialog.showErrorBox(i18n.__('title.error'), i18n.__('error.loading.no_file'));
			return;
		}
        var fileName = slash(fileNames[0]);
		
		// Get a list of matching files
        glob("*/*-*/*h*.vwi", { cwd: fileName, nocase: true }, function (err, matches) {
			if (matches.length == 0) {
				dialog.showErrorBox(i18n.__('title.error'), i18n.__('error.loading.not_valid'));
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
							duration = parseFloat(keyValue[1]);
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
					refreshData(true);
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
			linechart.destroy();
			refreshData(true);
		}
    }
};

function onNext() {
	console.log("Next clicked");
    if (isDataLoaded) {
		if (currentTrack < trackList.length-1) {
			currentTrack++;
			linechart.destroy();
			refreshData(true);
		}
    }
};


function loadLanguage() {
	$("#t-table-weight").html(i18n.__('table.weight'));
	$("#t-table-duration").html(i18n.__('table.duration'));
	$("#t-table-level").html(i18n.__('table.level'));
	$("#t-table-energy").html(i18n.__('table.energy'));
	$("#t-footer-credit").html(i18n.__('footer.credit'));
	$("#no-file-loaded").html(i18n.__('body.no-file'));
	$("title").html(i18n.__('app.title'));
	
	if (currentTrack == undefined) {
		$("#page-title").html(i18n.__('app.title'));
	} else {
		refreshData(false);
	}
}

function onFR() {
	i18n.setLocale("fr");
	loadLanguage();
}

function onEN() {
	i18n.setLocale("en");
	loadLanguage();
}

function refreshData(plot) {
	var track = trackList[currentTrack];
	var interval = (track.duration*60) / (track.cardiac.length-1);
	var txt_duration = track.duration*60 >= 60 ? Math.floor(track.duration) + " min " + ((track.duration*60%60) <10 ? "" : (track.duration*60%60)) : track.duration*60 + " s";
	
	console.log("Currently drawing new stuff.");
	console.log("Currently displayed data is from :" + track.getString());
		
	// Set page title
	$("#page-title").html(track.date.toLocaleString(i18n.getLocale(), { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }));

	// Update table
	$("#weight").html(track.weight + " kg");
	$("#level").html(track.level);
	$("#calories").html(track.calories + " cal");
	$("#duration").html(txt_duration);
	
	if (plot) {
		refreshPlot(track, interval);
	}
}

function refreshPlot(track, interval) {
	// Update chart
	var ctx = document.getElementById("line-chart");
	
	Chart.defaults.global.responsive = true;
	Chart.defaults.global.tooltips.enabled = false;
	Chart.defaults.global.legend.display = false;
	
	linechart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: [""],
			datasets: [{
				label: i18n.__('graph.label'),
				backgroundColor: "rgba(220,0,0,0.2)",
				borderColor: "rgba(220,0,0,1)",
				pointBackgroundColor: "rgba(220,0,0,1)",
				pointBorderColor: "#fff",
				pointHoverBackgroundColor: "#fff",
				pointHoverBorderColor: "rgba(220,220,220,1)",
				lineTension: 0.1,
				data: [0]
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	});	
	
	linechart.data.datasets[0].data = [];
	linechart.data.labels = [];
	
	track.cardiac.forEach(function (i, data) {
		linechart.data.datasets[0].data.push(i);
		linechart.data.labels.push(data<(60/interval) ? data*interval + " s" : Math.floor((data * interval)/60) + " min " + (data * interval)%60);
		
	});
	
	linechart.update();
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
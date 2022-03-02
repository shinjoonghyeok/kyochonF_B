var pid = LOGPRESSO.process.getPid();
var instance;

var profileName = "datalog";
//var suID = "root";
//var suID = ["root","logpresso"];
var suID = new Array();
var LOGLEVEL = "info";

//var dashboardServerAddress = "10.10.1.72";
var dashboardServerAddress = "192.168.10.15";
var dashboardServerMethod = "http";
//var dashboardServerAddress = "211.248.255.123";

var userAccountScriptPath = "/data/logpresso/answer";
var userAccountHomePath = "/storage/baseLogs";

var logpressoDefault = "qwerty12345!!!";

var maxUrlRequest = 50;

var loader_gif_path = "images/loader/loader_trans.gif";

var answerEventTable = "datalog_event";
var answerEventList = "event_list"

//Table Trand Query - Logger 정보 가져올때.
//var answerTableTrendQuery = "table sys_table_trends | stats sum(count) as count, sum(volume) as volume, sum(compressed) as compressed by table | search table == 'answer*'";
var answerTableTrendQuery = "table sys_table_trends | stats sum(count) as count, sum(volume) as volume, sum(compressed) as compressed by table | search table == \"answer*\"";

var Chart = function () {

	/* [월간] 수집 용량 추이
	--------------------------------------------------------------------------------*/
	var barMonthTableInputSize = function(categoryAry, dataAry) {
		Highcharts.chart('chart_month_size', {
			chart: {
				height: 200
			},
			title: {
				text: ''
			},
			subtitle: {
				text: ''
			},
			xAxis: {
				categories: categoryAry,
				crosshair: true
			},
			yAxis: {
				type: 'logarithmic',
				minorTickInterval: 0.1,
				title: {
					text: ''
				}
			},
			legend: {
				align: 'right'
			},

			plotOptions: {
				line: {
					dataLabels: {
						enabled: true
					},
					enableMouseTracking: false
				}
			},

			series: [{
				name: '원본용량(MB)',
				data: dataAry,
				color: '#25CAA5'
			}],

			responsive: {
				rules: [{
					condition: {
						maxWidth: 500
					},
					chartOptions: {
						legend: {
							layout: 'horizontal',
							align: 'center',
							verticalAlign: 'bottom'
						}
					}
				}]
			}

		});
	}

	/* [주간] 테이블별 수집용량 Top 10
	--------------------------------------------------------------------------------*/
	var barWeekTableInputSize = function(categoryAry, dataAry) {
		Highcharts.setOptions({
			lang: {
				thousandsSep: ','
			}
		});

		Highcharts.chart('chart_table_size', {
			chart: {
				type: 'column',
				height: 200
			},
			title: {
				text: ''
			},
			subtitle: {
				text: ''
			},
			xAxis: {
				categories: categoryAry,
				crosshair: true
			},
			yAxis: {
				type: 'logarithmic',
    			minorTickInterval: 0.1,
				title: {
					text: ''
				}
			},
			tooltip: {
				headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
				pointFormat:
					'<tr><td style="font-size:12px;padding:0">' +
					'<span style="color:#f49b2f;font-weight: bold;">수집용량: </span>' +
					'<span style="color:#000;font-weight: bold;">{point.y}</span> bytes</td></tr>',
				footerFormat: '</table>',
				shared: true,
				useHTML: true
			},
			 legend: {
			 	align: 'right',
			 	backgroundColor: '#FFFFFF'
			},
			plotOptions: {
				column: {
				pointPadding: 0.2,
				borderWidth: 0
				}
			},
			series: [{
				name: '수집용량',
				data: dataAry,
				color: '#f49b2f'
			}]
		});
	}


	/* 현재 디스크 사용량
	--------------------------------------------------------------------------------*/
	var barUseDisk = function(categoryAry, usedAry, freeAry) {
		Highcharts.setOptions({
			lang: {
				thousandsSep: ','
			}
		});

		Highcharts.chart('chart_use_disk', {
			chart: {
				type: 'bar',
				height: 200
			},
			title: {
				text: ''
			},
			xAxis: {
				categories: categoryAry
			},
			yAxis: {
				min: 0,
				title: {
					text: ''
				}
			},
			legend: {
				align: 'right',
				reversed: true
			},
			tooltip: {
				formatter: function() {
					var s;
					s = this.x + '<br/><span style="color:' + this.series.color + '">'+ this.series.name + '</span>: ';
					s = s + Highcharts.numberFormat(this.y, 0, '.', ',');
					s = s + '(' + Highcharts.numberFormat(this.percentage, 1)+ '%)';
					return s;
				},
				useHTML: true
			},
			plotOptions: {
				series: {
					stacking: 'normal'
				}
			},
			series: [
				{
					name: 'used',
					data: usedAry,
					color: '#80D7E1'
				},
				{
					name: 'free',
					data: freeAry,
					color: 'rgba(137,146,202,0.5)'
				}
			]
		});
	}

	/* 최근 10분 CPU 사용률
	--------------------------------------------------------------------------------*/
	var lineUseCPU = function(kernelAry, userAry) {
		Highcharts.chart('chart_use_cpu', {
			chart: {
				type: 'spline',
				height: 200
			},
			title: {
				text: ''
			},
			subtitle: {
				text: ''
			},
			xAxis: {
				type: 'datetime',

				dateTimeLabelFormats : {
					hour: '%H:%M',
					minute: '%H:%M',
					second: '%H:%M:%S',
				}
			},
			yAxis: {

				title: {
					text: ''
				}
			},
			legend: {
				align: 'right'
			},
			tooltip: {
				formatter: function() {
					var s;
					s = this.x + '<br/><span style="color:' + this.series.color + '">'+ this.series.name + '</span>: ';
					s = s + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', new Date(this.x));
					return s;
				},
				useHTML: true
			},
			plotOptions: {
				spline: {
					lineWidth: 2,
					states: {
						hover: {
							lineWidth: 4
						}
					},
					marker: {
						enabled: false
					},
					pointInterval: 120000
				}
			},
			series: [
				{
					name: 'kernel',
					data: kernelAry,
					color: '#FF5677'
				},
				{
					name: 'user',
					data: userAry,
					color: '#2896EB'
				}
			]
		});
	}

	/* 최근 10분 테이블 입력 Top 10
	--------------------------------------------------------------------------------*/
	var barTableInputCount = function(categoryAry, dataAry) {
		Highcharts.setOptions({
			lang: {
				thousandsSep: ','
			}
		});

		Highcharts.chart('chart_table_input', {
			chart: {
				type: 'bar',
				height: 200
			},
			title: {
				text: ''
			},
			xAxis: {
				categories: categoryAry
			},
			yAxis: {
				min: 0,
				title: {
					text: ''
				}
			},
			legend: {
				align: 'right',
				reversed: true
			},
			tooltip: {
				formatter: function() {
					var s;
					s = 'table: ' + this.x + '<br/><span style="color:' + this.series.color + '">'+ this.series.name + '</span>: ';
					s = s + Highcharts.numberFormat(this.y, 0, '.', ',');
					return s;
				},
				useHTML: true
			},
			plotOptions: {
				series: {
					stacking: 'normal'
				}
			},
			series: [
				{
					name: '건수',
					data: dataAry,
					color: '#25CAA5'
				}
			]
		});
	}


	return {

		month: function(colAry, dataAry) {
			barMonthTableInputSize(colAry, dataAry);
		},

		week: function(colAry, dataAry) {
			barWeekTableInputSize(colAry, dataAry);
		},

		useDisk: function(colAry, used, free) {
			barUseDisk(colAry, used, free);
		},

		useCPU: function(kernelAry, userAry) {
			lineUseCPU(kernelAry, userAry);
		},

		table: function(colAry, dataAry) {
			barTableInputCount(colAry, dataAry);
		},

		slide: function() {

		}

	};	// retrun close

}();	// Mains close




(function () {
	this.Theme = (function () {
		function Theme() {}
		Theme.colors = {
			white: "#FFFFFF",
			primary: "#5E87B0",
			red: "#D9534F",
			green: "#A8BC7B",
			blue: "#70AFC4",
			orange: "#F0AD4E",
			yellow: "#FCD76A",
			gray: "#6B787F",
			lightBlue: "#D4E5DE",
			purple: "#A696CE",
			pink: "#DB5E8C",
			dark_orange: "#F38630"
		};
		return Theme;
	})();
})(window.jQuery);

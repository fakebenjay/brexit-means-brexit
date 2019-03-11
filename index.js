document.addEventListener("DOMContentLoaded", function () {
	var barDivs = document.querySelectorAll('.pct-bar')
	var barWidth = document.getElementById('bars').offsetWidth * 0.9

	for (let i = 0; i < barDivs.length; i++) {
		barDivs[i].style.width = `${barWidth}px`
		barDivs[i].style.offsetWidth = `${barWidth}px`
	}
})

function horizBar(d, propsObj) {
	Promise.all([d3.csv("pandas/output/spending.csv"), d, propsObj])
		.then(function (data) {
			var councilsAll = data[0].sort((a, b) => {
				return parseFloat(a.pct_remain) - parseFloat(b.pct_remain);
			})

			var that = data[1].properties
			var precedingPct = 0

			var scale = data[2].scale
			var divID = data[2].divID
			var keyNameSnake = data[2].keyNameSnake
			var keyNameCamel = data[2].keyNameCamel
			var svg = data[2].svg

			var decade = 20
			var barObjs = []
			var x = 0

			for (let i = 0; i < councilsAll.length; i++) {
				if (that.LAD13CD === councilsAll[i].area_code) {
					councilsAll[i].selected = true;
					that.precedingPct = precedingPct
				} else {
					councilsAll[i].selected = false;
				}
				councilsAll[i].precedingPct = precedingPct
				precedingPct += scale(councilsAll[i][keyNameSnake])

				if (councilsAll[i].pct_remain - decade >= 10 || i === councilsAll.length - 1) {
					if (councilsAll[i].pct_remain - decade >= 10) {
						var width = councilsAll[i].precedingPct - x
					} else if (i === councilsAll.length - 1) {
						var width = scale.range()[1] - x
					}

					x += width
					var color = barColorScale(decade)
					var className = `remain-${decade}`
					decade += 10

					barObjs.push({
						width: width,
						color: color,
						className: className
					})
				}
			}

			// for (let i = 0; i < councilsAll.length; i++) {
			// 	if (councilsAll[i].pct_remain - decade >= 10 || i === councilsAll.length - 1) {
			// 		var width = councilsAll[i][preKeyName] - x
			// 		x += width
			// 		var color = barColorScale(decade)
			// 		var className = `remain-${decade}`
			// 		decade += 10
			//
			// 		barObjs.push({
			// 			width: width,
			// 			color: color,
			// 			className: className
			// 		})
			// 	}
			// }

			d3.select(divID).selectAll("div")
				.data(barObjs)
				.enter()
				.append('div')
				.attr('class', (d) => {
					return `bar ${d.className}`
				})
				.style('height', `${hBar}px`)
				.style('width', (d) => {
					return `${d.width}%`
				})
				.style('background-color', (d) => {
					return d.color
				});

			function widthKey(d, keyName, scale) {
				return `${scale(d.properties[keyName])}px`
			}

			svg.selectAll('rect')
				.data([that])
				.enter()
				.append('rect')
				.attr('x', (d) => {
					return `${d.precedingPct}px`
				})
				.attr('y', 0)
				.attr('width', widthKey(d, keyNameCamel, scale))
				.attr('height', `${hBar}px`)
				.style('fill', 'black')
				.style("stroke", 'black')
				.style("stroke-width", '1px');
		})
}

function drawPie(d, i) {
	var pie = d3.pie()
		.value(d => d)
		.sort(null);

	const arc = d3.arc()
		.innerRadius(0)
		.outerRadius(radius);

	const labelArc = d3.arc()
		.outerRadius(radius / 2)
		.innerRadius(radius / 2);

	function arcTween(a) {
		const i = d3.interpolate(this._current, a);
		this._current = i(1);
		return (t) => arc(i(t));
	}

	Promise.all([d])
		.then(function (data) {
			var properties = data[0].properties

			d3.selectAll("#map-div input")
				.on("click", update);

			function update(val = this.value) {
				//Update stats
				// https://inorganik.github.io/countUp.js/
				// function countTween(id, start, end, decimals, suffix) {
				// 	if (decimals > 0) {
				// 		var startPoint = !!start ? parseFloat(start) : parseFloat(end)
				// 		var endPoint = parseFloat(end)
				// 	} else {
				// 		var startPoint = !!start ? parseInt(start) : parseInt(end)
				// 		var endPoint = parseInt(end)
				// 	}
				//
				// 	var demo = new CountUp(id, endPoint, {
				// 		startVal: startPoint,
				// 		duration: 0.2,
				// 		decimalPlaces: decimals,
				// 		suffix: suffix
				// 	})
				// 	demo.start()
				// }
				// document.querySelector('#region-name').innerText = val.region
				//
				// countTween('remain-num', document.getElementById('remain-num').innerText, val.remain, 0, '')
				//
				// // var leaveSV = !!document.getElementById('leave-num').innerText ? parseInt(document.getElementById('leave-num').innerText) : parseInt(val.leave)
				// // new CountUp('leave-num', val.leave, {
				// //   startVal: leaveSV,
				// //   duration: 0.2
				// // }).start()
				//
				// document.querySelector('#turnout > span').innerText = `${val.pctTurnout}%`
				// document.querySelector('#valid-votes > span').innerText = val.validVotes
				// document.querySelector('#votes-cast > span').innerText = val.votesCast
				// document.querySelector('#rejected-ballots > span').innerText = val.rejectedBallots
				// document.querySelector('#electorate > span').innerText = val.electorate

				//Update legend
				legendSVG.selectAll('rect')
					.data([val])
					.transition()
					.attr('x', d => `${legendXScale(d.pctRemain) + legendMargin - legendOffset}px`)
					.attr('y', d => `${legendYScale(d.percentile) + legendMargin - legendOffset}px`);

				//Update bars
				barPerCapSVG.selectAll('rect')
					.data([val])
					.transition()
					.attr("x", function (d) {
						return `${barWidthScalePC(d.precedingPerCap)}px`
					})
					.attr('width', (d) => {
						return `${barWidthScalePC(d.spendingPerVoter)}px`
					});

				barElectorateSVG.selectAll('rect')
					.data([val])
					.transition()
					.attr("x", function (d) {
						return `${barWidthScaleElectorate(d.precedingElectorate)}px`
					})
					.attr('width', (d) => {
						return `${barWidthScaleElectorate(d.electorate)}px`
					});

				barTotalSVG.selectAll('rect')
					.data([val])
					.transition()
					.attr("x", function (d) {
						return `${barWidthScaleTotal(d.precedingProjEU)}px`
					})
					.attr('width', (d) => {
						return `${barWidthScaleTotal(d.projEUContribution)}px`
					});

				// Join new data
				var results = [val.pctLeave, val.pctRemain]

				// var statistics = d3.select('#stats').selectAll('span')

				var piePath = pieSVG.selectAll("path")
					.data(pie(results));

				var labelArcs = pieSVG.selectAll('text')
					.data(pie(results));

				// Update existing arcs
				piePath.transition()
					.duration(200)
					.attrTween("d", arcTween);

				d3.selectAll("text")
					.transition()
					.duration(200)
					.tween("text", function (a) {
						var that = d3.select(this);
						var newVal = that.text().replace('%', '')
						var oldVal = a.data
						var iNum = d3.interpolateNumber(newVal, oldVal);
						var format = d3.format(".4");
						return function (t) {
							that.text(`${format(iNum(t))}%`);
						};
					})
					.attrTween("transform", function (a) {
						// var c = arc.centroid(d);
						// return "translate(" + c[0] + "," + c[1] + ")";
						var i = d3.interpolate(this._current, a);
						this._current = i(0);
						return function (t) {
							var radius = document.getElementById('pie').offsetWidth / 2
							var centroidPt = labelArc.centroid(i(t))
							return `translate(${centroidPt[0]},${centroidPt[1]})`;
						}
					});

				// Enter new arcs
				piePath.enter()
					.append("path")
					.attr("fill", (d, i) => pieColor(i))
					.attr("d", arc)
					.attr("stroke", "white")
					.attr("stroke-width", "2px")
					.each(function (d) {
						this._current = d;
						// Store initial angels for transition: http://www.cagrimmett.com/til/2016/08/27/d3-transitions.html
					});

				labelArcs.enter()
					.append("text")
					.attr("class", "arc")
					.attr("transform", function (d) {
						var radius = document.getElementById('pie').offsetWidth / 2
						var centroidPt = labelArc.centroid(d)
						return `translate(${centroidPt[0]},${centroidPt[1]})`;
					})
					.attr("text-anchor", "middle")
					.text(function (d) {
						return `${d.data}%`;
					})
					.style('fill', 'white')
					.each(function (d) {
						this._current = d;
					});
			}

			update(properties);
			document.querySelector('#infobox').classList.remove("hidden")
		})
}

var wBar = document.getElementById('pct-bar-percap').offsetWidth;
var hBar = document.getElementById('pct-bar-percap').offsetHeight;

//100321726921.54 total EU spending
//1013925.169 per capita council sum
//46475882 eligible voters

var barPerCapSVG = d3.select("#pct-bar-percap")
	.append('svg')
	.attr('class', 'bar-svg')
	.attr('width', `100%`)
	.attr('height', '100%')
	.attr('viewBox', `0 0 ${Math.min(wBar, hBar)} ${Math.min(wBar, hBar)}`)
	.attr('preserveAspectRatio', 'xMinYMin');

var barElectorateSVG = d3.select("#pct-bar-electorate")
	.append('svg')
	.attr('class', 'bar-svg')
	.attr('width', `100%`)
	.attr('height', '100%')
	.attr('viewBox', `0 0 ${Math.min(wBar, hBar)} ${Math.min(wBar, hBar)}`)
	.attr('preserveAspectRatio', 'xMinYMin');

var barTotalSVG = d3.select("#pct-bar-total")
	.append('svg')
	.attr('class', 'bar-svg')
	.attr('width', `100%`)
	.attr('height', '100%')
	.attr('viewBox', `0 0 ${Math.min(wBar, hBar)} ${Math.min(wBar, hBar)}`)
	.attr('preserveAspectRatio', 'xMinYMin');

//For some reason, I have to reduce the outer bound of the range to 90% of itself. Div crap?
var barWidthScalePC = d3.scaleLinear()
	.domain([0, 1013925.169])
	.range([0, wBar * .9]);

var barWidthScaleElectorate = d3.scaleLinear()
	.domain([0, 46475882])
	.range([0, wBar * .9]);

var barWidthScaleTotal = d3.scaleLinear()
	.domain([0, 100321726921.54])
	.range([0, wBar * .9]);

var barColorScale = d3.scaleQuantize()
	.domain([20, 80])
	.range(['#bd1d1e', '#d76150', '#eb9788', '#9d80d3', '#6644bb', '#0000a3']);

var wPie = document.getElementById('pie').offsetWidth;
var hPie = document.getElementById('pie').offsetWidth;
var radius = Math.min(wPie, hPie) / 2;

var pieColor = d3.scaleOrdinal(["#bd1d1e", "#0000a3"]);

var pieSVG = d3.select("#pie")
	.append("svg")
	.attr("width", wPie)
	.attr("height", hPie)
	.append("g")
	.attr("transform", `translate(${Math.min(wPie, hPie) / 2},${Math.min(wPie, hPie) / 2})`);

var w = document.querySelector('#map-div').offsetWidth;
var h = document.querySelector('#map-div').offsetHeight * .99;

var select = d3.select("div#select-div")
	.append("select")
	.attr('id', 'select');

var mapSVG = d3.select("#map-div")
	.append("svg")
	.attr("width", w)
	.attr("height", h)
	.append("g")
	.attr('transform', `translate(${w/10},0)`);

var wLegend = w / 3.5
var hLegend = w / 3.5
var legendMargin = wLegend / 5
var legendOffset = wLegend / 40

var legendXScale = d3.scaleLinear()
	.domain([20, 80])
	.range([0, wLegend]);

var legendYScale = d3.scaleLinear()
	.domain([100, 0])
	.range([0, hLegend]);

// var mapLegend = d3.select("#map-div")
// 	.append('div')
// 	.attr('id', 'legend')
// 	.style('width', `${wLegend}px`)
// 	.style('height', `${hLegend}px`)
// 	.style('margin', `${parseFloat(legendMargin)}px ${parseFloat(legendMargin)}px ${parseFloat(legendMargin)}px ${parseFloat(legendMargin)}px`);

var mapLegend = d3.select("#legend")
	.style('width', `${wLegend}px`)
	.style('height', `${hLegend}px`)
	.style('margin', `${parseFloat(legendMargin)}px ${parseFloat(legendMargin)}px ${parseFloat(legendMargin)}px ${parseFloat(legendMargin)}px`);


var legendData = [
	{
		id: 'legend-20',
		maxColor: '#bd1d1e',
		minColor: '#f8e8e8'
	},
	{
		id: 'legend-30',
		maxColor: '#d76150',
		minColor: '#fbefed'
	},
	{
		id: 'legend-40',
		maxColor: '#eb9788',
		minColor: '#fdf4f3'
	},
	{
		id: 'legend-50',
		maxColor: '#9d80d3',
		minColor: '#f5f2fa'
	},
	{
		id: 'legend-60',
		maxColor: '#6644bb',
		minColor: '#efecf8'
	},
	{
		id: 'legend-70',
		maxColor: '#0000a3',
		minColor: '#e5e5f5'
	}
]

var legendBars = d3.select("#legend")
	.selectAll('span')
	.data(legendData)
	.enter()
	.append('span')
	.attr('id', d => d.id)
	.attr('class', "legend-bar")
	.style('width', `${parseFloat(wLegend)/6}px`)
	.style('height', `${parseFloat(hLegend)}px`)
	.style('background-image', d => `linear-gradient(${d.maxColor}, ${d.minColor})`)

var legendSVG = d3.select("#legend")
	.append('svg')
	.attr('class', 'legend-svg')
	.attr('width', `${wLegend + legendMargin + legendMargin}px`)
	.attr('height', `${hLegend + legendMargin + legendMargin}px`)
	.attr('transform', `translate(-${legendMargin}, -${legendMargin})`)
	.attr('viewBox', `0 0 100% 100%`)
	.attr('preserveAspectRatio', 'xMinYMin');

var projection = d3.geoAlbers()
	.center([1.5, 55.2])
	.rotate([4.4, 0])
	.parallels([50, 50])
	.scale(3300)
	.translate([w / 2, h / 2]);

var path = d3.geoPath()
	.projection(projection);

var color = d3.scaleQuantize()
	.domain([20, 80])
	// .range(['#b40000', '#a20032', '#900064', '#640090', '#3200a2', '#0000b4']);
	// .range(['#a30000', '#940032', '#800064', '#640080', '#320091', '#0000a3']);
	.range(['#bd1d1e', '#b6182d', '#af143b', '#47008f', '#310099', '#0000a3']);
// .range(['#a30000', '#a30032', '#a30064', '#6400a3', '#3200a3', '#0000a3']);
// .range(['#a30000', '#a3002d', '#a3005a', '#5a00a3', '#2d00a3', '#0000a3']);
// .range(['#a30000', '#9c001a', '#94002e', '#47008f', '#310099', '#0000a3']);
// .range(['#bd1d1e', '#b6182d', '#af143b', '#5d0b95', '#4210a3', '#0a14b0']);
// .range(['#bd1d1e', '#b41830', '#aa1241', '#650a90', '#4a0fa0', '#0a14b0']);
// .range(['#bd1d1e', '#b11635', '#a50f4a', '#710886', '#530d9b', '#0a14b0']);
// .range(['#ff0000', '#ee0040', '#dc0068', '#8f00cd', '#6500e8', '#0000ff']);

var ptileOpacity = d3.scaleLinear()
	.domain([0, 100])
	.range([0.1, 1.0]);

var spendingOpacity = d3.scaleLinear()
	.domain([5.179221, 3274.196])
	.range([0.1, 1.0]);

function regionName(name) {
	if (name === 'East') {
		return "East of England"
	} else if ((name.includes("North") || name.includes("South")) && !name.includes("Ireland")) {
		return `${name} England`
	} else {
		return name
	}
}

function init(data) {
	var stats = data[0]
	var mapJSON = data[1].features

	for (let i = 0; i < stats.length; i++) {
		let areaCode = stats[i].area_code
		let brexitConstituency = stats[i].brexit_constituency
		let region = regionName(stats[i].region)
		let electorate = stats[i].electorate
		let remain = parseInt(stats[i].remain)
		let leave = parseInt(stats[i].leave)
		let pctRemain = parseFloat(stats[i].pct_remain).toFixed(2)
		let pctLeave = parseFloat(stats[i].pct_leave).toFixed(2)
		let projEUContribution = parseFloat(stats[i].project_eu_contribution_gbp).toFixed(2)
		let spendingPerVoter = parseFloat(stats[i].spending_per_voter).toFixed(2)
		let percentile = parseFloat(stats[i].spending_percentile)
		let precedingPerCap = parseFloat(stats[i].preceding_per_cap)
		let precedingProjEU = parseFloat(stats[i].preceding_proj_eu)
		let precedingElectorate = parseFloat(stats[i].preceding_electorate)
		let rejectedBallots = parseInt(stats[i].rejected_ballots)
		let validVotes = parseInt(stats[i].valid_votes)
		let votesCast = parseInt(stats[i].votes_cast)
		let pctTurnout = parseFloat(stats[i].pct_turnout)
		let electorateRank = parseInt(stats[i].electorate_rank)
		let percapRank = parseInt(stats[i].percap_spend_rank)
		let projEURank = parseInt(stats[i].total_spend_rank)
		let remainRank = parseInt(stats[i].remain_rank)
		let leaveRank = parseInt(stats[i].leave_rank)

		for (let j = 0; j < mapJSON.length; j++) {
			let areaID = mapJSON[j].properties.LAD13CD

			if (areaID === areaCode) {
				//Copy the data value into the JSON
				mapJSON[j].properties.LAD13NM = brexitConstituency
				mapJSON[j].properties.region = region
				mapJSON[j].properties.electorate = electorate
				mapJSON[j].properties.remain = remain
				mapJSON[j].properties.leave = leave
				mapJSON[j].properties.pctRemain = pctRemain
				mapJSON[j].properties.pctLeave = pctLeave
				mapJSON[j].properties.projEUContribution = projEUContribution
				mapJSON[j].properties.spendingPerVoter = spendingPerVoter
				mapJSON[j].properties.percentile = percentile
				mapJSON[j].properties.precedingPerCap = precedingPerCap
				mapJSON[j].properties.precedingProjEU = precedingProjEU
				mapJSON[j].properties.precedingElectorate = precedingElectorate
				mapJSON[j].properties.rejectedBallots = rejectedBallots
				mapJSON[j].properties.validVotes = validVotes
				mapJSON[j].properties.votesCast = votesCast
				mapJSON[j].properties.pctTurnout = pctTurnout
				mapJSON[j].properties.electorateRank = electorateRank
				mapJSON[j].properties.percapRank = percapRank
				mapJSON[j].properties.projEURank = projEURank
				mapJSON[j].properties.remainRank = remainRank
				mapJSON[j].properties.leaveRank = leaveRank

				//Stop looking through the JSON
				break;
			}
		}
	}

	var selectOptions = mapJSON.map((council) => {
		return {
			itemGroup: council.properties.region,
			itemValue: council.properties.LAD13CD,
			itemName: council.properties.LAD13NM
		}
	})

	var groupArray = []

	for (let i = 0; i < selectOptions.length; i++) {
		if (!groupArray.includes(selectOptions[i].itemGroup)) {
			groupArray.push(selectOptions[i].itemGroup)
		}
	}

	var selectGroups = groupArray.map((region) => {
		return {
			groupName: region
		}
	})

	jQuery.fn.d3Click = function () {
		this.each(function (i, e) {
			var evt = new MouseEvent("click");
			e.dispatchEvent(evt);
		});
	};

	function clickMap(id) {
		$(`#${id}`).d3Click()
	}

	$('#select').selectize({
		sortField: [{
				field: 'groupName',
				direction: 'asc'
      },
			{
				field: 'itemGroup',
				direction: 'asc'
      },
			{
				field: 'itemName',
				direction: 'asc'
      },
			{
				field: '$score'
      }
    ],
		onChange: clickMap,
		options: selectOptions,
		optgroups: selectGroups,
		optgroupField: 'itemGroup',
		optgroupLabelField: 'groupName',
		optgroupValueField: 'groupName',
		valueField: 'itemValue',
		labelField: 'itemName',
		searchField: ['itemGroup', 'itemName'],
		create: false
	});

	mapSVG.selectAll("path")
		.data(mapJSON)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", (d) => {
			return d.properties.LAD13CD
		})
		.attr("name", (d) => {
			return d.properties.LAD13NM
		})
		.classed('unclicked', true)
		.style("fill", (d) => {
			var value = d.properties.pctRemain;
			return color(value)
		})
		.attr('fill-opacity', d => spendingOpacity(d.properties.spendingPerVoter))
		.on("click", function (d, i) {
			d3.select('svg.legend-svg').moveToFront();
			var $dropdown = $('select#select')
			var selectize = $dropdown[0].selectize
			selectize.addItem(d.properties.LAD13CD)

			var header = document.querySelector('#dist-name')
			header.innerText = d.properties.LAD13NM

			var paths = d3.select('#map-div').selectAll('path')
				.classed('clicked', false)
				.classed('unclicked', true);

			var path = d3.select(this)
				.classed('clicked', true)
				.classed('unclicked', false);

			if (d.properties.region === "Scotland") {
				header.className = 'scotland'
			} else if (d.properties.region === "Wales") {
				header.className = 'wales'
			} else if (d.properties.region === "Northern Ireland") {
				header.className = 'northern-ireland'
			} else {
				header.className = 'england'
			}

			legendSVG.selectAll('rect')
				.data([d])
				.enter()
				.append('rect')
				.attr('x', d => `${legendXScale(d.properties.pctRemain) + legendMargin - legendOffset}px`)
				.attr('y', d => `${legendYScale(d.properties.percentile) + legendMargin - legendOffset}px`)
				.attr('width', `${legendOffset * 2}px`)
				.attr('height', `${legendOffset * 2}px`)
				.style('fill', 'black')
				.style("stroke", 'black')
				.style("stroke-width", '0.001px');

			drawPie(d, i)

			horizBar(d, {
				'scale': barWidthScalePC,
				'divID': "#pct-bar-percap",
				'keyNameSnake': "spending_per_voter",
				'keyNameCamel': "spendingPerVoter",
				'svg': barPerCapSVG
			})
			horizBar(d, {
				'scale': barWidthScaleElectorate,
				'divID': "#pct-bar-electorate",
				'keyNameSnake': "electorate",
				'keyNameCamel': "electorate",
				'svg': barElectorateSVG
			})
			horizBar(d, {
				'scale': barWidthScaleTotal,
				'divID': "#pct-bar-total",
				'keyNameSnake': "project_eu_contribution_gbp",
				'keyNameCamel': "projEUContribution",
				'svg': barTotalSVG
			})

			document.querySelector('#region > span').innerText = d.properties.region
			document.querySelector('#remain-voters > span').innerText = numeral(d.properties.remain).format('0,0')
			document.querySelector('#leave-voters > span').innerText = numeral(d.properties.leave).format('0,0')
			document.querySelector('#turnout > span').innerText = numeral(d.properties.pctTurnout / 100).format('0.[00]%')
			document.querySelector('#valid-votes > span').innerText = numeral(d.properties.validVotes).format('0,0')
			document.querySelector('#votes-cast > span').innerText = numeral(d.properties.votesCast).format('0,0')
			document.querySelector('#rejected-ballots > span').innerText = numeral(d.properties.rejectedBallots).format('0,0')

			if (d.properties.pctLeave > d.properties.pctRemain) {
				document.querySelector('#vote-rank span').innerHTML = `<strong>${numeral(d.properties.leaveRank).format('0o')} most Leave</strong><br>of 270 Leave districts<br>(398 total)`
			} else {
				document.querySelector('#vote-rank span').innerHTML = `<strong>${numeral(d.properties.remainRank).format('0o')} most Remain</strong><br>of 128 Remain districts<br>(398 total)`
			}

			document.querySelector('span#percap-spend').innerText = `£${numeral(d.properties.spendingPerVoter).format('£0,0.00')} (Ranked ${numeral(parseInt(d.properties.percapRank)).format('0o')}, ${numeral(parseInt(d.properties.percentile)).format('0o')} percentile, ${numeral(parseInt(d.properties.spendingPerVoter)/443.0366).format('0.[00]%')} of £443.04 median)`
			//of £1,013,925.17
			//median £443.0366
			document.querySelector('span#total-electorate').innerText = `${numeral(d.properties.electorate).format('0,0')} (Ranked ${numeral(parseInt(d.properties.electorateRank)).format('0o')}, ${numeral(parseInt(d.properties.electorate)/46475882).format('0.[00]%')} of 46,475,882)`
			document.querySelector('span#total-spend').innerText = `£${numeral(d.properties.projEUContribution).format('£0,0.00')} (Ranked ${numeral(parseInt(d.properties.projEURank)).format('0o')}, ${numeral(parseFloat(d.properties.projEUContribution)/100321726921.54).format('0.[000]%')} of £100,321,726,921.54)`
			d.properties.electorate
		});
}

Promise.all([
  d3.csv("pandas/output/spending-ranked.csv"),
  d3.json("local-area.json")
]).then(init);
// ########################################################################## //

// Mindset Interactive
// Luke Thorburn, 2021

// -------------------------------------------------------------------------- //

import * as d3 from "https://cdn.skypack.dev/d3@7";
const div = d3.selectAll("div");

let width = 900,
	height = 600,
	m = [40, 40, 90, 90],
	w = width - m[1] - m[3],
	h = height - m[0] - m[2],

	xScale, yScale,
	xAxis, yAxis,
	bars, caps,
	progress,
	progressText,
	floor, floorHeight,

	svg, data, interval,

	n = 100,
	step = 1;

// ########################################################################## //
// ########################################################################## //
// ########################################################################## //

function draw() {

	svg = d3.select("svg#svg")
		.attr("height", height)
		.attr("width", width);

	xScale = d3.scaleBand()
		.domain(data.map(d => d.rank))
		.range([m[3],width - m[1]])
		.paddingOuter(5);
		
	yScale = d3.scaleLinear()
		.domain([0,1])
		.range([h+m[0],m[0]]);
	
	xAxis = d3.axisBottom(xScale)
		.tickValues([1,10,20,30,40,50,60,70,80,90,100]);
	yAxis = d3.axisLeft(yScale);

	svg.append("g")
		.attr("transform", `translate(0,${m[0]+h})`)
		.call(xAxis);

	svg.append("g")
		.attr("transform", `translate(${m[3]},0)`)
		.call(yAxis);

	svg.append("text")
		.text("Rank of Candidate (by selection probability)")
		.attr("text-anchor", "middle")
		.attr("x", xScale(n/2))
		.attr("y", height - 40);
	svg.append("text")
		.text("Selection Probability")
		.attr("text-anchor", "middle")
		.attr("transform", "rotate(-90,40," + (m[1] + h/2) + ")")
		.attr("x", 40)
		.attr("y", m[1] + h/2);

	bars = svg.selectAll("rect.bar")
		.data(data)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", d => xScale(d.rank) + 0.1*xScale.bandwidth())
		.attr("width", 0.8*xScale.bandwidth())
		.attr("y", d => yScale(d.p))
		.attr("height", d => yScale(0) - yScale(d.p))
		.attr("fill", "#29b6f6");

	caps = svg.selectAll("rect.cap")
		.data(data)
		.enter()
		.append("rect")
		.attr("class", "cap")
		.attr("x", d => xScale(d.rank) + 0.1*xScale.bandwidth())
		.attr("width", 0.8*xScale.bandwidth())
		.attr("y", d => yScale(d.p))
		.attr("height", 1)
		.attr("fill", "#039be5");

	progress = svg.selectAll("line.progress")
		.data([{ step }])
		.enter()
		.append("line")
		.attr("class", "progress")
		.attr("x1", xScale(n - step + 1))
		.attr("x2", xScale(n - step + 1))
		.attr("y1", m[0])
		.attr("y2", m[0] + h)
		.attr("stroke", "#cdcdcd")
		.attr("stroke-width", 1);

	progressText = svg.selectAll("text.progress")
		.data([{ step }])
		.enter()
		.append("text")
		.attr("class", "progress")
		.attr("x", xScale(n - step + 1))
		.attr("dx", 10)
		.attr("y", m[0])
		.text(`STEP ${step}`);

	floorHeight = Math.min(...data.filter(d => d.rank <= n - step + 1).map(d => d.p));
	floor = svg.selectAll("line.floor")
		.data([{ step }])
		.enter()
		.append("line")
		.attr("class", "floor")
		.attr("x1", xScale(n - step + 1))
		.attr("x2", xScale.range()[1])
		.attr("y1", yScale(floorHeight) + 1)
		.attr("y2", yScale(floorHeight) + 1)
		.attr("stroke", "red")
		.attr("stroke-width", 1);

}

function update() {

	bars.data(data)
		.transition()
		.attr("x", d => xScale(d.rank) + 0.1*xScale.bandwidth())
		.attr("y", d => yScale(d.p))
		.attr("height", d => yScale(0) - yScale(d.p));

	caps.data(data)
		.transition()
		.attr("x", d => xScale(d.rank) + 0.1*xScale.bandwidth())
		.attr("y", d => yScale(d.p));

	progress
		.transition()
		.attr("x1", xScale(n - step + 1))
		.attr("x2", xScale(n - step + 1));

	progressText
		.transition()
		.attr("x", xScale(n - step + 1))
		.text(`STEP ${step}`);

	floorHeight = Math.min(...data.filter(d => d.rank <= n - step + 1).map(d => d.p));
	floor
		.transition()
		.attr("x1", xScale(n - step + 1))
		.attr("y1", yScale(floorHeight) + 1)
		.attr("y2", yScale(floorHeight) + 1);
}


// ########################################################################## //
// ########################################################################## //
// ########################################################################## //

function updateRanks(data) {

	let sorted = JSON.parse(JSON.stringify(data));
	
	sorted.sort((a, b) => b.p - a.p);
	sorted = sorted.map(d => d.id);

	data = data.map(function(d) {
		d.rank = sorted.indexOf(d.id) + 1;
		return d;
	})

	return data;

}

function generateData(n) {
	
	let data = [];

	function skewer(x, a) {
		return (Math.exp(a*x - a) - Math.exp(-1*a)) / (Math.exp(0) - Math.exp(-1*a));
	}
	
	for (let k = 0; k < n; k++) {
		data.push({
			id: n - k,
			rank: n - k,
			p: skewer(Math.random(), 3)
		})
	}

	return data;
}

function performRandomSwap(data) {

	let ids = data.map(d => d.id),
		eligibleIds = data
			.filter(d => d.rank <= n - step + 1)
			.filter(d => d.rank > 1)
			.map(d => d.id),
		fromId = eligibleIds[Math.floor(Math.random()*eligibleIds.length)];

	let toId = eligibleIds[Math.min(Math.max(eligibleIds.indexOf(fromId) + Math.floor(5*(Math.random()-1)), 0), eligibleIds.length-1)];
	
	let fromIdx = ids.indexOf(fromId),
		toIdx = ids.indexOf(toId),
		fromP = data[fromIdx].p,
		toP = data[toIdx].p;

	data[fromIdx].p = toP;
	data[toIdx].p = fromP;

	return data;

}

function updateData(data) {

	function skewer(x, a) {
		return (Math.exp(a*x - a) - Math.exp(-1*a)) / (Math.exp(0) - Math.exp(-1*a));
	}

	let ceilingHeight = Math.max(...data.filter(d => d.rank <= n - step + 1).map(d => d.p));

	let newFloor = 0.2 * (1 - skewer(1 - (step/n), 60));
	newFloor = Math.max(newFloor, floorHeight);

	if (step < n) {
		
		data = data.map(function(d) {

			if (d.rank <= n - step + 2) {
				let pRelative = (d.p - floorHeight) / (ceilingHeight - floorHeight);
				d.p = newFloor + (1-newFloor)*skewer(pRelative, 0.25*skewer(1-(step/n),2));
			}

			return d;
		})

		let nSwaps = 3 + Math.floor(10*Math.random());
		for (let k = 0; k < nSwaps; k++) {
			data = performRandomSwap(data);
		}
	}

	data = updateRanks(data);

	return data;
}

// ########################################################################## //
// ########################################################################## //
// ########################################################################## //

data = generateData(n);
draw();
data = updateRanks(data);
update();

function reset() {
	if (interval !== undefined) {
		interval.stop();
	}
	data = generateData(n);
	data = updateRanks(data);
	step = 1;
	update();
	document.querySelector("#play").classList.remove("hide");
	document.querySelector("#pause").classList.add("hide");
}
document.querySelector("#reset").onclick = reset;

function stepForward() {
	if (step < n) {
		step++;
		data = updateData(data);
		update();
	}
}
document.querySelector("#step-forward").onclick = stepForward;

function play() {
	
	document.querySelector("#play").classList.add("hide");
	document.querySelector("#pause").classList.remove("hide");
	
	interval = d3.interval((elapsed) => {
		stepForward();
		if (step >= n) {
			interval.stop();
			document.querySelector("#play").classList.add("hide");
			document.querySelector("#pause").classList.add("hide");
		}
	}, 200);

}
document.querySelector("#play").onclick = play;

function pause() {
	
	document.querySelector("#play").classList.remove("hide");
	document.querySelector("#pause").classList.add("hide");
	
	interval.stop();

}
document.querySelector("#pause").onclick = pause;

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

	svg, data,

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
		.attr("fill", "#ff0000");

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
		.attr("stroke", "blue")
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
	
	for (let k = 0; k < n; k++) {
		data.push({
			id: n - k,
			rank: n - k,
			p: Math.random()
		})
	}

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
	data = generateData(n);
	data = updateRanks(data);
	step = 1;
	update();
}
document.querySelector("#reset").onclick = reset;

function stepForward() {
	if (step < n) {
		step++;
		update();
	}
}
document.querySelector("#step-forward").onclick = stepForward;


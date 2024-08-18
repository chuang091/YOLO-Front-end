import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

function Dashboard() {
  const [annotations, setAnnotations] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  const classColors = {
    "0": "rgba(255, 0, 0, 0.5)",
    "1": "rgba(0, 255, 0, 0.5)",
    "2": "rgba(0, 0, 255, 0.5)",
    "3": "rgba(255, 255, 0, 0.5)",
    "4": "rgba(0, 255, 255, 0.5)",
    "5": "rgba(255, 0, 255, 0.5)",
    "6": "rgba(128, 0, 0, 0.5)",
    "7": "rgba(0, 128, 0, 0.5)",
    "8": "rgba(0, 0, 128, 0.5)",
    "9": "rgba(128, 128, 0.5)",
    "10": "rgba(0, 128, 128, 0.5)"
  };

  useEffect(() => {
    axios.get('http://localhost:5500/api/annotations')
      .then(response => {
        console.log('Fetched annotations:', response.data);
        setAnnotations(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the annotations!', error);
      });
  }, []);

  useEffect(() => {
    if (annotations.length === 0) return;

    // 計算各類別的數量
    const classCounts = {};
    annotations.forEach(annotation => {
      if (classCounts[annotation.class]) {
        classCounts[annotation.class]++;
      } else {
        classCounts[annotation.class] = 1;
      }
    });

    const data = Object.keys(classCounts).map(key => ({
      class: key,
      count: classCounts[key],
    }));

    // Bar Chart
    const barSvg = d3.select("#bar-chart")
      .attr("width", 500)
      .attr("height", 300);

    const x = d3.scaleBand()
      .domain(data.map(d => d.class))
      .range([0, 400])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .range([200, 0]);

    barSvg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.class))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => 200 - y(d.count))
      .attr("fill", d => classColors[d.class])
      .on("click", (event, d) => setSelectedClass(d.class));

    // Pie Chart
    const pieSvg = d3.select("#pie-chart")
      .attr("width", 300)
      .attr("height", 300)
      .append("g")
      .attr("transform", "translate(150,150)");

    const pie = d3.pie()
      .value(d => d.count);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(100);

    const arcs = pieSvg.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => classColors[d.data.class])
      .on("click", (event, d) => setSelectedClass(d.data.class));

    // Interactive effect between bar and pie charts
    if (selectedClass) {
      barSvg.selectAll(".bar")
        .attr("opacity", d => d.class === selectedClass ? 1 : 0.5);

      pieSvg.selectAll(".arc path")
        .attr("opacity", d => d.data.class === selectedClass ? 1 : 0.5);
    } else {
      barSvg.selectAll(".bar").attr("opacity", 1);
      pieSvg.selectAll(".arc path").attr("opacity", 1);
    }
  }, [annotations, selectedClass]);

  return (
    <div>
      <h2>Dashboard</h2>
      <div id="charts">
        <svg id="bar-chart"></svg>
        <svg id="pie-chart"></svg>
      </div>
    </div>
  );
}

export default Dashboard;

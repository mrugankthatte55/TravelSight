let currentlyShownDestinations = {};

function renderMatrix(data) {
    const margin = { top: 100, right: 50, bottom: 50, left: 220 };
    const cellWidth = 140;
    const cellHeight = 80;
    const padding = 25;

    const category = d3.select("#category").property("value");
    const allDestinations = Array.from(
        new Set(data.filter(d => d.Category === category).map(d => d.Destination))
    );

    if (!currentlyShownDestinations[category]) {
        currentlyShownDestinations[category] = allDestinations.slice(0, 5);
    }

    const filteredData = data.filter(
        d => d.Category === category && currentlyShownDestinations[category].includes(d.Destination)
    );

    updateSearchDropdown(allDestinations, currentlyShownDestinations[category]);
    updateSelectedDestinations(currentlyShownDestinations[category]);

    const themes = ["Foods", "Attractions", "Scenery", "Services", "Atmospheres"];
    const destinations = currentlyShownDestinations[category];

    const width = themes.length * (cellWidth + padding) + margin.left + margin.right;
    const height = destinations.length * (cellHeight + padding) + margin.top + margin.bottom;

    const svg = d3.select("#visualization svg")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll("*").remove();

    const xScale = d3.scaleBand()
        .domain(themes)
        .range([0, themes.length * (cellWidth + padding)])
        .padding(0.3);

    const yScale = d3.scaleBand()
        .domain(destinations)
        .range([0, destinations.length * (cellHeight + padding)])
        .padding(0.3);

    svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .call(d3.axisTop(xScale))
        .selectAll("text")
        .style("font-size", "18px")
        .style("font-weight", "bold");

    svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "18px")
        .style("font-weight", "bold");

    const positiveColor = d3.scaleLinear().domain([0.5, 1]).range(["#e5f5e0", "#31a354"]);
    const negativeColor = d3.scaleLinear().domain([0, 0.5]).range(["#fee0d2", "#de2d26"]);

    const maxEntityCount = d3.max(data, d => Math.max(d["Positive Count"], d["Negative Count"]));
    const entityScale = d3.scaleLinear().domain([0, maxEntityCount]).range([0.2, 0.8]);

    svg.selectAll(".matrix-cell")
        .data(filteredData)
        .join("g")
        .attr("transform", d => `translate(${xScale(d["Cognitive Theme"]) + margin.left},${yScale(d.Destination) + margin.top})`)
        .each(function (d) {
            const group = d3.select(this);

            const positiveEntityRatio = entityScale(d["Positive Count"]);
            const negativeEntityRatio = entityScale(d["Negative Count"]);

            const outerWidth = cellWidth / 2;
            const outerHeight = cellHeight;

            group.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", outerWidth)
                .attr("height", outerHeight)
                .attr("fill", positiveColor(d["Positive Sentiment"]));

            group.append("rect")
                .attr("x", outerWidth * (1 - positiveEntityRatio))
                .attr("y", (1 - positiveEntityRatio) * outerHeight / 2)
                .attr("width", outerWidth * positiveEntityRatio)
                .attr("height", outerHeight * positiveEntityRatio)
                .attr("fill", "#2b8c3a");

            group.append("rect")
                .attr("x", outerWidth)
                .attr("y", 0)
                .attr("width", outerWidth)
                .attr("height", outerHeight)
                .attr("fill", negativeColor(d["Negative Sentiment"]));

            group.append("rect")
                .attr("x", outerWidth)
                .attr("y", (1 - negativeEntityRatio) * outerHeight / 2)
                .attr("width", outerWidth * negativeEntityRatio)
                .attr("height", outerHeight * negativeEntityRatio)
                .attr("fill", "#c22525");
        });
}

function updateSearchDropdown(allDestinations, shownDestinations) {
    const dropdown = d3.select("#search");
    const remainingDestinations = allDestinations.filter(dest => !shownDestinations.includes(dest));
    dropdown.selectAll("option").remove();
    dropdown.append("option").text("Select a destination").attr("value", "").attr("disabled", true).attr("selected", true);
    remainingDestinations.forEach(dest => {
        dropdown.append("option").text(dest).attr("value", dest);
    });
}

function updateSelectedDestinations(shownDestinations) {
    const container = d3.select("#selected-destinations");
    container.selectAll("*").remove();

    shownDestinations.forEach(dest => {
        const div = container.append("div");
        div.append("span").text(dest).style("flex-grow", "1").style("text-align", "left");
        div.append("button")
            .text("Delete")
            .on("click", () => removeDestination(dest));
    });
}

function addDestination() {
    const category = d3.select("#category").property("value");
    const selectedDestination = d3.select("#search").property("value");
    if (selectedDestination && !currentlyShownDestinations[category].includes(selectedDestination)) {
        currentlyShownDestinations[category].push(selectedDestination);
        
        // Get the current view
        const currentView = d3.select(".view-btn.selected").attr("id");
        
        d3.csv("sentiment_matrix_historical.csv").then(data => {
            // Update the destinations list first
            const allDestinations = Array.from(
                new Set(data.filter(d => d.Category === category).map(d => d.Destination))
            );
            updateSearchDropdown(allDestinations, currentlyShownDestinations[category]);
            updateSelectedDestinations(currentlyShownDestinations[category]);
            
            // Render the appropriate visualization
            if (currentView === "overview") {
                renderMatrix(data);
            } else if (currentView === "radar_detail") {
                renderRadarChart(data);
            } else if (currentView === "time_series") {
                renderTimeSeries(data);
            }
        });
    }
}

function removeDestination(destination) {
    const category = d3.select("#category").property("value");
    currentlyShownDestinations[category] = currentlyShownDestinations[category].filter(dest => dest !== destination);
    
    // Get the current view
    const currentView = d3.select(".view-btn.selected").attr("id");
    
    d3.csv("sentiment_matrix_historical.csv").then(data => {
        // Update the destinations list first
        const allDestinations = Array.from(
            new Set(data.filter(d => d.Category === category).map(d => d.Destination))
        );
        updateSearchDropdown(allDestinations, currentlyShownDestinations[category]);
        updateSelectedDestinations(currentlyShownDestinations[category]);
        
        // Render the appropriate visualization
        if (currentView === "overview") {
            renderMatrix(data);
        } else if (currentView === "radar_detail") {
            renderRadarChart(data);
        } else if (currentView === "time_series") {
            renderTimeSeries(data);
        }
    });
}

function processWordCloudData(data, destination, theme) {
    return data
        .filter(d => d.Location === destination && d.Category === theme.toLowerCase())
        .reduce((acc, curr) => {
            const existing = acc.find(item => item.text === curr.Word);
            if (existing) {
                existing.size += curr.Frequency;
            } else {
                acc.push({
                    text: curr.Word,
                    size: curr.Frequency
                });
            }
            return acc;
        }, [])
        .sort((a, b) => b.size - a.size)
        .slice(0, 6);
}

function renderRadarChart(data) {
    const margin = { top: 50, right: 150, bottom: 150, left: 150 };  // Increase all margins
    const smallChartSize = 600;  // Size for each individual radar chart
    const chartsPerRow = 2;  // Number of charts per row
    
    const category = d3.select("#category").property("value");
    const destinations = currentlyShownDestinations[category];
    const themes = ["Foods", "Attractions", "Scenery", "Services", "Atmospheres"];
    
    // Calculate grid layout dimensions
    const numRows = Math.ceil(destinations.length / chartsPerRow);
    const width = smallChartSize * chartsPerRow + margin.left + margin.right;
    // Adjust height calculation to include proper spacing between rows
    const height = (smallChartSize + margin.top) * numRows + margin.bottom;

    const svg = d3.select("#visualization svg")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll("*").remove();

    const filteredData = data.filter(d => 
        d.Category === category && destinations.includes(d.Destination)
    );
    d3.csv("location_words_frequency.csv").then(function (wordCloudData) {
    destinations.forEach((destination, index) => {
        // Calculate position in the grid with proper spacing
        const row = Math.floor(index / chartsPerRow);
        const col = index % chartsPerRow;
        // Adjust translateX and translateY to ensure proper spacing
        const translateX = col * (smallChartSize + margin.right) + margin.left;
        const translateY = row * (smallChartSize + margin.top) + margin.top;

        // Rest of the radar chart drawing code remains the same...
        const chartGroup = svg.append("g")
            .attr("transform", `translate(${translateX},${translateY})`);

        // Process data for this destination
        const destinationData = themes.map(theme => {
            const match = filteredData.find(d => 
                d.Destination === destination && d["Cognitive Theme"] === theme
            );
            return {
                theme: theme,
                value: match ? parseFloat(match["Positive Sentiment"]) : 0,
                count: match ? parseInt(match["Total Count"]) : 0
            };
        });

        // Radar chart parameters
        const centerX = smallChartSize / 2;
        const centerY = smallChartSize / 2;
        const innerRadius = smallChartSize / 4.5;
        const outerRadius = smallChartSize / 2.5;
        const angleSlice = (Math.PI * 2) / themes.length;

        // Add destination title
        chartGroup.append("text")
            .attr("x", centerX)
            .attr("y", 1)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(destination);

        // Draw the circles
        chartGroup.append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", innerRadius)
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);

        chartGroup.append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", outerRadius)
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);

        // Draw axis lines
        themes.forEach((theme, i) => {
            const angle = i * angleSlice;
            const lineX = centerX + outerRadius * Math.cos(angle - Math.PI / 2);
            const lineY = centerY + outerRadius * Math.sin(angle - Math.PI / 2);
            
            chartGroup.append("line")
                .attr("x1", centerX)
                .attr("y1", centerY)
                .attr("x2", lineX)
                .attr("y2", lineY)
                .attr("stroke", "#ccc")
                .attr("stroke-width", 1);

            // Add theme labels
            const labelRadius = outerRadius + 45;
            const labelX = centerX + labelRadius * Math.cos(angle - Math.PI / 2);
            const labelY = centerY + labelRadius * Math.sin(angle - Math.PI / 2);
            
            chartGroup.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("font-size", "12px")
                .text(theme);
        });
        themes.forEach((theme, i) => {
            const angle = i * angleSlice;
            const wordCloudX = centerX + (outerRadius + 100) * Math.cos(angle - Math.PI / 2);
            const wordCloudY = centerY + (outerRadius + 100) * Math.sin(angle - Math.PI / 2);

            const wordCloudGroup = chartGroup.append("g")
                .attr("transform", `translate(${wordCloudX},${wordCloudY})`);

            const processedData = processWordCloudData(wordCloudData, destination, theme);

            // Add word cloud
            wordCloudGroup.selectAll("text")
                .data(processedData)
                .enter()
                .append("text")
                .attr("text-anchor", "middle")
                .attr("transform", (d, i) => `translate(0,${i * 15})`)
                .style("font-size", d => `${d.size / 10}px`)
                .text(d => d.text);
        });
        // Scales for data points
        const rScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, innerRadius * 0.8]);

        // Calculate points for the radar
        const points = destinationData.map((d, i) => {
            const angle = i * angleSlice;
            return {
                x: centerX + rScale(d.value) * Math.cos(angle - Math.PI / 2),
                y: centerY + rScale(d.value) * Math.sin(angle - Math.PI / 2),
                value: d.value,
                count: d.count
            };
        });

        // Draw the filled polygon
        const polygonPath = points.map((p, i) => {
            return (i === 0 ? "M" : "L") + p.x + "," + p.y;
        }).join("") + "Z";

        chartGroup.append("path")
            .attr("d", polygonPath)
            .attr("fill", "#800080")
            .attr("fill-opacity", 0.2)
            .attr("stroke", "#800080")
            .attr("stroke-width", 1.5);

        // Add data points and labels
        points.forEach((point, i) => {
            chartGroup.append("circle")
                .attr("cx", point.x)
                .attr("cy", point.y)
                .attr("r", 4)
                .attr("fill", "#800080");

            chartGroup.append("text")
                .attr("x", point.x)
                .attr("y", point.y - 10)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .text(point.value.toFixed(2));

            chartGroup.append("text")
                .attr("x", point.x)
                .attr("y", point.y + 15)
                .attr("text-anchor", "middle")
                .style("font-size", "9px")
                .text(`n=${point.count}`);
        });
    });
});
}

function selectView(viewType) {
    // Update button styles
    d3.selectAll(".view-btn").classed("selected", false);
    d3.select(`#${viewType}`).classed("selected", true);

    d3.csv("sentiment_matrix_historical.csv").then(function(data) {
        if (viewType === "overview") {
          renderMatrix(data);
        } else if (viewType === "radar_detail") {
          renderRadarChart(data);
        } else if (viewType === "time_series") {
          renderTimeSeries(data);
        }

    });
}

d3.csv("sentiment_matrix_historical.csv").then(function (data) {
    renderMatrix(data);

    d3.select("#category").on("change", function () {
        const category = d3.select(this).property("value");
        
        // Reset currentlyShownDestinations for the new category if it doesn't exist
        if (!currentlyShownDestinations[category]) {
            d3.csv("sentiment_matrix_historical.csv").then(data => {
                const allDestinations = Array.from(
                    new Set(data.filter(d => d.Category === category).map(d => d.Destination))
                );
                currentlyShownDestinations[category] = allDestinations.slice(0, 5);
                
                // Update the interaction lists
                updateSearchDropdown(allDestinations, currentlyShownDestinations[category]);
                updateSelectedDestinations(currentlyShownDestinations[category]);
                
                // Get the current view and render appropriate visualization
                const currentView = d3.select(".view-btn.selected").attr("id");
                if (currentView === "overview") {
                    renderMatrix(data);
                } else if (currentView === "radar_detail") {
                    renderRadarChart(data);
                } else if (currentView === "time_series") {
                    renderTimeSeries(data);
                }
            });
        } else {
            // If the category already exists, update lists and render current view
            d3.csv("sentiment_matrix_historical.csv").then(data => {
                const allDestinations = Array.from(
                    new Set(data.filter(d => d.Category === category).map(d => d.Destination))
                );
                
                // Update the interaction lists
                updateSearchDropdown(allDestinations, currentlyShownDestinations[category]);
                updateSelectedDestinations(currentlyShownDestinations[category]);
                
                const currentView = d3.select(".view-btn.selected").attr("id");
                if (currentView === "overview") {
                    renderMatrix(data);
                } else if (currentView === "radar_detail") {
                    renderRadarChart(data);
                } else if (currentView === "time_series") {
                    renderTimeSeries(data);
                }
            });
        }
    });
});
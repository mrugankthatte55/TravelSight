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
        .slice(0, 5);
}

function renderRadarChart(data) {
    const margin = { top: 100, right: 100, bottom: 100, left: 100 };
    const width = 800;
    const height = 800;

    const svg = d3.select("#visualization svg")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll("*").remove();

    const category = d3.select("#category").property("value");
    const destinations = currentlyShownDestinations[category];
    const themes = ["Foods", "Attractions", "Scenery", "Services", "Atmospheres"];

    const filteredData = data.filter(d => 
        d.Category === category && destinations.includes(d.Destination)
    );

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const innerRadius = Math.min(width, height) / 4;
    const outerRadius = Math.min(width, height) / 2.2;
    const angleSlice = (Math.PI * 2) / themes.length;

    // Draw the circles
    chartGroup.append("circle")
        .attr("r", innerRadius)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

    chartGroup.append("circle")
        .attr("r", outerRadius)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

    // Draw inner axis lines
    themes.forEach((theme, i) => {
        const angle = i * angleSlice;
        const lineX = innerRadius * Math.cos(angle - Math.PI / 2);
        const lineY = innerRadius * Math.sin(angle - Math.PI / 2);

        chartGroup.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", lineX)
            .attr("y2", lineY)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
    });

    // Draw outer axis lines
    themes.forEach((theme, i) => {
        const angle = (i + 0.5) * angleSlice;
        const lineStartX = innerRadius * Math.cos(angle - Math.PI / 2);
        const lineStartY = innerRadius * Math.sin(angle - Math.PI / 2);
        const lineEndX = outerRadius * Math.cos(angle - Math.PI / 2);
        const lineEndY = outerRadius * Math.sin(angle - Math.PI / 2);

        chartGroup.append("line")
            .attr("x1", lineStartX)
            .attr("y1", lineStartY)
            .attr("x2", lineEndX)
            .attr("y2", lineEndY)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
    });

    // Add theme labels for inner circle
    themes.forEach((theme, i) => {
        const angle = i * angleSlice;
        const innerLabelRadius = innerRadius * 0.85;
        const innerLabelX = innerLabelRadius * Math.cos(angle - Math.PI / 2);
        const innerLabelY = innerLabelRadius * Math.sin(angle - Math.PI / 2);

        chartGroup.append("text")
            .attr("x", innerLabelX)
            .attr("y", innerLabelY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-size", "12px")
            .text(theme);
    });

    const rScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, innerRadius * 0.8]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    destinations.forEach((destination, index) => {
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

        const points = destinationData.map((d, i) => {
            const angle = i * angleSlice;  // Changed from (i + 0.5)
            return {
                x: rScale(d.value) * Math.cos(angle - Math.PI / 2),
                y: rScale(d.value) * Math.sin(angle - Math.PI / 2),
                value: d.value,
                count: d.count
            };
        });

        const polygonPath = points.map((p, i) => {
            return (i === 0 ? "M" : "L") + p.x + "," + p.y;
        }).join("") + "Z";

        chartGroup.append("path")
            .attr("d", polygonPath)
            .attr("fill", colorScale(index))
            .attr("fill-opacity", 0)
            .attr("stroke", colorScale(index))
            .attr("stroke-width", 1.5)
            .attr("data-destination", destination)
            .on("click", function() {
                const clickedDestination = d3.select(this).attr("data-destination");
                showWordCloudAndLabels(clickedDestination, destinationData, points);
            });
    });

    function showWordCloudAndLabels(destination, destinationData, points) {
        // Remove existing word cloud, labels, and destination name
        chartGroup.selectAll(".word-cloud").remove();
        chartGroup.selectAll(".data-label").remove();
        svg.selectAll(".destination-name").remove();

        // Add destination title
        svg.append("text")
            .attr("class", "destination-name")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .text(destination);

        // Add data points and labels
        points.forEach((point, i) => {
            chartGroup.append("text")
                .attr("class", "data-label")
                .attr("x", point.x)
                .attr("y", point.y - 10)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .text(point.value.toFixed(2));

            chartGroup.append("text")
                .attr("class", "data-label")
                .attr("x", point.x)
                .attr("y", point.y + 15)
                .attr("text-anchor", "middle")
                .style("font-size", "9px")
                .text(`n=${point.count}`);
        });

        // Add word cloud
        d3.csv("location_words_frequency.csv").then(function (wordCloudData) {
            themes.forEach((theme, i) => {
                const angle = (i + 0.5) * angleSlice;
                const sectorStartAngle = angle - angleSlice / 2;
                const sectorEndAngle = angle + angleSlice / 2;
                const sectorInnerRadius = outerRadius;
                const sectorOuterRadius = outerRadius + 100;
        
                const wordCloudGroup = chartGroup.append("g")
                    .attr("class", "word-cloud");
        
                const processedData = processWordCloudData(wordCloudData, destination, theme);
        
                const fontSizeScale = d3.scaleLinear()
                    .domain([0, d3.max(processedData, d => d.size)])
                    .range([10, 20]);
        
                const words = wordCloudGroup.selectAll("text")
                    .data(processedData)
                    .enter()
                    .append("text")
                    .attr("text-anchor", "middle")
                    .style("font-size", d => `${fontSizeScale(d.size)}px`)
                    .style("fill", colorScale(destinations.indexOf(destination)))
                    .text(d => d.text);
        
                // Calculate positions with better spacing
                processedData.forEach((d, i) => {
                    const spacing = (sectorEndAngle - sectorStartAngle) / (processedData.length);
                    const angle = sectorStartAngle + spacing * (i + 0.5);
                    const radius = sectorInnerRadius - 100 + (sectorOuterRadius - sectorInnerRadius) * 0.3;
                    d.x = radius * Math.cos(angle);
                    d.y = radius * Math.sin(angle);
                });
        
                words
                    .attr("transform", d => `translate(${d.x},${d.y})`)
                    .style("text-anchor", "middle");
            });
        });
    }
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
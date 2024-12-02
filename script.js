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
        d3.csv("sentiment_matrix_historical.csv").then(data => renderMatrix(data));
    }
}

function removeDestination(destination) {
    const category = d3.select("#category").property("value");
    currentlyShownDestinations[category] = currentlyShownDestinations[category].filter(dest => dest !== destination);
    d3.csv("sentiment_matrix_historical.csv").then(data => renderMatrix(data));
}

function renderRadarChart(data) {
    const margin = { top: 70, right: 50, bottom: 50, left: 70 };
    const width = 800;
    const height = 800;

    const svg = d3.select("#visualization svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove();

    const category = d3.select("#category").property("value");
    const filteredData = data.filter(d => d.Category === category);

    // Get unique destinations and themes
    const destinations = Array.from(new Set(filteredData.map(d => d.Destination)));
    const themes = ["Foods", "Attractions", "Scenery", "Services", "Atmospheres"];

    // Process data for radar chart
    const firstDest = destinations[0];
    const radarData = themes.map(theme => {
        const match = filteredData.find(d => d.Destination === firstDest && d["Cognitive Theme"] === theme);
        return {
            theme: theme,
            value: match ? parseFloat(match["Positive Sentiment"]) : 0,
            count: match ? parseInt(match["Total Count"]) : 0
        };
    });

    // Radar chart parameters
    const centerX = width / 2 + margin.left;
    const centerY = height / 2 + margin.top;
    const innerRadius = Math.min(width, height) / 4.5;  // Smaller inner circle
    const outerRadius = Math.min(width, height) / 2.5;  // Bigger outer circle
    const angleSlice = (Math.PI * 2) / themes.length;
    const offsetAngle = angleSlice / 2;

    // Define the themes and their associated words
    const themeData = [
        { 
            theme: "Foods", 
            words: ["Delicious", "Cuisine", "Restaurant", "Meals", "Fresh", "Menu", "Taste", "Local", "Dining", "Food"]
        },
        { 
            theme: "Attractions", 
            words: ["Sightseeing", "Tourist", "Historic", "Cultural", "Famous", "Popular", "Landmark", "Visit", "Monument", "Site"]
        },
        { 
            theme: "Scenery", 
            words: ["Beautiful", "Nature", "Landscape", "View", "Scenic", "Picture", "Natural", "Environment", "Stunning", "Visual"]
        },
        { 
            theme: "Services", 
            words: ["Staff", "Helpful", "Friendly", "Service", "Professional", "Clean", "Quality", "Efficient", "Support", "Care"]
        },
        { 
            theme: "Atmosphere", 
            words: ["Ambiance", "Comfortable", "Relaxing", "Peaceful", "Pleasant", "Quiet", "Cozy", "Modern", "Space", "Mood"]
        }
    ];

    // Draw the two main circles
    svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", innerRadius)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

    svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", outerRadius)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

    // Helper function to check word placement collision
    function checkCollision(newX, newY, existingPositions, padding = 20) {
        for (let pos of existingPositions) {
            const dx = newX - pos.x;
            const dy = newY - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < padding) return true;
        }
        return false;
    }

    // Draw divisions and word clouds
    const existingWordPositions = [];
    
    themeData.forEach((theme, i) => {
        const angle = i * angleSlice;
        
        // Inner circle division
        const innerLineX = centerX + innerRadius * Math.cos(angle - Math.PI / 2);
        const innerLineY = centerY + innerRadius * Math.sin(angle - Math.PI / 2);
        
        svg.append("line")
            .attr("x1", centerX)
            .attr("y1", centerY)
            .attr("x2", innerLineX)
            .attr("y2", innerLineY)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);

        // Outer circle division (dotted)
        const outerAngle = angle + offsetAngle;
        const innerX = centerX + innerRadius * Math.cos(outerAngle - Math.PI / 2);
        const innerY = centerY + innerRadius * Math.sin(outerAngle - Math.PI / 2);
        const outerX = centerX + outerRadius * Math.cos(outerAngle - Math.PI / 2);
        const outerY = centerY + outerRadius * Math.sin(outerAngle - Math.PI / 2);

        svg.append("line")
            .attr("x1", innerX)
            .attr("y1", innerY)
            .attr("x2", outerX)
            .attr("y2", outerY)
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "4,4")
            .attr("stroke-width", 1);

        // Add theme label
        svg.append("text")
            .attr("x", centerX + (innerRadius - 20) * Math.cos(angle - Math.PI / 2))
            .attr("y", centerY + (innerRadius - 20) * Math.sin(angle - Math.PI / 2))
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#800080")
            .text(theme.theme);

        // Add word cloud with improved positioning
        const wordStartRadius = innerRadius + 40;
        const wordEndRadius = outerRadius - 40;
        const sectorPadding = angleSlice * 0.1; // 10% padding on each side of the sector

        theme.words.forEach((word, j) => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 50;

            while (!placed && attempts < maxAttempts) {
                const sectorStartAngle = angle - Math.PI/2 - angleSlice/2 + sectorPadding;
                const sectorEndAngle = angle - Math.PI/2 + angleSlice/2 - sectorPadding;
                
                // Distribute words more evenly using j index
                const baseRadius = wordStartRadius + (j / theme.words.length) * (wordEndRadius - wordStartRadius);
                const radiusJitter = (Math.random() - 0.5) * (wordEndRadius - wordStartRadius) * 0.2;
                const wordRadius = baseRadius + radiusJitter;
                
                // Calculate angle with controlled randomness
                const angleRange = sectorEndAngle - sectorStartAngle;
                const wordAngle = sectorStartAngle + (j / theme.words.length + Math.random() * 0.3) * angleRange;

                const wordX = centerX + wordRadius * Math.cos(wordAngle);
                const wordY = centerY + wordRadius * Math.sin(wordAngle);

                if (!checkCollision(wordX, wordY, existingWordPositions)) {
                    const fontSize = 11 + Math.random() * 3;

                    svg.append("text")
                        .attr("x", wordX)
                        .attr("y", wordY)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .style("font-size", `${fontSize}px`)
                        .style("fill", "#666")
                        .text(word);

                    existingWordPositions.push({x: wordX, y: wordY});
                    placed = true;
                }
                attempts++;
            }
        });
    });

    // Scales for data points
    const rScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, innerRadius * 0.6]);

    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(radarData, d => d.count)])
        .range([4, 20]);

    // Calculate points for the radar
    const points = radarData.map((d, i) => {
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

    svg.append("path")
        .attr("d", polygonPath)
        .attr("fill", "#800080")
        .attr("fill-opacity", 0.2)
        .attr("stroke", "#800080")
        .attr("stroke-width", 1.5);

    // Add labels for data points
    points.forEach((point, i) => {
        // Add value label
        svg.append("text")
            .attr("x", point.x)
            .attr("y", point.y - 15)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(point.value.toFixed(2));

        // Add count label
        svg.append("text")
            .attr("x", point.x)
            .attr("y", point.y + 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(`n=${point.count}`);
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
        const currentView = d3.select(".view-btn.selected").attr("id");
        if (currentView === "overview") {
            renderMatrix(data);
        } else if (currentView === "radar_detail") {
            renderRadarChart(data);
        } else if (currentView === "time_series") {
            renderTimeSeries(data);
        }
    });
});

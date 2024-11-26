class RadarView {
    constructor(containerId, data, options = {}) {
        this.containerId = containerId;
        this.data = data;
        this.options = {
            width: options.width || 500,
            height: options.height || 500,
            outerRadius: options.outerRadius || 200,
            innerRadius: options.innerRadius || 100,
            sectors: options.sectors || 5
        };
        
        this.init();
    }

    init() {
        d3.select(`#${this.containerId}`).select('svg').remove();

        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .append('g')
            .attr('transform', `translate(${this.options.width/2},${this.options.height/2})`);

        this.drawCircles();
        this.drawSectors();
        this.renderInnerPolygon();
        this.renderWordClouds();
    }

    drawCircles() {
        this.svg.append('circle')
            .attr('class', 'radar-circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', this.options.outerRadius);

        this.svg.append('circle')
            .attr('class', 'radar-circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', this.options.innerRadius);
    }

    drawSectors() {
        // Draw outer sector lines
        for (let i = 0; i < this.options.sectors; i++) {
            const angle = (i * 2 * Math.PI) / this.options.sectors;
            const x2 = this.options.outerRadius * Math.cos(angle);
            const y2 = this.options.outerRadius * Math.sin(angle);
            const x1 = this.options.innerRadius * Math.cos(angle);
            const y1 = this.options.innerRadius * Math.sin(angle);

            this.svg.append('line')
                .attr('class', 'radar-line')
                .attr('x1', x1)
                .attr('y1', y1)
                .attr('x2', x2)
                .attr('y2', y2);
        }

        // Draw inner sector lines
        const phaseOffset = Math.PI / this.options.sectors;
        for (let i = 0; i < this.options.sectors; i++) {
            const angle = (i * 2 * Math.PI) / this.options.sectors + phaseOffset;
            const x2 = this.options.innerRadius * Math.cos(angle);
            const y2 = this.options.innerRadius * Math.sin(angle);

            this.svg.append('line')
                .attr('class', 'radar-line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x2)
                .attr('y2', y2);
        }
    }

    renderInnerPolygon() {
        const radiusScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, this.options.innerRadius]);

        const points = this.data.innerData.map((d, i) => {
            const angle = (i * 2 * Math.PI) / this.options.sectors + Math.PI / this.options.sectors;
            const radius = radiusScale(d.value);
            return [
                radius * Math.cos(angle),
                radius * Math.sin(angle)
            ];
        });

        // Create polygon path
        const lineGenerator = d3.lineRadial()
            .radius(d => d[0])
            .angle(d => d[1])
            .curve(d3.curveLinearClosed);

        this.svg.append('path')
            .attr('class', 'inner-polygon')
            .attr('d', `M ${points.map(p => p.join(',')).join(' L ')} Z`);

        // Add data points
        points.forEach(point => {
            this.svg.append('circle')
                .attr('class', 'data-point')
                .attr('cx', point[0])
                .attr('cy', point[1])
                .attr('r', 4);
        });
    }

    renderWordClouds() {
        for (let i = 0; i < this.options.sectors; i++) {
            const angle = (i * 2 * Math.PI) / this.options.sectors;
            const centerX = (this.options.innerRadius + this.options.outerRadius) / 2 * Math.cos(angle);
            const centerY = (this.options.innerRadius + this.options.outerRadius) / 2 * Math.sin(angle);
            
            const words = this.data.outerData[i].words;
            
            // Create word cloud
            const cloud = d3.layout.cloud()
                .size([80, 80])
                .words(words.map(d => ({text: d.text, size: 10 + d.value * 20})))
                .padding(2)
                .rotate(0)
                .fontSize(d => d.size)
                .on("end", (words) => {
                    const cloudGroup = this.svg.append("g")
                        .attr("class", "word-cloud")
                        .attr("transform", `translate(${centerX},${centerY})`);

                    cloudGroup.selectAll("text")
                        .data(words)
                        .enter().append("text")
                        .style("font-size", d => `${d.size}px`)
                        .style("fill", "#333")
                        .attr("text-anchor", "middle")
                        .attr("transform", d => `translate(${d.x},${d.y})`)
                        .text(d => d.text);
                });

            cloud.start();
        }
    }
}

// Sample data
const sampleData = {
    innerData: [
        { value: 75 },
        { value: 45 },
        { value: 90 },
        { value: 60 },
        { value: 85 }
    ],
    outerData: [
        { words: [
            { text: "Data", value: 3 },
            { text: "Analytics", value: 2 },
            { text: "ML", value: 1 }
        ]},
        { words: [
            { text: "Cloud", value: 3 },
            { text: "AWS", value: 2 },
            { text: "Azure", value: 1 }
        ]},
        { words: [
            { text: "Security", value: 3 },
            { text: "Network", value: 2 },
            { text: "Crypto", value: 1 }
        ]},
        { words: [
            { text: "Web", value: 3 },
            { text: "UI", value: 2 },
            { text: "UX", value: 1 }
        ]},
        { words: [
            { text: "Mobile", value: 3 },
            { text: "iOS", value: 2 },
            { text: "Android", value: 1 }
        ]}
    ]
};

// Initialize the radar view
const options = {
    width: 800,
    height: 800,
    outerRadius: 300,
    innerRadius: 150,
    sectors: 5
};

const radarView = new RadarView('radar-container', sampleData, options);
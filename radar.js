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
        const phaseOffset = Math.PI / this.options.sectors;
        const points = this.data.innerData.map((d, i) => {
            const angle = (i * 2 * Math.PI) / this.options.sectors + phaseOffset;
            const radius = (d.value / 100) * this.options.innerRadius;
            return {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
                value: d.value,
                label: d.label
            };
        });

        // Create polygon
        const polygonPath = points.map(p => `${p.x},${p.y}`).join(' ');
        this.svg.append('polygon')
            .attr('class', 'inner-polygon')
            .attr('points', polygonPath);

        // Add vertices with labels
        points.forEach(point => {
            // Add point
            this.svg.append('circle')
                .attr('class', 'data-point')
                .attr('cx', point.x)
                .attr('cy', point.y)
                .attr('r', 4);

            // Add label
            this.svg.append('text')
                .attr('class', 'data-point-label')
                .attr('x', point.x)
                .attr('y', point.y - 10)
                .attr('text-anchor', 'middle')
                .text(point.value);
        });
    }

    renderWordClouds() {
        const sectorAngle = (2 * Math.PI) / this.options.sectors;
    
        this.data.outerData.forEach((sector, i) => {
            const startAngle = i * sectorAngle;
            const centerAngle = startAngle + sectorAngle / 2;
            
            // Adjust this value to move text closer to center
            // Changed from 0.75 to 0.6 to move text inward
            const centerRadius = (this.options.innerRadius + this.options.outerRadius) * 0.5;
            const centerX = centerRadius * Math.cos(centerAngle);
            const centerY = centerRadius * Math.sin(centerAngle);
    
            const cloudGroup = this.svg.append('g')
                .attr('class', 'word-cloud')
                .attr('transform', `translate(${centerX},${centerY})`);
    
            // Sort words by value to render larger ones first
            const sortedWords = sector.words.sort((a, b) => b.value - a.value);
    
            // Calculate total height of text block
            const totalHeight = sortedWords.reduce((acc, word) => {
                const fontSize = 8 + word.value * 3;
                return acc + fontSize + 2;
            }, 0);
    
            // Add words with adjusted positioning
            let currentY = -totalHeight / 2;
            sortedWords.forEach((word, idx) => {
                const fontSize = 8 + word.value * 3;
                
                cloudGroup.append('text')
                    .attr('x', 0)
                    .attr('y', currentY + fontSize)
                    .attr('text-anchor', 'middle')
                    .style('font-size', `${fontSize}px`)
                    .text(word.text);
    
                currentY += fontSize + 2;
            });
        });
    }
}

function processCSVData(csvData) {
    // Add console.log to debug the incoming data
    console.log('Raw CSV data:', csvData);

    const themes = ['Foods', 'Attractions', 'Scenery', 'Services', 'Atmospheres'];
    
    return {
        innerData: themes.map(theme => {
            const themeData = csvData.find(d => d.Cognitive_Theme === theme);
            // Add null checking
            if (!themeData) {
                console.error(`No data found for theme: ${theme}`);
                return { value: 0, label: theme };
            }
            // Ensure we're getting a number
            const value = Math.max(0, Math.min(100, Math.round(parseFloat(themeData.Positive_Sentiment) * 100)));
            return {
                value: isNaN(value) ? 0 : value,
                label: theme
            };
        }),
        outerData: themes.map(theme => {
            const themeData = csvData.find(d => d.Cognitive_Theme === theme);
            // Add null checking
            if (!themeData) {
                console.error(`No data found for theme: ${theme}`);
                return {
                    title: theme,
                    words: [{ text: theme, value: 5 }]
                };
            }
            return {
                title: theme,
                words: [
                    { 
                        text: theme, 
                        value: 5 
                    },
                    { 
                        text: `+${parseInt(themeData.Positive_Count) || 0}`, 
                        value: 3 
                    },
                    { 
                        text: `-${parseInt(themeData.Negative_Count) || 0}`, 
                        value: 2 
                    }
                ]
            };
        })
    };
}

// Sample data
document.addEventListener('DOMContentLoaded', function() {
    d3.csv("normalized_sentiment_data_2020.csv").then(function(csvData) {
        // Clean up column names and ensure numeric values
        csvData = csvData.map(d => ({
            Destination: d.Destination,
            Category: d.Category,
            Year: parseInt(d.Year) || 0,
            Cognitive_Theme: d['Cognitive Theme'],
            Positive_Sentiment: parseFloat(d['Positive Sentiment']) || 0,
            Negative_Sentiment: parseFloat(d['Negative Sentiment']) || 0,
            Positive_Count: parseInt(d['Positive Count']) || 0,
            Negative_Count: parseInt(d['Negative Count']) || 0,
            Total_Count: parseInt(d['Total Count']) || 0,
            Non_Emotional_Count: parseInt(d['Non-Emotional Count']) || 0
        }));

        console.log('Processed CSV data:', csvData);

        const visualizationData = processCSVData(csvData);
        console.log('Visualization data:', visualizationData);
        
        const options = {
            width: 800,
            height: 800,
            outerRadius: 300,
            innerRadius: 150,
            sectors: 5
        };

        const radarView = new RadarView('radar-container', visualizationData, options);
    }).catch(error => {
        console.error('Error loading or processing CSV:', error);
    });
});
class PathfindingVisualizer {
    constructor() {
        this.grid = new Grid('pathGrid');
        this.algorithm = 'astar';
        this.speed = 50;
        this.isRunning = false;
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.grid.draw();
    }

    setupEventListeners() {
        document.getElementById('algorithmSelect').addEventListener('change', (e) => {
            this.algorithm = e.target.value;
        });

        document.getElementById('speedRange').addEventListener('input', (e) => {
            this.speed = 100 - e.target.value;
        });

        document.getElementById('startButton').addEventListener('click', () => {
            if (!this.isRunning) {
                this.runAlgorithm();
            }
        });

        document.getElementById('resetButton').addEventListener('click', () => {
            this.grid.reset();
        });

        document.getElementById('clearPathButton').addEventListener('click', () => {
            this.grid.clearPath();
        });

        document.getElementById('generateMazeButton').addEventListener('click', async () => {
            if (!this.isRunning) {
                this.isRunning = true;
                document.getElementById('startButton').disabled = true;
                document.getElementById('generateMazeButton').disabled = true;
                
                await this.grid.generateMaze();
                
                this.isRunning = false;
                document.getElementById('startButton').disabled = false;
                document.getElementById('generateMazeButton').disabled = false;
            }
        });
    }

    async runAlgorithm() {
        this.isRunning = true;
        document.getElementById('startButton').disabled = true;
        
        const start = this.grid.startNode;
        const end = this.grid.endNode;
        
        if (!start || !end) {
            alert('Please set start and end points');
            this.isRunning = false;
            document.getElementById('startButton').disabled = false;
            return;
        }

        const gridData = this.grid.nodes.map(row => row.map(node => node.isWall));
        
        try {
            const response = await fetch('/api/pathfind', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start: { x: start.x, y: start.y },
                    end: { x: end.x, y: end.y },
                    algorithm: this.algorithm,
                    grid: gridData
                })
            });

            const data = await response.json();
            
            if (data.error) {
                alert(data.error);
                return;
            }

            // Visualize visited nodes
            for (const node of data.visited) {
                const gridNode = this.grid.getNode(node.x, node.y);
                if (gridNode !== start && gridNode !== end) {
                    gridNode.state = 'visited';
                    this.grid.draw();
                    await sleep(this.speed);
                }
            }

            // Visualize final path
            if (data.path) {
                await this.grid.visualizePath(data.path.map(pos => this.grid.getNode(pos.x, pos.y)), this.speed);
            }
        } catch (error) {
            console.error('Error during pathfinding:', error);
            alert('An error occurred during pathfinding');
        }

        this.isRunning = false;
        document.getElementById('startButton').disabled = false;
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pathfinder = new PathfindingVisualizer();
});

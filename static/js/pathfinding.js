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

        let path;
        if (this.algorithm === 'astar') {
            path = await astar(this.grid, start, end, this.speed);
        } else {
            path = await dijkstra(this.grid, start, end, this.speed);
        }

        if (path) {
            await this.grid.visualizePath(path, this.speed);
        }

        this.isRunning = false;
        document.getElementById('startButton').disabled = false;
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pathfinder = new PathfindingVisualizer();
});

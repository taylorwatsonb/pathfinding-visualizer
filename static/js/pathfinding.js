class PathfindingVisualizer {
    constructor() {
        this.grid = new Grid('pathGrid');
        this.algorithm = 'astar';
        this.speed = 50;
        this.isRunning = false;
        this.algorithmInfo = {
            'astar': {
                title: 'A* Algorithm',
                description: 'A* is an informed search algorithm that combines Dijkstra\'s shortest path with heuristic estimation. It guarantees the shortest path while being more efficient than Dijkstra\'s algorithm.',
                steps: {
                    'exploring': 'Exploring new nodes based on lowest f-score (g-score + heuristic).',
                    'visited': 'Node visited and added to closed set. Shortest path to this node is found.',
                    'path': 'Reconstructing the optimal path from start to goal.'
                }
            },
            'taylor': {
                title: 'Taylor\'s Algorithm',
                description: 'Taylor\'s algorithm is a variant that uses a modified heuristic based on Taylor series expansion, considering both Manhattan distance and diagonal movements.',
                steps: {
                    'exploring': 'Evaluating nodes using Taylor-series inspired heuristic for better path estimation.',
                    'visited': 'Node processed and added to closed set. Current best path recorded.',
                    'path': 'Reconstructing the optimal path using recorded movements.'
                }
            },
            'bfs': {
                title: 'Breadth-First Search',
                description: 'BFS explores all neighbor nodes at the present depth before moving to nodes at the next depth level. Guarantees shortest path in unweighted graphs.',
                steps: {
                    'exploring': 'Adding unvisited neighbors to the queue for exploration.',
                    'visited': 'Processing current node and marking it as visited.',
                    'path': 'Reconstructing path by backtracking from goal to start.'
                }
            },
            'dfs': {
                title: 'Depth-First Search',
                description: 'DFS explores as far as possible along each branch before backtracking. Does not guarantee shortest path but can be memory-efficient.',
                steps: {
                    'exploring': 'Exploring deepest unvisited node in the current path.',
                    'visited': 'Marking current node as visited and checking for goal.',
                    'path': 'Reconstructing path from recorded movements.'
                }
            }
        };
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.grid.draw();
        this.updateAlgorithmInfo();
    }

    setupEventListeners() {
        document.getElementById('algorithmSelect').addEventListener('change', (e) => {
            this.algorithm = e.target.value;
            this.updateAlgorithmInfo();
        });

        document.getElementById('speedRange').addEventListener('input', (e) => {
            this.speed = 100 - e.target.value;
        });
        
    updateAlgorithmInfo() {
        const info = this.algorithmInfo[this.algorithm];
        document.getElementById('algorithmTitle').textContent = info.title;
        document.getElementById('algorithmDescription').textContent = info.description;
        document.getElementById('algorithmSteps').classList.add('d-none');
    }

    updateStepInfo(nodeState) {
        const stepsDiv = document.getElementById('algorithmSteps');
        const info = this.algorithmInfo[this.algorithm];
        
        if (info.steps[nodeState]) {
            stepsDiv.textContent = info.steps[nodeState];
            stepsDiv.classList.remove('d-none');
        }
    }

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
                    this.updateStepInfo('visited');
                    this.grid.draw();
                    await sleep(this.speed);
                }
            }

            // Visualize final path
            if (data.path) {
                this.updateStepInfo('path');
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

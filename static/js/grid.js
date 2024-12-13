window.Grid = class {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 25;
        this.rows = 20;
        this.cols = 30;
        this.nodes = [];
        this.startNode = null;
        this.endNode = null;
        this.isDrawingWalls = false;
        
        this.setupCanvas();
        this.createNodes();
        this.setupEventListeners();
    }

    setupCanvas() {
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;
    }

    createNodes() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.nodes.push({
                    x: col,
                    y: row,
                    isWall: false,
                    state: 'unvisited' // unvisited, visited, exploring, path
                });
            }
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            const node = this.getNodeFromMouseEvent(e);
            if (e.shiftKey) {
                if (this.startNode) this.startNode.state = 'unvisited';
                this.startNode = node;
                node.state = 'start';
            } else if (e.ctrlKey) {
                if (this.endNode) this.endNode.state = 'unvisited';
                this.endNode = node;
                node.state = 'end';
            } else {
                this.isDrawingWalls = true;
                node.isWall = !node.isWall;
            }
            this.draw();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDrawingWalls) {
                const node = this.getNodeFromMouseEvent(e);
                node.isWall = true;
                this.draw();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDrawingWalls = false;
        });
    }

    getNodeFromMouseEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        return this.getNode(x, y);
    }

    getNode(x, y) {
        return this.nodes.find(node => node.x === x && node.y === y);
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const newX = node.x + dx;
            const newY = node.y + dy;
            
            if (newX >= 0 && newX < this.cols && newY >= 0 && newY < this.rows) {
                const neighbor = this.getNode(newX, newY);
                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }

    setNodeState(node, state) {
        node.state = state;
        this.draw();
    }

    async visualizePath(path, speed) {
        for (const node of path) {
            if (node !== this.startNode && node !== this.endNode) {
                node.state = 'path';
                this.draw();
                await new Promise(resolve => setTimeout(resolve, speed));
            }
        }
    }

    reset() {
        this.nodes.forEach(node => {
            node.isWall = false;
            node.state = 'unvisited';
        });
        this.startNode = null;
        this.endNode = null;
        this.draw();
    }

    async generateMaze() {
        // Reset the grid before generating maze
        this.reset();
        
        // Initialize all cells as walls
        this.nodes.forEach(node => {
            node.isWall = true;
        });
        
        const stack = [];
        const startX = 1;
        const startY = 1;
        
        // Get the initial cell and mark it as passage
        const startCell = this.getNode(startX, startY);
        startCell.isWall = false;
        stack.push(startCell);
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const unvisitedNeighbors = this.getMazeNeighbors(current).filter(n => this.isCellUnvisited(n));
            
            if (unvisitedNeighbors.length === 0) {
                stack.pop();
            } else {
                const next = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
                const wall = this.getNode(
                    current.x + Math.floor((next.x - current.x) / 2),
                    current.y + Math.floor((next.y - current.y) / 2)
                );
                
                next.isWall = false;
                wall.isWall = false;
                stack.push(next);
            }
            
            this.draw();
            await new Promise(resolve => setTimeout(resolve, 20));
        }
    }
    
    getMazeNeighbors(node) {
        const neighbors = [];
        const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
        
        for (const [dx, dy] of directions) {
            const newX = node.x + dx;
            const newY = node.y + dy;
            
            if (newX >= 0 && newX < this.cols && newY >= 0 && newY < this.rows) {
                const neighbor = this.getNode(newX, newY);
                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }
    
    isCellUnvisited(node) {
        return node.isWall;
    }

    clearPath() {
        this.nodes.forEach(node => {
            if (node.state !== 'start' && node.state !== 'end') {
                node.state = 'unvisited';
            }
        });
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = '#2a2a2a';
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw nodes
        this.nodes.forEach(node => {
            const x = node.x * this.cellSize;
            const y = node.y * this.cellSize;
            
            if (node.isWall) {
                this.ctx.fillStyle = '#666';
            } else {
                switch (node.state) {
                    case 'unvisited':
                        this.ctx.fillStyle = '#1a1a1a';
                        break;
                    case 'visited':
                        this.ctx.fillStyle = '#264653';
                        break;
                    case 'exploring':
                        this.ctx.fillStyle = '#2a9d8f';
                        break;
                    case 'path':
                        this.ctx.fillStyle = '#e9c46a';
                        break;
                    case 'start':
                        this.ctx.fillStyle = '#2ecc71';
                        break;
                    case 'end':
                        this.ctx.fillStyle = '#e74c3c';
                        break;
                }
            }
            
            this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
        });
    }
}

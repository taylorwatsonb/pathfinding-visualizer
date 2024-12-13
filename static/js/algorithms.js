async function astar(grid, start, end, speed) {
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = new Map();
    
    const gScore = new Map();
    const fScore = new Map();
    
    gScore.set(start, 0);
    fScore.set(start, heuristic(start, end));
    
    while (openSet.length > 0) {
        const current = getLowestFScore(openSet, fScore);
        
        if (current === end) {
            return reconstructPath(cameFrom, current);
        }
        
        openSet.splice(openSet.indexOf(current), 1);
        closedSet.add(current);
        
        grid.setNodeState(current, 'visited');
        await sleep(speed);
        
        const neighbors = grid.getNeighbors(current);
        for (const neighbor of neighbors) {
            if (closedSet.has(neighbor) || neighbor.isWall) continue;
            
            const tentativeGScore = gScore.get(current) + 1;
            
            if (!openSet.includes(neighbor)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= gScore.get(neighbor)) {
                continue;
            }
            
            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeGScore);
            fScore.set(neighbor, gScore.get(neighbor) + heuristic(neighbor, end));
            
            grid.setNodeState(neighbor, 'exploring');
        }
    }
    
    return null;
}

async function taylor(grid, start, end, speed) {
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = new Map();
    
    const gScore = new Map();
    const tScore = new Map(); // Taylor score
    
    gScore.set(start, 0);
    tScore.set(start, taylorHeuristic(start, end));
    
    while (openSet.length > 0) {
        const current = getLowestTScore(openSet, tScore);
        
        if (current === end) {
            return reconstructPath(cameFrom, current);
        }
        
        openSet.splice(openSet.indexOf(current), 1);
        closedSet.add(current);
        
        grid.setNodeState(current, 'visited');
        await sleep(speed);
        
        const neighbors = grid.getNeighbors(current);
        for (const neighbor of neighbors) {
            if (closedSet.has(neighbor) || neighbor.isWall) continue;
            
            const tentativeGScore = gScore.get(current) + 1;
            
            if (!openSet.includes(neighbor)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= gScore.get(neighbor)) {
                continue;
            }
            
            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeGScore);
            tScore.set(neighbor, gScore.get(neighbor) + taylorHeuristic(neighbor, end));
            
            grid.setNodeState(neighbor, 'exploring');
        }
    }
    
    return null;
}

function taylorHeuristic(node1, node2) {
    // Taylor's series-inspired heuristic that considers both Manhattan distance and diagonal movement
    const dx = Math.abs(node1.x - node2.x);
    const dy = Math.abs(node1.y - node2.y);
    return Math.sqrt(dx * dx + dy * dy) + (dx + dy) / 2;
}

function getLowestTScore(nodes, tScore) {
    return nodes.reduce((min, node) => 
        (tScore.get(node) < tScore.get(min)) ? node : min
    );
}

function heuristic(node1, node2) {
    return Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y);
}

function getLowestFScore(nodes, fScore) {
    return nodes.reduce((min, node) => 
        (fScore.get(node) < fScore.get(min)) ? node : min
    );
}

function getMinDistance(nodes, distances) {
    let minNode = null;
    let minDistance = Infinity;
    
    nodes.forEach(node => {
        if (distances.get(node) < minDistance) {
            minNode = node;
            minDistance = distances.get(node);
        }
    });
    
    return minNode;
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        path.unshift(current);
    }
    return path;
}

async function bfs(grid, start, end, speed) {
    const queue = [start];
    const visited = new Set();
    const cameFrom = new Map();
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        if (current === end) {
            return reconstructPath(cameFrom, current);
        }
        
        visited.add(current);
        grid.setNodeState(current, 'visited');
        await sleep(speed);
        
        const neighbors = grid.getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor) && !neighbor.isWall) {
                queue.push(neighbor);
                visited.add(neighbor);
                cameFrom.set(neighbor, current);
                grid.setNodeState(neighbor, 'exploring');
            }
        }
    }
    
    return null;
}

async function dfs(grid, start, end, speed) {
    const stack = [start];
    const visited = new Set();
    const cameFrom = new Map();
    
    while (stack.length > 0) {
        const current = stack.pop();
        
        if (current === end) {
            return reconstructPath(cameFrom, current);
        }
        
        if (!visited.has(current)) {
            visited.add(current);
            grid.setNodeState(current, 'visited');
            await sleep(speed);
            
            const neighbors = grid.getNeighbors(current);
            for (const neighbor of neighbors.reverse()) {
                if (!visited.has(neighbor) && !neighbor.isWall) {
                    stack.push(neighbor);
                    cameFrom.set(neighbor, current);
                    grid.setNodeState(neighbor, 'exploring');
                }
            }
        }
    }
    
    return null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

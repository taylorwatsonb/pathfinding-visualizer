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

async function dijkstra(grid, start, end, speed) {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();
    
    grid.nodes.forEach(node => {
        distances.set(node, Infinity);
        unvisited.add(node);
    });
    distances.set(start, 0);
    
    while (unvisited.size > 0) {
        const current = getMinDistance(unvisited, distances);
        
        if (current === end) {
            return reconstructPath(previous, current);
        }
        
        unvisited.delete(current);
        grid.setNodeState(current, 'visited');
        await sleep(speed);
        
        const neighbors = grid.getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!unvisited.has(neighbor) || neighbor.isWall) continue;
            
            const alt = distances.get(current) + 1;
            if (alt < distances.get(neighbor)) {
                distances.set(neighbor, alt);
                previous.set(neighbor, current);
                grid.setNodeState(neighbor, 'exploring');
            }
        }
    }
    
    return null;
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

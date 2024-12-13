from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from collections import deque
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

def heuristic(node, goal):
    return abs(node.x - goal.x) + abs(node.y - goal.y)

def taylor_heuristic(node, goal):
    dx = abs(node.x - goal.x)
    dy = abs(node.y - goal.y)
    return ((dx * dx + dy * dy) ** 0.5) + (dx + dy) / 2

def taylor(grid, start, end):
    start_node = grid.nodes[start['y']][start['x']]
    end_node = grid.nodes[end['y']][end['x']]
    
    open_set = {start_node}
    closed_set = set()
    visited = []
    
    start_node.g_score = 0
    start_node.t_score = taylor_heuristic(start_node, end_node)
    
    while open_set:
        current = min(open_set, key=lambda node: node.t_score)
        
        if current.x == end_node.x and current.y == end_node.y:
            path = []
            while current:
                path.append({'x': current.x, 'y': current.y})
                current = current.came_from
            return path[::-1], visited
        
        open_set.remove(current)
        closed_set.add(current)
        visited.append({'x': current.x, 'y': current.y})
        
        for neighbor in grid.get_neighbors(current):
            if neighbor in closed_set:
                continue
                
            tentative_g_score = current.g_score + 1
            
            if neighbor not in open_set:
                open_set.add(neighbor)
            elif tentative_g_score >= neighbor.g_score:
                continue
            
            neighbor.came_from = current
            neighbor.g_score = tentative_g_score
            neighbor.t_score = neighbor.g_score + taylor_heuristic(neighbor, end_node)
    
    return [], visited  # No path found

def bfs(grid, start, end):
    start_node = grid.nodes[start['y']][start['x']]
    end_node = grid.nodes[end['y']][end['x']]
    
    queue = deque([start_node])
    visited = set([start_node])
    came_from = {}
    visit_order = []
    
    while queue:
        current = queue.popleft()
        visit_order.append({'x': current.x, 'y': current.y})
        
        if current.x == end_node.x and current.y == end_node.y:
            path = []
            while current in came_from:
                path.append({'x': current.x, 'y': current.y})
                current = came_from[current]
            path.append({'x': start_node.x, 'y': start_node.y})
            return path[::-1], visit_order
        
        for neighbor in grid.get_neighbors(current):
            if neighbor not in visited:
                queue.append(neighbor)
                visited.add(neighbor)
                came_from[neighbor] = current
    
    return [], visit_order

def dfs(grid, start, end):
    start_node = grid.nodes[start['y']][start['x']]
    end_node = grid.nodes[end['y']][end['x']]
    
    stack = [start_node]
    visited = set()
    came_from = {}
    visit_order = []
    
    while stack:
        current = stack.pop()
        
        if current not in visited:
            visited.add(current)
            visit_order.append({'x': current.x, 'y': current.y})
            
            if current.x == end_node.x and current.y == end_node.y:
                path = []
                while current in came_from:
                    path.append({'x': current.x, 'y': current.y})
                    current = came_from[current]
                path.append({'x': start_node.x, 'y': start_node.y})
                return path[::-1], visit_order
            
            for neighbor in reversed(list(grid.get_neighbors(current))):
                if neighbor not in visited:
                    stack.append(neighbor)
                    came_from[neighbor] = current
    
    return [], visit_order

def astar(grid, start, end):
    start_node = grid.nodes[start['y']][start['x']]
    end_node = grid.nodes[end['y']][end['x']]
    
    open_set = {start_node}
    closed_set = set()
    visited = []
    
    start_node.g_score = 0
    start_node.f_score = heuristic(start_node, end_node)
    
    while open_set:
        current = min(open_set, key=lambda node: node.f_score)
        
        if current.x == end_node.x and current.y == end_node.y:
            path = []
            while current:
                path.append({'x': current.x, 'y': current.y})
                current = current.came_from
            return path[::-1], visited
        
        open_set.remove(current)
        closed_set.add(current)
        visited.append({'x': current.x, 'y': current.y})
        
        for neighbor in grid.get_neighbors(current):
            if neighbor in closed_set:
                continue
                
            tentative_g_score = current.g_score + 1
            
            if neighbor not in open_set:
                open_set.add(neighbor)
            elif tentative_g_score >= neighbor.g_score:
                continue
            
            neighbor.came_from = current
            neighbor.g_score = tentative_g_score
            neighbor.f_score = neighbor.g_score + heuristic(neighbor, end_node)
    
    return [], visited  # No path found

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a secret key"

class Node:
    def __init__(self, x, y, is_wall=False):
        self.x = x
        self.y = y
        self.is_wall = is_wall
        self.g_score = float('inf')
        self.f_score = float('inf')
        self.t_score = float('inf')  # Added for Taylor's algorithm
        self.came_from = None

class Grid:
    def __init__(self, data):
        self.rows = len(data)
        self.cols = len(data[0]) if self.rows > 0 else 0
        self.nodes = [[Node(x, y, data[y][x]) for x in range(self.cols)] for y in range(self.rows)]
    
    def get_neighbors(self, node):
        neighbors = []
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]  # Right, Down, Left, Up
        
        for dx, dy in directions:
            new_x, new_y = node.x + dx, node.y + dy
            if (0 <= new_x < self.cols and 0 <= new_y < self.rows and 
                not self.nodes[new_y][new_x].is_wall):
                neighbors.append(self.nodes[new_y][new_x])
        
        return neighbors

# Configure SQLAlchemy
if os.environ.get("DATABASE_URL"):
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    db.init_app(app)
    logger.info("Database initialized successfully")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/pathfind', methods=['POST'])
def pathfind():
    data = request.get_json()
    start = data.get('start')
    end = data.get('end')
    algorithm = data.get('algorithm', 'astar')
    grid_data = data.get('grid')
    
    # Return empty path if missing data
    if not all([start, end, grid_data]):
        return jsonify({'error': 'Missing required data'}), 400
    
    grid = Grid(grid_data)
    
    algorithms = {
        'astar': astar,
        'taylor': taylor,
        'bfs': bfs,
        'dfs': dfs
    }
    
    algorithm_func = algorithms.get(algorithm, astar)
    path, visited = algorithm_func(grid, start, end)
    
    return jsonify({
        'path': path,
        'visited': visited
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

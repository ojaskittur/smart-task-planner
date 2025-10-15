from flask import Blueprint, request, jsonify, render_template
from app.models import db, Goal, Task
from app.llm_service import LLMService
import json

# Create a Blueprint for routes
main_routes = Blueprint('main', __name__)

@main_routes.route('/')
def index():
    return render_template('index.html')

@main_routes.route('/api/goals', methods=['POST'])
def create_goal():
    try:
        data = request.get_json()
        
        goal = Goal(
            title=data.get('title', 'New Goal'),
            description=data.get('description', ''),
            deadline_days=data.get('deadline_days', 14)
        )
        
        db.session.add(goal)
        db.session.commit()
        
        # Generate tasks using LLM
        llm_service = LLMService()
        tasks_data = llm_service.generate_task_breakdown(
            goal.description, 
            goal.deadline_days
        )
        
        # Create task objects
        for i, task_data in enumerate(tasks_data):
            task = Task(
                goal_id=goal.id,
                title=task_data.get('title', f'Task {i+1}'),
                description=task_data.get('description', ''),
                duration_days=task_data.get('duration_days', 1),
                dependencies=json.dumps(task_data.get('dependencies', [])),
                start_day=task_data.get('start_day', 0),
                end_day=task_data.get('end_day', 1),
                status='pending'
            )
            db.session.add(task)
        
        db.session.commit()
        
        return jsonify(goal.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@main_routes.route('/api/goals', methods=['GET'])
def get_goals():
    goals = Goal.query.all()
    return jsonify([goal.to_dict() for goal in goals])

@main_routes.route('/api/goals/<int:goal_id>', methods=['GET'])
def get_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    return jsonify(goal.to_dict())

@main_routes.route('/api/goals/<int:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    db.session.delete(goal)
    db.session.commit()
    return jsonify({'message': 'Goal deleted successfully'})

@main_routes.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'status' in data:
        task.status = data['status']
    
    db.session.commit()
    return jsonify(task.to_dict())
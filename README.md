# Smart Task Planner

## Description

The **Smart Task Planner** is a web application designed to help users break down large goals into smaller, manageable tasks using the power of AI. Simply input your goal, and the application will generate a detailed, actionable plan with timelines, dependencies, and priorities. It's the perfect tool for project managers, students, or anyone looking to organize their objectives effectively.

## Features

* **AI-Powered Task Generation**: Leverages the Gemini API to intelligently break down your goals into a series of smaller, actionable tasks.
* **Dynamic Timelines**: Visual timeline overview to easily track your progress.
* **Task Management**: Create, edit, and delete goals and tasks. Mark tasks as complete and see your progress in real-time.
* **Prioritization**: Assign priorities (High, Medium, Low) to tasks to focus on what matters most.
* **Dependencies**: Define dependencies between tasks to ensure a logical workflow.
* **Responsive Design**: A clean, intuitive, and mobile-friendly user interface.

## Demo

To see the Smart Task Planner in action, you can watch a full video demonstration on Google Drive.

**[Watch the Video Demo Here](https://drive.google.com/file/d/1hWTccVhUFgYH8SSNKYAwG7lIKyUeW0-3/view?usp=sharing)**

## Technologies Used

* **Backend**: Python, Flask, Flask-SQLAlchemy
* **Frontend**: HTML, CSS, JavaScript, Bootstrap
* **Database**: SQLite
* **AI**: Google Generative AI (Gemini)

## Setup and Installation

Follow these steps to get the project running on your local machine.

### 1. **Clone the repository:**
<pre>
git clone https://github.com/ojaskittur/smart-task-planner.git
cd smart-task-planner
</pre>

### 2. **Create a virtual environment:**
<pre>
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
</pre>

### 3. **Install dependencies:**
<pre>
pip install -r requirements.txt
</pre>

### 4. **Set up environment variables:**

Create a `.env` file in the root directory and add the following:
<pre>
SECRET_KEY='a-very-secret-key'
DATABASE_URL='sqlite:///tasks.db'
GEMINI_API_KEY='your-gemini-api-key'
</pre>
Replace `'your-gemini-api-key'` with your actual Gemini API key.

### 5. **Run the application:**
<pre>
python run.py
</pre>
The application will be available at `http://127.0.0.1:5000`.

## API Endpoints

The application provides the following RESTful API endpoints:

| Method   | Endpoint             | Description              |
| -------- | -------------------- | ------------------------ |
| `POST`   | `/api/goals`         | Creates a new goal.      |
| `GET`    | `/api/goals`         | Retrieves all goals.     |
| `GET`    | `/api/goals/<id>`    | Retrieves a single goal. |
| `PUT`    | `/api/goals/<id>`    | Updates a goal.          |
| `DELETE` | `/api/goals/<id>`    | Deletes a goal.          |
| `PUT`    | `/api/tasks/<id>`    | Updates a task.          |

## Project Structure
<pre>
├── app/
│   ├── static/
│   │   └── js/
│   │       └── app.js
│   ├── templates/
│   │   └── index.html
│   ├── __init__.py
│   ├── llm_service.py
│   ├── models.py
│   └── routes.py
├── .env
├── .gitignore
├── config.py
├── requirements.txt
└── run.py
</pre>

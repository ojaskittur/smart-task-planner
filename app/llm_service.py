import google.generativeai as genai
import json
import re
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables. Please set it in your .env file.")

        try:
            genai.configure(api_key=self.api_key)

            models_to_try = [
                'gemini-2.0-flash',
                'gemini-pro-latest',
                'gemini-2.0-flash-001',
            ]

            self.model = None
            for model_name in models_to_try:
                try:
                    self.model = genai.GenerativeModel(model_name)

                    test_response = self.model.generate_content("Say hello")
                    print(f" Using model: {model_name}")
                    break
                except Exception as e:
                    print(f" Model {model_name} failed: {e}")
                    continue

            if not self.model:
                raise RuntimeError("No working Gemini model found.")

        except Exception as e:
            print(f" Gemini configuration failed: {e}")
            self.model = None

    def generate_task_breakdown(self, goal_description, deadline_days):
        if not self.model:
            print(" Using fallback tasks (API not configured)")
            return self._create_smart_fallback_tasks(goal_description, deadline_days)

        prompt = self._build_prompt(goal_description, deadline_days)

        try:
            print(f"🔍 Sending request to Gemini API...")
            print(f"Goal: {goal_description}")
            print(f"Timeline: {deadline_days} days")

            generation_config = genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            )

            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )

            response_text = response.text.strip()

            print(" Raw Gemini Response:")
            print("=" * 50)
            print(response_text)
            print("=" * 50)

            tasks = self._extract_json_from_response(response_text)
            if tasks:
                tasks = self._validate_timeline(tasks, deadline_days)
                print(f"Successfully generated {len(tasks)} tasks using Gemini API")
                return tasks
            else:
                print(" JSON extraction failed, using fallback tasks")
                return self._create_smart_fallback_tasks(goal_description, deadline_days)

        except Exception as e:
            print(f" Gemini API call failed: {e}")
            return self._create_smart_fallback_tasks(goal_description, deadline_days)

    def _build_prompt(self, goal_description, deadline_days):
        return f"""You are a project management expert. Break down this goal into specific tasks with timelines.

GOAL: {goal_description}
TOTAL TIMELINE: {deadline_days} days

Create 4-6 specific, actionable tasks. For each task provide:
- A clear, concise title
- Detailed description of what needs to be done
- Realistic duration in days
- Dependencies (list of task numbers this depends on, empty list if none)
- Start day (0-based)
- End day
- Priority ('High', 'Medium', 'Low')

Format your response as a valid JSON array ONLY. No other text.

Example format:
[
  {{
    "title": "Research and Planning",
    "description": "Define project scope, research requirements, and create project plan",
    "duration_days": 3,
    "dependencies": [],
    "start_day": 0,
    "end_day": 2,
    "priority": "High"
  }},
  {{
    "title": "Design Phase",
    "description": "Create wireframes, design mockups, and user interface designs",
    "duration_days": 5,
    "dependencies": [0],
    "start_day": 3,
    "end_day": 7,
    "priority": "Medium"
  }}
]

Ensure the entire project completes within {deadline_days} days.
Make tasks specific and actionable.
Return only the JSON array.
"""

    def _extract_json_from_response(self, response_text):
        """Extract and parse JSON from Gemini response"""
        try:
            # More robust cleaning of the response text
            cleaned = response_text.strip()
            # Remove markdown formatting
            cleaned = re.sub(r'```json\s*', '', cleaned)
            cleaned = re.sub(r'```\s*', '', cleaned)

            # Find the start and end of the JSON array
            start_idx = cleaned.find('[')
            end_idx = cleaned.rfind(']') + 1

            if start_idx != -1 and end_idx != 0:
                json_str = cleaned[start_idx:end_idx]
                # Remove trailing commas that can cause JSON parsing errors
                json_str = re.sub(r',\s*}', '}', json_str)
                json_str = re.sub(r',\s*]', ']', json_str)

                tasks = json.loads(json_str)
                return tasks

        except Exception as e:
            print(f"JSON extraction failed: {e}")

        return None

    def _validate_timeline(self, tasks, deadline_days):
        """Ensure tasks fit within deadline"""
        if not tasks:
            return tasks

        for task in tasks:
            if 'start_day' in task and 'duration_days' in task:
                task['end_day'] = task['start_day'] + task['duration_days'] - 1

        max_end = max((task.get('end_day', 0) for task in tasks), default=0)

        if max_end >= deadline_days:
            scale_factor = (deadline_days - 1) / max_end
            for task in tasks:
                if 'start_day' in task:
                    task['start_day'] = int(task['start_day'] * scale_factor)
                if 'duration_days' in task:
                    task['duration_days'] = max(1, int(task['duration_days'] * scale_factor))
                if 'end_day' in task:
                    task['end_day'] = task['start_day'] + task['duration_days'] - 1

        return tasks

    def _create_smart_fallback_tasks(self, goal_description, deadline_days):
        """Create fallback tasks when API fails"""
        print(f" Using smart fallback for: {goal_description}")

        tasks = [
            {
                "title": f"Research and Plan {goal_description}",
                "description": f"Conduct initial research, define requirements, and create detailed project plan for {goal_description}",
                "duration_days": max(2, deadline_days // 5),
                "dependencies": [],
                "start_day": 0,
                "end_day": max(1, deadline_days // 5) - 1,
                "priority": "High"
            },
            {
                "title": f"Prepare and Setup",
                "description": f"Gather resources, set up systems, and prepare for implementation of {goal_description}",
                "duration_days": max(3, deadline_days // 4),
                "dependencies": [0],
                "start_day": max(2, deadline_days // 5),
                "end_day": max(2, deadline_days // 5) + max(2, deadline_days // 4) - 1,
                "priority": "Medium"
            },
            {
                "title": f"Execute Core Work",
                "description": f"Implement the main components and do the primary work for {goal_description}",
                "duration_days": max(4, deadline_days // 2),
                "dependencies": [1],
                "start_day": max(2, deadline_days // 5) + max(3, deadline_days // 4),
                "end_day": max(2, deadline_days // 5) + max(3, deadline_days // 4) + max(3, deadline_days // 2) - 1,
                "priority": "High"
            },
            {
                "title": f"Review and Finalize",
                "description": f"Test, review outcomes, make final adjustments, and complete {goal_description}",
                "duration_days": max(2, deadline_days // 5),
                "dependencies": [2],
                "start_day": max(2, deadline_days // 5) + max(3, deadline_days // 4) + max(4, deadline_days // 2),
                "end_day": deadline_days - 1,
                "priority": "Medium"
            }
        ]

        return tasks
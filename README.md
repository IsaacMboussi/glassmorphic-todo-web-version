# Glassmorphic Todo List

A beautiful todo list application with a modern glassmorphic design, built with HTML, CSS, JavaScript, and MongoDB.

## Features

- Modern glassmorphic UI design
- Add, edit, and delete tasks
- Mark tasks as complete/incomplete
- Filter tasks (All, Active, Completed)
- Clear all completed tasks
- Persistent storage with MongoDB
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd todo-list-web-version
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
MONGODB_URI=mongodb://localhost:27017/todo-app
PORT=3000
```

4. Start MongoDB:
Make sure MongoDB is running on your system. If you're using MongoDB locally, start the MongoDB service.

5. Start the application:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Development

To run the application in development mode with auto-reload:
```bash
npm run dev
```

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `DELETE /api/tasks/completed/all` - Delete all completed tasks

## Technologies Used

- Frontend:
  - HTML5
  - CSS3 (with glassmorphic design)
  - JavaScript (ES6+)
  - Font Awesome icons

- Backend:
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose

## License

MIT 
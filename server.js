const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',  // Allow requests from any origin
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],  // Allow specific HTTP methods
    allowedHeaders: ['Content-Type']  // Allow specific headers
}));
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// MongoDB Connection with timeout
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        // Don't exit the process, just log the error
    }
};

connectDB();

// Task Schema
const taskSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Task = mongoose.model('Task', taskSchema);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

// Routes
// Get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection not ready' });
        }
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a task
app.post('/api/tasks', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection not ready' });
        }
        console.log('Received task creation request:', req.body);
        
        if (!req.body.text) {
            return res.status(400).json({ message: 'Task text is required' });
        }
        
        const task = new Task({
            text: req.body.text,
            date: req.body.date || new Date()
        });
        
        const newTask = await task.save();
        console.log('Task created successfully:', newTask);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update a task
app.patch('/api/tasks/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection not ready' });
        }
        const task = await Task.findById(req.params.id);
        if (task) {
            if (req.body.text !== undefined) {
                task.text = req.body.text;
            }
            if (req.body.completed !== undefined) {
                task.completed = req.body.completed;
            }
            const updatedTask = await task.save();
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection not ready' });
        }
        const task = await Task.findById(req.params.id);
        if (task) {
            await task.deleteOne();
            res.json({ message: 'Task deleted' });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete all completed tasks
app.delete('/api/tasks/completed/all', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: 'Database connection not ready' });
        }
        await Task.deleteMany({ completed: true });
        res.json({ message: 'All completed tasks deleted' });
    } catch (error) {
        console.error('Error clearing completed tasks:', error);
        res.status(500).json({ message: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
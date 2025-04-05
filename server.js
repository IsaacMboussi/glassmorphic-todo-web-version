const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Log environment variables (without sensitive data)
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT || 3000);

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

// MongoDB Connection with retry logic
const connectDB = async () => {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            console.log(`Attempting to connect to MongoDB (attempt ${retries + 1}/${maxRetries})...`);
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                retryWrites: true,
                w: 'majority'
            });
            console.log('Connected to MongoDB successfully');
            return;
        } catch (err) {
            retries++;
            console.error(`MongoDB connection attempt ${retries} failed:`, err.message);
            if (retries === maxRetries) {
                console.error('Max retries reached. Could not connect to MongoDB');
                // Don't exit, just log the error
            } else {
                // Wait for 5 seconds before retrying
                console.log(`Waiting 5 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
};

// Initial connection
connectDB();

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

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
    console.error('Global error handler:', err);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Routes
// Get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('Database not ready, attempting to reconnect...');
            await connectDB();
            if (mongoose.connection.readyState !== 1) {
                console.error('Database connection failed after retry');
                return res.status(503).json({ message: 'Database connection not ready' });
            }
        }
        console.log('Fetching all tasks...');
        const tasks = await Task.find().sort({ createdAt: -1 });
        console.log(`Found ${tasks.length} tasks`);
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
            console.log('Database not ready, attempting to reconnect...');
            await connectDB();
            if (mongoose.connection.readyState !== 1) {
                console.error('Database connection failed after retry');
                return res.status(503).json({ message: 'Database connection not ready' });
            }
        }
        console.log('Received task creation request:', req.body);
        
        if (!req.body.text) {
            return res.status(400).json({ message: 'Task text is required' });
        }
        
        const task = new Task({
            text: req.body.text,
            date: req.body.date || new Date()
        });
        
        console.log('Saving task to database...');
        const newTask = await task.save();
        console.log('Task created successfully:', newTask);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update a task
app.patch('/api/tasks/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('Database not ready, attempting to reconnect...');
            await connectDB();
            if (mongoose.connection.readyState !== 1) {
                console.error('Database connection failed after retry');
                return res.status(503).json({ message: 'Database connection not ready' });
            }
        }
        console.log(`Updating task with ID: ${req.params.id}`);
        const task = await Task.findById(req.params.id);
        if (task) {
            if (req.body.text !== undefined) {
                task.text = req.body.text;
            }
            if (req.body.completed !== undefined) {
                task.completed = req.body.completed;
            }
            const updatedTask = await task.save();
            console.log('Task updated successfully:', updatedTask);
            res.json(updatedTask);
        } else {
            console.log(`Task with ID ${req.params.id} not found`);
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('Database not ready, attempting to reconnect...');
            await connectDB();
            if (mongoose.connection.readyState !== 1) {
                console.error('Database connection failed after retry');
                return res.status(503).json({ message: 'Database connection not ready' });
            }
        }
        console.log(`Deleting task with ID: ${req.params.id}`);
        const task = await Task.findById(req.params.id);
        if (task) {
            await task.deleteOne();
            console.log(`Task with ID ${req.params.id} deleted successfully`);
            res.json({ message: 'Task deleted' });
        } else {
            console.log(`Task with ID ${req.params.id} not found`);
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
            console.log('Database not ready, attempting to reconnect...');
            await connectDB();
            if (mongoose.connection.readyState !== 1) {
                console.error('Database connection failed after retry');
                return res.status(503).json({ message: 'Database connection not ready' });
            }
        }
        console.log('Deleting all completed tasks');
        const result = await Task.deleteMany({ completed: true });
        console.log(`Deleted ${result.deletedCount} completed tasks`);
        res.json({ message: 'All completed tasks deleted', count: result.deletedCount });
    } catch (error) {
        console.error('Error clearing completed tasks:', error);
        res.status(500).json({ message: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const status = {
        status: 'ok', 
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        env: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3000
        }
    };
    console.log('Health check:', status);
    res.json(status);
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
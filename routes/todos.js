import express from 'express';
import Todo from '../models/Todo.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/todos
// @desc    Create a new todo
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Please provide a title' });
        }

        const todo = await Todo.create({
            title,
            description,
            user: req.user._id,
        });

        res.status(201).json(todo);
    } catch (error) {
        console.error('Create todo error:', error);
        res.status(500).json({ message: 'Server error while creating todo' });
    }
});

// @route   GET /api/todos
// @desc    Get all todos for logged in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;

        const filter = { user: req.user._id };

        // Add status filter if provided
        if (status && (status === 'pending' || status === 'completed')) {
            filter.status = status;
        }

        const todos = await Todo.find(filter).sort({ createdAt: -1 });

        res.json(todos);
    } catch (error) {
        console.error('Get todos error:', error);
        res.status(500).json({ message: 'Server error while fetching todos' });
    }
});

// @route   PUT /api/todos/:id
// @desc    Update a todo
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { title, description, status } = req.body;

        // Find todo
        let todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        // Verify ownership
        if (todo.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this todo' });
        }

        // Update fields
        if (title !== undefined) todo.title = title;
        if (description !== undefined) todo.description = description;
        if (status !== undefined && (status === 'pending' || status === 'completed')) {
            todo.status = status;
        }

        await todo.save();

        res.json(todo);
    } catch (error) {
        console.error('Update todo error:', error);
        res.status(500).json({ message: 'Server error while updating todo' });
    }
});

// @route   DELETE /api/todos/:id
// @desc    Delete a todo
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        // Verify ownership
        if (todo.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this todo' });
        }

        await Todo.deleteOne({ _id: req.params.id });

        res.json({ message: 'Todo removed' });
    } catch (error) {
        console.error('Delete todo error:', error);
        res.status(500).json({ message: 'Server error while deleting todo' });
    }
});

export default router;

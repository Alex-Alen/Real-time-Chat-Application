const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
mongoose.connect('mongodb+srv://alex:passw0rd123cool@cluster0.uwxvhsl.mongodb.net/chatUsers', { useNewUrlParser: true, useUnifiedTopology: true });

// Create a schema and model for messages
const messageSchema = new mongoose.Schema({
    name: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);

// Serve the initial HTML page
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Track users' presence
const users = new Map(); // Map to track users by their socket IDs

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.query.token;
        console.log(`\nJWT token: ${token}\n`)
        const payload = await jwt.verify(token, 'alex alen secret');
        console.log(payload)
        socket.user_id = payload.id;
        socket.username = payload.username;
        next();
    } catch (err) {
        console.log(err)
        next(err);
    }
});

io.on('connection', (socket) => {
    // Handle user joining
    socket.on('join', (data) => {
        console.log('User connected:', socket.username);
        io.emit('user list', Array.from(users.values())); // Broadcast updated user list

        // Load chat history and send to new user
        (async () => {
            try {
                const messages = await Message.find().sort({ timestamp: 1 }).exec();
                socket.emit('chat history', messages);
            } catch (err) {
                console.error('Error fetching chat history:', err);
            }
        })();
    });

    // Handle incoming messages
    socket.on('send message', async (data) => {
        try {
            const messageData = { name: socket.username, message: data.message };
            const newMessage = new Message(messageData);
            await newMessage.save();
            io.emit('new message', messageData);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    // Handle typing indicator
    socket.on('typing', (name) => {
        socket.broadcast.emit('typing', socket.username);
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        const name = users.get(socket.id);
        if (name) {
            console.log('User disconnected:', socket.username);
            users.delete(socket.id);
            io.emit('user list', Array.from(users.values())); // Broadcast updated user list
        }
    });
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

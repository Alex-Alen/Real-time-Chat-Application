document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const socket = io.connect('http://localhost:5000', {
        query: {token}
    }); // Error if token is wrong

    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageButton = document.getElementById('sendMessage');
    const typingIndicator = document.getElementById('typingIndicator');
    const messageInputFields = document.getElementById('messageInputFields');
    const userList = document.getElementById('userList');


    socket.on('chat history', (messages) => {
        messages.forEach(message => {
            appendMessage(message);
        });
        messageInputFields.style.display = "block";
    });

    socket.on('new message', (message) => {
        appendMessage(message);
    });

    socket.on('typing', (name) => {
        typingIndicator.innerHTML = `${name} is typing...`;
        setTimeout(() => {
            typingIndicator.innerHTML = '';
        }, 4000); // Clear typing indicator after 4 second
    });

    socket.on('user list', (users) => {
        userList.innerHTML = users.map(user => `<li>${user}</li>`).join('');
    });

    sendMessageButton.addEventListener('click', () => {
        const message = messageInput.value;
        if (message.trim()) {
            socket.emit('send message', { name: "placeholder", message });
            messageInput.value = '';
        }
    });

    messageInput.addEventListener('input', () => {
  
        socket.emit('typing', "placeholder");
    });

    function appendMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `<span class="name">${message.name}:</span> ${message.message}`;
        messagesDiv.appendChild(messageElement);
    }


    socket.emit('join', { name: "placeholder" });
    socket.emit('get history'); // Request chat history


});

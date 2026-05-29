const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {
    Server
} = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    socket.emit("server_send_socket_id", socket.id);

    socket.on("Client_send_socket_id", (data) => {
        console.log(data);

        //Server gửi tất cả các client
        // io.emit("server_send_message", data);

        //A gửi lên server => Server chỉ gửi cho A
        socket.emit("SERVER_SEND_MESSAGE", data);

        //Server gửi cho tất cả các clkieemr tra ient trừ Client A
        // socket.broadcast.emit("server_send_message", data);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
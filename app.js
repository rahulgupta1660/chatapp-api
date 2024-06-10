import express from "express";
import { Server as SocketIO } from "socket.io";
import http from "http";
import cors from "cors";

const app = express();
const port = 8080;

const users = {};

app.use(cors());

app.get("/", (req, res) => {
  res.send("WORKING");
});

const server = http.createServer(app);

const io = new SocketIO(server);

io.on("connection", (socket) => {
  console.log("New Connection");

  socket.on("join", ({ user, room }) => {
    users[socket.id] = { user, room };
    socket.join(room);
    console.log(`${user} has joined room ${room}`);

    socket.broadcast.to(room).emit("userJoined", {
      user: "Admin",
      message: `${user} has joined`,
    });

    socket.emit("welcome", {
      user: "Admin",
      message: `Welcome to the chat, ${user}`,
    });
  });

  socket.on("message", ({ message, room }) => {
    const user = users[socket.id]?.user;
    io.to(room).emit("sendMessage", { user, message });
  });

  socket.on("disconnect", () => {
    const { user, room } = users[socket.id] || {};
    if (room) {
      socket.broadcast.to(room).emit("leave", {
        user: "Admin",
        message: `${user} has left`,
      });
      console.log(`${user} has left room ${room}`);
    }
    delete users[socket.id];
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

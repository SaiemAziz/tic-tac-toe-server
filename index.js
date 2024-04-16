const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { Server } = require("socket.io");
const { createServer } = require("http");
const { getUsers } = require("./functions/socketFunctions");
const { db, client } = require("./functions/db.config");
app.use(cors());
app.use(express.json());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    allowedHeaders: "http://localhost:5173",
    credentials: true,
    method: ["GET", "POST"],
    transports: ["websocket", "polling"],
  },
});

const userRoute = require("./routes/user");
const gameRoute = require("./routes/games");

async function run() {
  io.on("connection", (socket) => {
    let user = socket?.handshake?.query;
    //   socket.to(socket?.id).emit("connection", "connected");
    if (user?.email) {
      const user = socket?.handshake?.query;
      //   console.log("User connected: ", user?.email);

      socket.on("invite", (m) => {
        if (Array.isArray(io?.busy) && io?.busy.includes(m?.reciever)) return;
        socket.join(m?.sender + m?.reciever);
        socket.broadcast.emit("send-invitation", m);
      });
      socket.on("accept", (m) => {
        socket.join(m?.sender + m?.reciever);
        socket.broadcast.emit("accept-invitation", m);
      });

      socket.on("both-accepted", (m) => {
        io.to(m?.sender + m?.reciever).emit("start-game", m);
      });

      socket.on("get-busy", (m) => {
        if (Array.isArray(io?.busy)) io.busy = [...io.busy, m?.email];
        else io.busy = [m?.email];
        io.emit("online", {
          online: getUsers(io), // users email and ids
        });
      });
      socket.on("get-free", (m) => {
        io.busy = io?.busy.filter((u) => u !== m?.email);
        // else io.busy = [m?.email];
        io.emit("online", {
          online: getUsers(io), // users email and ids
        });
      });

      socket.on("moves", (m) => {
        m.player1 = !m?.player1;
        m.moves += 1;
        io.to(m?.sender + m?.reciever).emit("next-state", m);
      });

      io.emit("online", {
        online: getUsers(io), // users email and ids
      });
      socket.on("disconnect", () => {
        io.emit("online", {
          online: getUsers(io), // users email and ids
        });
      });
    }
  });

  app.use("/users", userRoute);
  app.use("/games", gameRoute);

  app.get("/", (req, res) => {
    res.send("Welcome to tic tac toe server");
  });
}

run().catch((err) => {
  console.log(err);
});

server.listen(port, async () => {
  await client.connect();
  console.log(`Server listening on ${port}`);
});

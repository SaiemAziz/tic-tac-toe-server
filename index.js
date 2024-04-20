const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { Server } = require("socket.io");
const { createServer } = require("http");
const { getUsers } = require("./functions/socketFunctions");
const { client, gameCollection } = require("./functions/db.config");
app.use(cors({ origin: "*" }));
app.use(express.json());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
    method: ["*"],
    allowedHeaders: ["*"],
    transports: ["websocket", "polling"],
    secure: true,
  },
});

const userRoute = require("./routes/user");
const gameRoute = require("./routes/games");
const pair = {};
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
        pair[m?.sender] = m?.reciever;
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
        io.to(m?.sender + m?.reciever).emit("opponent-left", m);
        io.emit("online", {
          online: getUsers(io), // users email and ids
        });
      });
      socket.on("restart-request", (m) => {
        // console.log("restart-request", m);
        io.to(m?.sender + m?.reciever).emit("restart-request-send", m);
      });
      socket.on("restart-request-response", (m) => {
        // console.log("restart-request-response", m);
        io.to(m?.sender + m?.reciever).emit("restart-request-responded", m);
      });
      socket.on("moves", (m) => {
        m.player1 = !m?.player1;
        m.moves += 1;
        io.to(m?.sender + m?.reciever).emit("next-state", m);
      });
      socket.on("game-ended", async (m) => {
        await gameCollection?.insertOne(m);
        io.to(m?.sender + m?.reciever).emit("declaration", m);
      });
      io.emit("online", {
        online: getUsers(io), // users email and ids
      });
      socket.on("disconnect", () => {
        let online = getUsers(io);

        for (let u in pair) {
          if (
            Object.keys(online).includes(u) &&
            Object.keys(online).includes(pair[u])
          )
            return;

          let sender = u;
          let reciever = pair[u];
          io.to(sender + reciever).emit("opponent-left", {
            sender: sender,
            reciever: reciever,
          });
        }
        io.emit("online", {
          online, // users email and ids
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

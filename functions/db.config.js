const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.mongoURL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const database = client.db("tic-tac-toe");
const userCollection = database.collection("user");
const gameCollection = database.collection("game");

module.exports = {
  client,
  userCollection,
  gameCollection,
};

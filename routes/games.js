const { Router } = require("express");
const { userCollection, gameCollection } = require("../functions/db.config");
const { ObjectId } = require("mongodb");
const router = Router();

router.get("/all-games", async (req, res) => {
  const games1 = await gameCollection
    ?.find({ sender: req?.query?.email })
    .toArray();
  const games2 = await gameCollection
    ?.find({ reciever: req?.query?.email })
    .toArray();
  res.send({ data: [...games1, ...games2] });
});
router.get("/single-game", async (req, res) => {
  const game = await gameCollection?.findOne({ _id: ObjectId(req?.query?.id) });
  //   console.log(user);
  res.send({ data: game });
});
router.post("/insert-game", async (req, res) => {
  //   console.log(req?.body);
  const result = await gameCollection?.insertOne(req?.body);
  res.send({ data: result });
});
router.get("/my-games", async (req, res) => {
  const email = req?.query?.email;
  const sentGames = await gameCollection
    ?.find({ sender: email })
    .sort({ time: -1 })
    .toArray();
  const recGames = await gameCollection
    ?.find({ reciever: email })
    .sort({ time: -1 })
    .toArray();
  const users = await userCollection?.find({}).toArray();
  const modUsers = {};
  users.forEach((u) => (modUsers[u?.email] = u));
  const allGames = {};
  sentGames.forEach((g) => {
    allGames[g?.reciever] = {
      opponent: modUsers[g?.reciever],
      games: Array.isArray(allGames[g?.reciever]?.games)
        ? [
            ...allGames[g?.reciever]?.games,
            {
              ...g,
              winner: "p1" ? g?.sender : "p2" ? g?.reciever : "",
            },
          ]
        : [
            {
              ...g,
              winner: "p1" ? g?.sender : "p2" ? g?.reciever : "",
            },
          ],
    };
  });
  recGames.forEach((g) => {
    allGames[g?.sender] = {
      opponent: modUsers[g?.sender]?.games,
      games: Array.isArray(allGames[g?.sender]?.games)
        ? [
            ...allGames[g?.sender],
            {
              ...g,
              winner: "p1" ? g?.sender : "p2" ? g?.reciever : "",
            },
          ]
        : [
            {
              ...g,
              winner: "p1" ? g?.sender : "p2" ? g?.reciever : "",
            },
          ],
    };
  });

  res.send({ data: allGames });
});

module.exports = router;

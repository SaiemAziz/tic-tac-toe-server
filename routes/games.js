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

module.exports = router;

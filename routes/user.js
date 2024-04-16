const { Router } = require("express");
const { userCollection } = require("../functions/db.config");

const router = Router();

router.get("/all-users", async (req, res) => {
  const users = await userCollection?.find({}).toArray();
  res.send({ data: users });
});
router.get("/single-user", async (req, res) => {
  const user = await userCollection?.findOne({ email: req?.query?.email });
  //   console.log(user);
  res.send({ data: user });
});
router.post("/insert-user", async (req, res) => {
  //   console.log(req?.body);
  let exist = await userCollection?.findOne({ email: req.body.email });
  let result;
  if (!exist?.email) result = await userCollection?.insertOne(req?.body);
  res.send({ data: result });
});

module.exports = router;

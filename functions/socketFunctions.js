const getUsers = (io) => {
  let list = {};
  if (!io?.busy) io.busy = [];
  io.sockets.sockets.forEach((s) => {
    if (s.handshake?.query?.email) {
      let user = s.handshake?.query;
      if (list[user?.email])
        list[user?.email] = {
          id: [...list[user?.email]?.id, s?.id],
          status: io?.busy?.includes(user?.email) ? "busy" : "online",
        };
      else
        list[user?.email] = {
          id: [s?.id],
          status: io?.busy?.includes(user?.email) ? "busy" : "online",
        };
    }
  });
  //   console.log(list);
  return list;
};

module.exports = {
  getUsers,
};

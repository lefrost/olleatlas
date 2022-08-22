let dome = require(`../utils/dome`);
let mongo = require(`../utils/mongo`);

module.exports = {
  getVote: async (id) => {
    return mongo.getOne(`votes`, { id });
  },

  countVotes: async (data) => {
    let params = {};

    if (data.item_id) {
      params[`item_id`] = data.item_id;
    }

    return mongo.count(`votes`, params);
  },

  getVotes: async (data, options) => {
    let params = {};

    if (data.start_id) {
      params[`id`] = { $gt: data.start_id };
    }

    if (data.item_id) {
      params[`item_id`] = data.item_id;
    }

    return mongo.getAll(`votes`, params, options);
  },

  addVote: async (data) => {
    await module.exports.pullVote({
      user_id: data.user_id || ``,
      item_id: data.item_id || ``,
    });

    let vote = {
      id: dome.generateId(),
      item_id: data.item_id || ``,
      user_id: data.user_id || ``,
      metadata: {
        create_timestamp: dome.getTimestamp(),
      },
    };

    await mongo.addOne(`votes`, vote);

    return vote;
  },

  pullVote: async (data) => {
    let matching_votes = await module.exports.getVotes(
      {
        user_id: data.user_id || ``,
        item_id: data.item_id || ``,
      },
      {
        sorters: [`id`],
        sort_direction: `ascending`,
      }
    );

    for (let matching_vote of matching_votes) {
      await module.exports.deleteVote({
        id: matching_vote.id,
      });
    }
  },

  deleteVote: async (data) => {
    await mongo.deleteOne(`votes`, { id: data.id });
  },
};

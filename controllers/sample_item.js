let dome = require(`../utils/dome`);
let mongo = require(`../utils/mongo`);

module.exports = {
  getItem: async (id) => {
    return mongo.getOne(`items`, { id });
  },

  getItems: async (data, options) => {
    let params = {};

    if (data.start_id) {
      params[`id`] = { $gt: data.start_id };
    }

    if (data.user_id) {
      params[`members`] = { $in: [data.user_id] };
    }

    return mongo.getAll(`items`, params, options);
  },

  countItems: async (data) => {
    let params = {};

    if (data.user_id) {
      params[`members`] = { $in: [data.user_id] };
    }

    return mongo.count(`items`, params);
  },

  addItem: async (data) => {
    let item = {
      id: data.id || dome.generateId(),
      name: data.name || ``,
      roles: data.roles || [],
      links: data.links || [],
      members: data.members || [],
      metadata: {
        create_timestamp: dome.getTimestamp(),
      },
    };

    await mongo.addOne(`items`, item);

    return item;
  },

  editItem: async (data) => {
    let item_edits = {};
    let item_incs = {};

    let editable_attributes = [`name`, `roles`, `links`, `members`];

    let numeric_attributes = [];
    let boolean_attributes = [];

    for (let key of Object.keys(data)) {
      if (
        editable_attributes.includes(key) &&
        data[key] !== null &&
        data[key] !== undefined
      ) {
        if (numeric_attributes.includes(key)) {
          item_edits[key] = Number(data[key]);
        } else if (boolean_attributes.includes(key)) {
          item_edits[key] = Boolean(data[key]);
        } else {
          item_edits[key] = data[key];
        }
      }
    }

    await mongo.updateOne(
      `items`,
      { id: data.id },
      { $set: item_edits, $inc: item_incs }
    );

    return await module.exports.getItem(data.id);
  },

  deleteItem: async (data) => {
    await mongo.deleteOne(`items`, { id: data.id });
  },
};

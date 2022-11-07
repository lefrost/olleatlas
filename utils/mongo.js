const { MongoClient } = require(`mongodb`);
const uri = process.env.DB_URI;
const API_TYPE = process.env.API_TYPE;

let dome = require("./dome");

module.exports = {
  getAll: async (collection_name, params, options) => {
    if (options.sorters === undefined) {
      options.sorters = [`id`];
    }

    if (options.sort_direction === undefined) {
      options.sort_direction = `ascending`;
    }

    let items = [];
    let item_count = (await module.exports.count(collection_name, params))
      .count;

    let last_id;

    while (items.length < item_count) {
      let loop_params = {};

      if (last_id) {
        loop_params[options.sorters[0]] = { $gt: last_id };
      }

      let items_from_database = await module.exports.getMany(
        collection_name,
        {
          ...params,
          ...loop_params,
        },
        {
          sorters: options.sorters ? options.sorters : [`id`],
          sort_direction: options.sort_direction || `ascending`,
          result_count: Math.min(item_count - items.length, 100),
        }
      );

      items.push(...items_from_database);

      // last_id = items[items.length - 1].id;
      last_id = items[items.length - 1][options.sorters[0]];
    }

    return items;
  },

  getMany: (collectionName, params, options) => {
    return new Promise(async (resolve, reject) => {
      if (options.sorters === undefined) {
        options.sorters = [`id`];
      }

      if (options.sort_direction === undefined) {
        options.sort_direction = `ascending`;
      }

      if (options.result_count === undefined) {
        options.result_count = 100;
      }

      let client = new MongoClient(uri);
      let data;

      await client.connect({ useUnifiedTopology: true });

      let sorters = {};
      for (let sorter_string of options.sorters) {
        sorters[sorter_string] =
          options.sort_direction === `ascending` ? 1 : -1;
      }

      await client
        .db(API_TYPE === `dev` ? `olleatlas-dev` : `olleatlas`)
        .collection(collectionName)
        .find(params, {
          sort: sorters,
          limit: options.result_count,
          collation: { locale: `en`, strength: 2 },
        })
        // limit-sort-find for lazy loading (need to update code for newer vers.) - https://tomkit.wordpress.com/2013/02/08/mongodb-lazy-loading-infinite-scrolling/
        // `sort` and `limit` in `find` (for newer vers.) - https://stackoverflow.com/a/60447623/8919391
        // `collation` for case-insensitive MongoDB query - https://stackoverflow.com/a/40914924
        .toArray(async (err, result) => {
          if (!dome.isEmptyObj(result)) {
            data = result;
            data.forEach((d) => delete d._id); // MongoDB automatically adds an `_id` prop to its objects; don't show that at the endpoint
          } else {
            data = [];
          }
        });
      await client.close();
      resolve(data);
    });
  },

  getOne: (collectionName, params) => {
    return new Promise(async (resolve, reject) => {
      // resolve({ collectionName, params });

      let client = new MongoClient(uri);
      let data;
      await client.connect({ useUnifiedTopology: true });
      await client
        .db(API_TYPE === `dev` ? `olleatlas-dev` : `olleatlas`)
        .collection(collectionName)
        .findOne(
          params,
          { collation: { locale: `en`, strength: 2 } },
          (err, result) => {
            if (result) {
              data = result;
              delete data._id;
            } else {
              data = {};
            }
          }
        );
      await client.close();
      resolve(data);
    });
  },

  addOne: (collectionName, obj) => {
    return new Promise(async (resolve, reject) => {
      let responseCode = 503;
      let client = new MongoClient(uri);

      try {
        await client.connect({ useUnifiedTopology: true });
        await client
          .db(API_TYPE === `dev` ? `olleatlas-dev` : `olleatlas`)
          .collection(collectionName)
          .insertOne(obj);
        responseCode = 201;
      } finally {
        await client.close();
        resolve(responseCode);
      }
    });
  },

  updateOne: (collectionName, idObj, setObj, filterObj) => {
    return new Promise(async (resolve, reject) => {
      let responseCode = 503;
      let client = new MongoClient(uri);

      try {
        await client.connect({ useUnifiedTopology: true });
        await client
          .db(API_TYPE === `dev` ? `olleatlas-dev` : `olleatlas`)
          .collection(collectionName)
          .updateOne(idObj, setObj, filterObj);
        responseCode = 200;
      } finally {
        await client.close();
        resolve(responseCode);
      }
    });
  },

  deleteOne: (collectionName, idObj) => {
    return new Promise(async (resolve, reject) => {
      let responseCode = 503;
      let client = MongoClient(uri);

      try {
        await client.connect({ useUnifiedTopology: true });
        await client
          .db(API_TYPE === `dev` ? `olleatlas-dev` : `olleatlas`)
          .collection(collectionName)
          .deleteOne(idObj);
        responseCode = 200;
      } finally {
        await client.close();
        resolve(responseCode);
      }
    });
  },

  deleteMany: (collectionName, idObj) => {
    return new Promise(async (resolve, reject) => {
      let responseCode = 503;
      let client = MongoClient(uri);

      try {
        await client.connect({ useUnifiedTopology: true });
        await client
          .db(API_TYPE === `dev` ? `olleatlas-dev` : `olleatlas`)
          .collection(collectionName)
          .deleteMany(idObj);
        responseCode = 200;
      } finally {
        await client.close();
        resolve(responseCode);
      }
    });
  },

  clear: (collectionName) => {
    return new Promise(async (resolve, reject) => {
      let responseCode = 503;
      let client = MongoClient(uri);

      try {
        await client.connect({ useUnifiedTopology: true });
        await client
          .db(API_TYPE === `dev` ? `olleatlas-dev` : `olleatlas`)
          .collection(collectionName)
          .remove();
        responseCode = 200;
      } finally {
        await client.close();
        resolve(responseCode);
      }
    });
  },

  count: (collectionName, params) => {
    return new Promise(async (resolve, reject) => {
      let client = MongoClient(uri);
      let count;

      try {
        await client.connect({ useUnifiedTopology: true });
        count = await client
          .db(API_TYPE === `dev` ? `olleatlas-dev` : `olleatlas`)
          .collection(collectionName)
          .find(params, {
            collation: { locale: `en`, strength: 2 },
          })
          .count();
      } finally {
        await client.close();
        resolve({ count });
      }
    });
  },
};

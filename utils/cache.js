let dome = require("./dome");
let mongo = require("./mongo");
let _ = require("lodash");

let cache = {};

module.exports = {
  // {id, type}
  get: async (d) => {
    return await get(d);
  },

  // {type, filters}
  getMany: async (d) => {
    return await getMany(d);
  },

  // -
  getAll: async () => {
    return await getAll();
  },

  // {db_obj}
  set: async (d) => {
    return await set(d);
  },

  // {id, type}
  del: async (d) => {
    return await del(d);
  },

  // {obj, type, exceptions}
  // pull: async (d) => {
  //   return await pull(d);
  // },

  // -
  refresh: async () => {
    return await refresh();
  },
};

async function get(d) {
  try {
    let obj;
    if (d.type && d.id) {
      obj = cache[`${d.type}-${d.id}`];
    } else {
      let objs = await getMany(d);
      if (objs.length > 0) {
        obj = objs[0];
      }
    }
    return obj || null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function getMany(d) {
  try {
    d.filters = [
      ...d.filters,
      {
        prop: `metadata.type`,
        value: d.type,
        condition: `match`,
        options: [],
      },
    ];

    console.log(`${d.type}-`);

    return Object.keys(cache)
      .filter((k) => k.startsWith(`${d.type}-`))
      .filter((k) => {
        let item = cache[k];
        let passed = true;

        for (let filter of d.filters) {
          switch (filter.condition) {
            // conditions: match, some
            case `match`: {
              // match options: non-case-sensitive
              if (filter.options.includes(`non-case-sensitive`)) {
                passed =
                  _.get(item, filter.prop).toLowerCase() ===
                  filter.value.toLowerCase();
              } else {
                passed = _.get(item, filter.prop) === filter.value;
              }
              break;
            }
            case `some`: {
              // some options: ...
              passed = _.some(_.get(item, filter.prop), filter.value);
              break;
            }
          }

          if (!passed) {
            break;
          }
        }

        return passed;
      })
      .map((k) => cache[k]);
  } catch (e) {
    console.log(e);
    return [];
  }
}

async function getAll() {
  try {
    return cache;
  } catch (e) {
    console.log(e);
    return [];
  }
}

async function set(d) {
  try {
    cache[`${d.obj.metadata.type}-${d.obj.id}`] = {
      ...d.obj,
      cache_metadata: {
        timestamp: dome.getTimestamp(),
      },
    };
  } catch (e) {
    console.log(e);
  }
}

async function del(d) {
  try {
    delete cache[`${d.type}-${d.id}`];
  } catch (e) {}
}

// async function pull(d) {
//   try {
//     let filters = [
//       {
//         prop: `metadata.type`,
//         value: d.type,
//         condition: `match`,
//         options: [],
//       },
//     ];

//     for (let key of Object.keys(d.obj)) {
//       if (!d.exceptions.includes(key)) {
//         filters.push({
//           prop: key,
//           value: d.obj[key],
//           condition: `match`,
//           options: [],
//         });
//       }
//     }

//     let matches = await getMany({ filters });

//     for (let match of matches) {
//       await del({ type: d.type, id: match.id });
//     }
//   } catch (e) {
//     console.log(e);
//   }
// }

async function refresh() {
  let deletables = [
    // {
    //   id: `user`,
    //   timespan_mins: 10,
    // },
  ];

  for (let key of Object.keys(cache)) {
    if (
      dome.isEmptyObj(cache[key]) ||
      dome.getTimestampDiff(
        cache[key].cache_metadata.timestamp,
        dome.getTimestamp(),
        `minutes`
      ) >=
        (deletables.some((d) => d.id === cache[key].metadata.type)
          ? deletables.find((d) => d.id === cache[key].metadata.type)
              .timespan_mins
          : 30)
      // && deletable_cache_entries.includes(cache[key].metadata.type)
    ) {
      delete cache[key];
    }
  }
}

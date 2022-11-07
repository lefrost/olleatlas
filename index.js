// config

require("dotenv").config();
const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const { Client, GatewayIntentBits, IntentsBitField } = require("discord.js");
const axios = require("axios").default;
const uri = process.env.DB_URI;

// const puppeteer = require("puppeteer");
// var userAgent = require("user-agents");
// let browser;

let cache = require(`./utils/cache`);
let dome = require(`./utils/dome`);
let mongo = require(`./utils/mongo`);

let port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log(`Up on http://localhost:${port}`);

  // browser = await puppeteer.launch({
  //   args: [`--no-sandbox`],
  // });
});

app.set(`view engine`, `pug`);

app.use(express.json({ limit: "50mb", extended: true }));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// cache

let cache_initiated = false;

function getWaitCacheResponse() {
  return {
    res: `wait`,
    msg: `Cache hasn't finished intiating.`,
    data: null,
  };
}

refreshCache();

async function refreshCache() {
  cache.refresh();
  await refreshCachedItems();
  if (!cache_initiated) {
    console.log(`cache initiated`);
  } else {
    console.log(`cache refreshed`);
  }
  cache_initiated = true;
  await dome.wait(30);
  refreshCache();
}

async function refreshCachedItems() {
  let keys = [
    // `users`,
  ];

  for (let key of keys) {
    console.log(`get cached ${key}`);
    let items = await mongo.getAll(key, {}, getOptionsFromBody({}));
    for (let item of items) {
      cache.set({ obj: item });
    }
  }
}

// routes

app.get(`/`, (req, res) => {
  res.send(`Olleatlas Sample API`);
});

// app.get("/scrape", async (req, res) => {
//   let url = req.query.url;
//   let page = await browser.newPage();
//   try {
//     await page.setItemAgent(itemAgent.toString());
//     await page.goto(url, {
//       waitUntil: "networkidle0",
//     });
//     res.send({ data: await page.content() });
//   } catch (e) {
//     res.send({ data: null });
//   } finally {
//     await page.close();
//   }
// });

app.get(`/cache`, async (req, res) => {
  res.send(await cache.getAll());
});

/*
  routes
  - /get {id, type, filters!}
  - /get_many {type, filters}
  - /add {obj, type}
  - /edit {obj, type}
  - /del {id, type}
  - /pull {obj, type}
*/

app.post(`/get`, async (fe, api) => {
  api.send(cache_initiated ? await get(fe.body) : getWaitCacheResponse());
});

app.post(`/get_many`, async (fe, api) => {
  api.send(cache_initiated ? await getMany(fe.body) : getWaitCacheResponse());
});

app.post(`/add`, async (fe, api) => {
  api.send(cache_initiated ? await add(fe.body) : getWaitCacheResponse());
});

app.post(`/edit`, async (fe, api) => {
  api.send(cache_initiated ? await edit(fe.body) : getWaitCacheResponse());
});

app.post(`/del`, async (fe, api) => {
  api.send(cache_initiated ? await del(fe.body) : getWaitCacheResponse());
});

app.post(`/pull`, async (fe, api) => {
  api.send(cache_initiated ? await pull(fe.body) : getWaitCacheResponse());
});

// functions

async function get(d) {
  try {
    return getRes({
      res: `ok`,
      act: `get`,
      type: d.type,
      data: await cache.get(d),
    });
  } catch (e) {
    return getRes({ res: `no`, act: `get`, type: d.type, data: null });
  }
}

async function getMany(d) {
  try {
    return getRes({
      res: `ok`,
      act: `get_many`,
      type: d.type,
      data: await cache.getMany(d),
    });
  } catch (e) {
    return getRes({ res: `no`, act: `get_many`, type: d.type, data: null });
  }
}

async function add(d) {
  try {
    let addable_data = await addable.get({ obj: d.obj, type: d.type });

    if (addable_data && addable_data.obj) {
      if (addable_data.pullable) {
        await pull({ obj: d.obj, type: d.type });
      }

      await mongo.addOne(addable_data.collection_name, addable_data.obj);

      let obj = await mongo.getOne(addable_data.collection_name, {
        id: addable_data.obj.id,
      });

      await cache.set({ obj });

      return getRes({ res: `ok`, act: `add`, type: d.type, data: obj });
    }

    return getRes({ res: `no`, act: `add`, type: d.type, data: null });
  } catch (e) {
    console.log(e);
    return getRes({ res: `no`, act: `add`, type: d.type, data: null });
  }
}

async function edit(d) {
  try {
    let edits = {};
    let increments = {};

    let editable_data = await editable.get({ type: d.type });

    if (editable_data) {
      for (let key of Object.keys(d.obj)) {
        if (
          editable_data.attributes.editables.includes(key) &&
          d.obj[key] !== null &&
          d.obj[key] !== undefined
        ) {
          if (editable_data.attributes.numerics.includes(key)) {
            edits[key] = Number(d.obj[key]);
          } else if (editable_data.attributes.booleans.includes(key)) {
            edits[key] = Boolean(d.obj[key]);
          } else {
            edits[key] = d.obj[key];
          }
        }
      }

      await mongo.updateOne(
        editable_data.collection_name,
        { id: d.obj.id },
        { $set: edits, $inc: increments }
      );

      let obj = await mongo.getOne(editable_data.collection_name, {
        id: d.obj.id,
      });

      await cache.set({ obj });

      return getRes({ res: `ok`, act: `edit`, type: d.type, data: obj });
    }

    return getRes({ res: `no`, act: `edit`, type: d.type, data: null });
  } catch (e) {
    console.log(e);
    return getRes({ res: `no`, act: `edit`, type: d.type, data: null });
  }
}

async function del(d) {
  try {
    let deletable_data = await deletable.get({ type: d.type });

    if (deletable_data) {
      await mongo.deleteOne(deletable_data.collection_name, { id: d.id });

      await cache.del({ id: d.id, type: d.type });

      return getRes({ res: `ok`, act: `del`, type: d.type, data: null });
    }

    return getRes({ res: `no`, act: `del`, type: d.type, data: null });
  } catch (e) {
    return getRes({ res: `no`, act: `del`, type: d.type, data: null });
  }
}

async function pull(d) {
  try {
    // {obj, type}
    let deletable_data = await deletable.get({ type: d.type });

    if (deletable_data) {
      let filters = [
        {
          prop: `metadata.type`,
          value: d.type,
          condition: `match`,
          options: [],
        },
      ];

      for (let key of Object.keys(d.obj)) {
        if (deletable_data.pullable_attributes.includes(key)) {
          filters.push({
            prop: key,
            value: d.obj[key] || ``,
            condition: `match`,
            options: [],
          });
        }
      }

      let matches = (await getMany({ type: d.type, filters })).data;

      for (let match of matches) {
        await mongo.deleteOne(deletable_data.collection_name, { id: match.id });

        await cache.del({ id: match.id, type: d.type });
      }

      return getRes({ res: `ok`, act: `pull`, type: d.type, data: null });
    }

    return getRes({ res: `no`, act: `pull`, type: d.type, data: null });
  } catch (e) {
    return getRes({ res: `no`, act: `pull`, type: d.type, data: null });
  }
}

// util

function getOptionsFromBody(body) {
  return {
    sorters: body.sorters ? body.sorters.split(`,`) : [`id`],
    sort_direction: body.sort_direction || `ascending`,
  };
}

function getRes(d) {
  let msg = `Unknown.`;

  switch (d.res) {
    case `ok`: {
      msg = `Completed [${d.act}] {${d.type}} in DB and cache.`;
      break;
    }
    case `no`: {
      msg = `Unable to [${d.act}] {${d.type}} in DB and cache.`;
      break;
    }
  }

  return {
    res: d.res,
    msg,
    data: d.data,
  };
}

// discord bot

// let DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// const discord_intents = new IntentsBitField();
// discord_intents.add(
//   IntentsBitField.Flags.Guilds,
//   IntentsBitField.Flags.GuildMembers
// );

// const discord_bot = new Client({
//   intents: discord_intents,
// });

// discord_bot.login(DISCORD_BOT_TOKEN);

// discord_bot.once(`ready`, async () => {
//   console.log(`Discord bot ready!`);
// });

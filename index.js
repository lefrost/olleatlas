// config

require("dotenv").config();
const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const { Client, GatewayIntentBits, IntentsBitField } = require("discord.js");
const axios = require("axios").default;
const uri = process.env.DB_URI;

// let api = require(`./utils/api`);
let dome = require(`./utils/dome`);
let mongo = require(`./utils/mongo`);

let _item = require(`./controllers/sample_item`);
let _vote = require(`./controllers/sample_vote`);

let port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log(`Up on http://localhost:${port}`);
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

// routes

app.get("/", (req, res) => {
  res.send("Olleatlas Sample API");
});

// scrape

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

// api

app.get(`/items`, async (req, res) => {
  res.send(
    await _item.getItems(
      {
        start_id: req.query.start_id,
      },
      {
        sorters: req.query.sorters ? req.query.sorters.split(`,`) : [`id`],
        sort_direction: req.query.sort_direction || `ascending`,
      }
    )
  );
});

app.get(`/item/:id`, async (req, res) => {
  res.send(await _item.getItem(req.params.id));
});

app.post(`/add/item`, async (req, res) => {
  try {
    res.send(await _item.addItem(req.body));
  } catch (e) {
    console.log(e);
    res.send(503);
  }
});

app.post(`/edit/item`, async (req, res) => {
  try {
    res.send(await _item.editItem(req.body));
  } catch (e) {
    console.log(e);
    res.send(503);
  }
});

app.post(`/delete/item`, async (req, res) => {
  try {
    res.send(await _item.deleteItem(req.body));
  } catch (e) {
    console.log(e);
    res.send(503);
  }
});

app.get("/votes", async (req, res) => {
  res.send(
    await _vote.getVotes(
      {
        start_id: req.query.start_id,
        item_id: req.query.item_id,
      },
      {
        sorters: req.query.sorters ? req.query.sorters.split(`,`) : [`id`],
        sort_direction: req.query.sort_direction || `ascending`,
      }
    )
  );
});

app.post(`/add/vote`, async (req, res) => {
  try {
    res.send(await _vote.addVote(req.body));
  } catch (e) {
    console.log(e);
    res.send(503);
  }
});
app.post(`/pull/vote`, async (req, res) => {
  try {
    res.send(await _vote.pullVote(req.body));
  } catch (e) {
    console.log(e);
    res.send(503);
  }
});

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
//   refresh();
// });

// async function refresh() {
//   await utils.wait(60);
//   refresh();
// }

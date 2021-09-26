require("dotenv").config();
const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const uri = process.env.DB_URI;

const puppeteer = require("puppeteer");
var userAgent = require("user-agents");
let browser;

let port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log(`Up on http://localhost:${port}`);

  browser = await puppeteer.launch({
    args: ["--no-sandbox"],
  });
});

app.use(function (request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

/* --- Routes --- */

app.get("/", (req, res) => {
  res.send("Olleatlas Sample API");
});

app.get("/scrape", async (req, res) => {
  let url = req.query.url;
  let page = await browser.newPage();
  try {
    await page.setUserAgent(userAgent.toString());
    await page.goto(url, {
      waitUntil: "networkidle0",
    });
    res.send({ data: await page.content() });
  } catch (e) {
    res.send({ data: null });
  } finally {
    await page.close();
  }
});

app.get("/users/:id", (req, res) => {
  let id = cleanStr(req.params.id);
  getUser(id).then((data) => {
    res.send(data);
  });
});

/* --- API: GET --- */

function get(collectionName, params, options) {
  params = params ? params : {};
  options = options ? options : {};
  let itemsRetrieved = new Promise(async (resolve, reject) => {
    let client = new MongoClient(uri);
    let data;

    try {
      await client.connect();
      await client
        .db("olleatlas")
        .collection(collectionName)
        .find(params, { collation: { locale: "en", strength: 2 } }) // Case-insensitive MongoDB query - https://stackoverflow.com/a/40914924
        .toArray(async function (err, result) {
          if (!isEmpty(result)) {
            if (options.single) {
              data = result[0];
              delete data._id; // MongoDB automatically adds an `_id` prop to its objects; don't show that at the endpoint
            } else {
              data = result;
              data.forEach((d) => delete d._id); // MongoDB automatically adds an `_id` prop to its objects; don't show that at the endpoint
            }
          } else {
            data = { error: "No data." };
          }
          client.close();
          resolve(data);
        });
    } finally {
      // moved client.close() and resolve(data) into the try block - https://stackoverflow.com/a/39535396
    }
  });

  return itemsRetrieved;
}

function getUser(id) {
  return get(
    "users",
    {
      id: id,
    },
    {
      single: true,
    }
  );
}

/* --- API: Add --- */

// app.get("/add/user/:params", (req, res) => {
//   let params = cleanStr(req.params.params);
//   addUser(params).then((resCode) => {
//     res.send(resCode);
//   });
// });

app.post("/add/user/:params", (req, res) => {
  let params = cleanStr(req.params.params);
  addUser(params).then((resCode) => {
    res.send(resCode);
  });
});

function addUser(params) {
  let userAdded = add("users", {
    ...JSON.parse(params),
    codes: [],
  });
  return userAdded;
}

function add(collectionName, obj) {
  obj = obj ? obj : {};
  let itemAdded = new Promise(async (resolve, reject) => {
    let client = new MongoClient(uri);

    try {
      await client.connect();
      await client.db("olleatlas").collection(collectionName).insertOne(obj);
    } finally {
      await client.close();
      resolve(201);
    }
  });

  return itemAdded;
}

/* --- API: Update --- */

// app.get("/update/user/:id/:params", (req, res) => {
//   let id = cleanStr(req.params.id);
//   let params = cleanStr(req.params.params);
//   updateUser(id, params).then((resCode) => {
//     res.send(resCode);
//   });
// });

app.post("/update/user/:id/:params", (req, res) => {
  let id = cleanStr(req.params.id);
  let params = cleanStr(req.params.params);
  updateUser(id, params).then((resCode) => {
    res.send(resCode);
  });
});

function updateUser(id, params) {
  let userUpdated = update(
    "users",
    {
      id: id,
    },
    JSON.parse(params)
  );

  return userUpdated;
}

function update(collectionName, idObj, setObj) {
  idObj = idObj ? idObj : {};
  setObj = setObj ? setObj : {};
  let itemUpdated = new Promise(async (resolve, reject) => {
    let client = MongoClient(uri);

    try {
      await client.connect();
      await client.db("olleatlas").collection(collectionName).updateOne(idObj, {
        $set: setObj,
      });
    } finally {
      await client.close();
      resolve(200);
    }
  });

  return itemUpdated;
}

/* --- Utils --- */

function cleanStr(str) {
  return str.toString().trim();
}

function isEmpty(obj) {
  for (let i in obj) return false;
  return true;
}

function paramsToObj(params) {
  return Object.fromEntries(
    params
      .replace(/%20/g, " ")
      .split("&")
      .map((s) => s.split("="))
  );
}

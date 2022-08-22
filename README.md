### 🍃 「olleatlas」 is Léfrost's Node.js API boilerplate.

- `npm i` to install packages.
- `node index.js` to run.
- `.env` file required. Variables: `API_TYPE = prod/dev`, `DB_URI = mongodb+srv:...`, `DISCORD_BOT_TOKEN = ABC123...`.
- [package.json](https://github.com/lefrst/olleatlas/blob/main/package.json) shows stable package versions.
- [Atlas](https://www.mongodb.com/atlas) database.
- [Heroku](https://www.heroku.com/home) deployment.
- [Discord.js](https://discordjs.guide) integration.
- Deploy to Heroku: `heroku login`, `heroku create app-name`, `heroku git:remote -a app-name`, `git push heroku main`. Push to Github first.
- [Buildpack](https://github.com/jontewks/puppeteer-heroku-buildpack) to make Puppeteer package work on Heroku.

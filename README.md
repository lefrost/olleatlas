# Olleatlas

My personal API template. Preview on [Heroku](https://olleatlas.herokuapp.com/users/1). ✌️

## Architecture

Built with Node.js, database on MongoDB Atlas, deployed on Heroku. 💪

Powered by:
- [node.js](https://github.com/nodejs/node) environment
- [express](https://github.com/expressjs/express) framework
- [mongodb](https://github.com/mongodb/node-mongodb-native) for connecting to database hosted on MongoDB Atlas
- [heroku](https://github.com/heroku/cli) for deployment through CLI
- [dotenv](https://github.com/motdotla/dotenv) for locally managing environment variables

## Stable versions

- node.js: `16.4.2`
- dotenv: `^10.0.0`
- express: `^4.17.1`
- mongodb: `^3.6.10` (dependency with version `4.0.0` or higher breaks the code!)

## Setup

```bash
npm install
node index.js
```

Note: Any dependency changes will require another `npm install` to be put into effect.

## Deployment

First-time deployment with [Heroku](http://heroku.com/).

```bash
heroku login
heroku create app-name
heroku git:remote -a app-name
git push heroku main
```

Following deployments, simply:
```bash
git push heroku main
```

Note: Anytime when deploying with Heroku CLI, commit main branch but don't push before deploying onto Heroku.

---

🍉 Last updated on July 2021 🍉

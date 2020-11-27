const express = require('express');
const app = require('./app');
const {PORT} = require('./config');
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: DATABASE_URL
})

app.set('db', db)

 app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

 module.exports = {app};
require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const {NODE_ENV} = require('./config')
const inventoryRouter = require('./inventory/inventory-router');
const recipeRouter = require('./recipes/recipe-router');
const mealplanRouter = require('./mealplan/mealplan-router');
const shoppingListRouter = require('./shoppingList/shopping-list-router');

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors());

app.use('/api/inventory', inventoryRouter)
app.use('/api/recipes', recipeRouter)
app.use('/api/mealplan', mealplanRouter)
app.use('/api/shopping-list', shoppingListRouter)

app.use(function errorHandler(error, req, res, next) {
   let response
   if (NODE_ENV === 'production') {
      response = { error: { message: 'server error' } }
    }else{
         console.error(error)
         response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app
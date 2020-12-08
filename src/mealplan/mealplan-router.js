const express = require('express');
const xss = require('xss');
const MealplanService = require('./mealplan-service');
const path = require('path');
const mealplanRouter = express.Router();
const jsonParser = express.json();

mealplanRouter
    .route('/')
    .get((req,res,next) => {
        MealplanService.getMealplanRecipes(req.app.get('db'))
            .then(recipes => {
                MealplanService.getMealplanItems(req.app.get('db'))
                    .then(items => {
                        res.items = items;
                        console.log({recipes: recipes, items: items})
                        res.status(200).json({recipes: recipes, items: items})
                    })
            })
            .catch(next)
    })
    .post(jsonParser, (req,res,next) => {
        const {recipe_id, item_id, qty, unit} = req.body;
        if((!recipe_id && !item_id) || !qty){
            return res.status(400).json({
                error: {message: 'Must include an item or recipe id and a quantity'}
            })
        }
        let mealplanItem = {recipe_id, item_id, qty, unit};
        MealplanService.addMealplanItem(req.app.get('db'), mealplanItem)
            .then(id => {
                    return res.status(201).end()
                })
    })

module.exports = mealplanRouter;


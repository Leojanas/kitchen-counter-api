const express = require('express');
const xss = require('xss');
const RecipeService = require('./recipe-service');
const path = require('path');
const InventoryService = require('../inventory/inventory-service');

const recipeRouter = express.Router();
const jsonParser = express.json();

const sanitizeRecipe = recipe => ({
        id: recipe.id,
        recipe_name: xss(recipe.recipe_name),
        category: recipe.category,
        rating: recipe.rating,
        instructions: xss(recipe.instructions),
        ingredients: recipe.ingredients
})

recipeRouter
    .route('/')
    .get((req,res,next) => {
        RecipeService.getRecipes(req.app.get('db'))
            .then(recipes => {
                return recipes
            })
            .then((recipes) => {
                if(recipes.length === 0){
                    return res.json([])
                }
                let promises = recipes.map((recipe) => {
                    return  RecipeService.getIngredientsByRecipe(req.app.get('db'), recipe.id)
                    .then(ingredients => {
                        recipe.ingredients = ingredients
                        return recipe
                    })
                  })
                  Promise.all(promises).then((results) => {
                      res.json(results)
                  })



            })
            .catch(next)
    })
    .post(jsonParser, (req,res,next) => {
        let input = req.body;
        if(!input.recipe_name || !input.category){
            return res.status(400).json({
                error: {message: 'Invalid data'}
            })
        }

        let ingredients = input.ingredients;
        delete input.ingredients;
        RecipeService.addRecipe(req.app.get('db'), input)
        .then((recipe) => {
            let promises = ingredients.map(ingredient => {
                return InventoryService.getItemByName(req.app.get('db'), ingredient.item_name)
                    .then((item) => {
                        let recipeIngredient = {
                            recipe_id: recipe.id,
                            item_id: item.id,
                            qty: ingredient.qty
                        };
                        return recipeIngredient
                    })
    
            })
            Promise.all(promises)
            .then(results => {
            RecipeService.addRecipeIngredients(req.app.get('db'), results)
            .then(() => {
                input.id = results[0].recipe_id;
                input.ingredients = ingredients;
                return res.status(201).json(input)
            })
        })
        })


    })

module.exports = recipeRouter;
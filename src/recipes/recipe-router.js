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
                        if(!item){
                            return InventoryService.addItem(req.app.get('db'), ingredient)
                                .then((item) => {
                                    console.log(item)
                                    console.log('added item')
                                    let recipeIngredient = {
                                        recipe_id: recipe.id,
                                        item_id: item[0],
                                        qty: ingredient.qty
                                    };
                                    console.log(recipeIngredient)
                                    return recipeIngredient;
                                })
                        }else{
                            let recipeIngredient = {
                                recipe_id: recipe.id,
                                item_id: item.id,
                                qty: ingredient.qty
                            };
                            return recipeIngredient
                        }
                    })
            })
            console.log(promises)
            Promise.all(promises)
            .then(results => {
                console.log(results)
            RecipeService.addRecipeIngredients(req.app.get('db'), results)
            .then(() => {
                RecipeService.getRecipeById(req.app.get('db'), recipe.id)
                .then(recipe => {
                    res.recipe = recipe
                    RecipeService.getIngredientsByRecipe(req.app.get('db'), res.recipe.id)
                    .then((ingredients) => {
                        res.recipe.ingredients = ingredients;
                        return res.status(201).json(res.recipe)
                    })
                })
            })
        })
        })


    })

recipeRouter
    .route('/:id')
    .all((req,res,next) => {
        RecipeService.getRecipeById(req.app.get('db'), req.params.id)
        .then(recipe => {
            if(!recipe){
                return res.status(404).end()
            }
            res.recipe = recipe
            next()
        })
    })
    .get((req,res,next) => {
        RecipeService.getIngredientsByRecipe(req.app.get('db'), res.recipe.id)
            .then((ingredients) => {
                res.recipe.ingredients = ingredients;
                return res.status(200).json(res.recipe)
            })
    })
    .patch(jsonParser, (req,res,next) => {
        let recipe = req.body;
        if(!recipe.recipe_name){
            return res.status(400).json({
                error: {message: 'Must update at least one field'}
            })
        }
        let ingredients = recipe.ingredients;
        delete recipe.ingredients;
        let promises = ingredients.map(ingredient => {
            return InventoryService.getItemByName(req.app.get('db'), ingredient.item_name)
                .then((item) => {
                    let recipeIngredient = {
                        recipe_id: req.params.id,
                        item_id: item.id,
                        qty: ingredient.qty
                    };
                    return recipeIngredient
                })

        })
        Promise.all(promises)
            .then(results => {
                RecipeService.deleteRecipeIngredients(req.app.get('db'), req.params.id)
                    .then(() => {
                        RecipeService.addRecipeIngredients(req.app.get('db'), results, req.params.id)
                            .then(()=> {
                        RecipeService.updateRecipe(req.app.get('db'), recipe, req.params.id)
                            .then(() => {
                                    return res.status(204).end()
                            })
                    })
                    .catch(next)
                })
            })
 
    })
    .delete((req,res,next) => {
        RecipeService.deleteRecipeIngredients(req.app.get('db'), req.params.id)
            .then(() => {
                RecipeService.deleteRecipe(req.app.get('db'), req.params.id)
                .then(() => {
                    return res.status(204).end()
                })
            })
    })


module.exports = recipeRouter;
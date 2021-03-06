const express = require('express');
const MealplanService = require('./mealplan-service');
const InventoryService = require('../inventory/inventory-service');
const mealplanRouter = express.Router();
const jsonParser = express.json();

mealplanRouter
    .route('/')
    .get((req,res,next) => {
        MealplanService.getMealplanRecipes(req.app.get('db'))
            .then(recipes => {
                MealplanService.getMealplanItems(req.app.get('db'))
                    .then(items => {
                        res.status(200).json({recipes: recipes, items: items})
                    })
            })
            .catch(next)
    })
    .post(jsonParser, (req,res,next) => {
        const {recipe_id, item_name, qty, unit} = req.body;
        if((!recipe_id && !item_name) || !qty){
            return res.status(400).json({
                error: {message: 'Must include an item name or recipe id and a quantity'}
            })
        }
        if(item_name){
            InventoryService.getItemByName(req.app.get('db'), item_name)
            .then(item => {
                let item_id;
                if(!item){
                    let item = {item_name: item_name}
                    InventoryService.addItem(req.app.get('db'), item)
                        .then(id => {
                            item_id = Number(id);
                            let mealplanItem = {item_id, qty, unit};
                            MealplanService.addMealplanItem(req.app.get('db'), mealplanItem)
                                .then(id => {
                                        return res.status(201).end()
                                })
                                .catch(next)
                        })
                }else{
                item_id = item.id
                let mealplanItem = {item_id, qty, unit};
                MealplanService.addMealplanItem(req.app.get('db'), mealplanItem)
                    .then(id => {
                            return res.status(201).end()
                    })
                    .catch(next)
                }
                })
        }else{
            let mealplanItem = {recipe_id, qty, unit};
            MealplanService.getMealplanItemByRecipeId(req.app.get('db'), mealplanItem.recipe_id)
                .then(item => {
                    if(item){
                        let qty = item.qty +1
                        item = {...item, qty}
                        MealplanService.updateMealplanQty(req.app.get('db'), item, item.id)
                        .then(() => {
                            return res.status(201).end()
                        })
                    }else{
                        MealplanService.addMealplanItem(req.app.get('db'), mealplanItem)
                        .then(() => {
                                return res.status(201).end()
                        })
                    }
                })
                .catch(next)
        }



    })
    .delete(jsonParser, (req,res,next) => {
        const {id} = req.body;
        if(!id){
            return res.status(400).json({
                error: {message: 'Invalid data'}
            })
        }
        if(id === 'all'){
            MealplanService.clearMealplan(req.app.get('db'))
                .then(() => {
                    return res.status(204).end()
                })
        }else{
        MealplanService.getMealplanItemById(req.app.get('db'), id)
            .then(item => {
                if(!item){
                    return res.status(400).json({
                        error: {message: 'Item not found in mealplan'}
                    })
                }
                MealplanService.removeMealplanItemById(req.app.get('db'), id)
                .then(() => {
                    return res.status(204).end()
                })
            })
            .catch(next)
        }
    })

module.exports = mealplanRouter;


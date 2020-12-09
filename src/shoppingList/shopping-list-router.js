const express = require('express');
const xss = require('xss');
const ShoppingListService = require('./shopping-list-service');
const path = require('path');
const InventoryService = require('../inventory/inventory-service');
const MealplanService = require('../mealplan/mealplan-service');
const unitService = require('../inventory/unit-service');
const UnitService = require('../inventory/unit-service');

const shoppingListRouter = express.Router();
const jsonParser = express.json();

shoppingListRouter
    .route('/')
    .get((req,res,next) => {
        ShoppingListService.getShoppingList(req.app.get('db'))
            .then(list => {
                return res.status(200).json(list)
            })
    })
    .post((req,res,next) => {
        ShoppingListService.clearShoppingList(req.app.get('db'))
            .then(() => {
                MealplanService.getItemsForShoppingList(req.app.get('db'))
                    .then(items => {
                        MealplanService.getRecipeItemsForShoppinglist(req.app.get('db'))
                            .then(recipeItems => {
                                let promises = recipeItems.map(item => {
                                    let index = items.indexOf(items.filter(i => i.id === item.item_id)[0])
                                    if(index >= 0){
                                        if(items[index].unit !== item.unit){
                                            UnitService.convertValue(item, items[index].unit)
                                                .then(value => {
                                                    let newItem = {
                                                        item_id: item.item_id,
                                                        qty: value,
                                                        unit: items[index].unit
                                                    }
                                                    return newItem
                                                })
                                        }
                                        return item
                                    }
                                    return item
                                })
                                Promise.all(promises)
                                .then(recipeItems => {
                                    items = items.map(item => {
                                        return {
                                            item_id: item.id,
                                            qty: item.qty,
                                            unit: item.unit
                                        }
                                    })
                                    recipeItems.map(item => {
                                        let index = items.indexOf(items.filter(i => i.item_id === item.item_id)[0]);
                                        if(index >= 0){
                                           item.qty = items[index].qty + item.qty;
                                           items[index].qty = 0;
                                           return item
                                        }
                                        return item
                                    })
                                    items.map(item => {
                                        if(item.qty > 0){
                                            recipeItems.push(item)
                                            return item
                                        }
                                    })
                                    InventoryService.getInventoryForShopping(req.app.get('db'))
                                    .then(inventory => {
                                        let promises = recipeItems.map(item => {
                                            let index = inventory.indexOf(inventory.filter(i => i.item_id === item.item_id)[0]);
                                                if(index >= 0){
                                                    if(inventory[index].unit !== item.unit){
                                                        UnitService.convertValue(item, inventory[index].unit)
                                                            .then(value => {
                                                                let newItem = {
                                                                    item_id: item.item_id,
                                                                    qty: value - inventory[index].qty,
                                                                    unit: inventory[index].unit
                                                                }
                                                                return newItem
                                                            })
                                                    }
                                                    let newItem = {
                                                        item_id: item.item_id,
                                                        qty: item.qty - inventory[index].qty,
                                                        unit: inventory[index].unit
                                                    }
                                                    return newItem
                                                }
                                                return item
                                        })
                                        Promise.all(promises)
                                        .then(finalList => {
                                            finalList = finalList.filter(item => {
                                                return item.qty > 0;
                                            })
                                            ShoppingListService.addShoppingList(req.app.get('db'), finalList)
                                            .then(list => {
                                                return res.status(201).json(list)
                                            })
                                        })

                                    })

                                })

                            })
                    })
            })
            .catch(next)
    })
    .delete((req,res,next) => {
        ShoppingListService.clearShoppingList(req.app.get('db'))
        .then(() => {
            return res.status(204).end()
        })
    })





module.exports = shoppingListRouter;
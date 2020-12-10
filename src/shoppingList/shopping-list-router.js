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
                                            let value = UnitService.convertValue(item, items[index].unit)
                                                let newItem = {
                                                    item_id: item.item_id,
                                                    qty: value,
                                                    unit: items[index].unit
                                                }
                                                return newItem
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
                                            let instances =inventory.filter(i => i.item_id === item.item_id);
                                            if(instances.length === 0){
                                                return item
                                            }
                                            if(instances.length === 1){
                                                if(instances[0].unit !== item.unit){
                                                    let value = UnitService.convertValue(item, instances[0].unit)
                                                        let newItem = {
                                                            item_id: item.item_id,
                                                            qty: value - instances[0].qty,
                                                            unit: instances[0].unit
                                                        }
                                                        return newItem
                                                }
                                                let newItem = {
                                                    item_id: item.item_id,
                                                    qty: item.qty - instances[0].qty,
                                                    unit: instances[0].unit
                                                }
                                                return newItem
                                            }
                                            if(instances.length > 1){
                                                let total = UnitService.combineAmounts(instances)
                                                if(total.unit !== item.unit){
                                                    let value = UnitService.convertValue(item, total.unit)
                                                        let newItem = {
                                                            item_id: item.item_id,
                                                            qty: value - total.qty,
                                                            unit: total.unit
                                                        }
                                                        return newItem
                                                }
                                                let newItem = {
                                                    item_id: item.item_id,
                                                    qty: item.qty - total.qty,
                                                    unit: total.unit
                                                }
                                                return newItem
                                            }
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
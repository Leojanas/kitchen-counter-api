const express = require('express');
const xss = require('xss');
const InventoryService = require('./inventory-service');
const RecipeService = require('../recipes/recipe-service');
const UnitService = require('./unit-service');
const path = require('path');
const inventoryRouter = express.Router();
const jsonParser = express.json();

const sanitizeItem = item => ({
        id: item.id,
        item_name: xss(item.item_name),
        qty: item.qty,
        unit: item.unit
})

inventoryRouter
    .route('/')
    .get((req, res, next) => {
        InventoryService.getInventory(req.app.get('db'))
        .then(items => {
            if(items.length === 0){
                return res.json([])
            }
            res.json(items.map(item => sanitizeItem(item)))
        })
        .catch(next)
    })
    .post(jsonParser, (req,res,next) => {
        if(Array.isArray(req.body)){
            let items = [];
            for(let i=0;i<req.body.length;i++){
                let {item_id, qty, unit} = req.body[i];
                if(!item_id || !qty || !unit){
                    return res.status(400).send({
                        error: {message: 'Invalid data'}
                    })
                }
                items.push({item_id, qty, unit}) 
            }
            InventoryService.addMultipleInventoryItems(req.app.get('db'), items)
            .then(() => {
                return res.status(201).end()
            })
            .catch(next)

        }else{
        let {item_name, qty, unit} = req.body;
        if(!item_name || !qty || !unit){
            return res.status(400).send({
                error: {message: 'Invalid data'}
            })
        }
        const inputItem = {item_name, qty, unit}
        InventoryService.getItemByName(req.app.get('db'), item_name)
            .then(item => {
                let item_id;
                if(!item){
                    InventoryService.addItem(req.app.get('db'), inputItem)
                        .then(i => {
                            item_id = Number(i)
                            const inventoryItem = {
                                item_id: item_id,
                                qty: inputItem.qty,
                                unit: inputItem.unit
                            }
                            InventoryService.addInventoryItem(req.app.get('db'), inventoryItem)
                                .then(item => {
                                    res
                                        .status(201)
                                        .location(path.posix.join(req.originalUrl + `/${item.id}`))
                                        .json(sanitizeItem(item))
                                })
                                .catch(next)
                        })
                        .catch(next) 
                }else{
                    item_id = item.id;
                    InventoryService.getInventoryItemByItemId(req.app.get('db'), item_id)
                    .then(item => {
                        if(item){
                            if(item.unit !== inputItem.unit){
                                inputItem.qty = UnitService.convertValue(inputItem, item.unit)
                            }
                            const inventoryItem = {
                                id: item.id,
                                item_id: item_id,
                                qty: inputItem.qty + item.qty,
                                unit: item.unit
                            }
                            InventoryService.updateInventoryItem(req.app.get('db'), inventoryItem, inventoryItem.id)
                            .then(() => {
                                return res.status(204).end()
                            })

                        }else{
                            const inventoryItem = {
                                item_id: item_id,
                                qty: inputItem.qty,
                                unit: inputItem.unit
                            }
                            InventoryService.addInventoryItem(req.app.get('db'), inventoryItem)
                                .then(item => {
                                    return res
                                        .status(201)
                                        .location(path.posix.join(req.originalUrl + `/${item.id}`))
                                        .json(sanitizeItem(item))
                                })
                                .catch(next)
                        }
                    })

                }
            })
            .catch(next)
        }
    })
    .patch(jsonParser, (req,res,next) => {
        //this endpoint updates the inventory when a recipe is used
        //check for  valid recipe id in body
        let {recipe_id} = req.body;
        if(recipe_id === undefined){
            return res.status(400).json({
                error: { message: "Recipe not found"}
            })
        }
        RecipeService.getRecipeById(req.app.get('db'), recipe_id)
            .then(recipe => {
                if(!recipe){
                    return res.status(400).json({
                        error: { message: "Recipe not found"}
                    })
                }
                //get all recipe ingredients
                RecipeService.getIngredientsByRecipe(req.app.get('db'), recipe_id)
                .then(ingredients => {
                    InventoryService.getInventory(req.app.get('db'))
                    .then(inventory => {
                        let item_names = inventory.map(item => item.item_name);
                        let promises = ingredients.map(ingredient => {
                            let bool = !item_names.includes(ingredient.item_name)
                            if(bool){
                                return res.status(400).json({
                                    error: {message: "At least one recipe ingredient was not found in inventory"}
                                })
                            }
                            //convert units to match inventory
                            let inventoryUnit = inventory.filter(item => item.item_name === ingredient.item_name)[0].unit;
                            if(ingredient.unit !== inventoryUnit){
                                let qty = UnitService.convertValue(ingredient, inventoryUnit);
                                if(qty === 'Not a valid set of units for conversion'){
                                    return res.status(400).json({
                                        error: {message: "Cannot convert between recipe and inventory units"}
                                    })
                                }
                                return {item_name: ingredient.item_name, qtyToRemove: qty}
                            }
                            return {item_name : ingredient.item_name, qtyToRemove: ingredient.qty }
                        })
                        Promise.all(promises)
                        .then(ingredients => {
                            let updates = ingredients.map(ingredient => {
                                let inventoryItem = inventory.filter(item => item.item_name === ingredient.item_name)[0]
                                let inventoryQty = inventoryItem.qty;
                                //check if all ingredients have large enough inventory quantities
                                if(inventoryQty < ingredient.qtyToRemove){
                                    return res.status(400).json({
                                        error: {message: "At least one ingredient requires more than is currently in inventory"}
                                    })
                                }
                                //adjust inventory quantities as needed
                                let newItem = {...inventoryItem, qty: inventoryQty - ingredient.qtyToRemove}
                                let id = newItem.id
                                return InventoryService.getItemByName(req.app.get('db'), newItem.item_name)
                                    .then(item => {
                                        let item_id = item.id;
                                        let inventoryItem = {
                                            id: newItem.id,
                                            item_id: item_id,
                                            qty: newItem.qty,
                                            unit: newItem.unit
                                        }
                                        if(inventoryItem.qty === 0){
                                            return InventoryService.deleteInventoryItem(req.app.get('db'), inventoryItem.id)
                                        }
                                        return InventoryService.updateInventoryItem(req.app.get('db'), inventoryItem, id)
                                    })
                            })
                            Promise.all(updates)
                            .then(() => {
                                    //return new inventory
                                    InventoryService.getInventory(req.app.get('db'))
                                    .then((inventory) => {
                                        return res.json(inventory)
                                    })
                                })

                        })
                    })
                })
            })
            .catch(next)
    })

inventoryRouter
    .route('/:id')
    .all((req,res,next) => {
        InventoryService.getInventoryItemById(req.app.get('db'), req.params.id)
            .then(item => {
                if(!item){
                    return res.status(404).send({
                        error: {message: 'Item does not exist in inventory'}
                    })
                }
                res.item = item
                next()
            })
    })
    .get((req,res,next) => {
        res.json(sanitizeItem(res.item))
    })
    .put(jsonParser, (req,res,next) => {
        let {qty, unit} = req.body;
        if(!qty && !unit){
            return res.status(400).json({
                error: {message: 'Must update at least one field'}
            })
        }
        const item = {id: res.item.id, qty, unit}
        InventoryService.updateInventoryItem(req.app.get('db'), item, req.params.id)
            .then(() => {
                res.status(204).end()
            })
        
    })
    .delete((req,res,next) => {
        InventoryService.deleteInventoryItem(req.app.get('db'), req.params.id)
            .then(() => {
                return res.status(204).end()
            })
    })



module.exports = inventoryRouter;
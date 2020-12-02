const express = require('express');
const xss = require('xss');
const InventoryService = require('./inventory-service');
const path = require('path');

const inventoryRouter = express.Router();
const jsonParser = express.json();

const sanitizeItem = item => ({
        id: item.id,
        item_name: xss(item.item_name),
        item_id: item.item_id,
        qty: item.qty,
        expiration: item.expiration
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
        const {item_name, qty, expiration, unit} = req.body;
        if(!item_name || !qty){
            return res.status(400).send({
                error: {message: 'Invalid data'}
            })
        }
        const inputItem = {item_name, qty, expiration, unit}
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
                                expiration: inputItem.expiration
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
                    const inventoryItem = {
                        item_id: item_id,
                        qty: inputItem.qty,
                        expiration: inputItem.expiration
                    }
                    InventoryService.addInventoryItem(req.app.get('db'), inventoryItem)
                        .then(item => {
                            res
                                .status(201)
                                .location(path.posix.join(req.originalUrl + `/${item.id}`))
                                .json(sanitizeItem(item))
                        })
                        .catch(next)
                }
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
    .patch(jsonParser, (req,res,next) => {
        const {qty, expiration} = req.body;
        if(!qty && !expiration){
            return res.status(400).json({
                error: {message: 'Must update at least one field'}
            })
        }
        const item = {id: res.item.id, qty, expiration}
        InventoryService.updateInventoryItem(req.app.get('db'), item, req.params.id)
            .then(() => {
                res.status(204).end()
            })
        
    })
    .delete((req,res,next) => {
        InventoryService.deleteInventoryItem(req.app.get('db'), req.params.id)
            .then(() => {
                res.status(204).end()
            })
    })



module.exports = inventoryRouter;
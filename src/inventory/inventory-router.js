const express = require('express');
const xss = require('xss');
const InventoryService = require('./inventory-service');
const path = require('path');

const inventoryRouter = express.Router();
const jsonParser = express.json();

const sanitizeItem = item => ({
        id: item.id,
        item_id: item.item_id,
        qty: xss(item.qty),
        expiration: xss(item.expiration)
    })

inventoryRouter
    .route('/')
    .get((req, res, next) => {
        InventoryService.getInventory(req.app.get('db'))
        .then(items => {
            if(items.length === 0){
                return res.json([])
            }
            res.json(items)
        })
        .catch(next)
    })
    .post(jsonParser, (req,res,next) => {
        const {item_id, qty, expiration} = req.body;
        if(!item_id || !qty){
            return res.status(400).send({
                error: {message: 'Invalid data'}
            })
        }
        const item = {item_id, qty, expiration}
        InventoryService.addInventoryItem(req.app.get('db'), item)
            .then(item => {
                res
                .status(201)
                .location(path.posix.join(req.originalUrl + `/${item.id}`))
                .json(item)
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
        res.json(res.item)
    })
    .patch(jsonParser, (req,res,next) => {
        const {qty, expiration} = req.body;
        if(!qty && !expiration){
            return res.status(400).json({
                error: {message: 'Must update at least one field'}
            })
        }
        const item = {...res.item, qty, expiration}
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
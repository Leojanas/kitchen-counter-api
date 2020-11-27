const express = require('express')
const xss = require('xss')
//const FoldersService = require('./folders-service')
const path = require('path')

const inventoryRouter = express.Router()
const jsonParser = express.json()

inventoryRouter
    .route('/')
    .get((req, res, next) => {
        res.status(200).send([])
    })
    .post(jsonParser, (req,res,next) => {
        res.status(404).end()
    })



module.exports = inventoryRouter;
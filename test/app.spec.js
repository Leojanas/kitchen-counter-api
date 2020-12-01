const supertest = require('supertest');
const app = require('../src/app');
const knex = require('knex');
const makeItemsArray = require('./items.fixtures');
const makeInventoryArray = require('./inventory.fixtures');
const { expect } = require('chai');

let db;
  
before('make knex instance', () => {
  db = knex({
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL,
  })
  app.set('db', db)
});
after('disconnect from db', () => db.destroy());
before('clean the table', () => db.raw('TRUNCATE items, inventory, recipes, recipe_ingredients RESTART IDENTITY CASCADE'));
afterEach('cleanup',() => db.raw('TRUNCATE items, inventory, recipes, recipe_ingredients RESTART IDENTITY CASCADE'));


describe('Inventory Endpoints', () => {
  describe('GET /api/inventory', () => {
    context('Given no inventory items', () => {
      it('Returns 200 and an empty array', () => {
        return supertest(app)
          .get('/api/inventory')
          .expect(200, [])
      })
    })
    context('Given inventory items', () => {
      const itemsArray = makeItemsArray();
      beforeEach('seed items table', () => {
      return db.insert(itemsArray).into('items')
      })
      const inventoryArray = makeInventoryArray();
      const outputArray = [
        {
          id: inventoryArray[0].id,
          item_name: itemsArray[0].item_name,
          qty: inventoryArray[0].qty,
          unit: itemsArray[0].unit,
          expiration: inventoryArray[0].expiration
        },
        {
          id: inventoryArray[1].id,
          item_name: itemsArray[2].item_name,
          qty: inventoryArray[1].qty,
          unit: itemsArray[2].unit,
          expiration: inventoryArray[0].expiration
        }
      ]
      beforeEach('Seed inventory table', () => {
        return db.insert(inventoryArray).into('inventory')
      })
      it('Returns 200 and the inventory array', () => {

        return supertest(app)
          .get('/api/inventory')
          .expect(200, outputArray)
      })
    })
    /*context('Given an xss attack item', () => {
      it('Returns the sanitized item', () => {

      })
    })*/

  })
  describe('POST /api/inventory', () => {
    beforeEach('seed items table', () => {
      const itemsArray = makeItemsArray();
      return db.insert(itemsArray).into('items')
      })
    it('should return 400 if required fields are blank', () => {
      return supertest(app)
        .post('/api/inventory')
        .send({})
        .expect(400, {
          error: {message: 'Invalid data'}
        })
    })
    it('should add item to inventory and return item and location', () => {
      const inventoryItem = {
        item_id: 2,
        qty: 8,
        expiration: '2020-12-25T07:00:00.000Z'
      }
      return supertest(app)
        .post('/api/inventory')
        .send(inventoryItem)
        .expect(201)
        .expect(res => {
          expect(res.body).to.eql({...inventoryItem, id: 1})
          expect(res.headers.location).to.eql('/api/inventory/1')
        })
    })
  })

})

describe('inventory/:id endpoints', () => {
  describe('GET /api/inventory/:id', () => {
    context('given that the item does not exist', () => {
      it('should return 404 not found', () => {
        return supertest(app)
          .get('/api/inventory/45')
          .expect(404, {
            error: {message: 'Item does not exist in inventory'}
          })
      })
    })
    context('given the item does exist', () => {
      const itemsArray = makeItemsArray();
      beforeEach('seed items table', () => {
        return db.insert(itemsArray).into('items')
      })
      const inventoryArray = makeInventoryArray();
      beforeEach('Seed inventory table', () => {
        return db.insert(inventoryArray).into('inventory')
      })
      it('should return the item', () => {
        const item = {
          id: inventoryArray[0].id,
          item_name: itemsArray[0].item_name,
          qty: inventoryArray[0].qty,
          unit: itemsArray[0].unit,
          expiration: inventoryArray[0].expiration
        }
        return supertest(app)
          .get('/api/inventory/1')
          .expect(200, item)
      })
    })
  })
  describe('PATCH /api/inventory/:id', () => {
    context('given that the item does not exist', () => {
      it('should return 404 not found', () => {
        return supertest(app)
          .patch('/api/inventory/45')
          .send({})
          .expect(404, {
            error: {message: 'Item does not exist in inventory'}
          })
      })
    })
    context('given the item does exist', () => {
      const itemsArray = makeItemsArray();
      beforeEach('seed items table', () => {
        return db.insert(itemsArray).into('items')
      })
      const inventoryArray = makeInventoryArray();
      beforeEach('Seed inventory table', () => {
        return db.insert(inventoryArray).into('inventory')
      })
      it('should return 400 if no fields are updated', () => {
        return supertest(app)
          .patch('/api/inventory/1')
          .send({})
          .expect(400, {
            error: {message: 'Must update at least one field'}
          })
      })
      it('should return 204', () => {
        const item = {
          id: 1,
          item_id: 1,
          qty: 8,
          expiration: '2020-12-05T07:00:00.000Z'
        }
        const inventory = [{
          id: inventoryArray[0].id,
          item_name: itemsArray[0].item_name,
          qty: 8,
          unit: itemsArray[0].unit,
          expiration: '2020-12-05T07:00:00.000Z'
        },
        {
          id: inventoryArray[1].id,
          item_name: itemsArray[2].item_name,
          qty: inventoryArray[1].qty,
          unit: itemsArray[2].unit,
          expiration: inventoryArray[0].expiration
        }]
        return supertest(app)
          .patch('/api/inventory/1')
          .send({
            qty: 8,
            expiration: '2020-12-05T07:00:00.000Z'
          })
          .expect(204)
          .then(() => {
            return supertest(app)
              .get('/api/inventory')
              .expect(200, inventory)
          })
      })
    }) 
  })
  describe('DELETE /api/inventory/:id', () => {
    context('given that the item does not exist', () => {
      it('should return 404 not found', () => {
        return supertest(app)
          .delete('/api/inventory/45')
          .expect(404, {
            error: {message: 'Item does not exist in inventory'}
          })
      })
    })
    context('given the item does exist', () => {
      const itemsArray = makeItemsArray();
      beforeEach('seed items table', () => {
        return db.insert(itemsArray).into('items')
        })
        const inventoryArray = makeInventoryArray();
        beforeEach('Seed inventory table', () => {
          return db.insert(inventoryArray).into('inventory')
        })
      it('should delete the item and return 204', () => {
        const item = inventoryArray[0]
        const inventory =  [{
          id: inventoryArray[1].id,
          item_name: itemsArray[2].item_name,
          qty: inventoryArray[1].qty,
          unit: itemsArray[2].unit,
          expiration: inventoryArray[0].expiration
        }]
        return supertest(app)
          .delete('/api/inventory/1')
          .expect(204)
          .then(() => {
            return supertest(app)
              .get('/api/inventory')
              .expect(200, inventory)
          })
      })
    })
  })
})
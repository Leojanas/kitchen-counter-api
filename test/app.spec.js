const supertest = require('supertest');
const app = require('../src/app');
const knex = require('knex');
const makeItemsArray = require('./items.fixtures');
const makeInventoryArray = require('./inventory.fixtures');
const makeRecipesArray = require('./recipes.fixtures');
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


describe('inventory Endpoints', () => {
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
    it('should add to inventory and create a new item if needed', () => {
      return supertest(app)
        .post('/api/inventory')
        .send({
          item_name: 'carrots',
          qty: 4,
          unit: 'each',
          expiration: '2020-12-22T07:00:00.000Z'
        })
        .expect(201)
        .expect(res => {
          expect(res.body).to.eql({id: 1, item_name: 'carrots', qty: 4, unit: 'each', expiration: '2020-12-22T07:00:00.000Z'})
          expect(res.headers.location).to.eql('/api/inventory/1')
        })
    })
    it('should add item to inventory and return item and location', () => {
      const inventoryItem = {
        item_name: 'butter',
        qty: 8,
        unit: 'cups',
        expiration: '2020-12-25T07:00:00.000Z'
      }
      return supertest(app)
        .post('/api/inventory')
        .send(inventoryItem)
        .expect(201)
        .expect(res => {
          expect(res.body).to.eql({...inventoryItem, id: 1, unit: 'cups'})
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

describe('recipes endpoints', () => {
  describe('GET /api/recipes', () => {
    context('given no recipes', () => {
      it('should return an empty array', () => {
        return supertest(app)
          .get('/api/recipes')
          .expect(200, [])
      })
    })
    context('given data in recipes', () => {
      const itemsArray = makeItemsArray();
      beforeEach('seed items table', () => {
      return db.insert(itemsArray).into('items')
      })
      const inventoryArray = makeInventoryArray();
      beforeEach('Seed inventory table', () => {
        return db.insert(inventoryArray).into('inventory')
      })
      const recipesArray = makeRecipesArray();
      const ingredientsArray = [
        {
          recipe_id: 1,
          item_id: 1,
          qty: 4
        },
        {
          recipe_id: 1,
          item_id: 2,
          qty: 1
        }
      ];
      beforeEach('Seed recipes table', () => {
        return db.insert(recipesArray).into('recipes')
          .then(() => {
            return db.insert(ingredientsArray)
            .into('recipe_ingredients')
          })
      })
      it('should return a recipes array', () => {
        const expectedArray = [
          {
            id: 1,
            recipe_name: 'Meatloaf',
            category: 'main',
            rating: 4,
            instructions: 'Step 1: Do this. Step 2: Do that.',
            ingredients: [
              {
                item_name: 'eggs',
                qty: 4,
                unit: 'each'
              },
              {
                item_name: 'butter',
                qty: 1,
                unit: 'cups'
              }
            ]
          },
          {
            id: 2,
            recipe_name: 'Green Beans',
            category: 'side',
            rating: 4,
            instructions: 'Step 1: Do this. Step 2: Do that.',
            ingredients: []
          }
        ]
        return supertest(app)
          .get('/api/recipes')
          .expect(200, expectedArray)
      })
    })
  })
  describe('POST /api/recipes', () => {
    const itemsArray = makeItemsArray();
    beforeEach('seed items table', () => {
    return db.insert(itemsArray).into('items')
    })
    const inventoryArray = makeInventoryArray();
    beforeEach('Seed inventory table', () => {
      return db.insert(inventoryArray).into('inventory')
    })
    it('Should return 400 if required fields are missing', () => {
      return supertest(app)
        .post('/api/recipes')
        .send({})
        .expect(400, {
          error: {message: 'Invalid data'}
        })
    })
    it('Should save the recipe and return the recipe and location with 201 status', () => {
      const expResponse = {
        id: 1,
        recipe_name: 'Test name',
        category: 'main',
        rating: 5,
        instructions: 'Step 1: Stuff. Step 2: Other Things.',
        ingredients: [
          {
            item_name: 'eggs',
            qty: 2,
            unit: 'each'
          },
          {
            item_name: 'butter',
            qty: 1,
            unit: 'cups'
          }
        ]
      }
      return supertest(app)
        .post('/api/recipes')
        .send({
          recipe_name: 'Test name',
          category: 'main',
          rating: 5,
          instructions: 'Step 1: Stuff. Step 2: Other Things.',
          ingredients: [
            {
              item_name: 'eggs',
              qty: 2,
              unit: 'each'
            },
            {
              item_name: 'butter',
              qty: 1,
              unit: 'cups'
            }
          ]
        })
        .expect(201, expResponse)
    })
  })
})

describe('recipes/:id endpoints', () => {
  it('should respond 404 if id does not exist', () => {
    return supertest(app)
      .get('/api/recipes/45')
      .expect(404)
  })
  describe('GET /api/recipes/:id', () => {
    const itemsArray = makeItemsArray();
    beforeEach('seed items table', () => {
    return db.insert(itemsArray).into('items')
    })
    const inventoryArray = makeInventoryArray();
    beforeEach('Seed inventory table', () => {
      return db.insert(inventoryArray).into('inventory')
    })
    const recipesArray = makeRecipesArray();
    const ingredientsArray = [
      {
        recipe_id: 1,
        item_id: 1,
        qty: 4
      },
      {
        recipe_id: 1,
        item_id: 2,
        qty: 1
      }
    ];
    beforeEach('Seed recipes table', () => {
      return db.insert(recipesArray).into('recipes')
        .then(() => {
          return db.insert(ingredientsArray)
          .into('recipe_ingredients')
        })
    })
    it('should retrieve the recipe if it exists', () => {
      return supertest(app)
        .get('/api/recipes/1')
        .expect(200, {
          id: 1,
          recipe_name: 'Meatloaf',
          category: 'main',
          rating: 4,
          instructions: 'Step 1: Do this. Step 2: Do that.',
          ingredients: [
            { item_name: 'eggs', qty: 4, unit: 'each' },
            { item_name: 'butter', qty: 1, unit: 'cups' }
          ]
        })
    })
  })

  describe('DELETE /api/recipes/:id', () => {
    const itemsArray = makeItemsArray();
    beforeEach('seed items table', () => {
    return db.insert(itemsArray).into('items')
    })
    const inventoryArray = makeInventoryArray();
    beforeEach('Seed inventory table', () => {
      return db.insert(inventoryArray).into('inventory')
    })
    const recipesArray = makeRecipesArray();
    const ingredientsArray = [
      {
        recipe_id: 1,
        item_id: 1,
        qty: 4
      },
      {
        recipe_id: 1,
        item_id: 2,
        qty: 1
      }
    ];
    beforeEach('Seed recipes table', () => {
      return db.insert(recipesArray).into('recipes')
        .then(() => {
          return db.insert(ingredientsArray)
          .into('recipe_ingredients')
        })
    })
    it('should delete the recipe and return 204', () => {
      return supertest(app)
        .delete('/api/recipes/1')
        .expect(204)
        .then(() => {
          return supertest(app)
            .get('/api/recipes')
            .expect(200, [  {
              id: 2,
              recipe_name: 'Green Beans',
              category: 'side',
              rating: 4,
              instructions: 'Step 1: Do this. Step 2: Do that.',
              ingredients: []
            }
          ])
        })
    })
  })

  describe('PATCH /api/recipes/:id', () => {
    const itemsArray = makeItemsArray();
    beforeEach('seed items table', () => {
    return db.insert(itemsArray).into('items')
    })
    const inventoryArray = makeInventoryArray();
    beforeEach('Seed inventory table', () => {
      return db.insert(inventoryArray).into('inventory')
    })
    const recipesArray = makeRecipesArray();
    const ingredientsArray = [
      {
        recipe_id: 1,
        item_id: 1,
        qty: 4
      },
      {
        recipe_id: 1,
        item_id: 2,
        qty: 1
      }
    ];
    beforeEach('Seed recipes table', () => {
      return db.insert(recipesArray).into('recipes')
        .then(() => {
          return db.insert(ingredientsArray)
          .into('recipe_ingredients')
        })
    })
    it('should return 400 if no update is sent', () => {
      return supertest(app)
        .patch('/api/recipes/1')
        .send({})
        .expect(400, {
          error: {message: 'Must update at least one field'}
        })
    })
    it('should return 204 and update the recipe', () => {
      return supertest(app)
        .patch('/api/recipes/1')
        .send({
          id: 1,
          recipe_name: 'Meatloaf 2.0',
          category: 'main',
          rating: 5,
          instructions: 'Step 1: Do this. Step 2: Do that.',
          ingredients: [
            { item_name: 'eggs', qty: 3, unit: 'each' },
            { item_name: 'butter', qty: 2, unit: 'cups' },
          ]
        })
        .expect(204)
        .then(() => {
          return supertest(app)
            .get('/api/recipes/1')
            .expect(200, {
              id: 1,
              recipe_name: 'Meatloaf 2.0',
              category: 'main',
              rating: 5,
              instructions: 'Step 1: Do this. Step 2: Do that.',
              ingredients: [
                { item_name: 'eggs', qty: 3, unit: 'each' },
                { item_name: 'butter', qty: 2, unit: 'cups' },
              ]
            })
        })
    })
    it('should remove recipe ingredients if needed', () => {
      return supertest(app)
        .patch('/api/recipes/1')
        .send({
          id: 1,
          recipe_name: 'Meatloaf 2.0',
          category: 'main',
          rating: 5,
          instructions: 'Step 1: Do this. Step 2: Do that.',
          ingredients: [
            { item_name: 'butter', qty: 2, unit: 'cups' },
          ]
        })
        .expect(204)
        .then(() => {
          return supertest(app)
            .get('/api/recipes/1')
            .expect(200, {
              id: 1,
              recipe_name: 'Meatloaf 2.0',
              category: 'main',
              rating: 5,
              instructions: 'Step 1: Do this. Step 2: Do that.',
              ingredients: [
                { item_name: 'butter', qty: 2, unit: 'cups' },
              ]
            })
        })
    })
  })
})
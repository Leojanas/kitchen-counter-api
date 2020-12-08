const supertest = require('supertest');
const app = require('../src/app');
const knex = require('knex');
const makeItemsArray = require('./items.fixtures');
const makeInventoryArray = require('./inventory.fixtures');
const makeRecipesArray = require('./recipes.fixtures');
const makeIngredientsArray = require('./recipe-ingredients.fixtures');
const makeMealplanArray = require('./mealplan.fixtures');
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
          unit: inventoryArray[0].unit,
          expiration: inventoryArray[0].expiration
        },
        {
          id: inventoryArray[1].id,
          item_name: itemsArray[2].item_name,
          qty: inventoryArray[1].qty,
          unit: inventoryArray[1].unit,
          expiration: inventoryArray[1].expiration
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
          expiration: ""
        })
        .expect(201)
        .expect(res => {
          expect(res.body).to.eql({id: 1, item_name: 'carrots', qty: 4, unit: 'each', expiration: null})
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
  describe('PATCH /api/inventory', () => {
    beforeEach('seed items table', () => {
      const itemsArray = makeItemsArray();
      return db.insert(itemsArray).into('items')
    })
    const inventoryArray = makeInventoryArray();
    beforeEach('Seed inventory table', () => {
      return db.insert(inventoryArray).into('inventory')
    })
    context('given invalid recipe', () => {
      const recipesArray = makeRecipesArray();
      const ingredientsArray = [
        {
          recipe_id: 1,
          item_id: 1,
          qty: 4,
          unit: 'each'
        },
        {
          recipe_id: 1,
          item_id: 2,
          qty: 12,
          unit: 'cups'
        }
      ];
      beforeEach('Seed recipes table', () => {
        return db.insert(recipesArray).into('recipes')
          .then(() => {
            return db.insert(ingredientsArray)
            .into('recipe_ingredients')
          })
      })
      it('should return 400 if no recipe id is in body', () => {
        return supertest(app)
          .patch('/api/inventory')
          .send({})
          .expect(400, {
            error: {message: 'Recipe not found'}
          })
          .then(() => {
            return supertest(app)
              .patch('/api/inventory')
              .send({recipe_id: 356})
              .expect(400, {
                error: {message: 'Recipe not found'}
              })
          })
      })
      it('should return 400 if recipe ingredient is not in inventory', () => {
        return supertest(app)
          .patch('/api/inventory')
          .send({recipe_id: 1})
          .expect(400, {
            error: {message: 'At least one recipe ingredient was not found in inventory'}
          })
      })
    })
    context('Given a valid recipe', () => {
      const recipesArray = makeRecipesArray();
      const ingredientsArray = [
        {
          recipe_id: 1,
          item_id: 1,
          qty: 4,
          unit: 'each'
        },
        {
          recipe_id: 1,
          item_id: 3,
          qty: 1,
          unit: 'pints'
        }
      ];
      beforeEach('Seed recipes table', () => {
        return db.insert(recipesArray).into('recipes')
          .then(() => {
            return db.insert(ingredientsArray)
            .into('recipe_ingredients')
          })
      })
      const updatedInventory = [
        {
          id: 1,
          item_name: 'eggs',
          qty: 8,
          unit: 'each',
          expiration: '2021-01-05T07:00:00.000Z'
        },
        {
          id: 2,
          item_name: 'sugar',
          qty: 6,
          unit: 'cups',
          expiration: '2021-01-05T07:00:00.000Z'
        }
      
      ]
      it('should return 200 and new inventory', () => {
        return supertest(app)
          .patch('/api/inventory')
          .send({recipe_id: 1})
          .expect(200, updatedInventory)
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
          unit: inventoryArray[0].unit,
          expiration: inventoryArray[0].expiration
        }
        return supertest(app)
          .get('/api/inventory/1')
          .expect(200, item)
      })
    })
  })
  describe('PUT /api/inventory/:id', () => {
    context('given that the item does not exist', () => {
      it('should return 404 not found', () => {
        return supertest(app)
          .put('/api/inventory/45')
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
          .put('/api/inventory/1')
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
          unit: inventoryArray[0].unit,
          expiration: null
        },
        {
          id: inventoryArray[1].id,
          item_name: itemsArray[2].item_name,
          qty: inventoryArray[1].qty,
          unit: inventoryArray[1].unit,
          expiration: inventoryArray[1].expiration
        }]
        return supertest(app)
          .put('/api/inventory/1')
          .send({
            qty: 8,
            expiration: ''
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
        const inventory =  [{
          id: inventoryArray[1].id,
          item_name: itemsArray[2].item_name,
          qty: inventoryArray[1].qty,
          unit: inventoryArray[1].unit,
          expiration: inventoryArray[1].expiration
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
          qty: 4,
          unit: 'each'
        },
        {
          recipe_id: 1,
          item_id: 2,
          qty: 1,
          unit: 'cups'
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
            item_name: 'beef',
            qty: 1,
            unit: 'pounds'
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
              item_name: 'beef',
              qty: 1,
              unit: 'pounds'
            }
          ]
        })
        .expect(201) 
        .expect(res => {
          expect(res.body).to.eql(expResponse)
          expect(res.headers.location).to.eql('/api/recipes/1')
        })
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
    const ingredientsArray = makeIngredientsArray();
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
    const ingredientsArray = makeIngredientsArray();
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

  describe('PUT /api/recipes/:id', () => {
    const itemsArray = makeItemsArray();
    beforeEach('seed items table', () => {
    return db.insert(itemsArray).into('items')
    })
    const inventoryArray = makeInventoryArray();
    beforeEach('Seed inventory table', () => {
      return db.insert(inventoryArray).into('inventory')
    })
    const recipesArray = makeRecipesArray();
    const ingredientsArray = makeIngredientsArray();
    beforeEach('Seed recipes table', () => {
      return db.insert(recipesArray).into('recipes')
        .then(() => {
          return db.insert(ingredientsArray)
          .into('recipe_ingredients')
        })
    })
    it('should return 400 if no update is sent', () => {
      return supertest(app)
        .put('/api/recipes/1')
        .send({})
        .expect(400, {
          error: {message: 'Must update at least one field'}
        })
    })
    it('should return 204 and update the recipe', () => {
      return supertest(app)
        .put('/api/recipes/1')
        .send({
          recipe_name: 'Meatloaf 2.0',
          category: 'main',
          rating: 5,
          instructions: 'Step 1: Do this. Step 2: Do that.',
          ingredients: [
            { item_name: 'beef', qty: 1, unit: 'pounds' },
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
                { item_name: 'beef', qty: 1, unit: 'pounds' },
              ]
            })
        })
    })
    it('should remove recipe ingredients if needed', () => {
      return supertest(app)
        .put('/api/recipes/1')
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

describe('mealplan endpoints', () => {
  describe('GET /api/mealplan', () => {
    context('given an empty mealplan', () => {
      it('returns 200 and []', () => {
        return supertest(app)
          .get('/api/mealplan')
          .expect(200, {recipes: [], items: []})
      })
    })
    context('given data in mealplan', () => {
      const itemsArray = makeItemsArray();
      beforeEach('seed items table', () => {
      return db.insert(itemsArray).into('items')
      })
      const recipesArray = makeRecipesArray();
      const ingredientsArray = makeIngredientsArray();
      beforeEach('Seed recipes table', () => {
        return db.insert(recipesArray).into('recipes')
          .then(() => {
            return db.insert(ingredientsArray)
            .into('recipe_ingredients')
          })
      })
      const mealplanArray = makeMealplanArray();
      beforeEach('Seed mealplan table', () => {
        return db.insert(mealplanArray).into('mealplan')
      })
      it('returns both recipes and items', () => {
        return supertest(app)
          .get('/api/mealplan')
          .expect(200, {
            recipes: [
              { id: 1, recipe_id: 1, recipe_name: 'Meatloaf', category: 'main' }
            ],
            items: [
              { id: 2, item_name: 'eggs', qty: 2, unit: 'each' },
              { id: 3, item_name: 'butter', qty: 2, unit: 'cups' }
            ]
          }
          )
      })
    })
  })

  describe('POST /api/mealplan', () => {
    const itemsArray = makeItemsArray();
    beforeEach('seed items table', () => {
    return db.insert(itemsArray).into('items')
    })
    const recipesArray = makeRecipesArray();
    const ingredientsArray = makeIngredientsArray();
    beforeEach('Seed recipes table', () => {
      return db.insert(recipesArray).into('recipes')
        .then(() => {
          return db.insert(ingredientsArray)
          .into('recipe_ingredients')
        })
    })
    it('returns 400 if invalid body is sent', () => {
      return supertest(app)
        .post('/api/mealplan')
        .send({})
        .expect(400, {
          error: {message: 'Must include an item name or recipe id and a quantity'}
        })
    })
    it('adds the item and returns 201 with no content', () => {
      return supertest(app)
        .post('/api/mealplan')
        .send({
            item_name: 'stuff',
            qty: 2,
            unit: 'each'
          })
        .expect(201)
        .then(() => {
          return supertest(app)
            .get('/api/mealplan')
            .expect(200, {items: [{id:1, item_name: 'stuff', qty: 2, unit: 'each'}], recipes: []})
        })
    })
    it('adds a recipe and returns 201 with no content', () => {
      return supertest(app)
      .post('/api/mealplan')
      .send({
          recipe_id: 1,
          qty: 1
        })
      .expect(201)
      .then(() => {
        return supertest(app)
          .get('/api/mealplan')
          .expect(200, {items: [], recipes: [{id: 1, recipe_id: 1, category: 'main', recipe_name: 'Meatloaf'}]})
      })
    })
  })

  describe('DELETE /api/mealplan', () => {
    context('given no items in mealplan', () => {
      it('should return 400', () => {
        return supertest(app)
          .delete('/api/mealplan')
          .send({})
          .expect(400, {
            error: {message: 'Invalid data'}
          })
      })
    })
    context('given a valid item in mealplan', () => {
      const itemsArray = makeItemsArray();
      beforeEach('seed items table', () => {
      return db.insert(itemsArray).into('items')
      })
      const recipesArray = makeRecipesArray();
      const ingredientsArray = makeIngredientsArray();
      beforeEach('Seed recipes table', () => {
        return db.insert(recipesArray).into('recipes')
          .then(() => {
            return db.insert(ingredientsArray)
            .into('recipe_ingredients')
          })
      })
      const mealplanArray = makeMealplanArray();
      beforeEach('Seed mealplan table', () => {
        return db.insert(mealplanArray).into('mealplan')
      })
      it('should delete the item and return 204', () => {
        return supertest(app)
          .delete('/api/mealplan')
          .send({id: 2})
          .expect(204)
          .then(() => {
            return supertest(app)
              .get('/api/mealplan')
              .expect(200, {
                recipes: [
                  { id: 1, recipe_id: 1, recipe_name: 'Meatloaf', category: 'main' }
                ],
                items: [
                  { id: 3, item_name: 'butter', qty: 2, unit: 'cups' }
                ]
              })
          })
      })
      it('should clear the whole mealplan if id is "all"', () => {
        return supertest(app)
          .delete('/api/mealplan')
          .send({id: 'all'})
          .expect(204)
          .then(() => {
            return supertest(app)
              .get('/api/mealplan')
              .expect(200, {items: [], recipes: []})
          })
      })
    })
  })
})
# Kitchen Counter API

This is the repository for the Server, API, and Database used with the Kitchen Counter app.
It was developed as a full stack capstone for the Bloc Web Developer Course.

The live app can be viewed at https://kitchen-counter.vercel.app/
The repo for the front end client is at https://github.com/Leojanas/kitchen-counter

This was built with Node.js, Express.js, and PostgreSQL.

## Summary

This app allows the user to save and modify their grocery inventory.  They can also add, save, and edit recipes.  When they use a recipe, the ingredients are automatically deducted fro mtheir inventory.  They can also generate a mealplan from recipes or individual ingredients and use this mealplan to automatically generate a shopping list.  The shopping list will be for all ingredients needed for the mealplan after removing the ingredients currently in inventory.

## API Documentation:
The deployed API is at 'https://sheltered-cliffs-12152.herokuapp.com'

### /api/inventory

This endpoint supports GET, POST, and PATCH requests.

GET requests need no body and will return an array of inventory item objects.

POST requests can be made with a single object or an array of objects in the body. A single object should have keys of 'item_name','qty',and 'unit'.
  Each object in an array should have keys of 'item_id','qty',and 'unit'.
  
PATCH requests should have an object in the body with a key 'recipe_id' corresponding to an existing recipe in the database. This request reduces the inventory by the items and     quantites associated with using the provided recipe.

### /api/inventory/:id

This endpoint supports GET,PUT, and DELETE requests.

GET requests need no body and will return an object containing info on a single inventory item.

PUT requests need a body object with at least one key of 'qty', and 'unit'.

DELETE requests need no body.

### /api/recipes

This endpoint supports GET and POST requests.

GET requests need no body and return an array of recipes.

POST requests need a body object that needs a minimum of keys for 'recipe_name' and 'category'. It can also take 'instructions','rating', and 'ingredients'. Rating value should    be numeric, instructions value should be a string, and ingredients should be an array of objects with keys 'item_name','qty',and 'unit'.

### /api/recipes/:id

This endpoint supports GET, PUT, and DELETE requests.

GET requests need no body and return an object with info on a single recipe.

PUT requests need a body object with a minimum of 'recipe_name' and any other keys that need to be updated (see /api/recipes POST above for key info).

DELETE requests need no body.

### /api/mealplan

This endpoint supports GET, POST, and DELETE requests.

GET requests need no body and return an object with arrays of 'recipes' and 'items'.

POST requests need a body onject with either 'item_name', 'qty', and 'unit' OR 'recipe_id' and 'qty'.

DELETE requests need a body onject with 'id'. Providing 'id':'all' will clear the entire table or providing a valid 'id' will remove one item/recipe.

### /api/shopping-list

This endpoint supports GET, POST, and DELETE requests.

GET requests need no body and return an array of objects.

POST requests need no body and will use the current mealplan and inventory tables in the database to generate the shopping list table data.

DELETE requests need no body and will clear the entire shopping list table.


  





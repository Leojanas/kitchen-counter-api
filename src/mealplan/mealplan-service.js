const mealplanRouter = require("./mealplan-router")

const MealplanService = {
    getMealplanItemById(knex, id){
        return knex('mealplan')
            .where('id', id)
            .select('*')
    },
    getMealplanItemByRecipeId(knex, recipe_id){
        return knex('mealplan')
            .where('recipe_id', recipe_id)
            .select('*')
            .first()
    },
    getMealplanRecipes(knex){
        return knex('mealplan')
            .join('recipes', 'mealplan.recipe_id', '=', 'recipes.id')
            .select('mealplan.id', 'mealplan.recipe_id', 'recipes.recipe_name', 'recipes.category', 'mealplan.qty')
            .whereNotNull('mealplan.recipe_id')
    },
    getMealplanItems(knex){
        return knex('mealplan')
            .join('items', 'mealplan.item_id', '=', 'items.id')
            .select('mealplan.id', 'items.item_name', 'mealplan.qty', 'mealplan.unit')
            .whereNotNull('mealplan.item_id')
    },
    addMealplanItem(knex, item){
        return knex
            .insert(item)
            .into('mealplan')
            .returning('id')
    },
    updateMealplanQty(knex, item, id){
        return knex('mealplan')
            .where('id', id)
            .update(item)
    },
    removeMealplanItemById(knex, id){
        return knex('mealplan')
            .where('id', id)
            .del()
    },
    clearMealplan(knex){
        return knex('mealplan').truncate()
    },
    getRecipeItemsForShoppinglist(knex){
        return knex('mealplan')
            .join('recipe_ingredients', 'mealplan.recipe_id', '=', 'recipe_ingredients.recipe_id')
            .select('recipe_ingredients.item_id', 'recipe_ingredients.qty', 'recipe_ingredients.unit', 'mealplan.qty AS recipe_qty')
            .whereNotNull('mealplan.recipe_id')
    },
    getItemsForShoppingList(knex){
        return knex('mealplan')
        .join('items', 'mealplan.item_id', '=', 'items.id')
        .select('items.id', 'mealplan.qty', 'mealplan.unit')
        .whereNotNull('mealplan.item_id')
    }
}

module.exports = MealplanService;
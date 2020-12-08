const MealplanService = {
    getMealplanRecipes(knex){
        return knex('mealplan')
            .join('recipes', 'mealplan.recipe_id', '=', 'recipes.id')
            .select('mealplan.id', 'mealplan.recipe_id', 'recipes.recipe_name', 'recipes.category')
            .whereNotNull('mealplan.recipe_id')
    },
    getMealplanItems(knex){
        return knex('mealplan')
            .select('id', 'item_id', 'qty', 'unit')
            .whereNotNull('item_id')
    },
    addMealplanItem(knex, item){
        return knex
            .insert(item)
            .into('mealplan')
            .returning('id')
    },
    removeMealplanItemById(knex, id){
        return knex('mealplan')
            .where('id', id)
            .del()
    },
    clearMealplan(knex){
        return knex('mealplan')
            .del()
    },

}

module.exports = MealplanService;
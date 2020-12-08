const MealplanService = {
    getMealplanItemById(knex, id){
        return knex('mealplan')
            .where('id', id)
            .select('*')
    },
    getMealplanRecipes(knex){
        return knex('mealplan')
            .join('recipes', 'mealplan.recipe_id', '=', 'recipes.id')
            .select('mealplan.id', 'mealplan.recipe_id', 'recipes.recipe_name', 'recipes.category')
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
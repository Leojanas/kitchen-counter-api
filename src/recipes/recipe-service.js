const RecipeService = {
    getRecipes(knex){
       return knex('recipes')
        .select('*')
    },
    getIngredientsByRecipe(knex, id){
        return knex('items')
            .join('recipe_ingredients', 'items.id', '=', 'recipe_ingredients.item_id')
            .where('recipe_ingredients.recipe_id', id)
            .select('items.item_name', 'recipe_ingredients.qty', 'items.unit')
    },
    addRecipe(knex, recipe){
        return knex.insert(recipe).into('recipes').returning('*').then(rows => {return rows[0]})
    },
    addRecipeIngredients(knex, ingredients){
        return knex.insert(ingredients).into('recipe_ingredients')
    }
}

module.exports = RecipeService;
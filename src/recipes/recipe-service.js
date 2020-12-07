const RecipeService = {
    getRecipes(knex){
       return knex('recipes')
        .select('*')
    },
    getIngredientsByRecipe(knex, id){
        return knex('items')
            .join('recipe_ingredients', 'items.id', '=', 'recipe_ingredients.item_id')
            .where('recipe_ingredients.recipe_id', id)
            .select('items.item_name', 'recipe_ingredients.qty', 'recipe_ingredients.unit')
    },
    addRecipe(knex, recipe){
        return knex.insert(recipe).into('recipes').returning('*').then(rows => {return rows[0]})
    },
    addRecipeIngredients(knex, ingredients){
        return knex.insert(ingredients).into('recipe_ingredients')
    },
    updateRecipe(knex, recipe, id){
        return knex('recipes')
            .where('id', id)
            .update(recipe)
    },
    getRecipeById(knex, id){
        return knex('recipes')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteRecipe(knex, id){
        return knex('recipes')
            .where('id', id)
            .delete()
    },
    deleteRecipeIngredients(knex, id){
        return knex('recipe_ingredients')
            .where('recipe_id', id)
            .delete()
    }
}

module.exports = RecipeService;
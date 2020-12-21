const ShoppingListService = {
    getShoppingList(knex){
        return knex('shopping_list')
            .join('items', 'shopping_list.item_id', '=', 'items.id')
            .select('shopping_list.item_id', 'items.item_name', 'shopping_list.qty', 'shopping_list.unit')
    },
    clearShoppingList(knex){
        return knex('shopping_list').truncate()
    },
    addShoppingList(knex, items){
        return knex
            .insert(items)
            .into('shopping_list')
            .then(() => {
                return knex('shopping_list')
                    .select('*')
            })
    }
}


module.exports = ShoppingListService;
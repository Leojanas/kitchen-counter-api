const InventoryService = {
    addItem(knex, input){
        const {item_name} = input;
        const item = {
            item_name: item_name
        }
        return knex
            .insert(item)
            .into('items')
            .returning('id')
    },
    getItemByName(knex, name){
        return knex('items')
            .select('*')
            .where('item_name', name)
            .first()
    },
    getInventory(knex){
        return knex('inventory')
            .join('items', 'inventory.item_id', '=', 'items.id')
            .select('inventory.id', 'items.item_name', 'inventory.qty', 'inventory.unit')
            .orderBy('inventory.id')
    },
    addInventoryItem(knex, item){
        return knex
            .insert(item)
            .into('inventory')
            .returning('id')
            .then(res => {
                let id = Number(res)
                return knex('inventory')
                .join('items', 'inventory.item_id', '=', 'items.id')
                .select('inventory.id', 'items.item_name', 'inventory.qty', 'inventory.unit')
                .where('inventory.id', id)
                .first()
            })
    },
    addMultipleInventoryItems(knex, items){
        return knex 
            .insert(items)
            .into('inventory')
    },
    getInventoryItemById(knex, id){
        return knex('inventory')
            .join('items', 'inventory.item_id', '=', 'items.id')
            .select('inventory.id', 'items.item_name', 'inventory.qty', 'inventory.unit')
            .where('inventory.id', id)
            .first()
    },
    getInventoryItemByItemId(knex, item_id){
        return knex('inventory')
            .select('*')
            .where('item_id', item_id)
            .first()
    },
    updateInventoryItem(knex, item, id){
        return knex('inventory')
            .where('id', id)
            .update(item)
    },
    deleteInventoryItem(knex, id){
        return knex('inventory')
            .where('id', id)
            .delete()
    },
    getInventoryForShopping(knex){
        return knex('inventory')
            .join('items', 'inventory.item_id', '=', 'items.id')
            .select('inventory.item_id', 'inventory.qty', 'inventory.unit')
    }

}


module.exports = InventoryService;
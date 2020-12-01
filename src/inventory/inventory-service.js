const InventoryService = {
    getInventory(knex){
        return knex('inventory')
            .join('items', 'inventory.item_id', '=', 'items.id')
            .select('inventory.id', 'items.item_name', 'inventory.qty', 'items.unit', 'inventory.expiration')
            .orderBy('inventory.id')
    },
    addInventoryItem(knex, item){
        return knex
            .insert(item)
            .into('inventory')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getInventoryItemById(knex, id){
        return knex('inventory')
            .join('items', 'inventory.item_id', '=', 'items.id')
            .select('inventory.id', 'items.item_name', 'inventory.qty', 'items.unit', 'inventory.expiration')
            .where('inventory.id', id)
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
    }

}


module.exports = InventoryService;
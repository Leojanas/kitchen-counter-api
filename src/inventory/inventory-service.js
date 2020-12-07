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
            .select('inventory.id', 'items.item_name', 'inventory.qty', 'inventory.unit', 'inventory.expiration')
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
                .select('inventory.id', 'items.item_name', 'inventory.qty', 'inventory.unit', 'inventory.expiration')
                .where('inventory.id', id)
                .first()
            })


    },
    getInventoryItemById(knex, id){
        return knex('inventory')
            .join('items', 'inventory.item_id', '=', 'items.id')
            .select('inventory.id', 'items.item_name', 'inventory.qty', 'inventory.unit', 'inventory.expiration')
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
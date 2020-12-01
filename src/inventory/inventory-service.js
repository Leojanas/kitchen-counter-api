const InventoryService = {
    getInventory(knex){
        return knex
            .select('*')
            .from('inventory')
            .orderBy('id')
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
        return knex
            .select('*')
            .from('inventory')
            .where('id', id)
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
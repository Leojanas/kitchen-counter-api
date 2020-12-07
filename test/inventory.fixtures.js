function makeInventoryArray() {
    return [
        {
            id: 1,
            item_id: 1,
            qty: 12,
            unit: 'each',
            expiration: '2021-01-05T07:00:00.000Z'
        },
        {
            id: 2,
            item_id: 3,
            qty: 8,
            unit: 'cups',
            expiration: '2021-01-05T07:00:00.000Z'
        }
    ]
}

module.exports = makeInventoryArray;
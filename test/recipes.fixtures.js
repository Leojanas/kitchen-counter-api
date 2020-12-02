function makeRecipesArray(){
    return [
        {
            id: 1,
            recipe_name: 'Meatloaf',
            category: 'main',
            rating: 4,
            instructions: 'Step 1: Do this. Step 2: Do that.'
        },
        {
            id: 2,
            recipe_name: 'Green Beans',
            category: 'side',
            rating: 4,
            instructions: 'Step 1: Do this. Step 2: Do that.'
        },
    ]
}

module.exports = makeRecipesArray;
DROP TABLE IF EXISTS recipe_ingredients;

CREATE TABLE recipe_ingredients (
    recipe_id INTEGER REFERENCES recipes(id),
    item_id INTEGER REFERENCES items(id),
    qty INTEGER NOT NULL,
    unit unit NOT NULL
)
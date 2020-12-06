DROP TABLE IF EXISTS mealplan;

CREATE TABLE mealplan (
    recipe_id INTEGER REFERENCES recipes(id),
    item_id INTEGER REFERENCES items(id),
    qty INTEGER NOT NULL,
    unit unit  
)
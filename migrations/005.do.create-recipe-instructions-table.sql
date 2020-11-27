DROP TABLE IF EXISTS recipe_instructions;

CREATE TABLE recipe_instructions (
    recipe_id INTEGER REFERENCES recipes(id),
    step INTEGER NOT NULL,
    content TEXT
)
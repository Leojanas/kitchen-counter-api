DROP TABLE IF EXISTS recipes;
DROP TYPE IF EXISTS category;

CREATE TYPE category AS ENUM (
    'breakfast', 'lunch', 'side', 'main', 'dessert'
);

CREATE TABLE recipes (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    recipe_name TEXT NOT NULL,
    category category NOT NULL,
    rating SMALLINT DEFAULT 0,
    instructions TEXT
);
DROP TABLE IF EXISTS shopping_list;

CREATE TABLE shopping_list (
    item_id INTEGER REFERENCES items(id),
    qty INTEGER NOT NULL,
    unit unit NOT NULL  
)
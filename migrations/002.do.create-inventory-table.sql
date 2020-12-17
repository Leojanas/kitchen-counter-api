DROP TABLE IF EXISTS inventory;

CREATE TABLE inventory (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    item_id INTEGER REFERENCES items(id) NOT NULL,
    qty REAL NOT NULL,
    unit unit NOT NULL
);
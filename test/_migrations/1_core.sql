-- !ups
CREATE TABLE core (
    id SERIAL NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- !downs
DROP TABLE IF EXISTS core;
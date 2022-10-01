-- DROP TABLE images;
CREATE TABLE IF NOT EXISTS images (
    id VARCHAR(255) PRIMARY KEY,
    groupId VARCHAR(255),
    promptBreakdown TEXT NOT NULL,
    -- JSON
    seed INT NOT NULL,
    cfg DOUBLE NOT NULL,
    url VARCHAR(255) NOT NULL,
    dateCreated VARCHAR(255) NOT NULL,
    steps INT NOT NULL
);
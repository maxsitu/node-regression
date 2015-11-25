DROP TABLE IF EXISTS  TEST_ITEM;
CREATE TABLE TEST_ITEM(
  test_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  cmd          TEXT NOT NULL UNIQUE,
  rc           INT  DEFAULT NULL,
  running      INT [0,1] DEFAULT 0
);


-- INSERT INTO TEST_ITEM (cmd) VALUES  ('/a/b/c');
DROP TABLE IF EXISTS  TEST_RUN;
CREATE TABLE TEST_RUN(
  test_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_item_id INTEGER,
  rc           INT  DEFAULT NULL,
  start_time   DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time     DATETIME ,
  modify_time  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(test_item_id) REFERENCES TEST_ITEM(test_item_id)
);

CREATE TRIGGER UPDATE_TEST_RUN UPDATE ON TEST_RUN
  BEGIN
    UPDATE TEST_RUN SET modify_time =  datetime(CURRENT_TIMESTAMP, 'localtime') where test_run_id = NEW.test_run_id;
    UPDATE TEST_ITEM SET rc = NEW.rc where test_item_id = NEW.test_item_id;
END;

CREATE TRIGGER INSERT_TEST_RUN AFTER INSERT ON TEST_RUN
  BEGIN
    Update TEST_RUN set modify_time =  datetime(CURRENT_TIMESTAMP, 'localtime'), start_time = datetime(CURRENT_TIMESTAMP, 'localtime') where test_run_id = NEW.test_run_id;
END;
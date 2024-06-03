import sql from 'k6/x/sql';
import exec from 'k6/execution';
import { Counter } from 'k6/metrics';

const error_counter = new Counter('sql_errors');

const MAX_SIGNED_32_INT = ((2 ** 31) - 1);
const ITERATIONS= 10000;
const ITEMS_PER_REQUEST = 20; // Queries are hard coded so if you change this you have to change the queries
// Increment Document IDs by this amount in order to use document
// IDs that reach MAX_SIGNED_32_INT
const DOCUMENT_ID_INCREMENTOR = Math.floor(MAX_SIGNED_32_INT / ITERATIONS / ITEMS_PER_REQUEST);

// The second argument is a PostgreSQL connection string, e.g.
// postgres://myuser:mypass@127.0.0.1:5432/postgres?sslmode=disable
const db = sql.open('postgres', 'postgres://k6:badpassword@db/k6?sslmode=disable');

export function setup() {
  db.exec(`
    DROP SCHEMA IF EXISTS "k6-run" CASCADE;
    CREATE SCHEMA "k6-run";
  `);
  if ( __ENV.TEST_NAME === "serial" ) {
    db.exec(`
      SET search_path TO "k6-run";
      CREATE TABLE item
      (
        id          SERIAL,
        document_id integer,
        value       varchar(32),
        constraint item_pk
          primary key (document_id, id)
      );
    `);
  }
  else {
    db.exec(`
      SET search_path TO "k6-run";
      CREATE TABLE item
      (
        id          integer,
        document_id integer,
        value       varchar(32),
        constraint item_pk
          primary key (document_id, id)
      );
            
      CREATE FUNCTION get_item_id_sequence(documentId integer)
          RETURNS text
          LANGUAGE sql IMMUTABLE
      AS
      $$
      SELECT format('S_Item_%s', TO_CHAR(abs(hashint4(documentId) % 10), 'fm000'));
      $$;
  
      CREATE SEQUENCE S_Item_000 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_001 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_002 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_003 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_004 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_005 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_006 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_007 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_008 AS integer NO CYCLE OWNED BY item.id;
      CREATE SEQUENCE S_Item_009 AS integer NO CYCLE OWNED BY item.id;
    `);

    if ( __ENV.TEST_NAME === "trigger" ) {
      db.exec(`
        SET search_path TO "k6-run";
        CREATE FUNCTION set_id() RETURNS trigger AS $$
            BEGIN
                NEW.value := get_item_id_sequence(NEW.document_id);
                NEW.id := nextval(NEW.value);
                RETURN NEW;
            END;
        $$ LANGUAGE plpgsql;  
        
        CREATE TRIGGER set_id BEFORE INSERT ON item
          FOR EACH ROW EXECUTE FUNCTION set_id();
      `);
    }
  }
}

export function teardown() {
  let results = sql.query(db, `
    SELECT
        "value",
        COUNT(*) AS "rows",
        array_to_string((ARRAY_AGG("id" ORDER BY "id" ASC))[0:10], ',') AS sample_ids,
        array_to_string((ARRAY_AGG("document_id" ORDER BY "document_id" ASC))[0:10], ',') AS sample_document_ids,
        TO_CHAR(ROUND(COUNT(*) / SUM(COUNT(*)) OVER(), 2), 'FM90.00') as "percentage"
    FROM
        "k6-run".item
    GROUP BY "value"
    ORDER BY "value" ASC;  
  `);

  for (const row of results) {
    // Log distribution
    console.log(row);
  }
  db.close();
}

var tests = Object();

tests.inline = function() {
  let document_id = exec.scenario.iterationInTest * DOCUMENT_ID_INCREMENTOR;

  db.exec(`
    SET search_path TO "k6-run";
    BEGIN;
    INSERT INTO item
      ("document_id", "id", "value")
      VALUES
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id})),
      (${document_id}, nextval(get_item_id_sequence(${document_id})), get_item_id_sequence(${document_id}))
      RETURNING id;
    COMMIT;
  `);
}

tests.cte = function() {
  let document_id = exec.scenario.iterationInTest * DOCUMENT_ID_INCREMENTOR;

  db.exec(`
    SET search_path TO "k6-run";
    BEGIN;
    WITH
    sequence AS (
      SELECT get_item_id_sequence(${document_id}) AS sequence
    ),
    ids AS (
      SELECT nextval(sequence.sequence) AS id, sequence.sequence AS sequence
      FROM generate_series(1, 20), sequence
    )
    INSERT INTO item
    ("document_id", "id", "value")
    (
        SELECT ${document_id}, id, sequence FROM ids
    )
    RETURNING id;
    COMMIT;
  `);
}

tests.trigger = function() {
  let document_id = exec.scenario.iterationInTest * DOCUMENT_ID_INCREMENTOR;

  db.exec(`
    SET search_path TO "k6-run";
    BEGIN;
    INSERT INTO item
    ("document_id")
    (
        SELECT ${document_id} FROM generate_series(1, 20)
    )
    RETURNING id;
    COMMIT;
  `);
}

tests.serial = function() {
  let document_id = exec.scenario.iterationInTest * DOCUMENT_ID_INCREMENTOR;

  db.exec(`
    SET search_path TO "k6-run";
    BEGIN;
    INSERT INTO item
    ("document_id", "value")
    (
        SELECT ${document_id}, 'serial' FROM generate_series(1, 20)
    )
    RETURNING id;
    COMMIT;
  `);
}

if (tests[__ENV.TEST_NAME] === undefined ) {
  exec.test.abort(`Invalid test name: "${__ENV.TEST_NAME}"`);
}

export default function () {
  try {
    tests[__ENV.TEST_NAME]();
  } catch (error) {
    error_counter.add(1);
    throw error;
  }
}


export const options = {
  tags: {
    name: __ENV.TEST_NAME,
  },
  iterations: ITERATIONS,
  // The number of concurrent clients
  vus: 50,
  throw: true,
  discardResponseBodies: true,
  thresholds: {
    'sql_errors': [
      {
        threshold: 'count==0',
        abortOnFail: true,
      }
    ],
    'iteration_duration{scenario:default}': [
      {
        threshold: 'p(95)<500',
        abortOnFail: true,
        delayAbortEval: '10s',
      }
    ],
  },
};

# Postgres Sequence Shard

Benchmark testing for using sharded sequences in Postgres.

In this case, "sharded sequences" means using multiple
[Postgres sequences](https://www.postgresql.org/docs/current/sql-createsequence.html)
for IDs instead of only one sequence or one `SERIAL` column.

The purpose of this is to get more possible values out of a 32-bit
integer when used with a compound key.

For this test, a compound key of `item.document_id` and `item.id` is used.
The `item.id` only needs to be unique within the scope of a 
`item.document_id`.

There are 10 sequences. One of the 10 sequences is chosen based on a 
consistent hash of the `document_id`.

It compares the performance of using a auto-incrementing `SERIAL` 
column against several methods of using a sharded sequence approach 
including:

- `trigger` - Get an ID inside an on-insert trigger.
- `cte` - Get 20 IDs in a CTE and use them when inserting documents.
- `inline` - Calling the `nextval` function to get an ID within a SQL query.

## Run with just

```sh
brew install just
```

## build

```sh
just build
```

## Run All Tests

```sh
just test-all
```

## Run Test

```sh
just test {test_name}
```



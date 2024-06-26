# Postgres Sequence Shard

Bench testing for using sharded sequences in Postgres.

Testing is done with [k6](https://k6.io/) and 
[xk6-sql](https://github.com/grafana/xk6-sql). K6 and Postgres
are run in Docker containers using Docker compose.

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

- `serial w/ trigger` - Same as `serial` but has an on-insert trigger to determine the impact of a trigger.
- `trigger` - Get an ID inside an on-insert trigger.
- `cte` - Get 20 IDs in a CTE and use them when inserting documents.
- `inline` - Calling the `nextval` function to get an ID within a SQL query.

## Results

100,000 iterations with 20 items each. 

Run on a MacBook Pro M1 Max with 64GB of RAM. See `docker-compose.yml` 
for DB container memory and CPU limits.

| Test              | Iterations Per Second |    avg |   p(90) |  p(95) |
|-------------------|----------------------:|-------:|--------:|-------:|
| serial            |              15283.26 | 2.63ms |   4.7ms |  5.6ms |
| serial w/ trigger |              13104.29 | 3.19ms |   5.7ms | 6.72ms |
| cte               |              13411.31 | 3.09ms |  5.42ms | 6.44ms |
| trigger           |              12536.95 | 3.36ms |  5.96ms | 6.95ms |
| inline            |               6383.83 | 7.18ms | 12.32ms | 14.6ms |

`serial` is fastest, but that's no surprise since it is the simplest. 
However, for this use case, `serial` will not work because 32-bit IDs 
will be exhausted.

`serial w/ trigger` shows that simply having an on-insert trigger affects
performance.

`cte` is next best, but it requires changes to the application to make
complex queries. Notably, it's as fast as `serial w/ trigger`, which
indicates that getting a sharded sequence ID isn't inherently slower.
This likely gets its speed boost because the DB function to get the 
sequence shard is only called once for all 20 inserts.

`trigger` is only ~82% the speed of `serial`. Notably, it's ~95% the
speed of `serial w/ trigger` which indicates most of the performance
loss is from the trigger itself. However, it is the easiest
to implement because it doesn't require changes to the insert queries.

`inline` is the slowest, likely because the DB function is called 40 times
for 20 inserts. It's only here for a baseline.

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

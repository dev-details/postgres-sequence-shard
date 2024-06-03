[private]
default:
  @just --list

build:
  docker build -t k6-runner .

k6 test_name *args:
  @docker compose \
    --profile k6 \
    run \
    --env "TEST_NAME={{test_name}}" \
    k6 \
    run \
    --no-usage-report \
    script.js

test *test_name: build
  #!/bin/sh
  for name in {{test_name}}; do
    echo ">>> Running test ${name}"
    just k6 ${name}
  done


test-all:
  just test serial cte trigger inline
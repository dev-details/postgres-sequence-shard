FROM grafana/xk6 AS base
RUN /usr/local/bin/xk6 build --with github.com/grafana/xk6-sql

FROM gcr.io/distroless/static-debian11
COPY --from=base /xk6/k6 /k6
ENTRYPOINT ["/k6"]
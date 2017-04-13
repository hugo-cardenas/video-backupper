#!/bin/bash

docker-compose \
    --file docker/compose/compose.dev.yml \
    up -d
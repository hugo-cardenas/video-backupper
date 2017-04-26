#!/bin/bash

if [ "$*" == "" ]; then
    echo ""
    echo "Usage: $0 <command>"
    exit 1
fi

docker-compose \
    --file docker/compose/compose.dev.yml \
    run --rm -T app \
    $*
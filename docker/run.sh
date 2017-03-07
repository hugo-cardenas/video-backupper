#!/bin/bash

docker run \
    --env 'VIDEOBACKUPPER_CONFIG=/usr/src/video-backupper/config/dev.config.json' \
    --tty \
    --user node \
    --volume /workspace/projects/video-backupper:/usr/src/video-backupper \
    --volume /workspace/keys/dev.config.json:/usr/src/video-backupper/config/dev.config.json \
    --workdir /usr/src/video-backupper \
    node:7.6 \
    "$@"
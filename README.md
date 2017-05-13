# video-backupper

[![Build Status](https://travis-ci.org/hugo-cardenas/video-backupper.svg?branch=master)](https://travis-ci.org/hugo-cardenas/video-backupper)

Make backups of videos from Youtube, saving them into a persistent storage (Amazon S3, Dropbox or local filesystem). 

Uses a queue ([bee-queue](https://github.com/LewisJEllis/bee-queue)) based on Redis for storing and processing the backup jobs.

## Requirements

* npm >= 4.7
* Node.js >= 7.6
* Redis >= 3.2

or 

* npm >= 4.7
* Docker >= 1.13
* Docker Compose >= 1.9

## Usage

Set the environment variable specifying the application config file:
```
export VIDEOBACKUPPER_CONFIG=/path/to/config.json
```
Then, use the commands:
```
./bin/backup channel myChannelId40
```
```
./bin/backup playlist myPlaylistId42
```
```  
Usage: backup [command]


  Commands:

    channel <channel-id>    Create backup jobs for all videos in all playlists from a channel
    playlist <playlist-id>  Create backup jobs for all videos in a playlist

  Create backup jobs for Youtube videos
```

```
./bin/runWorker
```
```  
Usage: runWorker

Process backup jobs from the queue
```

## Config

Example of the project config.json:
```
{
    "backupper": {
        "storage": "dropbox"
    },
    "provider": {
        "youtube": {
            "email": "my-service-account@developer.gserviceaccount.com",
            "keyFile": "/path/to/google/api/private.pem"
        }
    },
    "queue": {
        "redis": {
            "host": "127.0.0.1",
            "port": 6379,
            "db": 0,
            "options": {}
        }
    },
    "storage": {
        "dropbox": {
            "token": "my-dropbox-token"
        },
        "file": {
            "baseDir": "/path/to/storage/dir"
        }
        "s3": {
            "bucket": "bucket-name"
        }
    }
}
```
#### Provider

For fetching the videos from the playlist, it's necessary to configure Google API service account credentials: https://developers.google.com/identity/protocols/OAuth2ServiceAccount

The email and private key have to be specified in the `provider`.`youtube` section.

#### Queue

Redis config for the queue is specified in `queue`.`redis`. 
The whole `queue` section is passed through to `bee-queue` config: https://github.com/LewisJEllis/bee-queue#settings so other settings for the queue can be specified also.

#### Storage

There are three configurable storages for saving the videos: Amazon S3, Dropbox and local filesystem. The storage to be used is specified in `backupper.storage` (values can be `s3`, `dropbox` or `file`).

How to setup credentials for the S3 storage: http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files

How to setup credentials for the Dropbox storage: https://www.dropbox.com/developers/reference/oauth-guide

The file storage will store the videos in the `baseDir` directory specified. This directory needs to exist with `rw` permissions before running the application with the file storage enabled.

## Tests
Tests are written with [tape](https://github.com/substack/tape)

```
npm test
```

For running integration tests, a separate testing config.json should be used.
Integration tests will run only if this config contains the setting  `"integrationTestEnabled": true`.

Note that they will delete all the contents from the S3 bucket and the Dropbox account, and will flush the Redis DB specified from the config.

## Docker
There is also a setup for running the application using Docker containers.

### Build
First, build the Docker image (run from project folder):

```
docker build -t 'video-backupper-node:1.0.0' -f docker/build/default/Dockerfile .
```

There is also a Dockerfile for Raspberry Pi machines (it requires a different build):

```
docker build -t 'video-backupper-node-rpi:1.0.0' -f docker/build/rpi/Dockerfile .
```

### Run

There is a Docker compose file ready for running the project in development environment ([compose.dev.yml](video-backupper/docker/compose/compose.dev.yml)). It requires to specify some arguments in environment variables.

In order to simplify running common commands with `docker-compose`, there are a few wrapper shell commands available
in the directory [docker](video-backupper/docker).

Example:

* Run the worker:
```
./docker/runWorker.sh
```
* Run the backup:
```
./docker/backup.sh playlist myPlaylistId42
```


## License

MIT

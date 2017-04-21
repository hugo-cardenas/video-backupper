# video-backupper

[![Build Status](https://travis-ci.org/hugo-cardenas/video-backupper.svg?branch=master)](https://travis-ci.org/hugo-cardenas/video-backupper)

Make backups of videos from Youtube, saving them into a persistent storage (Amazon S3 or Dropbox). 

Uses a queue ([bee-queue](https://github.com/LewisJEllis/bee-queue)) based on Redis for storing and processing the backup jobs.

# Usage
```
VIDEOBACKUPPER_CONFIG=/path/to/config.json bin/backup channel myChannelId40
```
```
VIDEOBACKUPPER_CONFIG=/path/to/config.json bin/backup playlist myPlaylistId42
```
```  
Usage: backup [command]


  Commands:

    channel <channel-id>    Create backup jobs for all videos in all playlists from a channel
    playlist <playlist-id>  Create backup jobs for all videos in a playlist

  Create backup jobs for Youtube videos
```

```
VIDEOBACKUPPER_CONFIG=/path/to/config.json bin/runWorker
```
```  
Usage: runWorker

Process backup jobs from the queue
```

# Config

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

There are two storages available for saving the videos: Amazon S3 and Dropbox. The storage to be used is specified in the `backupper` section.

How to setup credentials for the S3 storage: http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files

How to setup credentials for the Dropbox storage: https://www.dropbox.com/developers/reference/oauth-guide

# Tests
Tests are written with [tape](https://github.com/substack/tape)

```
npm test
```

For running integration tests, a separate testing config.json should be used.
Integration tests will run only if this config contains the setting  `"integrationTestEnabled": true`.

Note that they will delete all the contents from the S3 bucket and the Dropbox account, and will flush the Redis DB specified from the config.

# license

MIT

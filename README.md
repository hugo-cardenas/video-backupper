# video-backupper

[![Build Status](https://travis-ci.org/hugo-cardenas/video-backupper.svg?branch=master)](https://travis-ci.org/hugo-cardenas/video-backupper)

Make backups of videos from Youtube, saving them into a persistent storage (Amazon S3 or Dropbox). 

Uses a queue ([bee-queue](https://github.com/LewisJEllis/bee-queue)) based on Redis for storing and processing the backup jobs.

# Usage
```
VIDEOBACKUPPER_CONFIG=/path/to/config.json bin/backup myPlaylistId42
```
```  
Usage: backup [options] <playlist-id>

Create backup jobs for all videos in a Youtube playlist

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```

```
VIDEOBACKUPPER_CONFIG=/path/to/config.json bin/runWorker
```
```  
Usage: backup [options] <playlist-id>

Process backup jobs from the queue

Options:

  -h, --help     output usage information
  -V, --version  output the version number
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

#### Storage

There are two storages available for saving the videos: Amazon S3 and Dropbox. The storage to be used is specified in the `backupper` section.

How to setup credentials for the S3 storage: http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files

How to setup credentials for the Dropbox storage: https://www.dropbox.com/developers/reference/oauth-guide

# Tests
Tests are written with [tape](https://github.com/substack/tape)

```
npm test
```

# license

MIT

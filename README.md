# video-backupper

[![Build Status](https://travis-ci.org/hugo-cardenas/video-backupper.svg?branch=master)](https://travis-ci.org/hugo-cardenas/video-backupper)

Makes backups of videos from a Youtube playlist, saving them into a persistent storage.

# Usage
```
VIDEOBACKUPPER_CONFIG=/path/to/config.json backup myPlaylistId42
```
```  
Usage: backup [options] <playlist-id>

Backup videos from a youtube playlist

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

For fetching the videos from the playlist, it's necessary to configure Google API service account credentials: https://developers.google.com/identity/protocols/OAuth2ServiceAccount

The email and private key have to be specified in the `provider`.`youtube` section.

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

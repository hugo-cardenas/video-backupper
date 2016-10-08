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

Example of the project config.json:
```
{
    "provider": {
        "youtube": {
            "email": "my-service-account@developer.gserviceaccount.com",
            "keyFile": "/path/to/google/api/private.pem"
        }
    },
    "storage": {
        "s3": {
            "bucket": "bucket-name"
        }
    }
}
```

How to obtain Google API service account credentials: https://developers.google.com/identity/protocols/OAuth2ServiceAccount

How to setup the AWS credentials and profile files: http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files

# Tests
Tests are written with [tape](https://github.com/substack/tape)

```
npm test
```

# license

MIT

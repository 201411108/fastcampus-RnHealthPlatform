fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### preflight

```sh
[bundle exec] fastlane preflight
```

Yarn workspace lint + typecheck (no store upload).

----


## iOS

### ios upload_testflight

```sh
[bundle exec] fastlane ios upload_testflight
```

Archive HealthAI and upload to TestFlight (no App Store customer release).

----


## Android

### android internal

```sh
[bundle exec] fastlane android internal
```

bundleRelease (signed AAB) + upload to Play internal testing track only.

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

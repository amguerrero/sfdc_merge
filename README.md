# sfdx-md-merge-driver

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sfdx-md-merge-driver.svg)](https://npmjs.org/package/sfdx-md-merge-driver)
[![CircleCI](https://circleci.com/gh/jayree/sfdx-md-merge-driver/tree/master.svg?style=shield)](https://circleci.com/gh/jayree/sfdx-md-merge-driver/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/jayree/sfdx-md-merge-driver?branch=master&svg=true)](https://ci.appveyor.com/project/jayree/sfdx-md-merge-driver/branch/master)
[![Codecov](https://codecov.io/gh/jayree/sfdx-md-merge-driver/branch/master/graph/badge.svg)](https://codecov.io/gh/jayree/sfdx-md-merge-driver)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-md-merge-driver.svg)](https://npmjs.org/package/sfdx-md-merge-driver)
[![License](https://img.shields.io/npm/l/sfdx-md-merge-driver.svg)](https://github.com/jayree/sfdx-md-merge-driver/blob/master/package.json)

This is a git merge driver specific for Salesforce.com Metadata (Profiles, Permission Sets, Custom Labels).

The merge is done based on the nodes of the files, checking if any node changed in both the local copy and the branch we're trying to merge, and automatically merging whenever there is no conflict.

In the case of a node being modified in our local workspace and in the branch we try to merge, both nodes are marked with a conflict that specifies from which change the node comes, so it makes it easier to identify and resolve the conflict.

<!-- toc -->
* [sfdx-md-merge-driver](#sfdx-md-merge-driver)
* [Automatic Setup (recommended)](#automatic-setup-recommended)
* [Install as Dependency](#install-as-dependency)
* [Uninstalling](#uninstalling)
* [Commands](#commands)
* [Author](#author)
<!-- tocstop -->

# Automatic Setup (recommended)

To start using it right away:

```
$ npx sfdx-md-merge-driver install --global
```

**Or** install it locally, per-project:

```
$ cd /path/to/git/repository
$ npx sfdx-md-merge-driver install
```

...And you're good to go!

## Example

```
$ npx sfdx-md-merge-driver install
$ git merge my-conflicting-branch
Conflicts Found: 2
Conflicts Found: 0
CONFLICT (content): Merge conflict in force-app/main/default/profiles/Admin.profile-meta.xml
Auto-merging force-app/main/default/profiles/Standard.profile-meta.xml
Automatic merge failed; fix conflicts and then commit the result.
```

# Install as Dependency

To avoid regular `npx` installs, consider installing the driver:

<!-- usage -->
```sh-session
$ npm install -g @kgossent/sfdx-md-merge-driver
$ sfdx-md-merge-driver COMMAND
running command...
$ sfdx-md-merge-driver (-v|--version|version)
@kgossent/sfdx-md-merge-driver/0.1.22 win32-x64 node-v12.16.2
$ sfdx-md-merge-driver --help [COMMAND]
USAGE
  $ sfdx-md-merge-driver COMMAND
...
```
<!-- usagestop -->

# Uninstalling

To remove an installed merge driver, use `sfdx-md-merge-driver uninstall`:

```
$ npx sfdx-md-merge-driver uninstall [--global] [--driver-name=sfdx-md-merge-driver]
```

**Or** remove the package:

```
$ npm uninstall -g sfdx-md-merge-driver
```

# Commands

<!-- commands -->
* [`sfdx-md-merge-driver help [COMMAND]`](#sfdx-md-merge-driver-help-command)
* [`sfdx-md-merge-driver install`](#sfdx-md-merge-driver-install)
* [`sfdx-md-merge-driver join`](#sfdx-md-merge-driver-join)
* [`sfdx-md-merge-driver merge %O %A %B [%P]`](#sfdx-md-merge-driver-merge-o-a-b-p)
* [`sfdx-md-merge-driver uninstall`](#sfdx-md-merge-driver-uninstall)

## `sfdx-md-merge-driver help [COMMAND]`

display help for sfdx-md-merge-driver

```
USAGE
  $ sfdx-md-merge-driver help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src\commands\help.ts)_

## `sfdx-md-merge-driver install`

Set up the merge driver in the current git repository.

```
USAGE
  $ sfdx-md-merge-driver install

OPTIONS
  -d, --driver=driver
      [default: npx sfdx-md-merge-driver merge %O %A %B %P] string to install as the driver in the git configuration

  -g, --global
      install to your user-level git configuration

  -h, --help
      show CLI help

  -n, --name=name
      [default: sfdx-md-merge-driver] String to use as the merge driver name in your configuration.

  -t, --files=*.profile|*.profile-meta.xml|*.permissionset|*.permissionset-meta.xml|*.labels|*.labels-meta.xml
      [default: *.profile,*.profile-meta.xml,*.permissionset,*.permissionset-meta.xml,*.labels,*.labels-meta.xml] 
      Filenames that will trigger this driver.
```

_See code: [src\commands\install.ts](https://github.com/KevinGossentCap/sfdx-md-merge-driver/blob/v0.1.22/src\commands\install.ts)_

## `sfdx-md-merge-driver join`

Additionally merge the files of same metadataType

```
USAGE
  $ sfdx-md-merge-driver join

OPTIONS
  -a, --algo=latest|meld  [default: latest] algorithm for join, latest or meld
  -h, --help              show CLI help
  -m, --meta=meta         (required) path(s) to file(s) to join
  -o, --output=output     path to write output
  -v, --verbose           verbose mode
```

_See code: [src\commands\join.ts](https://github.com/KevinGossentCap/sfdx-md-merge-driver/blob/v0.1.22/src\commands\join.ts)_

## `sfdx-md-merge-driver merge %O %A %B [%P]`

Check for conflicts and merge them if possible.

```
USAGE
  $ sfdx-md-merge-driver merge %O %A %B [%P]

ARGUMENTS
  %O  ancestor’s version
  %A  current version
  %B  other branches' version
  %P  pathname in which the merged result will be stored

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\merge.ts](https://github.com/KevinGossentCap/sfdx-md-merge-driver/blob/v0.1.22/src\commands\merge.ts)_

## `sfdx-md-merge-driver uninstall`

Remove a previously configured driver

```
USAGE
  $ sfdx-md-merge-driver uninstall

OPTIONS
  -g, --global     install to your user-level git configuration
  -h, --help       show CLI help
  -n, --name=name  [default: sfdx-md-merge-driver] String to use as the merge driver name in your configuration.
```

_See code: [src\commands\uninstall.ts](https://github.com/KevinGossentCap/sfdx-md-merge-driver/blob/v0.1.22/src\commands\uninstall.ts)_
<!-- commandsstop -->

# Author

Written by [jayree](https://github.com/jayree)

Based on code from [Amguerrero's](https://github.com/amguerrero) repository [sfdc_merge](https://github.com/amguerrero/sfdc_merge) and forks from [Dhanielk](https://github.com/Dhanielk/sfdc_merge) and [KevinGossentCap](https://github.com/KevinGossentCap/sfdc_merge).

Node.js Installer framework based on code from [Zkat's](https://github.com/zkat) repository [npm-merge-driver](https://github.com/npm/npm-merge-driver)

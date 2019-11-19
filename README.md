<!-- [![npm](https://img.shields.io/jayree/v/sfdx-md-merge-driver.svg)](https://npm.im/sfdx-md-merge-driver) [![license](https://img.shields.io/jayree/l/sfdx-md-merge-driver.svg)](https://npm.im/sfdx-md-merge-driver) [![Travis](https://img.shields.io/travis/jayree/sfdx-md-merge-driver.svg)](https://travis-ci.org/jayree/sfdx-md-merge-driver) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/jayree/sfdx-md-merge-driver?svg=true)](https://ci.appveyor.com/project/jayree/sfdx-md-merge-driver) [![Coverage Status](https://coveralls.io/repos/github/jayree/sfdx-md-merge-driver/badge.svg?branch=latest)](https://coveralls.io/github/jayree/sfdx-md-merge-driver?branch=latest) -->

# sfdx-md-merge-driver(1) -- Salesforce Metadata Specific Git Merge Driver

This is a git merge driver specific for Salesforce.com Metadata (Profiles, Permission Sets, Custom Labels).

The merge is done based on the nodes of the files, checking if any node changed in both the local copy and the branch we're trying to merge, and merging automatically whenever there is no conflict.

In the case of a node being modified in our local workspace and in the branch we try to merge both nodes are marked with a conflict that specifies from which change the node comes so it makes it easier to identify and resolve the conflict.

### Automatic Setup (recommended):

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

<!-- Next time your lockfile has a conflict, it will be automatically fixed. You
don't need to do anything else. -->

### Example

```
$ npx sfdx-md-merge-driver install
$ git merge my-conflicting-branch
Conflicts Found: 2
Conflicts Found: 0
CONFLICT (content): Merge conflict in force-app/main/default/profiles/Admin.profile-meta.xml
Auto-merging force-app/main/default/profiles/Standard.profile-meta.xml
Automatic merge failed; fix conflicts and then commit the result.
```

### Advanced

The following section is only for advanced configuration of the driver if you
have specific needs.

#### Setup Options

`sfdx-md-merge-driver install` supports a couple of config options:

`--driver` - string to install as the driver in the git configuration

`--driver-name` - string to use as the merge driver name in your configuration

`--files` - list of files that will trigger this driver

#### Install as Dependency

To avoid regular `npx` installs, consider installing the driver:

`$ yarn [global|--dev] add sfdx-md-merge-driver`

#### Manual Setup (advanced):

`sfdx-md-merge-driver` requires two git configurations to work: a git configuration
to add the driver to git, which is by default your local `.git/config` file, and
a `gitattributes(5)` configuration, which is by default your local
`.git/info/attributes`.

If you **do not** want `sfdx-md-merge-driver` to install itself for you:

Add the driver to `.git/config`:

```
$ git config merge."sfdx-md-merge-driver".name \
    "A custom merge driver for Salesforce profiles"
$ git config merge."sfdx-md-merge-driver".driver \
    "npx sfdx-md-merge-driver merge %O %A %B %P"
$ git config merge."sfdx-md-merge-driver".recursive \
    "binary"
```

This will configure the merge driver to run merges on the metadata files.

Add the relevant attributes to `.gitattributes` or `.git/info/attributes`:

```
*.profile merge=sfdx-md-merge-driver
*.profile-meta.xml merge=sfdx-md-merge-driver
*.permissionset merge=sfdx-md-merge-driver
*.permissionset-meta.xml merge=sfdx-md-merge-driver
*.labels merge=sfdx-md-merge-driver
*.labels-meta.xml merge=sfdx-md-merge-driver
```

This will instruct git that all the Salesforce files should be merged using the new merge drivers.
You can also choose which metadata you want to use this driver to.

<!-- #### Configure the driver
The merge driver uses the configuration in the file `.git/scritps/sfdx-merge/conf/merge-<metadataType>-config.json` to know what nodes to merge and how to identify if the nodes are the same node and if they are equal between the branches.

If a node type is not configured there, the merge driver will choose the one in the current branch.
 -->

#### Uninstalling

To remove an installed merge driver, use `sfdx-md-merge-driver uninstall`:

```
$ npx sfdx-md-merge-driver uninstall [--global] [--driver-name=sfdx-md-merge-driver]
```

## AUTHOR

Written by [jayree](https://github.com/jayree)

Based on code from [Amguerrero's](https://github.com/amguerrero) repository [sfdc_merge](https://github.com/amguerrero/sfdc_merge) and forks from [Dhanielk](https://github.com/Dhanielk/sfdc_merge) and [KevinGossentCap](https://github.com/KevinGossentCap/sfdc_merge).

Node.js Installer framework based on code from [Zkat's](https://github.com/zkat) repository [npm-merge-driver](https://github.com/npm/npm-merge-driver)

## SEE ALSO

- `git-config(1)`
- `gitattributes(5)`

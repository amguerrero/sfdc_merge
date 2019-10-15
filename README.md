<!-- [![npm](https://img.shields.io/jayree/v/sfdx-merge-driver.svg)](https://npm.im/sfdx-merge-driver) [![license](https://img.shields.io/jayree/l/sfdx-merge-driver.svg)](https://npm.im/sfdx-merge-driver) [![Travis](https://img.shields.io/travis/jayree/sfdx-merge-driver.svg)](https://travis-ci.org/jayree/sfdx-merge-driver) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/jayree/sfdx-merge-driver?svg=true)](https://ci.appveyor.com/project/jayree/sfdx-merge-driver) [![Coverage Status](https://coveralls.io/repos/github/jayree/sfdx-merge-driver/badge.svg?branch=latest)](https://coveralls.io/github/jayree/sfdx-merge-driver?branch=latest) -->

# sfdx-merge-driver --  Salesforce Metadata Specific Git Merge Driver
This is a git merge driver specific for Salesforce.com Metadata (WIP).

Now supports:
* Profiles
* Permission Sets
* Custom Labels

The merge is done based on the nodes of the files, checking if any node changed in both the local copy and the branch we’re trying to merge, and merging automatically whenever there is no conflict.

In the case of a node being modified in our local workspace and in the branch we try to merge both nodes are marked with a conflict that specifies from which change the node comes so it makes it easier to identify and resolve the conflict.

### Automatic Setup (recommended):

To start using it right away:

```
$ npx sfdx-merge-driver install --global
```

**Or** install it locally, per-project:
```
$ cd /path/to/git/repository
$ npx sfdx-merge-driver install
```

### Example

```
$ npx sfdx-merge-driver install
$ git merge my-conflicting-branch
<demo tbd>
$ git status
<clean>
```

### Advanced

The following section is only for advanced configuration of the driver if you
have specific needs.

#### Setup Options

`sfdx-merge-driver install` supports a couple of config options:

`--driver` - string to install as the driver in the git configuration

`--driver-name` - string to use as the merge driver name in your configuration

`--files` - list of files that will trigger this driver

#### Install as Dependency

To avoid regular `npx` installs, consider installing the driver:

`$ yarn install [-g|--save-dev] npm-merge-driver`

#### Manual Setup (advanced):

`sfdx-merge-driver` requires two git configurations to work: a git configuration
to add the driver to git, which is by default your local `.git/config` file, and
a `gitattributes` configuration, which is by default your local
`.git/info/attributes`.

If you **do not** want `sfdx-merge-driver` to install itself for you:

In order to use this merge driver you need to copy the content of the directory `sfdc-merge/*` into `.git/scripts/sfdc-merge/` (create this directory if it doesn’t exist yet).

Then edit the *.git/config* file and add the following lines:
```
[merge "sfdc-merge"]
	name = A custom merge driver for Salesforce profiles
	driver = groovy .git/scripts/sfdc-merge/sfdc_merge.groovy %O %A %B .git/scripts/sfdc-merge
	recursive = binary
```

Which will configure the merge drivers, and configure it to run the groovy script, the merges of the metadata.

Then create the file `.git/info/attributes` if it doesn’t exist yet and add the following lines:
```
*.profile merge=sfdc-merge
*.profile-meta.xml merge=sfdc-merge
*.permissionset merge=sfdc-merge
*.permissionset-meta.xml merge=sfdc-merge
*.labels merge=sfdc-merge
*.labels-meta.xml merge=sfdc-merge
```

This will instruct git that all the Salesforce files should be merged using the new merge drivers.
You can also choose which metadata you want to use this driver to.

#### Configure the driver
The merge driver uses the configuration in the file `.git/scritps/sfdc-merge/conf/merge-<metadataType>-config.json` to know what nodes to merge and how to identify if the nodes are the same node and if they are equal between the branches.

If a node type is not configured there, the merge driver will choose the one in the current branch.

#### Uninstalling

To remove an installed merge driver, use `sfdx-merge-driver uninstall`:

```
$ npx sfdx-merge-driver uninstall [--global] [--driver-name=sfdx-merge-driver]
```

## AUTHOR
This repository is based on code from [Amguerrero's](https://github.com/amguerrero) repository *[Salesforce Profile Specific Git Merge Driver](https://github.com/amguerrero/sfdc_merge)*

Installer written by [Kat Marchan](https://github.com/zkat)

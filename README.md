# Salesforce Metadata Specific Git Merge Driver
This is a git merge driver specific for Salesforce.com Metadata (WIP).

Now supports:
* Profiles
* Permission Sets
* Custom Labels

The merge is done based on the nodes of the files, checking if any node changed in both the local copy and the branch we’re trying to merge, and merging automatically whenever there is no conflict.

In the case of a node being modified in our local workspace and in the branch we try to merge both nodes are marked with a ```<CONFLICT />``` tag that specifies from which change the node comes so it makes it easier to identify and resolve the conflict.

## How to add it to your current git repository
You can download latest version [here](https://github.com/Dhanielk/sfdc_merge/releases/latest)

In order to use this merge driver you need to copy the content of the directory `sfdc-merge/*` into `.git/scripts/sfdc-merge/` (create this directory if it doesn’t exist yet).

Then edit the *.git/config* file and add the following lines:
```
[merge "sfdc-profiles"]
	name = A custom merge driver for Salesforce profiles
	driver = groovy .git/scripts/sfdc-merge/sfdc_merge.groovy %O %A %B 'profile' .git/scripts/sfdc-merge
	recursive = binary
[merge "sfdc-permsets"]
	name = A custom merge driver for Salesforce permission sets
	driver = groovy .git/scripts/sfdc-merge/sfdc_merge.groovy %O %A %B 'permissionset' .git/scripts/sfdc-merge
	recursive = binary
[merge "sfdc-labels"]
	name = A custom merge driver for Salesforce custom labels
	driver = groovy .git/scripts/sfdc-merge/sfdc_merge.groovy %O %A %B 'labels' .git/scripts/sfdc-merge
	recursive = binary
```

Which will configure the merge drivers, and configure it to run the groovy script, the merges of the metadata.

Then create the file `.git/info/attributes` if it doesn’t exist yet and add the following lines:
```
*.profile merge=sfdc-profiles
*.permissionset merge=sfdc-permsets
*.labels merge=sfdc-labels
```

This will instruct git that all the Salesforce files should be merged using the new merge drivers.
You can also choose which metadata you want to use this driver to.

## Configure the driver
The merge driver uses the configuration in the file `.git/scritps/sfdc-merge/config/<metadataType>.json` to know what nodes to merge and how to identify if the nodes are the same node and if they are equal between the branches.

If a node type is not configured there, the merge driver will choose the one in the current branch.

# About this repository
This repository is based on code from [Amguerrero's](https://github.com/amguerrero) repository *[Salesforce Profile Specific Git Merge Driver](https://github.com/amguerrero/sfdc_merge)*

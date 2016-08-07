# Salesforce Profile Specific Git Merge Driver
This is a git merge driver specific for Salesforce.com Profiles.

The merge is done based on the nodes of the profile file, checking if any node changed in both the local copy and the branch we’re trying to merge, and merging automatically whenever there is no conflict.

In the case of a node being modified in our local workspace and in the branch we try to merge both nodes are marked with a ```<CONFLICT />``` tag that specifies from which change the node comes so it makes it easier to identify and resolve the conflict.

## How to add it to your current git repository
In order to use this merge driver we need to copy the content of the directory directory *sf_merge/* into *.git/scripts/sf_merge/* (create this directory if it doesn’t exist yet).

Then edit the *.git/config* file and add the following lines:
```
[merge "merge-profiles"]
	name = A custom merge driver for Salesforce profiles
	driver = groovy .git/scripts/sf_merge/merge_profiles.groovy %O %A %B .git/scripts/sf_merge
	recursive = binary
```

Which will configure the merge driver merge-profiles, and configure it to run the groovy script, the merges the profiles.

Then create the file *.git/info/attributes* if it doesn’t exist yet and add the following line:
```
*.profile merge=merge-profiles
```

This will instruct git that all the Salesforce profile files should be merged using the new merge profile.

## Configure the driver
The merge driver uses the configuration in the file *.git/scritps/sf_merge/conf/merge-profile-config.json* to know what nodes to merge and how to identify if the nodes are the same node and if they are equal between the branches.

If a node type is not configured there, the merge driver will choose the one in the current branch.
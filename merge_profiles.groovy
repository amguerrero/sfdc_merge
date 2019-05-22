import groovy.io.GroovyPrintStream
import groovy.json.JsonSlurperClassic
import groovy.xml.StreamingMarkupBuilder
import groovy.xml.XmlUtil

def scriptBase = args[3]
def xmlParser = new XmlParser(false, true, true)
def metadataType = getMetadataType(args[0], args[1], args[2])
def basePath = getNodeBase(metadataType, scriptBase)
def profile = xmlParser.parse(basePath)
def ancientNodes = xmlParser.parse(treatNoBase(args[0], basePath))
def oursNodes 	= xmlParser.parse(args[1])
def theirsNodes	= xmlParser.parse(args[2])
def conflictOurs = xmlParser.parse(scriptBase + '/nodes/ConflictOurs.xml')
def conflictTheirs = xmlParser.parse(scriptBase + '/nodes/ConflictTheirs.xml')
def conflictNoOther = xmlParser.parse(scriptBase + '/nodes/ConflictNoOther.xml')

def config = new JsonSlurperClassic().parse(new File(getConfigPath(metadataType, scriptBase))) 

// #### MAIN ####
ancient = [:]
ancientNodes."*".each { node ->
	def uniqueNodeKey = buildUniqueKey(node, config."${node.name().localPart}")
	if (uniqueNodeKey) {
		ancient[uniqueNodeKey] = [
			nodeType: node.name().localPart,
			node: node
		]
	}
}

ours = [:]
oursIds = []
unmatchedNodeCount = 0
oursNodes."*".each { node ->
	uniqueNodeKey = buildUniqueKey(node, config."${node.name().localPart}", unmatchedNodeCount++)
	oursIds << uniqueNodeKey
	ours[uniqueNodeKey] = [
		nodeType: node.name().localPart,
		node: node,
		existsInAncient: (ancient[uniqueNodeKey] != null),
		isEqualsToAncient: areNodesEqual(node, ancient[uniqueNodeKey], config."${node.name().localPart}")
	]
}

def conflictCounter = 0
theirsNodes."*".each { node ->
	uniqueNodeKey = buildUniqueKey(node, config."${node.name().localPart}")
	if (uniqueNodeKey) {
		existsInAncient = ancient[uniqueNodeKey] != null
		isEqualsToAncient = areNodesEqual(node, ancient[uniqueNodeKey], config."${node.name().localPart}")
		existsInOurs = oursIds.remove(uniqueNodeKey)
		isEqualsToOurs = areNodesEqual(node, ours[uniqueNodeKey], config."${node.name().localPart}")
	
		if ((!existsInAncient && existsInOurs && isEqualsToOurs) ||
			(existsInAncient && (
				(existsInOurs && (isEqualsToOurs || isEqualsToAncient)) ||
				(!existsInOurs && isEqualsToAncient)))) {
			// Keep OURS
			// do nothing
		} else if (existsInAncient && existsInOurs && ours[uniqueNodeKey].isEqualsToAncient) {
			// Use THEIRS
			ours[uniqueNodeKey].node = node
		} else if (!existsInAncient && !existsInOurs) {
			// Use THEIRS
			ours[uniqueNodeKey] = [
				node: node
			]
		} else {
			// CONFLICT detected
			conflictCounter++
			node.append conflictTheirs
			if (existsInOurs) {
				ours[uniqueNodeKey].node.append conflictOurs
			} else {
				node.append conflictNoOther
			}
			ours["${uniqueNodeKey}CONFLICT#"] = [
				node: node
			]
		}
	}
}

oursIds.each { id ->
	if (ours[id].existsInAncient && !ours[id].isEqualsToAncient) {
		conflictCounter++
		ours[id].node.append conflictOurs
		ours[id].node.append conflictNoOther
	} else if (ours[id].isEqualsToAncient) {
		ours.remove(id)
	}
}

ours.sort { it.key }.each {
	profile.append it.value.node
}

def sw = new StringWriter()
def printer = new XmlNodePrinter(new PrintWriter(sw), '    ')
printer.with {
  preserveWhitespace = true
  expandEmptyElements = true
}
printer.print(profile)

// writing the file in ours
new File(args[1]).withWriter('UTF-8') { it.write "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n$sw" }

println "Conflicts Found: $conflictCounter"
System.exit(conflictCounter)

// #### FUNCTIONS ####
def buildUniqueKey(def node, def nodeTypeConfig) {
	def uniqueKey = null
	if (nodeTypeConfig) {
		uniqueKey = node.name().localPart + "#"
		if (nodeTypeConfig.uniqueKeys) {
			nodeTypeConfig.uniqueKeys.each { key ->
				if (node."$key") {
					uniqueKey += node."$key"[0].value()[0] + "#"
				}
			}
		} else {
			def exclusiveUniqueKey = ''
			for (def eukList : nodeTypeConfig.exclusiveUniqueKeys) {
				for (def euk : eukList) {
					if (node."$euk"[0])
					exclusiveUniqueKey += node."$euk"[0].value()[0] + "#"
				}

				if (exclusiveUniqueKey != '') {
					break
				}
			}

			uniqueKey += exclusiveUniqueKey
		}
	}

	uniqueKey
}

def buildUniqueKey(def node, def nodeTypeConfig, def count) {
	def uniqueKey = buildUniqueKey(node, nodeTypeConfig)
	if (uniqueKey == null) {
		uniqueKey += node.name().localPart + "#${count}#"
	}

	uniqueKey
}

def areNodesEqual(def node1, def node2, def nodeTypeConfig) {
	if (node2 == null || node2.node == null) {
		return false
	}

	if (nodeTypeConfig && nodeTypeConfig.equalKeys && !nodeTypeConfig.equalKeys.isEmpty()) {
		for (def key : nodeTypeConfig.equalKeys) {
			if (node1."$key"[0] && node1."$key"[0].value()[0] != node2.node."$key"[0].value()[0]) {
				return false
			}
		}
		return true
	} else {
		return node1.value()[0] == node2.node.value()[0]
	}
}

def treatNoBase(def path1, def path2) {
	def tmpFile = new File(path1)
	if (tmpFile.length()>0)
	{
		return path1
	} else {
		return path2
	}
}

def getMetadataType(def path1, def path2, def path3) {
	def tmpFile = new File(path1)
	if (tmpFile.length()==0)
	{
		tmpFile = new File(path2)
		if (tmpFile.length()==0)
		{
			tmpFile = new File(path3)
		}
	}
	def lineToRead = 0
	while (!tmpFile.readLines().get(lineToRead).contains('xmlns')) {
		lineToRead = lineToRead + 1
	}
	switch (tmpFile.readLines().get(lineToRead).toLowerCase()) {
		case ~/.*profile.*/:
			return 'Profile'
			break;
		case ~/.*permissionset.*/:
			return 'PermissionSet'
			break;
		default:
			println "Bad input, this metadata type not handled"
			System.exit(1)
	}
}

def getNodeBase(def metadataType, def scriptBase) {
	return scriptBase + '/nodes/Base.' + metadataType.toLowerCase()
}

def getConfigPath(def metadataType, def scriptBase) {
	return scriptBase + '/conf/merge-' + metadataType.toLowerCase() + '-config.json'
}
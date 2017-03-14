import groovy.io.GroovyPrintStream
import groovy.json.JsonSlurperClassic
import groovy.xml.StreamingMarkupBuilder
import groovy.xml.XmlUtil

def mergeType = args[3]
def scriptBase = args[4]
def xmlParser = new XmlParser(false, true, true)
def ancientNodes = xmlParser.parse(args[0])
def oursNodes 	= xmlParser.parse(args[1])
def theirsNodes	= xmlParser.parse(args[2])
def conflictOurs = xmlParser.parse(scriptBase + '/nodes/ConflictOurs.xml')
def conflictTheirs = xmlParser.parse(scriptBase + '/nodes/ConflictTheirs.xml')
def conflictNoOther = xmlParser.parse(scriptBase + '/nodes/ConflictNoOther.xml')

def patchCore = scriptBase
def patchConfig = scriptBase

switch(mergeType) {
	case 'profile':
		patchCore += '/core/core.profile'
		patchConfig = '/config/profile.json'
	break
	case 'permissionset':
		patchCore += '/core/core.permissionset'
		patchConfig = '/config/permissionset.json'
	break
	case 'labels':
		patchCore += '/core/core.labels'
		patchConfig = '/config/labels.json'
	break
	default:
		System.exit(1)
	break
}

def base = xmlParser.parse(patchCore)
def config = new JsonSlurperClassic().parse(new File(patchConfig)) 

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
	base.append it.value.node
}

def sw = new StringWriter()
def printer = new XmlNodePrinter(new PrintWriter(sw), '    ')
printer.with {
  preserveWhitespace = true
  expandEmptyElements = true
}
printer.print(base)

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

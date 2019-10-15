import groovy.io.GroovyPrintStream
import groovy.json.JsonSlurperClassic
import groovy.xml.StreamingMarkupBuilder
import groovy.xml.XmlUtil
import java.util.logging.Logger

Logger logger = Logger.getLogger("")

def scriptBase = args[3]
def xmlParser = new XmlParser(false, true, true)
def metadataType = getMetadataType(args[0], args[1], args[2])
def baseXML = getNodeBaseXML(metadataType)
def base = xmlParser.parseText(baseXML)
def ancientNodes = xmlParser.parseText(treatNoBase(new File(args[0]).text, baseXML))//ancestor’s version of the conflicting file
def oursNodes 	= xmlParser.parse(args[1])//current version of the conflicting file
def theirsNodes	= xmlParser.parse(args[2])//other branch's version of the conflicting file
def conflictOurs = xmlParser.parseText('<CONFLICT>NODE FROM OURS</CONFLICT>')
def conflictTheirs = xmlParser.parseText('<CONFLICT>NODE FROM THEIRS</CONFLICT>')
def conflictNoOther = xmlParser.parseText('<CONFLICT>NO OTHER NODE. BUT THIS IS DIFFERENT TO ANCIENT</CONFLICT>')

def config = new JsonSlurperClassic().parse(new File(getConfigPath(metadataType, scriptBase)))

// #### MAIN ####
ancient = [:]
ancientNodes."*".each { node ->
	def uniqueNodeKey = buildUniqueKey(node, config."${getLocalPart(node)}")
	if (uniqueNodeKey) {
		ancient[uniqueNodeKey] = [
			nodeType: getLocalPart(node),
			node: node
		]
	}
}

ours = [:]
oursIds = []
unmatchedNodeCount = 0
oursNodes."*".each { node ->
	uniqueNodeKey = buildUniqueKey(node, config."${getLocalPart(node)}", unmatchedNodeCount++)
	oursIds << uniqueNodeKey
	ours[uniqueNodeKey] = [
		nodeType: getLocalPart(node),
		node: node,
		existsInAncient: (ancient[uniqueNodeKey] != null),
    isEqualsToAncient: areNodesEqual(node, ancient[uniqueNodeKey], config."${getLocalPart(node)}")[0],
    isEqualsToAncientFailedList: areNodesEqual(node, ancient[uniqueNodeKey], config."${getLocalPart(node)}")[1]
	]
}

def conflictCounter = 0
theirsNodes."*".each { node ->
	def localPart = getLocalPart(node);

	uniqueNodeKey = buildUniqueKey(node, config."${getLocalPart(node)}")
	if (uniqueNodeKey) {
		existsInAncient = ancient[uniqueNodeKey] != null
    isEqualsToAncient = areNodesEqual(node, ancient[uniqueNodeKey], config."${getLocalPart(node)}")[0]
		existsInOurs = oursIds.remove(uniqueNodeKey)
    isEqualsToOurs = areNodesEqual(node, ours[uniqueNodeKey], config."${getLocalPart(node)}")[0]
    isEqualsToOursFailedList = areNodesEqual(node, ours[uniqueNodeKey], config."${getLocalPart(node)}")[1]

		if ((!existsInAncient && existsInOurs && isEqualsToOurs) ||
			(existsInAncient && (
				(existsInOurs && (isEqualsToOurs || isEqualsToAncient)) ||
				(!existsInOurs && isEqualsToAncient)))) {
			// Keep OURS
			// do nothing
		} else if (existsInAncient && existsInOurs && ours[uniqueNodeKey].isEqualsToAncient) { // existed before, not modified in ours, use theirs (incomming)
			// Use THEIRS
			ours[uniqueNodeKey].node = node
		} else if (!existsInAncient && !existsInOurs) {
			// Use THEIRS
			ours[uniqueNodeKey] = [
				node: node
			]
		} else {
			// CONFLICT detected

      isEqualsToOursFailedList.each { entry ->
        conflictCounter++
        if (entry == null) {
          node."${getLocalPart(node.value()[0])}"[0].value()[0] = "\n<<<<<<< CURRENT\nnull\n=======\n${node."${getLocalPart(node.value()[0])}"[0].value()[0]}\n>>>>>>> OTHER\n"
        } else {
          node."${getLocalPart(entry)}"[0].value()[0] = "\n<<<<<<< CURRENT\n${entry.value()[0]}\n=======\n${node."${getLocalPart(entry)}"[0].value()[0]}\n>>>>>>> OTHER\n"
        }
      }

      // node.append conflictTheirs
			if (existsInOurs) {
			  ours[uniqueNodeKey].node = node
 			} else {
        // this should never happen
        // println "this should never happen"
				// node.append conflictNoOther
        ours["${uniqueNodeKey}CONFLICT#"] = [
				  node: node
			  ]
			}
		}
	}
}

oursIds.each { id -> // all left oursIds see #59
	if (ours[id]) {
		if (ours[id].existsInAncient && !ours[id].isEqualsToAncient) { // not exists in theirs branch, modified in ours
      ours[id].isEqualsToAncientFailedList.each { entry ->
        conflictCounter++
        ours[id].node."${getLocalPart(entry)}"[0].value()[0] = "\n<<<<<<< CURRENT\n${entry.value()[0]}\n=======\nnull\n>>>>>>> OTHER\n"
      }
/* 			ours[id].node.append conflictOurs
			ours[id].node.append conflictNoOther */
		} else if (ours[id].isEqualsToAncient) {
			ours.remove(id) // deleted in theirs branch, delete in ours
		}
	}
}

/* ours.sort { it.key }.each{
    key, value -> println key;
} */

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
new File(args[1]).withWriter('UTF-8') { it.write "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n${sw.toString().replaceAll("&lt;","<").replaceAll("&gt;",">")}" }

println "Conflicts Found: $conflictCounter"
System.exit(conflictCounter)

// #### FUNCTIONS ####
def buildUniqueKey(def node, def nodeTypeConfig) {
	def uniqueKey = null
	if (nodeTypeConfig) {
		uniqueKey = getLocalPart(node) + "#"
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
		uniqueKey += getLocalPart(node) + "#${count}#"
	}

	uniqueKey
}

def areNodesEqual(def node1, def node2, def nodeTypeConfig) {
	if (node2 == null || node2.node == null) {
		return [false, [null]]
	}

	if (nodeTypeConfig && nodeTypeConfig.equalKeys && !nodeTypeConfig.equalKeys.isEmpty()) {
    def list = []
		for (def key : nodeTypeConfig.equalKeys) {
			  if (node1."$key"[0] && node2.node."$key"[0] && node1."$key"[0].value()[0] != node2.node."$key"[0].value()[0]) {
            list.push(node2.node."$key"[0])
			  }
		}
    if (!list.isEmpty()) {
      return [false, list]
    } else {
		  return [true, []]
    }
	} else {
		if (node1.value()[0] == node2.node.value()[0]) {
      return [true, []]
    } else {
      return [false, node2.node.value()[0]]
    }
	}
}

def getLocalPart(def node) {
	try {
		return node.name().localPart
	} catch (Exception ex) {
		return node.name().split(':')[0]
	}
}

def treatNoBase(def file1, def file2) {
	if (file1.length()>0)
	{
		return file1
	} else {
		return file2
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
    case ~/.*customlabels.*/:
			return 'Labels'
			break;
		default:
			println "Bad input, this metadata type not handled"
			System.exit(1)
	}
}

def getNodeBaseXML(def metadataType) {
  	switch (metadataType) {
		case 'Profile':
			return '''<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
</Profile>'''
			break;
		case 'PermissionSet':
			return '''<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
</PermissionSet>'''
			break;
    case 'Labels':
			return '''<?xml version="1.0" encoding="UTF-8"?>
<CustomLabels xmlns="http://soap.sforce.com/2006/04/metadata">
</CustomLabels>'''
			break;
		default:
      return null
	}
}

def getConfigPath(def metadataType, def scriptBase) {
	return scriptBase + '/conf/merge-' + metadataType.toLowerCase() + '-config.json'
}

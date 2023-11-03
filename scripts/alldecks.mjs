import { loadXMLDoc, xmlDoc } from './config.mjs';
//var xmlDoc;
//var xmlFile;

const mtgDeck = [
    "./xml/BigRedMachine.xml",
    "./xml/Stasis.xml",
    "./xml/ZombieRenewal.xml",
    "./xml/Rith.xml",
    "./xml/BlackRack.xml",
    "./xml/BlackDread.xml",
    "./xml/Brood.xml",
    "./xml/CharredDiscard.xml",
    "./xml/Classic.xml",
    "./xml/CreepingChill.xml",
    "./xml/FireandIce.xml",
    "./xml/GreenWaste.xml",
    "./xml/GreenWasteOrder.xml",
    "./xml/GreenWasteSakura.xml",
    "./xml/Ixalan_Cannons_RedBlue.xml",
    "./xml/Ixalan_Green_White.xml",
    "./xml/JeskaiPioneer.xml",
    "./xml/Dimir_Inverter.xml",
    "./xml/JunkDiver.xml",
    "./xml/KindofBlue.xml",
    "./xml/Lumberjack.xml",
    "./xml/MantisRiderPioneer.xml",
    "./xml/Napoleon.xml",
    "./xml/Nishoba.xml",
    "./xml/Outpost.xml",
    "./xml/PatriotBlock.xml",
    "./xml/Pernicious.xml",
    "./xml/Plum.xml",
    "./xml/PlumGoneBlock.xml",
    "./xml/RayneForest.xml",
    "./xml/RedPatrol.xml",
    "./xml/affinity.xml",
    "./xml/hightide.xml",
    "./xml/oath.xml",
    "./xml/trix.xml",
    "./xml/belcher.xml",
    "./xml/counterbalance.xml",
    "./xml/dredge.xml",
    "./xml/goblins.xml",
    "./xml/landstill.xml",
    "./xml/BloodBraidElf.xml",
    "./xml/BloodBraidEnchantress.xml",
    "./xml/Patriot.xml",
    "./xml/WelderGamble.xml",
    "./xml/CloudpostWelder.xml",
    "./xml/Welder.xml",
    "./xml/TronTate.xml"
];

export async function startCompareDecks() {
    try {
        const len = mtgDeck.length;

        for (let i = 0; i < len; i++) {
            const xmlFile = mtgDeck[i];
            await loadXMLDoc(xmlFile);
            displayDeckComparison();
        }
    } catch (error) {
        console.error(error);
        window.alert("An error occurred while comparing decks.");
    }
}

async function _loadXMLDoc(XMLFile) {
    try {
        // Create a Fetch API request to load the XML file.
        const response = await fetch(XMLFile);
        
        if (!response.ok) {
            throw new Error('Failed to load the requested file.');
        }
        
        // Parse the XML response into a document.
        const xmlText = await response.text(); // Use a different variable name
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlText, 'text/xml'); // Use xmlDoc here, not xmlDoc
    } catch (error) {
        console.error(error);
        window.alert('Unable to load the requested file.');
    }
}

// This returns a string with everything but the digits removed.
function getConvertedCost(currentCost) {
	var arrConvertedCost = new Array(2);
	var intColorless = currentCost.replace (/[^\d]/g, "");
	if (intColorless.length > 0) {
		var lenintColorless = intColorless.length
		}
		else {
		var lenintColorless = 0
		intColorless = 0
		}

	var totStrLength = currentCost.length
	var intConvertedCost = parseInt(intColorless) + (parseInt(totStrLength) - parseInt(lenintColorless))
	arrConvertedCost[0] = intConvertedCost;
	arrConvertedCost[1] = intColorless;
	return arrConvertedCost;
}
	
function __displayDeckComparison() {
	var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
	var deckListName = xmlDoc.getElementsByTagName("Decklist")[0].getAttribute("Deck");
	var uniqueCards = deckList.getElementsByTagName("Name").length;
 	// get the reference for the body
	var body = document.getElementsByTagName("body")[0];
	// creates a <table> element and a <tbody> element
   	var tbl     = document.getElementById("tblDeckList");
   	var tblBody = document.createElement("tbody");
  	var totConvertedCost = 0;
	var intLandCount = 0;
	var intCreatureCount = 0;
	var intInstantCount = 0;
	var intSorceryCount = 0;
	var intEnchantmentCount = 0;
	var intArtifactCount = 0;
	var deckSize = 0;

	for (var i=0; i <uniqueCards; i++) {
		var currentQuantity = deckList.getElementsByTagName("Quantity")[i].firstChild.data;
		var currentType = deckList.getElementsByTagName("Type")[i].firstChild.data;
		var currentCost = deckList.getElementsByTagName("Cost")[i].firstChild.data;
		switch (currentType) {
		   case "Land" : 
			intLandCount = intLandCount + parseInt(currentQuantity);
		      break; 
		   case "Creature" : 
			intCreatureCount = intCreatureCount + parseInt(currentQuantity); 
		      break; 
		   case "Instant" : 
			intInstantCount = intInstantCount + parseInt(currentQuantity);
		      break; 
		   case "Sorcery" : 
			intSorceryCount = intSorceryCount + parseInt(currentQuantity);
		      break; 
		   case "Enchantment" : 
			intEnchantmentCount = intEnchantmentCount + parseInt(currentQuantity);
		      break; 
		   case "Artifact" : 
			intArtifactCount = intArtifactCount + parseInt(currentQuantity);
		      break; 
		   default : 
		     } 
	
		deckSize = deckSize + parseInt(currentQuantity);

		if (currentCost != "NA") {
		var convertedCost = getConvertedCost(currentCost);
		var convertedStr = document.createTextNode("Converted Cost: " + convertedCost);
		totConvertedCost = totConvertedCost + (parseInt(convertedCost)*parseInt(currentQuantity));
		}

		}		
		var deckListNameNode = document.createTextNode(deckListName);
		var deckSizeNode = document.createTextNode(deckSize);
		var intTotalConvertedCost = document.createTextNode(totConvertedCost);
		var intLandCountNode = document.createTextNode(intLandCount);
		var intCreatureCountNode = document.createTextNode(intCreatureCount);
		var intInstantCountNode = document.createTextNode(intInstantCount);
		var intSorceryCountNode = document.createTextNode(intSorceryCount);
		var intEnchantmentCountNode = document.createTextNode(intEnchantmentCount);
		var intArtifactCountNode = document.createTextNode(intArtifactCount);
		
		
	    // creating all cells
            // creates a table row
            var row = document.createElement("tr");
            // add the row to the end of the table body
            tblBody.appendChild(row);

            // Create a <td> element and a text node, make the text
            // node the contents of the <td>, and put the <td> at
            // the end of the table row

        var cell = document.createElement("td");
	cell.appendChild(deckListNameNode);
        row.appendChild(cell);

        var cell = document.createElement("td");
	cell.appendChild(deckSizeNode);
        row.appendChild(cell);
			
	var cell = document.createElement("td");
	cell.appendChild(intTotalConvertedCost);
        row.appendChild(cell);

	var cell = document.createElement("td");
	cell.appendChild(intLandCountNode);
        row.appendChild(cell);
			
	var cell = document.createElement("td");
	cell.appendChild(intCreatureCountNode);
        row.appendChild(cell);

	var cell = document.createElement("td");
	cell.appendChild(intInstantCountNode);
        row.appendChild(cell)

	var cell = document.createElement("td");
	cell.appendChild(intSorceryCountNode);
        row.appendChild(cell)

	var cell = document.createElement("td");
	cell.appendChild(intEnchantmentCountNode);
        row.appendChild(cell)

	var cell = document.createElement("td");
	cell.appendChild(intArtifactCountNode);
        row.appendChild(cell)

	// add the row to the end of the table body
        tblBody.appendChild(row);
	// put the <tbody> in the <table>
	tbl.appendChild(tblBody);
	// appends <table> into <body>
	body.appendChild(tbl);
	// sets the border attribute of tbl to 2;
	tbl.setAttribute("border", "2");
	return;
}

function displayDeckComparison() {
    var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
    var deckListName = deckList.getAttribute("Deck");
    var uniqueCards = deckList.getElementsByTagName("Name").length;
    var deckStatistics = calculateDeckStatistics(deckList);

    createDeckComparisonTable(deckListName, deckStatistics);
}

function calculateDeckStatistics(deckList) {
    var stats = {
        landCount: 0,
        creatureCount: 0,
        instantCount: 0,
        sorceryCount: 0,
        enchantmentCount: 0,
        artifactCount: 0,
        deckSize: 0,
        totalConvertedCost: 0,
    };

    for (var i = 0; i < deckList.children.length; i++) {
        var card = deckList.children[i];
        var currentQuantity = parseInt(card.querySelector("Quantity")?.textContent || 0);
        var currentTypeElement = card.querySelector("Type");
        var currentCost = card.querySelector("Cost")?.textContent || "NA";

        if (currentTypeElement) {
            var currentType = currentTypeElement.textContent;
            // Use regular expressions to check for "Land" or "Creature" keywords
            if (/Land/i.test(currentType)) {
                stats.landCount += currentQuantity;
            } else if (/Creature/i.test(currentType)) {
                stats.creatureCount += currentQuantity;
            } else {
                switch (currentType) {
                    case "Instant":
                        stats.instantCount += currentQuantity;
                        break;
                    case "Sorcery":
                        stats.sorceryCount += currentQuantity;
                        break;
                    case "Enchantment":
                        stats.enchantmentCount += currentQuantity;
                        break;
                    case "Artifact":
                        stats.artifactCount += currentQuantity;
                        break;
                }
            }
        }

        stats.deckSize += currentQuantity;

        if (currentCost !== "NA") {
            var convertedCost = getConvertedCost(currentCost);
            stats.totalConvertedCost += parseInt(convertedCost) * currentQuantity;
        }
    }

    return stats;
}


function __calculateDeckStatistics(deckList) {
    var stats = {
        landCount: 0,
        creatureCount: 0,
        instantCount: 0,
        sorceryCount: 0,
        enchantmentCount: 0,
        artifactCount: 0,
        deckSize: 0,
        totalConvertedCost: 0,
    };

    for (var i = 0; i < deckList.children.length; i++) {
        var card = deckList.children[i];
        var currentQuantity = parseInt(card.querySelector("Quantity")?.textContent || 0);
        var currentTypeElement = card.querySelector("Type");
        var currentCost = card.querySelector("Cost")?.textContent || "NA";

        if (currentTypeElement) {
            var currentType = currentTypeElement.textContent;
            switch (currentType) {
                case "Land":
                    stats.landCount += currentQuantity;
                    break;
                case "Creature":
                    stats.creatureCount += currentQuantity;
                    break;
                case "Instant":
                    stats.instantCount += currentQuantity;
                    break;
                case "Sorcery":
                    stats.sorceryCount += currentQuantity;
                    break;
                case "Enchantment":
                    stats.enchantmentCount += currentQuantity;
                    break;
                case "Artifact":
                    stats.artifactCount += currentQuantity;
                    break;
            }
        }

        stats.deckSize += currentQuantity;

        if (currentCost !== "NA") {
            var convertedCost = getConvertedCost(currentCost);
            stats.totalConvertedCost += parseInt(convertedCost) * currentQuantity;
        }
    }

    return stats;
}


function createDeckComparisonTable(deckName, stats) {
    var table = document.getElementById("tblDeckList");
    var row = document.createElement("tr");

    // Add table cells with deck statistics
    appendTableCell(row, deckName);
    appendTableCell(row, stats.deckSize);
    appendTableCell(row, stats.totalConvertedCost);
    appendTableCell(row, stats.landCount);
    appendTableCell(row, stats.creatureCount);
    appendTableCell(row, stats.instantCount);
    appendTableCell(row, stats.sorceryCount);
    appendTableCell(row, stats.enchantmentCount);
    appendTableCell(row, stats.artifactCount);

    var tbody = document.createElement("tbody");
    tbody.appendChild(row);

    table.appendChild(tbody);
    table.setAttribute("border", "2");
}

function appendTableCell(row, content) {
    var cell = document.createElement("td");
    cell.appendChild(document.createTextNode(content));
    row.appendChild(cell);
}


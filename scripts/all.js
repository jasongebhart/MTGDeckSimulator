// main.js

// Import the configuration
import * as config from './config';

// Set values for global variables
// config.globalVariable1 = "new value for globalVariable1";
// config.globalVariable2 = "new value for globalVariable2";

// Access and use the configured values directly
// console.log(config.globalVariable1); // Output: new value for globalVariable1
// console.log(config.globalVariable2); // Output: new value for globalVariable2

// Your main script logic
// You can use config.globalVariable1, config.globalVariable2, etc. directly

// Assuming you have the xml2js library installed via npm
const xml2js = require('xml2js');
const fs = require('fs');

function start() {
    const mtgDeck = [
        "./xml/BigRedMachine.xml",
        "./xml/Stasis.xml",
        "./xml/ZombieRenewal.xml",
        "./xml/Rith.xml",
        "./xml/BlackRack.xml",
        "./xml/Brood.xml",
        "./xml/CharredDiscard.xml",
        "./xml/Classic.xml",
        "./xml/FireandIce.xml",
        "./xml/GreenWaste.xml",
        "./xml/JunkDiver.xml",
        "./xml/KindofBlue.xml",
        "./xml/Lumberjack.xml",
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
        "./xml/BloodBraidEnchantress.xml"
    ];

    mtgDeck.push(
        "./xml/CloudpostWelder.xml",
        "./xml/BlackDread.xml"
    );

    for (const xmlFile of mtgDeck) {
        loadXMLDoc(xmlFile);
        //displayDeck();
    }
}

function loadXMLDoc(xmlFile) {
    fs.readFile(xmlFile, 'utf8', (err, xmlData) => {
        if (err) {
            console.error('Error reading XML file:', err);
            return;
        }

        // Parse XML data using xml2js library
        xml2js.parseString(xmlData, (parseErr, result) => {
            if (parseErr) {
                console.error('Error parsing XML:', parseErr);
                return;
            }

            // Process the parsed XML data (result)
            displayDeck(result);
        });
    });
}

function displayDeck() {
	const deckList = xmlDoc.getElementsByTagName("Decklist")[0];
	const deckListName = deckList.getAttribute("Deck");
	const uniqueCards = deckList.getElementsByTagName("Name").length;

	const deckInfo = {
		convertedCost: 0,
		landCount: 0,
		creatureCount: 0,
		instantCount: 0,
		sorceryCount: 0,
		enchantmentCount: 0,
		artifactCount: 0,
		deckSize: 0
	};

	for (let i = 0; i < uniqueCards; i++) {
		updateDeckInfo(deckList, deckInfo, i);
	}

	const deckInfoNode = createDeckInfoNode(deckListName, deckInfo.convertedCost, deckInfo.landCount, deckInfo.creatureCount);

	appendDeckInfoToTable(deckInfoNode);
}

function updateDeckInfo(deckList, deckInfo, index) {
	const currentQuantity = parseInt(deckList.getElementsByTagName("Quantity")[index].firstChild.data);
	const currentType = deckList.getElementsByTagName("Type")[index].firstChild.data;
	const currentCost = deckList.getElementsByTagName("Cost")[index].firstChild.data;

	// Update deck size
	deckInfo.deckSize += currentQuantity;

	// Update card type counts
	switch (currentType) {
		case "Land":
			deckInfo.landCount += currentQuantity;
			break;
		case "Creature":
			deckInfo.creatureCount += currentQuantity;
			break;
		case "Instant":
			deckInfo.instantCount += currentQuantity;
			break;
		case "Sorcery":
			deckInfo.sorceryCount += currentQuantity;
			break;
		case "Enchantment":
			deckInfo.enchantmentCount += currentQuantity;
			break;
		case "Artifact":
			deckInfo.artifactCount += currentQuantity;
			break;
		default:
			break;
	}

	// Update converted cost
	if (currentCost !== "NA") {
		const convertedCost = getConvertedCost(currentCost);
		deckInfo.convertedCost += parseInt(convertedCost) * currentQuantity;
	}
}

function createDeckInfoNode(deckName, convertedCost, landCount, creatureCount) {
	const deckInfoNode = document.createElement("div");
	deckInfoNode.textContent = `Deck: ${deckName} | Converted Cost: ${convertedCost} | Lands: ${landCount} | Creatures: ${creatureCount}`;
	return deckInfoNode;
}

function appendDeckInfoToTable(deckInfoNode) {
	const body = document.getElementsByTagName("body")[0];
	body.appendChild(deckInfoNode);
}
	
// This returns a string with everything but the digits removed.
function getConvertedCost(currentCost) {
    // Remove all non-digit characters from the string
    const digitsOnly = currentCost.replace(/\D/g, "");
    
    // Calculate the converted cost
    const intColorless = parseInt(digitsOnly);
    const lenintColorless = digitsOnly.length;
    const totStrLength = currentCost.length;
    const intConvertedCost = intColorless + (totStrLength - lenintColorless);

    return intConvertedCost;
}

function startCompareDecks() {
    const mtgDeck = [
        "./xml/BigRedMachine.xml",
        "./xml/Stasis.xml",
        "./xml/ZombieRenewal.xml",
        "./xml/Rith.xml",
        "./xml/BlackRack.xml",
        "./xml/Brood.xml",
        "./xml/CharredDiscard.xml",
        "./xml/Classic.xml",
        "./xml/FireandIce.xml",
        "./xml/GreenWaste.xml",
        "./xml/GreenWasteExploration.xml",
        "./xml/GreenWasteSakura.xml",
        "./xml/JunkDiver.xml",
        "./xml/KindofBlue.xml",
        "./xml/Lumberjack.xml",
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
        "./xml/BloodBraidEnchantress.xml"
    ];

    for (const xmlFile of mtgDeck) {
        loadXMLDoc(xmlFile);
        displayDeckComparison();
    }
}

function loadXMLDocSim(xmlFile) {
	if (window.ActiveXObject) {
		xmlDoc= new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async="false";
		xmlDoc.load(xmlFile);
		return;
	}		
	else if (document.implementation && document.implementation.createDocument) {
		//alert('This is Firefox');
		xmlDoc = document.implementation.createDocument("", "", null);
		//xmlDoc.load(xmlFile);
		xmlDoc.async=false;
		xmlDoc.onload = function (){};xmlDoc.load(xmlFile);
		return;
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
	
function displayDeckComparison() {
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


var arrCardNames = new Array();
var arrTypes = new Array();
var deckSize;

function startSimulateHandDraw() {
	var XMLFile = GetSelectedItem();
        deleteRows("tblHand");
        deleteRows("tblLibrary");
        deleteRows("tblDraw");	
        deleteRows("tblInGameDraw");
	loadXMLDocSim(XMLFile);
	var arrDeckInformation = getCardNames(xmlDoc);
		arrCardNames = arrDeckInformation[0]
		deckSize = arrDeckInformation[1];
		arrTypes = arrDeckInformation[2];
		intTotLands = arrDeckInformation[3];
	var strDeckName = getDeckName();
	document.getElementById("HandSimulation").innerHTML = "Hand Simulation - " + strDeckName;
	var arrHandInformation = cardDraw(arrCardNames,deckSize,arrTypes);
		arrHand = arrHandInformation[0];
		strHand = arrHandInformation[1];
		arrLands = arrHandInformation[2];
		strLands = arrHandInformation[3];
		intHandTypes = arrHandInformation[4];
		deckSize = arrHandInformation[5];
		displayHand(arrHand,strHand,arrLands,strLands,intHandTypes);
		setDeckSize(deckSize)
   }

// delete table rows with index greater then 0  
function deleteRows(tblDelete) {
    var tbl = document.getElementById(tblDelete); // table reference  
    // set the last row index  
    var lastRow = tbl.rows.length - 1;
    // delete rows with index greater then 0  
    for (var i = lastRow; i > 0; i--) tbl.deleteRow(i);
    //tbl.deleteTHead();
}  

function setDeckSize(deckSize) {
 document.getElementById("deckSize").innerHTML = "Deck Size: " + deckSize;
 }

function GetSelectedItem() {
    len = document.formDecks.selectDeck.length;
	i = 0
	XMLFile = "none"
	for (i = 0; i < len; i++) {
	    if (document.formDecks.selectDeck[i].selected) {
	        XMLFile = document.formDecks.selectDeck[i].value		
	    }
	}
	return XMLFile;
}

function getDeckName() { 
	var deckListName = xmlDoc.getElementsByTagName("Decklist")[0].getAttribute("Deck");
	return deckListName;
}

function getCardNames(xmlDoc) {
    var arrDeckInfo = new Array(4);
    var deckSize = 0;
    var intCounter = 0;
	var intTotLands = 0;
	var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
	var uniqueCards = deckList.getElementsByTagName("Name").length;
	for (var i=0; i <uniqueCards; i++) {
	    var currentQuantity = deckList.getElementsByTagName("Quantity")[i].firstChild.data;
		deckSize = deckSize + parseInt(currentQuantity);
	}
	var arrCardNames = new Array(deckSize);
	var arrTypes = new Array(deckSize);

	for (var k=0; k <(uniqueCards); k++) {
		currentCard = deckList.getElementsByTagName("Name")[k].firstChild.data;
		var currentQuantity = deckList.getElementsByTagName("Quantity")[k].firstChild.data;
		var currentType = deckList.getElementsByTagName("Type")[k].firstChild.data;
		for (var j=0; j<currentQuantity; j++) {
		arrCardNames[intCounter]=currentCard;
			arrTypes[intCounter]=currentType;
			var intCounter = intCounter + 1;
		}
	}
	for (var i=0; i <arrTypes.length; i++) {
		if (arrTypes[i] == "Land") { 
			intTotLands = parseInt(intTotLands) + 1;
		}
		}
		arrDeckInfo[0] = arrCardNames;
		arrDeckInfo[1] = deckSize;
		arrDeckInfo[2] = arrTypes;
		arrDeckInfo[3] = intTotLands;
		return arrDeckInfo;
	}
	
	
function cardDraw(arrCardNames,deckSize,arrTypes) {
  var arrHandInfo = new Array(3);
	
 //Simulate card drawing;
  var intCardstoDraw = 7;
  var strIntCardDrawn = "";
  var strHand = "";
  var strLands = "";
  var intHandTypes = 0;
  var arrHand = new Array();
  var arrLands = new Array();
  var arrHandTypes = new Array();
  var j=0;
  var k=0;
  for (var i=0; i <intCardstoDraw; i++) {
    var randomnumber=Math.floor(Math.random()*deckSize-i)
    var intCardDrawn=randomnumber;
    var strCardDrawn = arrCardNames.splice(intCardDrawn, 1);
    var strTypeDrawn = arrTypes.splice(intCardDrawn, 1);
    if (strTypeDrawn == "Land") {
	arrLands[j] = strCardDrawn
	j++;
	} else {
        arrHand[k] = strCardDrawn;
	k++;
	}
    arrHandTypes[i] = strTypeDrawn;
	strHand += arrHand[k] + ', ';
	strLands += arrLands[j] + ', ';
	strIntCardDrawn = strIntCardDrawn + intCardDrawn
	if (arrHandTypes[i] == "Land" && i <7) { 
		intHandTypes = parseInt(intHandTypes) + 1;
	}

  }
	deckSize -= intCardstoDraw;
	arrHandInfo[0] = arrHand;
	arrHandInfo[1] = strHand;
	arrHandInfo[2] = arrLands;
	arrHandInfo[3] = strLands;
	arrHandInfo[4] = intHandTypes;
	arrHandInfo[5] = deckSize;
	return arrHandInfo;
}

function displayHand(arrHand,strHand,arrLands,strLands,intHandTypes) {
        // get the reference for the body
        var body = document.getElementsByTagName("body")[0];
        // creates a <table> element and a <tbody> element
        var tbl    = document.getElementById("tblHand");
        var tblBody = document.createElement("tbody");

        var row = document.createElement("tr");
        tblBody.appendChild(row);
	var cell = document.createElement("td");
	var strSpells = document.createTextNode("Spells");
    	cell.appendChild(strSpells);
	cell.setAttribute("colspan", arrHand.length);
	cell.setAttribute("class", "hand");
   	row.appendChild(cell);

	var cell = document.createElement("td");
	var strLands = document.createTextNode("Lands");
    	cell.appendChild(strLands);
	cell.setAttribute("colspan", arrLands.length)
	cell.setAttribute("class","OnTheDraw");
   	row.appendChild(cell);

	// creating all cells
        // creates a table row
        var row = document.createElement("tr");
        // add the row to the end of the table body
        tblBody.appendChild(row);

	for (var i=0; i <arrHand.length; i++) {	
        var cell = document.createElement("td");

        link = document.createElement('A');
	    link.href = "http://www.magiccards.info/autocard/" + arrHand[i];
	    cell.appendChild(link);
    	    var nameStr = document.createTextNode(arrHand[i]);
	    link.appendChild(nameStr);
	    cell.setAttribute("class", "hand");
            row.appendChild(cell);
	}

	for (var i=0; i <arrLands.length; i++) {	
        var cell = document.createElement("td");
        link = document.createElement('A');
	    link.href = "http://www.magiccards.info/autocard/" + arrLands[i];
	    cell.appendChild(link);
    	    var nameStr = document.createTextNode(arrLands[i]);
	    link.appendChild(nameStr);
	    cell.setAttribute("class","OnTheDraw");
            row.appendChild(cell);
	}

	var cell = document.createElement("td");
	var typeStr = document.createTextNode(intHandTypes);
    	cell.appendChild(typeStr);
   	row.appendChild(cell);
	
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
	
function startDrawOneCard() {
  var arrHandInformation = drawOneCard(arrCardNames,deckSize,arrTypes);
		arrDraw = arrHandInformation[0];
		strDraw = arrHandInformation[1];
		intDrawTypes = arrHandInformation[2];
		deckSize = arrHandInformation[3];
  displayDraw(arrDraw, strDraw, intDrawTypes);
  setDeckSize(deckSize);
}

function drawOneCard(arrCardNames,deckSize,arrTypes) {
  var arrDrawInfo = new Array(3);
	
 //Simulate card drawing;
  var intCardstoDraw = 1;
  var intCardDrawn = 0;
  var strCardDrawn = "";
  var strIntCardDrawn = "";
  var strTypeDrawn = "";
  var strDraw = "";
  var intDrawTypes = 0;
  var arrDraw = new Array();
  var arrDrawTypes = new Array();
  for (var i=0; i <intCardstoDraw; i++) {
    var randomnumber = Math.floor(Math.random()*deckSize-i)
    deckSize -= i
    intCardDrawn = randomnumber;
    strCardDrawn = arrCardNames.splice(intCardDrawn, 1);
    strTypeDrawn = arrTypes.splice(intCardDrawn, 1);
    arrDraw[i] = strCardDrawn;
    arrDrawTypes[i] = strTypeDrawn;
	strDraw += arrDraw[i] + ', ';
	strIntCardDrawn += intCardDrawn
	if (arrDrawTypes[i] == "Land" && i <1) { 
		intDrawTypes = parseInt(intDrawTypes) + 1;
	}

  }
	deckSize -= intCardstoDraw;
	arrDrawInfo[0] = arrDraw;
	arrDrawInfo[1] = strDraw;
	arrDrawInfo[2] = intDrawTypes;
	arrDrawInfo[3] = deckSize;
	return arrDrawInfo;
}


function displayDraw(arrDraw,strDraw,intDrawTypes) {
        // get the reference for the body
        var body = document.getElementsByTagName("body")[0];
        // creates a <table> element and a <tbody> element
        var tbl    = document.getElementById("tblDraw");
        var tblBody = document.createElement("tbody");

	// creating all cells
        // creates a table row
        var row = document.createElement("tr");
        // add the row to the end of the table body
        tblBody.appendChild(row);

	for (var i=0; i <arrDraw.length; i++) {	
        var cell = document.createElement("td");

        link = document.createElement('A');
	    link.href = "http://www.magiccards.info/autocard/" + arrDraw[i];
	    cell.appendChild(link);
    	    var nameStr = document.createTextNode(arrDraw[i]);
	    link.appendChild(nameStr);
            row.appendChild(cell);
	}

	var cell = document.createElement("td");
	var typeStr = document.createTextNode(intDrawTypes);
    cell.appendChild(typeStr);
    row.appendChild(cell);
	
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

function startLibraryDraw() {
  deleteRows("tblLibrary");
  var arrLibraryInformation = searchLibrary(arrCardNames,arrTypes);
	strDraw = arrLibraryInformation[0];
  displayLibraryCardAsButton(strDraw);
  setDeckSize(deckSize)
}


function searchLibrary(arrCardNames,arrTypes) {
  var arrLibrarySpellsDrawn = new Array(1);
  var arrlibrarySpells = new Array();
  var librarySize = arrCardNames.length;
  arrlibrarySpells = arrCardNames.slice(0);
	 
 //Simulate card drawing;
//Set type to land to make the while statement run the first time and selects a card that is not a land
  var strTypeDrawn = "Land";
  while (strTypeDrawn == "Land" || strTypeDrawn == "Creature") {
      var intCardDrawn = 0;
      var strCardDrawn = "";
      strTypeDrawn = "";	
      var randomnumber = Math.floor(Math.random()*librarySize);
//If the library Size is 60 then the randomnumber will equal a number from 0 to 59
      intCardDrawn = randomnumber;
      strCardDrawn = arrlibrarySpells[intCardDrawn];
      strTypeDrawn = arrTypes[intCardDrawn];
      }
	arrLibrarySpellsDrawn[0] = strCardDrawn;
	return arrLibrarySpellsDrawn;
}


function startLibraryDrawCreature() {
  deleteRows("tblLibrary");
  var arrLibraryInformation = searchLibraryCreature(arrCardNames,arrTypes);
	strDraw = arrLibraryInformation[0];
  displayLibraryCardAsButton(strDraw);
  setDeckSize(deckSize)
}


function searchLibraryCreature(arrCardNames,arrTypes) {
  var arrLibraryCreaturesDrawn = new Array(1);
  var arrlibraryCreatures = new Array();
  var librarySize = arrCardNames.length;
  arrlibraryCreatures = arrCardNames.slice(0);
	 
 //Simulate card drawing;
//Set type to NotCreature to make the while statement run the first time and select a card that is a creature
  var strTypeDrawn = "NotCreature";
  while (strTypeDrawn != "Creature") {
      var intCardDrawn = 0;
      var strCardDrawn = "";
      strTypeDrawn = "";	
      var randomnumber = Math.floor(Math.random()*librarySize);
//If the library Size is 60 then the randomnumber will equal a number from 0 to 59
      intCardDrawn = randomnumber;
      strCardDrawn = arrlibraryCreatures[intCardDrawn];
      strTypeDrawn = arrTypes[intCardDrawn];
      }
	arrLibraryCreaturesDrawn[0] = strCardDrawn;
	return arrLibraryCreaturesDrawn;
}

function startLibraryDrawLand() {
  deleteRows("tblLibrary");
  var arrLibraryInformation = searchLibraryLand(arrCardNames,arrTypes);
	strDraw = arrLibraryInformation[0];
  displayLibraryCardAsButton(strDraw);
}

function searchLibraryLand(arrCardNames,arrTypes) {
  var arrLibraryInfo = new Array(1);
  var arrlibraryLands = new Array();
  var librarySize = arrCardNames.length;
  arrlibraryLands = arrCardNames.slice(0);
	 
 //Simulate card drawing;
  var intCardDrawn = 0;
  var strCardDrawn = "";
  var strTypeDrawn = "NotLand";
  while (strTypeDrawn != "Land") {
    var randomnumber = Math.floor(Math.random()*librarySize);
   //If the library Size is 60 then randomnumber will equal a number from 0 to 59
    intCardDrawn = randomnumber;
    strCardDrawn = arrlibraryLands[intCardDrawn];
    strTypeDrawn = arrTypes[intCardDrawn];
  }
  arrLibraryInfo[0] = strCardDrawn;
  return arrLibraryInfo;
}

function displayLibraryCardAsButton (strDraw) {
        // get the reference for the body
        var body = document.getElementsByTagName("body")[0];
        // creates a <table> element and a <tbody> element
        var tbl    = document.getElementById("tblLibrary");
        var tblBody = document.createElement("tbody");
        var oTHead = document.createElement("THEAD");
        var oTFoot = document.createElement("TFOOT");
        var oCaption = document.createElement("CAPTION");

	// creating all cells
        // creates a table row
        var row = document.createElement("tr");
        // add the row to the end of the table body
        tblBody.appendChild(row);

        var cell = document.createElement("td");

        link = document.createElement('A');
	    link.href = "http://www.magiccards.info/autocard/" + strDraw;
	    cell.appendChild(link);
    	    var nameStr = document.createTextNode(strDraw);
	    link.appendChild(nameStr);
	    var buttonnode= document.createElement('input');
	    buttonnode.setAttribute('type','button');
	    buttonnode.setAttribute('name','Add to Hand');
	    buttonnode.setAttribute('value', 'Add to Hand');
	    buttonnode.setAttribute('class', 'btn');
	    strRunButton = strDraw;
	    cell.appendChild(buttonnode);
        row.appendChild(cell);
        buttonnode.onclick = function () {
            addToHand(arrCardNames, strRunButton);
        }

    oCaption.innerHTML = "Click to remove from library";
    oCaption.style.fontSize = "10px";
    oCaption.align = "bottom";

    tbl.appendChild(oCaption);

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


function addToHand(arrCardNames, strRunButton) {
  var strCardDrawn = "";
//Remove card from library and add to card effect draw
  for (var i = 0; i < arrCardNames.length; i++) {
      if (arrCardNames[i] == strRunButton) {
        deckSize -= 1
        strCardDrawn = arrCardNames.splice(i, 1);
        displayOneCardOnly(strCardDrawn);
        deleteRows("tblLibrary");
        setDeckSize(arrCardNames.length);
        return;
      }
  }
	return;
}



function displayOneCardOnly(strCardDrawn) {
    // get the reference for the body
    var body = document.getElementsByTagName("body")[0];
    // creates a <table> element and a <tbody> element
    var tbl = document.getElementById("tblInGameDraw");
    var tblBody = document.createElement("tbody");
    var oTHead = document.createElement("THEAD");
    var oTFoot = document.createElement("TFOOT");
    var oCaption = document.createElement("CAPTION");

    // creating all cells
    // creates a table row
    var row = document.createElement("tr");
    // add the row to the end of the table body
    tblBody.appendChild(row);

    var cell = document.createElement("td");
    link = document.createElement('A');
    link.href = "http://www.magiccards.info/autocard/" + strCardDrawn;
    cell.appendChild(link);
    var nameStr = document.createTextNode(strCardDrawn);
    link.appendChild(nameStr);
    row.appendChild(cell);

    // add the row to the end of the table body
    // put the <tbody> in the <table>
    tbl.appendChild(tblBody);
    // appends <table> into <body>
    body.appendChild(tbl);
    // sets the border attribute of tbl to 2;
    tbl.setAttribute("border", "2");
    return;
}


function startSimulateHandDraw() {
	var XMLFile = GetSelectedItem();
	loadXMLDocSim(XMLFile);
	var arrDeckInformation = getCardNames(xmlDoc);
		arrCardNames = arrDeckInformation[0]
		deckSize = arrDeckInformation[1];
		arrTypes = arrDeckInformation[2];
		intTotLands = arrDeckInformation[3];
	var strDeckName = getDeckName();
	document.getElementById("HandSimulation").innerHTML = "Hand Simulation - " + strDeckName;
	var arrHandInformation = cardDraw(arrCardNames,deckSize,arrTypes);
		arrHand = arrHandInformation[0];
		strHand = arrHandInformation[1];
		intHandTypes = arrHandInformation[2];
	loadXMLDocSim("./xml/mulligan.xml");
	var strMulligan = getMulliganRate(intTotLands);
        displayHand(arrHand,strHand,intHandTypes);
	getMulliganStats();
}

function GetSelectedItem() {
    len = document.formDecks.selectDeck.length;
	i = 0
	XMLFile = "none"
	for (i = 0; i < len; i++) {
	    if (document.formDecks.selectDeck[i].selected) {
	        XMLFile = document.formDecks.selectDeck[i].value		
	    }
	}
	return XMLFile;
}

function getDeckName() { 
	var deckListName = xmlDoc.getElementsByTagName("Decklist")[0].getAttribute("Deck");
	return deckListName;
}

function getCardNames(xmlDoc) {
    var arrDeckInfo = new Array(4);
    var deckSize = 0;
    var intCounter = 0;
	var intTotLands = 0;
	var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
	var uniqueCards = deckList.getElementsByTagName("Name").length;
	for (var i=0; i <uniqueCards; i++) {
	    var currentQuantity = deckList.getElementsByTagName("Quantity")[i].firstChild.data;
		deckSize = deckSize + parseInt(currentQuantity);
	}
	var arrCardNames = new Array(deckSize);
	var arrTypes = new Array(deckSize);

	for (var k=0; k <(uniqueCards); k++) {
		currentCard = deckList.getElementsByTagName("Name")[k].firstChild.data;
		var currentQuantity = deckList.getElementsByTagName("Quantity")[k].firstChild.data;
		var currentType = deckList.getElementsByTagName("Type")[k].firstChild.data;
		for (var j=0; j<currentQuantity; j++) {
		arrCardNames[intCounter]=currentCard;
			arrTypes[intCounter]=currentType;
			var intCounter = intCounter + 1;
		}
	}
	for (var i=0; i <arrTypes.length; i++) {
		if (arrTypes[i] == "Land") { 
			intTotLands = parseInt(intTotLands) + 1;
		}
		}
		arrDeckInfo[0] = arrCardNames;
		arrDeckInfo[1] = deckSize;
		arrDeckInfo[2] = arrTypes;
		arrDeckInfo[3] = intTotLands;
		return arrDeckInfo;
	}
	
	
function cardDraw(arrCardNames,deckSize,arrTypes) {
	var arrHandInfo = new Array(3);
	
 //Simulate card drawing;
  var intCardstoDraw = 11;
  var strIntCardDrawn = "";
  var strHand = "";
  var intHandTypes = 0;
  var arrHand = new Array();
  var arrHandTypes = new Array();
  for (var i=0; i <intCardstoDraw; i++) {
    var randomnumber=Math.floor(Math.random()*deckSize-i)
    var intCardDrawn=randomnumber;
    var strCardDrawn = arrCardNames.splice(intCardDrawn, 1);
    var strTypeDrawn = arrTypes.splice(intCardDrawn, 1);
    arrHand[i] = strCardDrawn;
    arrHandTypes[i] = strTypeDrawn;
	strHand = strHand + arrHand[i] + ', ';
	strIntCardDrawn = strIntCardDrawn + intCardDrawn
	if (arrHandTypes[i] == "Land" && i <7) { 
		intHandTypes = parseInt(intHandTypes) + 1;
	}

  }
	arrHandInfo[0] = arrHand;
	arrHandInfo[1] = strHand;
	arrHandInfo[2] = intHandTypes;
	return arrHandInfo;
}

function displayHand(arrHand,strHand,intHandTypes) {
        // get the reference for the body
        var body = document.getElementsByTagName("body")[0];
        // creates a <table> element and a <tbody> element
        var tbl    = document.getElementById("tblHand");
        var tblBody = document.createElement("tbody");

	// creating all cells
        // creates a table row
        var row = document.createElement("tr");
        // add the row to the end of the table body
        tblBody.appendChild(row);

	for (var i=0; i <arrHand.length; i++) {	
        var cell = document.createElement("td");
		if (i < 7 ) { 
		cell.setAttribute('class','hand');
		} else {
		cell.setAttribute('class','OnTheDraw');
		}
        link = document.createElement('A');
	    link.href = "http://www.magiccards.info/autocard/" + arrHand[i];
	    cell.appendChild(link);
    	    var nameStr = document.createTextNode(arrHand[i]);
	    link.appendChild(nameStr);
            row.appendChild(cell);
	}

	var cell = document.createElement("td");
	if (intHandTypes < 2 ) { 
		cell.setAttribute('class','IsMulligan');
	} else {
		cell.setAttribute('class','NoMulligan');
	}
	var typeStr = document.createTextNode(intHandTypes);
    cell.appendChild(typeStr);
    row.appendChild(cell);
	
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
	
function getMulliganRate (intTotLands) {	   
	var intZero = 0;
	var intOne = 0;
	var mulliganList = xmlDoc.getElementsByTagName("Mulligan")[0];
	var mulliganLand = mulliganList.getElementsByTagName("Quantity").length;
	for (var i=0; i <mulliganLand; i++) {
	    var intLandQuantity = mulliganList.getElementsByTagName("Quantity")[i].firstChild.data;
		if (intLandQuantity == intTotLands) {
		intZero = mulliganList.getElementsByTagName("Zero")[i].firstChild.data;
		intOne = mulliganList.getElementsByTagName("One")[i].firstChild.data;
		}
	}
	var strMulligan = (parseInt(intZero) + parseInt(intOne)) + "%";
	document.getElementById("HypergeometricDistribution").innerHTML = "Hypergeometric Distribution(60 cards): " + strMulligan;
	return strMulligan;
}

function getMulliganStats() {
//Count each total number of row created and how many have zero or one land hands
//Divide mulligan hands by total number of rows.
	var intNumMulligans = 0;
	var tbl = document.getElementById("tblHand"); // table reference  
	// set the last row index  
	var lastRow = tbl.rows.length -2;  
	for (var i=(lastRow+1); i>1; i--) {
		var intResult = tbl.rows[i].cells[11].innerHTML; 
		if (intResult < 2) {
			intNumMulligans = intNumMulligans + 1
		}
	}
 	document.getElementById("TotalHandsDrawn").innerHTML = "Hands: " + lastRow;
	document.getElementById("TotalMulligans").innerHTML = "Mulligans: " + intNumMulligans;
	document.getElementById("MulliganPercentage").innerHTML = "Current Mulligan Percentage: " + parseInt(intNumMulligans/lastRow*100) + "%"
}


function GetSelectedItem() {
    len = document.formDecks.selectDeck.length;
	i = 0
	XMLFile = "none"
	for (i = 0; i < len; i++) {
	    if (document.formDecks.selectDeck[i].selected) {
	        XMLFile = document.formDecks.selectDeck[i].value		
	    }
	}
	return XMLFile;
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

function getColorCosts(currentCost) {
	var arrColorDist = new Array(12);
	intBlueCount = 0;
	intBlueCards = 0;
	intRedCount = 0;
	intRedCards = 0;
	intBlackCount = 0;
	intBlackCards = 0;
	intWhiteCount = 0;
	intWhiteCards = 0;
	intGreenCount = 0;	
	intGreenCards = 0;
	intClearCount = 0;
	intClearCards = 0;

	var strLength = currentCost.length
	//currentCost = currentCost.toUpperCase();
	for (var i=0; i <(strLength); i++) {
	var strColorCharacter = currentCost.charAt(i);
		switch (strColorCharacter) {
		   case "U": 
			 intBlueCount = intBlueCount + 1; 
			 intBlueCards = 1;
			 break; 
		   case "R": 
			 intRedCount = intRedCount + 1;
			 intRedCards = 1;
			 break; 
		   case "B": 
			 intBlackCount = intBlackCount + 1;
			 intBlackCards = 1;
			 break; 
		   case "W": 
			  intWhiteCount = intWhiteCount + 1;
			  intWhiteCards = 1;
			  break; 
		   case "G": 
			  intGreenCount = intGreenCount + 1;
			  intGreenCards = 1;
			  break; 
		   case "X": 
			  intClearCount = parseInt(intClearCount) + 1;
			  intClearCards = 1;
			  break; 
		   default : 
			  break;
		} 
	}
			arrColorDist[0] = intBlueCount;
			arrColorDist[1] = intBlueCards;
			arrColorDist[2] = intRedCount;
			arrColorDist[3] = intRedCards;
			arrColorDist[4] = intBlackCount;
			arrColorDist[5] = intBlackCards;
			arrColorDist[6] = intWhiteCount;
			arrColorDist[7] = intWhiteCards;
			arrColorDist[8] = intGreenCount;
			arrColorDist[9] = intGreenCards;
			arrColorDist[10] = intClearCount;
			arrColorDist[11] = intClearCards;
			
			return arrColorDist;
	//return [intBlueCount,intBlueCards,intRedCount,intRedCards,intBlackCount,intBlackCards,intWhiteCount,intWhiteCards,intGreenCount,intGreenCards,intClearCount,intClearCards];
}

// delete table rows with index greater then 0  
function deleteRows(tblDelete){  
	var tbl = document.getElementById(tblDelete); // table reference  
	// set the last row index  
	var lastRow = tbl.rows.length -1;  
	// delete rows with index greater then 0  
	for (var i=lastRow; i>1; i--) tbl.deleteRow(i);  
	}  

	  
function displayDeck(xmlDoc) {
	var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
	var deckListName = xmlDoc.getElementsByTagName("Decklist")[0].getAttribute("Deck");
	var designGoal = xmlDoc.getElementsByTagName("DesignGoal")[0].firstChild.data;
	var uniqueCards = deckList.getElementsByTagName("Name").length;

	deleteRows("tblCreatureList");
	deleteRows("tblSpellsList");
	deleteRows("tblLandList");
	//initialize tables
	var tblChosen = "tblCreatureList";
	initializeCardTable(tblChosen);

	var intBlueCount;
	var intBlueCards = 0;
	var totBlueCards = 0;
	var intRedCount;
	var intRedCards = 0;
	var totRedCards = 0;
	var intBlackCount;
	var intBlackCards = 0;
	var totBlackCards = 0;
	var intWhiteCount;
	var intWhiteCards = 0;
	var totWhiteCards = 0;
	var intGreenCount;
	var intGreenCards = 0;
	var totGreenCards = 0;
	var intClearCount = 0;
	var intClearCards = 0;
	var totClearCards = 0;
	var totConvertedCost = 0;
	var intLandCount = 0;
	var intCreatureCount = 0;
	var intInstantCount = 0;
	var intSorceryCount = 0;
	var intEnchantmentCount = 0;
	var intArtifactCount = 0;
	var intPlaneswalkerCount = 0;
	var deckSize = 0;
	var intzeroCost = 0;
	var intoneCost = 0;
	var inttwoCost = 0;
	var intthreeCost = 0;
	var intfourCost = 0;
	var intfiveCost = 0;
	var intsixCost = 0;
	var intsevenmoreCost = 0;
	var totBlueCount = 0;
	var totRedCount = 0;
	var totBlackCount = 0;
	var totWhiteCount = 0;
	var totGreenCount = 0;
	var totColorlessCount = 0;
	var currentCard = null;
	var currentQunatity = null;
	var currentType = null;
	var currentCost = null;	

	for (var i=0; i <(uniqueCards); i++) {
		currentCard = deckList.getElementsByTagName("Name")[i].firstChild.data;
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
		   case "Planeswalker" : 
			intPlaneswalkerCount = intPlaneswalkerCount + parseInt(currentQuantity);
		        break; 
		   default : 
		} 

		deckSize = deckSize + parseInt(currentQuantity);
			if (currentCost != "NA") {
				var arrColorDistribution = getColorCosts(currentCost);
				//[intBlueCount,intBlueCards,intRedCount,intRedCards,intBlackCount,intBlackCards,intWhiteCount,intWhiteCards,intGreenCount,intGreenCards,intClearCount,intClearCards] = getColorCosts(currentCost);
				
    			intBlueCount = arrColorDistribution[0];
	    		intBlueCards = arrColorDistribution[1];
		    	intRedCount = arrColorDistribution[2];
				intRedCards = arrColorDistribution[3];
				intBlackCount = arrColorDistribution[4];
				intBlackCards = arrColorDistribution[5];
				intWhiteCount = arrColorDistribution[6];
				intWhiteCards = arrColorDistribution[7];
				intGreenCount = arrColorDistribution[8];	
				intGreenCards = arrColorDistribution[9];
				intClearCount = arrColorDistribution[10];
				intClearCards = arrColorDistribution[11];
				
				totBlueCount = totBlueCount + intBlueCount*parseInt(currentQuantity);
				totBlueCards = totBlueCards + intBlueCards*parseInt(currentQuantity);
				totRedCount = totRedCount + intRedCount*parseInt(currentQuantity);
				totRedCards = totRedCards + intRedCards*parseInt(currentQuantity);
				totBlackCount = totBlackCount + intBlackCount*parseInt(currentQuantity);
				totBlackCards = totBlackCards + intBlackCards*parseInt(currentQuantity);				
				totWhiteCount = totWhiteCount + intWhiteCount*parseInt(currentQuantity);
				totWhiteCards = totWhiteCards + intWhiteCards*parseInt(currentQuantity);
				totGreenCount = totGreenCount + intGreenCount*parseInt(currentQuantity);
				totGreenCards = totGreenCards + intGreenCards*parseInt(currentQuantity);
			
			    var convertedCost; var intColorless;
			    var arrConvertedCost = getConvertedCost(currentCost);
			    var convertedCost = arrConvertedCost[0];
			    intColorless = arrConvertedCost[1];
			    totColorlessCount = parseInt(totColorlessCount) + parseInt(intClearCount*currentQuantity) + parseInt(intColorless)*parseInt(currentQuantity);
			    switch (convertedCost) {
			       case 0 : 
				    intzeroCost = intzeroCost + parseInt(currentQuantity);
			          break; 
			       case 1 : 
				    intoneCost = intoneCost + parseInt(currentQuantity);
			          break; 
			       case 2 : 
				    inttwoCost = inttwoCost + parseInt(currentQuantity); 
			          break; 
			       case 3 : 
				    intthreeCost = intthreeCost + parseInt(currentQuantity);
			          break; 
			       case 4 : 
				    intfourCost = intfourCost + parseInt(currentQuantity);
			          break; 
			       case 5 : 
				    intfiveCost = intfiveCost + parseInt(currentQuantity);
			          break; 
			       case 6 : 
				    intsixCost = intsixCost + parseInt(currentQuantity);
			          break; 
			       default : 
				    intsevenmoreCost = intsevenmoreCost + parseInt(currentQuantity);
			         } 
				 
			    //var convertedStr = document.createTextNode(convertedCost);
			    var strConvertedCost = convertedCost;
			    totConvertedCost = totConvertedCost + (parseInt(convertedCost)*parseInt(currentQuantity));
			 }else {
			 var strConvertedCost = "NA";
			 }

			
		switch (currentType) {
		   case "Land" : 
		        var tblChosen = "tblLandList"
				createCardTable(tblChosen,currentCard,currentQuantity,currentCost,strConvertedCost);
			break; 
		   case "Creature" : 
				var tblChosen = "tblCreatureList"
				createCardTable(tblChosen,currentCard,currentQuantity,currentCost,strConvertedCost);
       		   break; 
		   case "Instant" : 
				var tblChosen = "tblSpellsList"
				createCardTable(tblChosen,currentCard,currentQuantity,currentCost,strConvertedCost);			
		        break; 
		   case "Sorcery" : 
				var tblChosen = "tblSpellsList"
				createCardTable(tblChosen,currentCard,currentQuantity,currentCost,strConvertedCost);		   
			    break; 
		   case "Enchantment" : 
				var tblChosen = "tblSpellsList"
				createCardTable(tblChosen,currentCard,currentQuantity,currentCost,strConvertedCost);		   
		        break; 
		   case "Artifact" : 
				var tblChosen = "tblSpellsList"
				createCardTable(tblChosen,currentCard,currentQuantity,currentCost,strConvertedCost);		   
		        break; 
		   case "Planeswalker" : 
				var tblChosen = "tblSpellsList"
				createCardTable(tblChosen,currentCard,currentQuantity,currentCost,strConvertedCost);		   
		        break; 
		   default : 
		} 
			 
	    document.getElementById("DesignGoal").innerHTML = designGoal;
	    document.getElementById("DeckListName").innerHTML = deckListName;
	    document.getElementById("deckSize").innerHTML = deckSize;
	    document.getElementById("TotConvertedCost").innerHTML = totConvertedCost;
	    document.getElementById("TotLands").innerHTML = intLandCount;
	    document.getElementById("TotCreatures").innerHTML = intCreatureCount;
	    document.getElementById("TotInstants").innerHTML = intInstantCount;
	    document.getElementById("TotSorceries").innerHTML = intSorceryCount;
	    document.getElementById("TotEnchantments").innerHTML = intEnchantmentCount;
	    document.getElementById("TotArtifacts").innerHTML = intArtifactCount;
	    document.getElementById("TotPlaneswalkers").innerHTML = intPlaneswalkerCount;
	    document.getElementById("ZeroCost").innerHTML = intzeroCost;
	    document.getElementById("OneCost").innerHTML = intoneCost;
	    document.getElementById("TwoCost").innerHTML = inttwoCost;
	    document.getElementById("ThreeCost").innerHTML = intthreeCost;
	    document.getElementById("FourCost").innerHTML = intfourCost;
	    document.getElementById("FiveCost").innerHTML = intfiveCost;
	    document.getElementById("SixCost").innerHTML = intsixCost;
	    document.getElementById("SevenmoreCost").innerHTML = intsevenmoreCost;
	    document.getElementById("BlueCost").innerHTML = totBlueCount;
	    document.getElementById("BlueCards").innerHTML = totBlueCards;
	    document.getElementById("RedCost").innerHTML = totRedCount;
	    document.getElementById("RedCards").innerHTML = totRedCards;
	    document.getElementById("BlackCost").innerHTML = totBlackCount;
	    document.getElementById("BlackCards").innerHTML = totBlackCards;
	    document.getElementById("WhiteCost").innerHTML = totWhiteCount;
	    document.getElementById("WhiteCards").innerHTML = totWhiteCards;
	    document.getElementById("GreenCost").innerHTML = totGreenCount;
	    document.getElementById("GreenCards").innerHTML = totGreenCards;
	    document.getElementById("ColorlessCost").innerHTML = totColorlessCount;
	}
}
function initializeCardTable(tblChosen) {
    // get the reference for the body
    var body = document.getElementsByTagName("body")[0];
    // creates a <table> element and a <tbody> element
    var tbl     = document.getElementById(tblChosen);
    var tblBody = document.createElement("tbody");	
	// creating all cells
    // creates a table row
    var row = document.createElement("tr");
    // add the row to the end of the table body
    // Create a <td> element and a text node, make the text
    // node the contents of the <td>, and put the <td> at
    // the end of the table row

    var nameStr = document.createTextNode("Card");
	var cell = document.createElement("td");
    cell.appendChild(nameStr);
    row.appendChild(cell);
        
	var quantityStr = document.createTextNode("Quantity");
	var cell = document.createElement("td");
    cell.appendChild(quantityStr);
    row.appendChild(cell);
    
	var costStr = document.createTextNode("Cost");
	var cell = document.createElement("td");
	cell.appendChild(costStr);
    row.appendChild(cell);

	var convertedStr = document.createTextNode("Converted Cost");
    var cell = document.createElement("td");
	cell.appendChild(convertedStr);
	row.appendChild(cell);
	
	// add the row to the end of the table body
	tblBody.appendChild(row);
	// put the <tbody> in the <table>
	tbl.appendChild(tblBody);
	// appends <table> into <body>
	body.appendChild(tbl);
	// sets the border attribute of tbl to 2;
	//tbl.setAttribute("border", "2");
	tbl.setAttribute("display", "inline-block");
}
	
function createCardTable(tblChosen,currentCard,currentQuantity,currentCost,strConvertedCost) {
    // get the reference for the body
    var body = document.getElementsByTagName("body")[0];
    // creates a <table> element and a <tbody> element
    var tbl     = document.getElementById(tblChosen);
    var tblBody = document.createElement("tbody");	
	// creating all cells
    // creates a table row
    var row = document.createElement("tr");
    // add the row to the end of the table body
    // Create a <td> element and a text node, make the text
    // node the contents of the <td>, and put the <td> at
    // the end of the table row
    var cell = document.createElement("td");
    link = document.createElement('A');
    link.href = "http://www.magiccards.info/autocard/" + currentCard;
    cell.appendChild(link);
    var nameStr = document.createTextNode(currentCard);
    link.appendChild(nameStr);
    row.appendChild(cell);
        
	var quantityStr = document.createTextNode(currentQuantity);
	var cell = document.createElement("td");
    cell.appendChild(quantityStr);
    row.appendChild(cell);
    
	if (currentCost != "NA") {
	var costStr = document.createTextNode(currentCost);
	var cell = document.createElement("td");
	cell.appendChild(costStr);
    row.appendChild(cell);

	var convertedStr = document.createTextNode(strConvertedCost);
    var cell = document.createElement("td");
	cell.appendChild(convertedStr);
	row.appendChild(cell);
	} 
	
	// add the row to the end of the table body
	tblBody.appendChild(row);
	// put the <tbody> in the <table>
	tbl.appendChild(tblBody);
	// appends <table> into <body>
	body.appendChild(tbl);
	// sets the border attribute of tbl to 2;
	//tbl.setAttribute("border", "2");
	tbl.setAttribute("display", "inline-block");
}

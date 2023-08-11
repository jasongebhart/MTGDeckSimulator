var xmlDoc;
var xmlFile;

function startCompareDecks() {
	var mtgDeck = []; // regular array
		mtgDeck.push("./xml/BigRedMachine.xml"); 
		mtgDeck.push("./xml/Stasis.xml");
		mtgDeck.push("./xml/ZombieRenewal.xml");
		mtgDeck.push("./xml/Rith.xml");
		mtgDeck.push("./xml/BlackRack.xml");
		mtgDeck.push("./xml/BlackDread.xml");
		mtgDeck.push("./xml/Brood.xml");
		mtgDeck.push("./xml/CharredDiscard.xml");
		mtgDeck.push("./xml/Classic.xml");
		mtgDeck.push("./xml/CreepingChill.xml");
		mtgDeck.push("./xml/FireandIce.xml");
		mtgDeck.push("./xml/GreenWaste.xml");
		mtgDeck.push("./xml/GreenWasteOrder.xml");
		mtgDeck.push("./xml/GreenWasteSakura.xml");	
		mtgDeck.push("./xml/Ixalan_Cannons_RedBlue.xml");
		mtgDeck.push("./xml/Ixalan_Green_White.xml");	
		mtgDeck.push("./xml/JeskaiPioneer.xml");
		mtgDeck.push("./xml/Dimir_Inverter.xml");
		mtgDeck.push("./xml/JunkDiver.xml");
		mtgDeck.push("./xml/KindofBlue.xml");
		mtgDeck.push("./xml/Lumberjack.xml");
		mtgDeck.push("./xml/MantisRiderPioneer.xml");
		mtgDeck.push("./xml/Napoleon.xml");
		mtgDeck.push("./xml/Nishoba.xml");
		mtgDeck.push("./xml/Outpost.xml");
		mtgDeck.push("./xml/PatriotBlock.xml");
		mtgDeck.push("./xml/Pernicious.xml");
		mtgDeck.push("./xml/Plum.xml");
		mtgDeck.push("./xml/PlumGoneBlock.xml");
		mtgDeck.push("./xml/RayneForest.xml");
		mtgDeck.push("./xml/RedPatrol.xml");
		mtgDeck.push("./xml/affinity.xml");
		mtgDeck.push("./xml/hightide.xml");
		mtgDeck.push("./xml/oath.xml");
		mtgDeck.push("./xml/trix.xml");
		mtgDeck.push("./xml/belcher.xml");	
		mtgDeck.push("./xml/counterbalance.xml");
		mtgDeck.push("./xml/dredge.xml");
		mtgDeck.push("./xml/goblins.xml");
		mtgDeck.push("./xml/landstill.xml");
		mtgDeck.push("./xml/BloodBraidElf.xml");
		mtgDeck.push("./xml/BloodBraidEnchantress.xml");
		mtgDeck.push("./xml/Patriot.xml");
		mtgDeck.push("./xml/WelderGamble.xml"); 
		mtgDeck.push("./xml/CloudpostWelder.xml"); 
		mtgDeck.push("./xml/Welder.xml"); 
		mtgDeck.push("./xml/TronTate.xml"); 




	var len=mtgDeck.length;
	for(var i=0; i<len; i++) {
		xmlFile = mtgDeck[i];
		//loadXMLDocSim(xmlFile);
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
function loadXMLDoc(XMLFile) {
	// Create a connection to the file.
	var Connect = new XMLHttpRequest();

	try
	{
 	// Define which file to open and
	// send the request.
  	Connect.open("GET", XMLFile, false);
  	Connect.send();
	}
	catch(e) {
		window.alert("unable to load the requested file.");
		return;
	}

  	xmlDoc=Connect.responseXML;
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

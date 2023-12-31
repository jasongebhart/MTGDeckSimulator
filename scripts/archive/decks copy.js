
var xmlDoc;
var xmlFile;

function startListDeck() {
	var XMLFile = GetSelectedItem();
	console.log('request was made: ' + xmlFile);
	loadXMLDoc(XMLFile);
	displayDeck(xmlDoc);
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
			}
			else {
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

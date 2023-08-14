function startSimulateHandDraw() {
	var XMLFile = GetSelectedItem();
	loadXMLDoc(XMLFile);
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
	loadXMLDoc("./xml/mulligan.xml");
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

function startMulliganCheck() {
	 loadXMLDocSim("./xml/mulligan.xml");
	 displayMulliganChart(xmlDoc);
}


function displayMulliganChart(xmlDoc) {
    var arrMulligan = [];  // Use array literal for better readability
    var mulliganList = xmlDoc.getElementsByTagName("Mulligan")[0];
    var mulliganLand = mulliganList.getElementsByTagName("Quantity").length;
    
    for (var i = 0; i < mulliganLand; i++) {
        var intZero = parseInt(mulliganList.getElementsByTagName("Zero")[i].firstChild.data);
        var intOne = parseInt(mulliganList.getElementsByTagName("One")[i].firstChild.data);
        var totalPercentage = intZero + intOne;
        arrMulligan[i] = totalPercentage + "%";
    }

    var mulliganElements = [
        "Nineteen", "Twenty", "TwentyOne", "TwentyTwo", "TwentyThree",
        "TwentyFour", "TwentyFive", "TwentySix", "TwentySeven", "TwentyEight"
    ];

    // Populate HTML elements using a loop
    for (var j = 0; j < mulliganElements.length; j++) {
        var elementId = mulliganElements[j];
        document.getElementById(elementId).innerHTML = arrMulligan[j];
    }
}


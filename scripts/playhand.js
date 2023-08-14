//Initialize variables
let arrCardNames = [];
let arrTypes = [];
let deckSize;
const fs = require('fs');

function startSimulateHandDraw() {
    const selectedXMLFile = GetSelectedItem();

    // Clear sections
    clearGameSections();

    // Load XML data
    loadXMLData(selectedXMLFile);

    // Retrieve deck information
    const deckInformation = getDeckInformationFromXML();
    const { cardNames, deckSize, types, totalLands } = deckInformation;
    arrCardNames = cardNames
    arrTypes = types
    // Simulate card draw
    const cardsToDraw = 7;
    const handInformation = simulateCardDraw(cardNames, deckSize, types, cardsToDraw);
    const { hand, handString, lands, landsString, handTypes, updatedDeckSize } = handInformation;

    // Display hand and update deck size
    displayHandAndDeck(hand, handString, lands, landsString, handTypes, updatedDeckSize);
}

function clearGameSections() {
    const sectionsToClear = ["section_spells", "section_lands", "section_battlefield", "section_graveyard"];
    sectionsToClear.forEach(section => deleteSection(section));
}

function loadXMLData(XMLFile) {
    loadXMLDoc(XMLFile);
}

function getDeckInformationFromXML() {
    const deckInfo = getCardNames();
    return {
        cardNames: deckInfo[0],
        deckSize: deckInfo[1],
        types: deckInfo[2],
        totalLands: deckInfo[3]
    };
}

function simulateCardDraw(cardNames, deckSize, types, cardsToDraw) {
    const handInfo = cardDraw(cardNames, deckSize, types, cardsToDraw);
    return {
        hand: handInfo[0],
        handString: handInfo[1],
        lands: handInfo[2],
        landsString: handInfo[3],
        handTypes: handInfo[4],
        updatedDeckSize: handInfo[5]
    };
}

function displayHandAndDeck(hand, handString, lands, landsString, handTypes, updatedDeckSize) {
    displayHand(hand, handString, lands, landsString, handTypes);
    setDeckSize(updatedDeckSize);
}

async function loadXMLDoc(XMLFile) {
    try {
        // Create a Fetch API request to load the XML file.
        const response = await fetch(XMLFile);
        
        if (!response.ok) {
            throw new Error('Failed to load the requested file.');
        }
        
        // Parse the XML response into a document.
        xmlDoc = await response.text();
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlDoc, 'text/xml');
    } catch (error) {
        console.error(error);
        window.alert('Unable to load the requested file.');
    }
}

function loadXMLDocOLD(XMLFile) {
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
// delete table rows with an index greater then 0
function deleteRows(tableId) {
    const table = document.getElementById(tableId);
    
    // Remove all rows except the header row (index 0)
    for (let i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    }
    
    // Add a new row after clearing the existing rows
    const newRow = table.insertRow(1); // Index 1, assuming you want to keep the header row
    // Insert cells and set content if needed
    // Example:
    // const cell1 = newRow.insertCell(0);
    // cell1.textContent = 'New Cell Content';
}


function deleteSection(secDelete) {
    document.getElementById(secDelete).textContent = '';
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

function fetchXMLDocSim(XMLFile) {
	 console.log('fetching xml:' + XMLFile);
	 var myHeaders = new Headers();
	 var myInit = {
		 	method: 'POST',
			headers: myHeaders,
      body: "XMLFile=test"
		};

 var myRequest = new Request('/clicked', myInit);
	fetch(myRequest).then(function(response) {
		 if(response.ok) {
			 console.log('Click was recorded');
			 return;
		 }
		 throw new Error('Request failed.');
	 })
	 .catch(function(error) {
		 console.log(error);
	 });
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
		xmlDoc.onload = function (){};
		xmlDoc.load(xmlFile);
		return;
	}
}



function getDeckName() {
	var deckListName = xmlDoc.getElementsByTagName("Decklist")[0].getAttribute("Deck");
	return deckListName;
}

function getCardNames() {
    // Evaluate XML file and build card array with multiple entries for each
    // name with multiple quantities
    var arrDeckInfo = new Array(4);
    var deckSize = 0;
    var intCounter = 0;
	var intTotLands = 0;
	var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
    // Retrieve the total number of unique names from the XML file
	var uniqueCards = deckList.getElementsByTagName("Name").length;
	for (var i=0; i <uniqueCards; i++) {
        // for each unique card add the quantity to determine the number of cards in the deck
        // set deckSize
        // parseInt will convert string to integer
	    var currentQuantity = deckList.getElementsByTagName("Quantity")[i].firstChild.data;
		deckSize = deckSize + parseInt(currentQuantity);
	}
	var arrCardNames = new Array(deckSize);
	var arrTypes = new Array(deckSize);

	for (var k=0; k <(uniqueCards); k++) {
        //Start loop through unique cards
		currentCard = deckList.getElementsByTagName("Name")[k].firstChild.data;
		var currentQuantity = deckList.getElementsByTagName("Quantity")[k].firstChild.data;
		var currentType = deckList.getElementsByTagName("Type")[k].firstChild.data;
		//Build arrCardNames with each card and quantity in order
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


function cardDraw(arrCardNames,deckSize,arrTypes,intCardstoDraw) {
      var arrHandInfo = new Array(3);
      //Simulate card drawing;
      //var intCardstoDraw = 7;
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
        // The splice() method removes items from an array, and returns the removed item(s).
        // randomnumber with be the index of the array
        // 1 means one item is removed
        strCardDrawn = arrCardNames.splice(randomnumber, 1);
        var strCardDrawn = new String(strCardDrawn);
        //strCardDrawn = strCardDrawn.replace(',','');
        strCardDrawn = strCardDrawn.trim();
        var strTypeDrawn = arrTypes.splice(randomnumber, 1);
        if (strTypeDrawn == "Land") {
	        arrLands[j] = strCardDrawn;
	        j++;
        } else {
            arrHand[k] = strCardDrawn;
	        k++;
        }
        arrHandTypes[i] = strTypeDrawn;
        strHand += arrHand[k] + ', ';
        strLands += arrLands[j] + ', ';
        //strIntCardDrawn = strIntCardDrawn + randomnumber
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
    // var function = [];
    for (var i=0; i <arrHand.length; i++) {
        var strCardDrawn = arrHand[i];
        var ToLocation = "spells";
        var FromLocation = "none";
        createCardAtSection(strCardDrawn,ToLocation,FromLocation);
   }

    for (var i=0; i <arrLands.length; i++) {
        var strCardDrawn = arrLands[i];
        var ToLocation = "lands";
        var FromLocation = "none";
        createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    }

    //var strLands = document.createTextNode("Lands");
    //var typeStr = document.createTextNode(intHandTypes);
    return;
}


function startDrawOneCard() {
    deleteSection("section_library");
    intCardstoDraw = 1;
	var arrHandInformation = cardDraw(arrCardNames,deckSize,arrTypes,intCardstoDraw);
	arrHand = arrHandInformation[0];
	strHand = arrHandInformation[1];
	arrLands = arrHandInformation[2];
	strLands = arrHandInformation[3];
	intHandTypes = arrHandInformation[4];
	deckSize = arrHandInformation[5];
	displayHand(arrHand,strHand,arrLands,strLands,intHandTypes);
	setDeckSize(deckSize)
}


//Build functions to select from multiple card types
function startLibrarySearch(cardtype) {
    deleteSection("section_library");
    //deleteRows("tblLibrary");
    var arrLibraryInformation = startLibrarySearchFilter(arrCardNames,arrTypes,cardtype);
    //alert(arrLibraryInformation.length);
    for (i = 0; i < arrLibraryInformation.length; i++) {
        //alert(arrLibraryInformation[i]);
        var ToLocation = "library";
        var FromLocation = "library";
        var strCardDrawn = arrLibraryInformation[i];
        //alert(strCardDrawn);
        createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    }
}



function startLibrarySearchFilter(arrCardNames,arrTypes,cardtype) {
    var arrLibrary = new Array();
    var librarySize = arrCardNames.length;
    //alert(librarySize);
    arrLibrary = arrCardNames.slice(0);
    //Find only each index for land type
    var myCards = new Set();
 	for (i = 0; i < librarySize-1; i++) {
       var currentcardtype = arrTypes[i]
       //alert(cardtype.indexOf(currentcardtype));
       //doing an indexOf compare rather than == so that Enchanments, Instants etc. group together
       if (cardtype.indexOf(currentcardtype) >= 0) {
          //alert(arrLibrary[i]);
          //Build a new set with the name of each found card of specified type
          // A set will eliminate duplicates
          myCards.add(arrLibrary[i]);
          //alert(arrLibrary[i]);
       }
    }
    //alert(myCards.size);
    var arrLibraryInfo = [...myCards];
    //alert("StartLibrarySearchFilter: " + arrLibraryInfo.length);
    return arrLibraryInfo;
}




function startLibraryDrawAll() {
  deleteSection("section_library");
  //deleteRows("tblLibrary");
  var strCardDrawn = searchLibraryAll(arrCardNames,arrTypes);
  var ToLocation = "library";
  var FromLocation = "library";
  createCardAtSection(strCardDrawn,ToLocation,FromLocation)
  setDeckSize(deckSize)
}


function searchLibraryAll(arrCardNames,arrTypes) {
  var arrlibraryAll = new Array();
  var librarySize = arrCardNames.length;
  arrlibraryAll = arrCardNames.slice(0);

  //Simulate card drawing;
  var intCardDrawn = 0;
  var strCardDrawn = "";
  strTypeDrawn = "";
  var randomnumber = Math.floor(Math.random()*deckSize);
  //If the library Size is 60 then the randomnumber will equal a number from 0 to 59
  strCardDrawn = arrlibraryAll[randomnumber];
  strTypeDrawn = arrTypes[randomnumber];
  return strCardDrawn;
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


function addToBattlefield(arrCardNames, strRunButton) {
    var strCardDrawn = "";
    //alert(strRunButton);
    //Remove card from library and add to card effect draw
    for (var i = 0; i < arrCardNames.length; i++) {
        if (arrCardNames[i] == strRunButton) {
            deckSize -= 1
            strCardDrawn = arrCardNames.splice(i, 1);
            //alert(strCardDrawn);
            displayOnBattlefield(strCardDrawn);
            deleteRows("tblLibrary");
            setDeckSize(arrCardNames.length);
            return;
        }
    }
    return;
}

function addToGraveyardFromPlay(arrCardNames,strCardDrawn){
    //Remove card from hand and add to card effect draw
    //alert(strCardDrawn);
    var ToLocation = "graveyard";
    var FromLocation = "battlefield";
    createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    //deleteCellFromBattlefield(strCardDrawn);
    return;
}



function addToBattlefieldFromGraveyard(arrCardNames,strCardDrawn){
    //Remove card from hand and add to card effect draw
    //alert(strCardDrawn);
    var ToLocation = "battlefield";
    var FromLocation = "graveyard";
    createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    //deleteCellFromGraveyard(strCardDrawn);
    return;
}

function addToBattlefieldFromSpells(arrCardNames, strCardDrawn) {
    //alert(strCardDrawn);
    //Remove card from hand and add to card effect draw
    var ToLocation = "battlefield";
    var FromLocation = "spells";
    createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    //deleteCellFromHand(strCardDrawn);
    return;
}

function addToBattlefieldFromLand(arrCardNames, strCardDrawn) {
    //alert(strCardDrawn);
    //Remove card from hand and add to card effect draw
    var ToLocation = "battlefield";
    var FromLocation = "lands";
    createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    //deleteCellFromHand(strCardDrawn);
    return;
}

function deleteCardFromGraveyard(strCardDrawn) {
    var card = document.getElementById("div1_graveyard_"+strCardDrawn);
    card.remove();
}

function deleteCardFromSpells(strCardDrawn) {
    var card = document.getElementById("div1_spells_"+strCardDrawn);
    card.remove();
}

function deleteCardFromLands(strCardDrawn) {
    var card = document.getElementById("div1_lands_"+strCardDrawn);
    card.remove();
}

function deleteCardFromBattlefield(strCardDrawn) {
    var card = document.getElementById("div1_battlefield_"+strCardDrawn);
    card.remove();
}



function deleteCellFromGraveyard(strCardDrawn) {
    var cell = document.getElementById("graveyard_"+strCardDrawn);
    cell.remove();
}

function deleteCellFromHand(strCardDrawn) {
    var cell = document.getElementById("Hand_"+strCardDrawn);
    cell.remove();
}
function deleteCellFromBattlefield(strCardDrawn) {
    var cell = document.getElementById("battlefield_"+strCardDrawn);
    cell.remove();
}

function deleteCellFromLibrary(strCardDrawn) {
    //No necessary since the original deck is not visible
    var cell = document.getElementById("library_"+strCardDrawn);
    cell.remove();
}

function addToHand(arrCardNames, strCardDrawn) {
    //Remove card from library and add to card effect draw
    for (var i = 0; i < arrCardNames.length; i++) {
        if (arrCardNames[i] == strCardDrawn) {
            deckSize -= 1
            // Remove card from library
            arrCardNames.splice(i, 1);
            addToHandFromLibrary(strCardDrawn);
            //displayOneCardOnly(strCardDrawn);
            deleteSection("section_library");
            //deleteRows("tblLibrary");
            setDeckSize(arrCardNames.length);
            return;
        }
    }
    return;
}

function addToHandFromLibrary(strCardDrawn) {
    //alert(intDrawTypes);
    strCardDrawn = strCardDrawn.replace(/,\s*$/, "");
    //strCardDrawn = strCardDrawn.replace(',','');
    var strCardDrawn = new String(strCardDrawn);
    var ToLocation = "spells";
    var FromLocation = "library";
    createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    return;
}


function addToHandFromLibraryNew(strCardDrawn) {
    strCardDrawn = strCardDrawn.replace(',','');
    //The / mark the beginning and end of the regular expression
    //The , matches the comma
    //The \s means whitespace characters (space, tab, etc) and the * means 0 or more
    //The $ at the end signifies the end of the string
    var strCardDrawn = new String(strCardDrawn);
    var ToLocation = "spells";
    var FromLocation = "library";
    createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    return;
}

function displayToLocation(strCardDrawn,ToLocation,FromLocation) {
    switch(ToLocation) {
        case "Hand":
            row = document.getElementById("tblSpells").rows[1];
            break;

        case "spells":
            row = document.getElementById("tblSpells").rows[1];
            break;

        case "lands":
            row = document.getElementById("tblLands").rows[1];
            break;

        case "graveyard":
            var row = document.getElementById("tblGraveyard").rows[1];
            break;

        case "battlefield":
            var row = document.getElementById("tblBattleField").rows[1];
            break;

        case "library":
            var row = document.getElementById("tblLibrary").rows[1];
            break;

        default:
    }


    strCardDrawn = strCardDrawn.replace(',','');
    var strCardDrawn = new String(strCardDrawn);
    createCardAtLocation(strCardDrawn,ToLocation,FromLocation);
    return;
}


function removeCardFromLocation(strCardDrawn,FromLocation) {

    switch(FromLocation) {
        case "Hand":
            deleteCardFromHand(strCardDrawn);
            break;

        case "spells":
            deleteCardFromSpells(strCardDrawn);
            break;

        case "lands":
            deleteCardFromLands(strCardDrawn);
            break;

        case "battlefield":
            deleteCardFromBattlefield(strCardDrawn);
            break;

        case "graveyard":
            deleteCardFromGraveyard(strCardDrawn);
            break;

        case "library":
            //deleteCardFromLibrary(strCardDrawn);
            break;

        default:
    }
}

function createCardLink(strCardDrawn) {
    link = document.createElement('A');
    link.href = "http://www.magiccards.info/autocard/" + strCardDrawn;
    //var cardpicture = "/assets/MagicImages/" + strCardDrawn + ".jpg";
    //link.setAttribute('data-value',cardpicture);
    var nameStr = document.createTextNode(strCardDrawn);
    link.appendChild(nameStr);
    //var cardimagepreview = createCardImagePreview(strCardDrawn);
    //link.appendChild(cardimagepreview);
    return link;
}


function createCardLinkPreview(strCardDrawn) {
    link = document.createElement('A');
    link.href = "/assets/MagicImages/" + strCardDrawn + ".jpg";
    var nameStr = document.createTextNode(strCardDrawn);
    link.appendChild(nameStr);
    return link;
}


function createCardImagePreview(strCardDrawn) {
    var image = document.createElement("img");
    image.src = "/assets/MagicImages/" + strCardDrawn + ".jpg";
    image.className = "image-preview";
    image.title = strCardDrawn;
    //image.alt="alt Hello";
    return image;
}


function createCardImage(strCardDrawn) {
    var image = document.createElement("img");
    image.src = "/assets/MagicImages/" + strCardDrawn + ".jpg";
    image.className = "image-preview";
    image.title = strCardDrawn;
    image.style.cssText = 'display:block;text-align:center;';
    //image.alt="alt Hello";
    return image;
}


function createCardCell(strCardDrawn,ToLocation,cardimage,cardlink,buttonnode) {
    switch(ToLocation) {
        case "Hand":
            row = document.getElementById("tblSpells").rows[1];
            break;

        case "spells":
            row = document.getElementById("tblSpells").rows[1];
            break;

        case "lands":
            row = document.getElementById("tblLands").rows[1];
            break;

        case "graveyard":
            var row = document.getElementById("tblGraveyard").rows[1];
            break;

        case "battlefield":
            var row = document.getElementById("tblBattleField").rows[1];
            break;

        case "library":
            var row = document.getElementById("tblLibrary").rows[1];
            break;

        default:
    }

    var cell = document.createElement("td");
    cell.setAttribute('id', ToLocation + "_"+strCardDrawn);

    cell.appendChild(cardimage);
    cell.appendChild(cardlink);

    var belement = createCardButton(strCardDrawn,ToLocation);
    //cell.appendChild(belement);
    cell.setAttribute("class", "hand");
    row.appendChild(cell);
}


function createCardItem(strCardDrawn,ToLocation) {
    switch(ToLocation) {
        case "spells":
            var section = document.getElementById("section_spells");
            break;

        case "lands":
            var section = document.getElementById("section_lands");
            break;

        case "graveyard":
            var section = document.getElementById("section_graveyard");
            break;

        case "battlefield":
            var section = document.getElementById("section_battlefield");
            break;

        case "library":
            var section = document.getElementById("section_library");
            break;

        default:
    }

    var carddiv = document.createElement("div");
    var newID = new String("div1_");
    carddiv.id = newID.concat(ToLocation,"_",strCardDrawn);

    var cardlink = createCardLink(strCardDrawn);
    var cardimage = createCardImage(strCardDrawn);
    //var cardimagepreview = createCardImagePreview(strCardDrawn);
    var buttonnode = createCardButton(strCardDrawn,ToLocation);
    //var cardlinkpreview = createCardLinkPreview(strCardDrawn);


    carddiv.appendChild(cardimage);
    carddiv.appendChild(cardlink);
    //carddiv.appendChild(cardlinkpreview);
    //carddiv.appendChild(cardimagepreview);
    carddiv.appendChild(buttonnode);

    //section.appendChild(cardlink);
    //section.appendChild(cardimage);
    //section.appendChild(buttonnode);

    section.appendChild(carddiv);
    //return carddiv;
}

function createCardButton(strCardDrawn,ToLocation) {
    var buttonnode
    //alert(ToLocation);
     switch(ToLocation) {
        case "graveyard":
             //Battlefield Button Creation
            buttonnode = document.createElement('input');
            buttonnode.setAttribute('type','button');
            buttonnode.setAttribute('name','Add to Battlefield');
            buttonnode.setAttribute('value','Add to Battlefield');
            buttonnode.setAttribute('class','btn');

            buttonnode.onclick = (function(arrCardNames,strCardDrawn) {
                return function () {
                    addToBattlefieldFromGraveyard(arrCardNames,strCardDrawn);
                };
            })(arrCardNames,strCardDrawn);
            break;

        case "battlefield":
            //Graveyard Button Creation
            buttonnode = document.createElement('input');
            buttonnode.setAttribute('type','button');
            buttonnode.setAttribute('name','Graveyard');
            buttonnode.setAttribute('value','Graveyard');
            buttonnode.setAttribute('class','btn');
            buttonnode.setAttribute('id', "gravebtn_"+strCardDrawn);
            //alert("To Location battlefield " + strCardDrawn);
            buttonnode.onclick = (function(arrCardNames,strCardDrawn) {
                return function () {
                    addToGraveyardFromPlay(arrCardNames,strCardDrawn);
                };
            })(arrCardNames,strCardDrawn);
            break;

        case "Hand":
            buttonnode = document.createElement('input');
            buttonnode.setAttribute('type','button');
            buttonnode.setAttribute('name','Add to Battlefield');
            buttonnode.setAttribute('value','Add to Battlefield');
            buttonnode.setAttribute('class','btn');

            buttonnode.onclick = (function(arrCardNames,strCardDrawn) {
                return function () {
                    addToBattlefieldFromHand(arrCardNames,strCardDrawn);
                };
            })(arrCardNames,strCardDrawn);
            break;

        case "spells":
            buttonnode = document.createElement('input');
            buttonnode.setAttribute('type','button');
            buttonnode.setAttribute('name','Add to Battlefield');
            buttonnode.setAttribute('value','Add to Battlefield');
            buttonnode.setAttribute('class','btn');

            buttonnode.onclick = (function(arrCardNames,strCardDrawn) {
                return function () {
                    addToBattlefieldFromSpells(arrCardNames,strCardDrawn);
                };
            })(arrCardNames,strCardDrawn);
            break;

        case "lands":
            buttonnode = document.createElement('input');
            buttonnode.setAttribute('type','button');
            buttonnode.setAttribute('name','Add to Battlefield');
            buttonnode.setAttribute('value','Add to Battlefield');
            buttonnode.setAttribute('class','btn');

            buttonnode.onclick = (function(arrCardNames,strCardDrawn) {
                return function () {
                    addToBattlefieldFromLand(arrCardNames,strCardDrawn);
                };
            })(arrCardNames,strCardDrawn);
            break;


        case "library":
            //Add library list
            buttonnode = document.createElement('input');
            buttonnode.setAttribute('type','button');
            buttonnode.setAttribute('name','Add to Hand');
            buttonnode.setAttribute('value','Hand');
            buttonnode.setAttribute('class', 'btn');
            buttonnode.setAttribute('id', "btn_"+strCardDrawn);

            buttonnode.onclick = (function (arrCardNames,strCardDrawn) {
                return function () {
                    addToHand(arrCardNames,strCardDrawn);
                };
            })(arrCardNames,strCardDrawn);
            break;

         default:
        }
        return buttonnode;
}

function createCardAtLocation(strCardDrawn,ToLocation,FromLocation) {
    var strCardDrawn = new String(strCardDrawn);
    strCardDrawn = strCardDrawn.trim();

    if (FromLocation != "none") {
        removeCardFromLocation(strCardDrawn,FromLocation);
    }
    var cardlink = createCardLink(strCardDrawn);
    var cardimage = createCardImage(strCardDrawn);

    createCardCell(strCardDrawn,ToLocation,cardimage,cardlink);
}


function createCardAtSection(strCardDrawn,ToLocation,FromLocation) {
    var strCardDrawn = new String(strCardDrawn);
    strCardDrawn = strCardDrawn.trim();

    if (FromLocation != "none") {
        removeCardFromLocation(strCardDrawn,FromLocation);
    }

    //var cardlink = createCardLink(strCardDrawn);
    //var cardimage = createCardImage(strCardDrawn);
    //var buttonnode = createCardButton(strCardDrawn,ToLocation);

    var cardItem = createCardItem(strCardDrawn,ToLocation);


    return cardItem;
}

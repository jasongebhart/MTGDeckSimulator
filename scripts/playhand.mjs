import { loadXMLDoc, xmlDoc } from './config.mjs';
var arrCardNames = [];
var arrTypes = [];
var deckSize;
// Function to start simulating hand draw
export async function startSimulateHandDraw() {
    try {
        const selectedXMLFile = GetSelectedItem();

        // Clear sections
        clearGameSections();

        // Load XML data
        await loadXMLDoc(selectedXMLFile); // Await the async function

        // Retrieve deck information
        const deckInformation = getDeckInformationFromXML();
        const { cardNames, deckSize, types, totalLands } = deckInformation;
        let arrCardNames = cardNames;
        let arrTypes = types;

        // Simulate card draw
        const cardsToDraw = 7;
        const handInformation = simulateCardDraw(cardNames, deckSize, types, cardsToDraw);
        const { hand, handString, lands, landsString, handTypes, updatedDeckSize } = handInformation;

        // Display hand and update deck size
        displayHandAndDeck(hand, handString, lands, landsString, handTypes, updatedDeckSize);
    } catch (error) {
        console.error(error);
        window.alert('An error occurred while loading XML data.');
    }
}
//Build functions to select from multiple card types
export function startLibrarySearch(cardtype) {
    deleteSection("section_library");
    //deleteRows("tblLibrary");
    var arrLibraryInformation = startLibrarySearchFilter(arrCardNames,arrTypes,cardtype);
    //alert(arrLibraryInformation.length);
    for (let i = 0; i < arrLibraryInformation.length; i++) {
        //alert(arrLibraryInformation[i]);
        var ToLocation = "library";
        var FromLocation = "library";
        var strCardDrawn = arrLibraryInformation[i];
        //alert(strCardDrawn);
        createCardAtSection(strCardDrawn,ToLocation,FromLocation);
    }
}
export function startDrawOneCard() {
    deleteSection("section_library");
    const intCardstoDraw = 1;
	var arrHandInformation = cardDraw(arrCardNames,deckSize,arrTypes,intCardstoDraw);
	var arrHand = arrHandInformation[0];
	var strHand = arrHandInformation[1];
	var arrLands = arrHandInformation[2];
	var strLands = arrHandInformation[3];
	var intHandTypes = arrHandInformation[4];
	var deckSize = arrHandInformation[5];
	displayHand(arrHand,strHand,arrLands,strLands,intHandTypes);
	setDeckSize(deckSize)
}

function clearGameSections() {
    const sectionIdsToClear = ["section_spells", "section_lands", "section_battlefield", "section_graveyard"];
    
    sectionIdsToClear.forEach(sectionId => {
        if (document.getElementById(sectionId)) {
            deleteSection(sectionId);
        }
    });
}

function getDeckInformationFromXML() {
    const cardNames = getCardNames();
    const deckSize = cardNames.length;
    const types = [];
    const totalLands = 0;
    for (const cardName of cardNames) {
        const type = getCardType(cardName);
        types.push(type);
        if (type === "Land") {
            totalLands++;
        }
    }
    return {
        cardNames,
        deckSize,
        types,
        totalLands
    };
}

function getCardType(cardName) {
    const type = cardName.split(" - ")[1];
    return type;
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
    var len = document.formDecks.selectDeck.length;
	let i = 0
	let XMLFile = "none"
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

function getCardNames() {
    const deckList = xmlDoc.getElementsByTagName("Decklist")[0];
    const cardNames = [];
    const quantities = [];
    const types = [];
    for (const card of deckList.getElementsByTagName("Card")) {
        const name = card.getElementsByTagName("Name")[0].textContent;
        const quantity = card.getElementsByTagName("Quantity")[0].textContent;
        const type = card.getElementsByTagName("Type")[0].textContent;
        cardNames.push(name);
        quantities.push(quantity);
        types.push(type);
    }
    const totalLands = quantities.reduce((sum, quantity) => sum + (quantity === "Land" ? 1 : 0), 0);
    return {
        cardNames,
        quantities,
        types,
        totalLands
    };
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


function startLibrarySearchFilter(arrCardNames,arrTypes,cardtype) {
    var arrLibrary = new Array();
    var librarySize = arrCardNames.length;
    //alert(librarySize);
    arrLibrary = arrCardNames.slice(0);
    //Find only each index for land type
    var myCards = new Set();
 	for (let i = 0; i < librarySize-1; i++) {
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

export function startLibraryDrawAll() {
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
  var strTypeDrawn = "";
  var randomnumber = Math.floor(Math.random()*deckSize);
  //If the library Size is 60 then the randomnumber will equal a number from 0 to 59
  strCardDrawn = arrlibraryAll[randomnumber];
  strTypeDrawn = arrTypes[randomnumber];
  return strCardDrawn;
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
    let link = document.createElement('A');
    link.href = "http://www.magiccards.info/autocard/" + strCardDrawn;
    //var cardpicture = "/assets/MagicImages/" + strCardDrawn + ".jpg";
    //link.setAttribute('data-value',cardpicture);
    var nameStr = document.createTextNode(strCardDrawn);
    link.appendChild(nameStr);
    //var cardimagepreview = createCardImagePreview(strCardDrawn);
    //link.appendChild(cardimagepreview);
    return link;
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

function createCardAtSection(cardName, toLocation, fromLocation) {
    if (fromLocation !== "none") {
        removeCardFromLocation(cardName, fromLocation);
    }
    return createCardItem(cardName, toLocation);
}

function createCardItem(cardName, toLocation) {
    const cardItem = document.createElement("div");
    cardItem.classList.add("card-item");
    cardItem.textContent = cardName;
    document.getElementById(toLocation).appendChild(cardItem);
    return cardItem;
}

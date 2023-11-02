import { loadXMLDoc, xmlDoc } from './config.mjs';

export async function startListDeck() {
    const XMLFile = GetSelectedItem();
    console.log('Request was made: ' + XMLFile);
    await loadXMLDoc(XMLFile);
    displayDeck(xmlDoc);
}
async function _loadXMLDoc(XMLFile) {
    try {
        // Create a Fetch API request to load the XML file.
        const response = await fetch(XMLFile);
        
        if (!response.ok) {
            throw new Error('Failed to load the requested file.');
        }
        
        // Parse the XML response into a document.
        const xmlText = await response.text();
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        return xmlDoc;
    } catch (error) {
        console.error(error);
        window.alert('Unable to load the requested file.');
    }
}

// Function to delete a card entry from the web page
export function deleteCardInDeck(button) {
	// Find the parent card element and remove it
	const card = button.closest(".card-info");
	if (card) {
	  card.remove();
	}
}
  
window.deleteCardInDeck = deleteCardInDeck; // Make it a global function	  
  
export function __deleteCard(index) {
	const cardElements = xmlDoc.querySelectorAll("card-info");
	if (index >= 0 && index < cardElements.length) {
	  // Remove the card element from the XML
	 // const removedCard = cardElements[index];
	 // removedCard.parentNode.removeChild(removedCard);
  
	  // Remove the card input fields from the web page
	  const cardInput = document.querySelector(`.card-info:nth-child(${index + 1})`);
	  cardInput.parentNode.removeChild(cardInput);
	}
  }
export function convertToXml(deckData) {
	const root = document.implementation.createDocument(null, 'Decklist', null);
	const deckElement = root.documentElement;
	deckElement.setAttribute('Deck', deckData.deckName);
  
	// Loop through card data and create XML elements
	deckData.cards.forEach((card) => {
	  const cardElement = root.createElement('Card');
	  const nameElement = root.createElement('Name');
	  nameElement.textContent = card.name;
	  const quantityElement = root.createElement('Quantity');
	  quantityElement.textContent = card.quantity;
	  const typeElement = root.createElement('Type');
	  typeElement.textContent = card.type;
	  const costElement = root.createElement('Cost');
	  costElement.textContent = card.cost;
  
	  cardElement.appendChild(nameElement);
	  cardElement.appendChild(quantityElement);
	  cardElement.appendChild(typeElement);
	  cardElement.appendChild(costElement);
  
	  deckElement.appendChild(cardElement);
	});
  
	const serializer = new XMLSerializer();
	const xmlString = serializer.serializeToString(root);
  
	return xmlString;
}

// Function to load data from an XML file
// Modify the loadFromXml function to populate form fields
export async function loadFromXml(xmlFile) {
    try {
        const response = await fetch(xmlFile);
        if (!response.ok) {
            throw new Error('Failed to load the XML file.');
        }
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Extract data from the XML document and populate form fields
        const deckName = xmlDoc.querySelector('deckName').textContent;
        const cardElements = xmlDoc.querySelectorAll('card');

        // Set the deck name input field
        document.querySelector("input[name='deckName']").value = deckName;

        // Populate card input fields
        cardElements.forEach((card, index) => {
            const cardName = card.querySelector('name').textContent;
            const cardQuantity = card.querySelector('quantity').textContent;
            const cardType = card.querySelector('type').textContent;
            const cardCost = card.querySelector('cost').textContent;

            // Set the input fields for the card
            document.querySelector(`input[name='cardName${index + 1}']`).value = cardName;
            document.querySelector(`input[name='cardQuantity${index + 1}']`).value = cardQuantity;
            document.querySelector(`input[name='cardType${index + 1}']`).value = cardType;
            document.querySelector(`input[name='cardCost${index + 1}']`).value = cardCost;
        });
    } catch (error) {
        console.error(error);
        window.alert('Unable to load the XML file. Please check the file and try again.');
    }
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

// This returns a string with everything but the digits removed.
function getConvertedCost(currentCost) {
    var arrConvertedCost = [];
	// var arrConvertedCost = new Array(2);
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

function countColorOccurrences(currentCost) {
    const colorCounts = {
        "U": { count: 0, cards: 0 },
        "R": { count: 0, cards: 0 },
        "B": { count: 0, cards: 0 },
        "W": { count: 0, cards: 0 },
        "G": { count: 0, cards: 0 },
        "X": { count: 0, cards: 0 }
    };

    for (var i = 0; i < currentCost.length; i++) {
        var strColorCharacter = currentCost.charAt(i);
        if (colorCounts.hasOwnProperty(strColorCharacter)) {
            colorCounts[strColorCharacter].count += 1;
            colorCounts[strColorCharacter].cards = 1;
        }
    }

    const arrColorDist = Object.values(colorCounts).flatMap(color => [color.count, color.cards]);
    return arrColorDist;
}

// delete table rows with index greater then 0
function deleteRows(tableId) {
	var table = document.getElementById(tableId);

	// Delete all rows except the header row (first row)
	for (var i = table.rows.length - 1; i > 0; i--) {
		table.deleteRow(i);
	}
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

				var arrColorDistribution = countColorOccurrences(currentCost);
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
    // Get the reference for the body
    var body = document.getElementsByTagName("body")[0];
    
    // Get the existing table or create a new one
    var tbl = document.getElementById(tblChosen) || document.createElement("table");
    tbl.setAttribute("display", "inline-block");

    // Create a table row
    var row = document.createElement("tr");

    // Create and add cells for headings
    createHeadingCell(row, "Card");
    createHeadingCell(row, "Quantity");
    createHeadingCell(row, "Cost");
    createHeadingCell(row, "Converted Cost");

    // Add the row to the end of the table body
    tbl.appendChild(row);

    // Append the table to the body if it's newly created
    if (!tbl.parentElement) {
        body.appendChild(tbl);
    }
}

// Helper function to create a heading cell and append it to a row
function createHeadingCell(row, text) {
    var cell = document.createElement("td");
    cell.appendChild(document.createTextNode(text));
    row.appendChild(cell);
}


function createCardTable(tblChosen, currentCard, currentQuantity, currentCost, strConvertedCost) {
    // Get the reference for the body
    var body = document.getElementsByTagName("body")[0];
    
    // Get the existing table or create a new one
    var tbl = document.getElementById(tblChosen) || document.createElement("table");
    tbl.setAttribute("display", "inline-block");

    // Create a table row
    var row = document.createElement("tr");
    
    // Create and add cell for card name with link
    var cell = document.createElement("td");
    var link = document.createElement('a');
    link.href = "http://www.magiccards.info/autocard/" + currentCard;
    link.appendChild(document.createTextNode(currentCard));
    cell.appendChild(link);
    row.appendChild(cell);

    // Create and add cell for quantity
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode(currentQuantity));
    row.appendChild(cell);

    // Check if currentCost is not "NA" before creating cost-related cells
    if (currentCost !== "NA") {
        // Create and add cell for currentCost
        cell = document.createElement("td");
        cell.appendChild(document.createTextNode(currentCost));
        row.appendChild(cell);

        // Create and add cell for strConvertedCost
        cell = document.createElement("td");
        cell.appendChild(document.createTextNode(strConvertedCost));
        row.appendChild(cell);
    }

    // Add the row to the end of the table body
    tbl.appendChild(row);
    
    // Append the table to the body if it's newly created
    if (!tbl.parentElement) {
        body.appendChild(tbl);
    }
}

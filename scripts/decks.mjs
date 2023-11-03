import { loadXMLDoc, xmlDoc } from './config.mjs';

export async function startListDeck() {
    const XMLFile = GetSelectedItem();
    console.log('Request was made: ' + XMLFile);
    await loadXMLDoc(XMLFile);
    displayDeck(xmlDoc);
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

export function convertToXml(deckData) {
	const root = document.implementation.createDocument(null, 'Decklist', null);
	const deckElement = root.documentElement;
	deckElement.setAttribute('Deck', deckData.deckName);
  
	// Add XML declaration
	const xmlDeclaration = root.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"');
	root.insertBefore(xmlDeclaration, root.firstChild);
  
	// Add custom elements
	const designGoalElement = root.createElement('DesignGoal');
	designGoalElement.textContent = deckData.designGoal; // Set the value for the DesignGoal
  
	deckElement.appendChild(designGoalElement);
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
	  const rulesTextElement = root.createElement('RulesText');
	  rulesTextElement.textContent = card.rulesText;
  
	  cardElement.appendChild(nameElement);
	  cardElement.appendChild(quantityElement);
	  cardElement.appendChild(typeElement);
	  cardElement.appendChild(costElement);
	  cardElement.appendChild(rulesTextElement);
  
	  deckElement.appendChild(cardElement);
	});
  
	const serializer = new XMLSerializer();
	const xmlString = serializer.serializeToString(root);

	// Create a new XML document to parse and format the content
	const formattedXmlDocument = new DOMParser().parseFromString(xmlString, 'application/xml');
	const formattedXmlString = new XMLSerializer().serializeToString(formattedXmlDocument);

	return formattedXmlString;
 }
 function __formatXml(xmlString) {
	const formattedXmlDocument = new DOMParser().parseFromString(xmlString, 'application/xml');
	const formattedXmlString = new XMLSerializer().serializeToString(formattedXmlDocument);
	return `<?xml version="1.0" encoding="UTF-8"?>\n${formattedXmlString}`;
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

    // Split the currentCost string by non-alphabetic characters
    const colorCharacters = currentCost.split(/[^A-Za-z]+/);

    colorCharacters.forEach(strColorCharacter => {
        if (colorCounts.hasOwnProperty(strColorCharacter)) {
            colorCounts[strColorCharacter].count += 1;
            colorCounts[strColorCharacter].cards = 1;
        }
    });

    const arrColorDist = Object.values(colorCounts).flatMap(color => [color.count, color.cards]);
    return arrColorDist;
}

function __countColorOccurrences(currentCost) {
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
	
function __displayDeck(xmlDoc) {
    const deckList = xmlDoc.getElementsByTagName("Decklist")[0];
    const deckListName = deckList.getAttribute("Deck");
    const designGoal = xmlDoc.getElementsByTagName("DesignGoal")[0].textContent;
    const cards = deckList.getElementsByTagName("Card");

    const cardCounts = {
        Land: 0,
        Creature: 0,
        Instant: 0,
        Sorcery: 0,
        Enchantment: 0,
        Artifact: 0,
        Planeswalker: 0,
    };

    const costCounts = {
        zeroCost: 0,
        oneCost: 0,
        twoCost: 0,
        threeCost: 0,
        fourCost: 0,
        fiveCost: 0,
        sixCost: 0,
        sevenmoreCost: 0,
        blueCost: 0,
        blueCards: 0,
        redCost: 0,
        redCards: 0,
        blackCost: 0,
        blackCards: 0,
        whiteCost: 0,
        whiteCards: 0,
        greenCost: 0,
        greenCards: 0,
        colorlessCost: 0,
    };

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const currentType = card.getElementsByTagName("Type")[0].textContent;
        const currentQuantity = parseInt(card.getElementsByTagName("Quantity")[0].textContent, 10);
        const currentCost = card.getElementsByTagName("Cost")[0].textContent;

        cardCounts[currentType] += currentQuantity;

        if (currentCost !== "NA") {
            const [intBlueCount, intBlueCards, intRedCount, intRedCards, intBlackCount, intBlackCards, intWhiteCount, intWhiteCards, intGreenCount, intGreenCards, intClearCount, intClearCards] = countColorOccurrences(currentCost);

            costCounts.zeroCost += currentCost === "0" ? currentQuantity : 0;
            costCounts.oneCost += currentCost === "1" ? currentQuantity : 0;
            costCounts.twoCost += currentCost === "2" ? currentQuantity : 0;
            costCounts.threeCost += currentCost === "3" ? currentQuantity : 0;
            costCounts.fourCost += currentCost === "4" ? currentQuantity : 0;
            costCounts.fiveCost += currentCost === "5" ? currentQuantity : 0;
            costCounts.sixCost += currentCost === "6" ? currentQuantity : 0;
            costCounts.sevenmoreCost += currentCost >= "7" ? currentQuantity : 0;
            costCounts.blueCost += intBlueCount * currentQuantity;
            costCounts.blueCards += intBlueCards * currentQuantity;
            costCounts.redCost += intRedCount * currentQuantity;
            costCounts.redCards += intRedCards * currentQuantity;
            costCounts.blackCost += intBlackCount * currentQuantity;
            costCounts.blackCards += intBlackCards * currentQuantity;
            costCounts.whiteCost += intWhiteCount * currentQuantity;
            costCounts.whiteCards += intWhiteCards * currentQuantity;
            costCounts.greenCost += intGreenCount * currentQuantity;
            costCounts.greenCards += intGreenCards * currentQuantity;

            const [convertedCost, intColorless] = getConvertedCost(currentCost);
            costCounts.colorlessCost += intClearCount * currentQuantity + intColorless * currentQuantity;
        }
    }

    updateDOMElements({
        designGoal,
        deckListName,
        cardCounts,
        costCounts,
    });
}


function updateDOMElements(data) {
	if (data && data.totalCounts) {
		document.getElementById("DesignGoal").innerHTML = data.designGoal;
		document.getElementById("DeckListName").innerHTML = data.deckListName;
		document.getElementById("deckSize").innerHTML = data.totalCounts.Land + data.totalCounts.Creature + data.totalCounts.Instant +
			data.totalCounts.Sorcery + data.totalCounts.Enchantment + data.totalCounts.Artifact + data.totalCounts.Planeswalker;
		document.getElementById("TotConvertedCost").innerHTML = data.costCounts.colorlessCost;
		document.getElementById("TotLands").innerHTML = data.cardCounts.Land;
		document.getElementById("TotCreatures").innerHTML = data.cardCounts.Creature;
		document.getElementById("TotInstants").innerHTML = data.cardCounts.Instant;
		document.getElementById("TotSorceries").innerHTML = data.cardCounts.Sorcery;
		document.getElementById("TotEnchantments").innerHTML = data.cardCounts.Enchantment;
		document.getElementById("TotArtifacts").innerHTML = data.cardCounts.Artifact;
		document.getElementById("TotPlaneswalkers").innerHTML = data.cardCounts.Planeswalker;
		document.getElementById("ZeroCost").innerHTML = data.costCounts.zeroCost;
		document.getElementById("OneCost").innerHTML = data.costCounts.oneCost;
		document.getElementById("TwoCost").innerHTML = data.costCounts.twoCost;
		document.getElementById("ThreeCost").innerHTML = data.costCounts.threeCost;
		document.getElementById("FourCost").innerHTML = data.costCounts.fourCost;
		document.getElementById("FiveCost").innerHTML = data.costCounts.fiveCost;
		document.getElementById("SixCost").innerHTML = data.costCounts.sixCost;
		document.getElementById("SevenmoreCost").innerHTML = data.costCounts.sevenmoreCost;
		document.getElementById("BlueCost").innerHTML = data.costCounts.blueCost;
		document.getElementById("BlueCards").innerHTML = data.costCounts.blueCards;
		document.getElementById("RedCost").innerHTML = data.costCounts.redCost;
		document.getElementById("RedCards").innerHTML = data.costCounts.redCards;
		document.getElementById("BlackCost").innerHTML = data.costCounts.blackCost;
		document.getElementById("BlackCards").innerHTML = data.costCounts.blackCards;
		document.getElementById("WhiteCost").innerHTML = data.costCounts.whiteCost;
		document.getElementById("WhiteCards").innerHTML = data.costCounts.whiteCards;
		document.getElementById("GreenCost").innerHTML = data.costCounts.greenCost;
		document.getElementById("GreenCards").innerHTML = data.costCounts.greenCards;
		document.getElementById("ColorlessCost").innerHTML = data.costCounts.colorlessCost;
	} else {
        console.error("data.totalCounts is undefined.");
    }
}

const deckStatistics = {
    intBlueCount: 0,
    intBlueCards: 0,
    totBlueCards: 0,
    intRedCount: 0,
    intRedCards: 0,
    totRedCards: 0,
    intBlackCount: 0,
    intBlackCards: 0,
    totBlackCards: 0,
    intWhiteCount: 0,
    intWhiteCards: 0,
    totWhiteCards: 0,
    intGreenCount: 0,
    intGreenCards: 0,
    totGreenCards: 0,
    intClearCount: 0,
    intClearCards: 0,
    totClearCards: 0,
    totConvertedCost: 0,
    intLandCount: 0,
    intCreatureCount: 0,
    intInstantCount: 0,
    intSorceryCount: 0,
    intEnchantmentCount: 0,
    intArtifactCount: 0,
    intPlaneswalkerCount: 0,
    deckSize: 0,
    intzeroCost: 0,
    intoneCost: 0,
    inttwoCost: 0,
    intthreeCost: 0,
    intfourCost: 0,
    intfiveCost: 0,
    intsixCost: 0,
    intsevenmoreCost: 0,
    totBlueCount: 0,
    totRedCount: 0,
    totBlackCount: 0,
    totWhiteCount: 0,
    totGreenCount: 0,
    totColorlessCount: 0,
    currentCard: null,
    currentQuantity: null,
    currentType: null,
    currentCost: null,
};

function readCardData(index, deckList) {
    deckStatistics.currentCard = deckList.getElementsByTagName("Name")[index].firstChild.data;
    deckStatistics.currentQuantity = parseInt(deckList.getElementsByTagName("Quantity")[index].firstChild.data);
    deckStatistics.currentType = deckList.getElementsByTagName("Type")[index].firstChild.data;
    deckStatistics.currentCost = deckList.getElementsByTagName("Cost")[index].firstChild.data;
}

function updateCardStatistics(cardType) {
    switch (cardType) {
        case "Land":
            deckStatistics.intLandCount += deckStatistics.currentQuantity;
            break;
        case "Creature":
            deckStatistics.intCreatureCount += deckStatistics.currentQuantity;
            break;
        case "Instant":
            deckStatistics.intInstantCount += deckStatistics.currentQuantity;
            break;
        case "Sorcery":
            deckStatistics.intSorceryCount += deckStatistics.currentQuantity;
            break;
        case "Enchantment":
            deckStatistics.intEnchantmentCount += deckStatistics.currentQuantity;
            break;
        case "Artifact":
            deckStatistics.intArtifactCount += deckStatistics.currentQuantity;
            break;
        case "Planeswalker":
            deckStatistics.intPlaneswalkerCount += deckStatistics.currentQuantity;
            break;
    }
}

function updateColorStatistics(currentCost, currentQuantity) {
    var strConvertedCost = ''; // Declare strConvertedCost here

    if (currentCost !== "NA") {
        var arrColorDistribution = countColorOccurrences(currentCost);

        deckStatistics.intBlueCount = arrColorDistribution[0];
        deckStatistics.intBlueCards = arrColorDistribution[1];
        deckStatistics.intRedCount = arrColorDistribution[2];
        deckStatistics.intRedCards = arrColorDistribution[3];
        deckStatistics.intBlackCount = arrColorDistribution[4];
        deckStatistics.intBlackCards = arrColorDistribution[5];
        deckStatistics.intWhiteCount = arrColorDistribution[6];
        deckStatistics.intWhiteCards = arrColorDistribution[7];
        deckStatistics.intGreenCount = arrColorDistribution[8];
        deckStatistics.intGreenCards = arrColorDistribution[9];
        deckStatistics.intClearCount = arrColorDistribution[10];
        deckStatistics.intClearCards = arrColorDistribution[11];

        deckStatistics.totBlueCount += deckStatistics.intBlueCount * currentQuantity;
        deckStatistics.totBlueCards += deckStatistics.intBlueCards * currentQuantity;
        deckStatistics.totRedCount += deckStatistics.intRedCount * currentQuantity;
        deckStatistics.totRedCards += deckStatistics.intRedCards * currentQuantity;
        deckStatistics.totBlackCount += deckStatistics.intBlackCount * currentQuantity;
        deckStatistics.totBlackCards += deckStatistics.intBlackCards * currentQuantity;
        deckStatistics.totWhiteCount += deckStatistics.intWhiteCount * currentQuantity;
        deckStatistics.totWhiteCards += deckStatistics.intWhiteCards * currentQuantity;
        deckStatistics.totGreenCount += deckStatistics.intGreenCount * currentQuantity;
        deckStatistics.totGreenCards += deckStatistics.intGreenCards * currentQuantity;

        var arrConvertedCost = getConvertedCost(currentCost);
        var convertedCost = arrConvertedCost[0];
        var intColorless = arrConvertedCost[1];

        deckStatistics.totColorlessCount += (deckStatistics.intClearCount * currentQuantity) + (intColorless * currentQuantity);

        switch (convertedCost) {
            case 0:
                deckStatistics.intzeroCost += currentQuantity;
                break;
            case 1:
                deckStatistics.intoneCost += currentQuantity;
                break;
            case 2:
                deckStatistics.inttwoCost += currentQuantity;
                break;
            case 3:
                deckStatistics.intthreeCost += currentQuantity;
                break;
            case 4:
                deckStatistics.intfourCost += currentQuantity;
                break;
            case 5:
                deckStatistics.intfiveCost += currentQuantity;
                break;
            case 6:
                deckStatistics.intsixCost += currentQuantity;
                break;
            default:
                deckStatistics.intsevenmoreCost += currentQuantity;
        }

        strConvertedCost = convertedCost; // Update strConvertedCost here
    }
    else {
        strConvertedCost = "NA"; // Assign "NA" directly
    }

    // Return or use strConvertedCost as needed
    return strConvertedCost;
}

function getTableByCardType(cardType) {
    switch (cardType) {
        case "Land":
            return "tblLandList";
        case "Creature":
            return "tblCreatureList";
        case "Instant":
        case "Sorcery":
        case "Enchantment":
        case "Artifact":
        case "Planeswalker":
            return "tblSpellsList";
        default:
            return ""; // Handle other cases if necessary
    }
}

function displayDeck(xmlDoc) {
	var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
	var deckListName = xmlDoc.getElementsByTagName("Decklist")[0].getAttribute("Deck");
	var designGoal = xmlDoc.getElementsByTagName("DesignGoal")[0].firstChild.data;
	var uniqueCards = deckList.getElementsByTagName("Name").length;

	initializeDeckTables();
	initializeCardTable("tblCreatureList");

	for (var i=0; i <(uniqueCards); i++) {
		readCardData(i, deckList);
        const cardType = deckStatistics.currentType;
        updateCardStatistics(cardType);
		deckStatistics.deckSize = deckStatistics.deckSize + parseInt(deckStatistics.currentQuantity);
        const currentCost = deckStatistics.currentCost;
        const currentQuantity = deckStatistics.currentQuantity;
		let strConvertedCost = ''; // Declare strConvertedCost here
		if (deckStatistics.currentCost !== "NA") {
           strConvertedCost = updateColorStatistics(deckStatistics.currentCost, deckStatistics.currentQuantity);
        } else {
			strConvertedCost = "NA";
        }
		const tblChosen = getTableByCardType(deckStatistics.currentType);
		createCardTable(tblChosen, deckStatistics.currentCard, deckStatistics.currentQuantity, deckStatistics.currentCost, strConvertedCost);
	}
	updateDisplayElements(deckListName, designGoal);
}


function updateDisplayElements(deckListName, designGoal) {
    document.getElementById("DesignGoal").innerHTML = designGoal;
    document.getElementById("DeckListName").innerHTML = deckListName;
    document.getElementById("deckSize").innerHTML = deckStatistics.deckSize;
    document.getElementById("TotConvertedCost").innerHTML = deckStatistics.totConvertedCost;
    document.getElementById("TotLands").innerHTML = deckStatistics.intLandCount;
    document.getElementById("TotCreatures").innerHTML = deckStatistics.intCreatureCount;
    document.getElementById("TotInstants").innerHTML = deckStatistics.intInstantCount;
    document.getElementById("TotSorceries").innerHTML = deckStatistics.intSorceryCount;
    document.getElementById("TotEnchantments").innerHTML = deckStatistics.intEnchantmentCount;
    document.getElementById("TotArtifacts").innerHTML = deckStatistics.intArtifactCount;
    document.getElementById("TotPlaneswalkers").innerHTML = deckStatistics.intPlaneswalkerCount;
    document.getElementById("ZeroCost").innerHTML = deckStatistics.intzeroCost;
    document.getElementById("OneCost").innerHTML = deckStatistics.intoneCost;
    document.getElementById("TwoCost").innerHTML = deckStatistics.inttwoCost;
    document.getElementById("ThreeCost").innerHTML = deckStatistics.intthreeCost;
    document.getElementById("FourCost").innerHTML = deckStatistics.intfourCost;
    document.getElementById("FiveCost").innerHTML = deckStatistics.intfiveCost;
    document.getElementById("SixCost").innerHTML = deckStatistics.intsixCost;
    document.getElementById("SevenmoreCost").innerHTML = deckStatistics.intsevenmoreCost;
    document.getElementById("BlueCost").innerHTML = deckStatistics.totBlueCount;
    document.getElementById("BlueCards").innerHTML = deckStatistics.totBlueCards;
    document.getElementById("RedCost").innerHTML = deckStatistics.totRedCount;
    document.getElementById("RedCards").innerHTML = deckStatistics.totRedCards;
    document.getElementById("BlackCost").innerHTML = deckStatistics.totBlackCount;
    document.getElementById("BlackCards").innerHTML = deckStatistics.totBlackCards;
    document.getElementById("WhiteCost").innerHTML = deckStatistics.totWhiteCount;
    document.getElementById("WhiteCards").innerHTML = deckStatistics.totWhiteCards;
    document.getElementById("GreenCost").innerHTML = deckStatistics.totGreenCount;
    document.getElementById("GreenCards").innerHTML = deckStatistics.totGreenCards;
    document.getElementById("ColorlessCost").innerHTML = deckStatistics.totColorlessCount;
}

function initializeDeckTables() {
    deleteRows("tblCreatureList");
    deleteRows("tblSpellsList");
    deleteRows("tblLandList");
    initializeCardTable("tblCreatureList");
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

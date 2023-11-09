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
	const card = button.closest(".card-main");
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

function getConvertedCost(currentCost) {
    // Initialize variables to track numeric and colorless costs
    var totalNumericCost = 0;
    var colorCost = 0;

    // Check if the casting cost contains curly braces
    if (currentCost.includes('{')) {
        // Split the currentCost into segments using curly braces {}
        var costSegments = currentCost.split(/{|}/);

        // Loop through the segments to calculate the converted cost
        for (var i = 0; i < costSegments.length; i++) {
            var segment = costSegments[i].trim();

            // Check if the segment is numeric
            if (/^\d+$/.test(segment)) {
                totalNumericCost += parseInt(segment);
            }

            // Check if the segment represents a color code (e.g., B for black)
            else if (segment.length === 1) {
                colorCost++;
            }
        }
    } else {
        // If there are no curly braces, assume a shorthand format like "4RR"
        // Extract numeric and color components manually
        var numericMatch = currentCost.match(/\d+/);
        if (numericMatch) {
            totalNumericCost = parseInt(numericMatch[0]);
        }

        var colorMatches = currentCost.match(/[WUBRGC]/g);
        if (colorMatches) {
            colorCost = colorMatches.length;
        }
    }

    // Create an array to store both values
    var arrConvertedCost = [totalNumericCost, colorCost];

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

    // Use a regular expression to match color symbols within curly braces
    const colorCharacters = currentCost.match(/{[URBWG]+}|[URBWG]+/g) || [];

    if (colorCharacters.length === 0) {
        // Handle colorless cards with no color symbols
        colorCounts["X"].count = 1;
        colorCounts["X"].cards = 1;
    } else {
        colorCharacters.forEach(strColorCharacter => {
            if (strColorCharacter.startsWith("{")) {
                // Remove curly braces
                const colorSymbols = strColorCharacter.replace(/[{}]/g, '');

                // Handle colorless as 'X'
                if (colorSymbols === '') {
                    colorSymbols = 'X';
                }

                // Update counts for each symbol
                colorSymbols.split('').forEach(symbol => {
                    if (colorCounts.hasOwnProperty(symbol)) {
                        colorCounts[symbol].count += 1;
                    }
                });

                // Mark it as one card
                if (colorSymbols.length > 0) {
                    colorCounts[colorSymbols[0]].cards = 1;
                }
            } else {
                // Handle colorless as 'X'
                if (strColorCharacter === '') {
                    strColorCharacter = 'X';
                }

                // Update counts for each character
                strColorCharacter.split('').forEach(symbol => {
                    if (colorCounts.hasOwnProperty(symbol)) {
                        colorCounts[symbol].count += 1;
                    }
                });

                // Mark it as one card
                if (strColorCharacter.length > 0) {
                    colorCounts[strColorCharacter[0]].cards = 1;
                }
            }
        });
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
	totClearCount: 0,
    currentCard: null,
    currentQuantity: null,
    currentType: null,
    currentCost: null,
};

function resetDeckStatistics() {
    for (const prop in deckStatistics) {
        if (deckStatistics.hasOwnProperty(prop)) {
            deckStatistics[prop] = 0; // Reset numeric properties to 0
        }
    }

    // Reset non-numeric properties to their appropriate initial values (e.g., null)
    deckStatistics.currentCard = null;
    deckStatistics.currentQuantity = null;
    deckStatistics.currentType = null;
    deckStatistics.currentCost = null;
}

function readCardData(index, deckList) {
    deckStatistics.currentCard = deckList.getElementsByTagName("Name")[index].firstChild.data;
    deckStatistics.currentQuantity = parseInt(deckList.getElementsByTagName("Quantity")[index].firstChild.data);
    deckStatistics.currentType = deckList.getElementsByTagName("Type")[index].firstChild.data;
    deckStatistics.currentCost = deckList.getElementsByTagName("Cost")[index].firstChild.data;
}

function updateCardStatistics(cardType) {
    // Check if the current card type is a basic land
    if (cardType.startsWith("Basic Land") || cardType.startsWith("Land")) {
        // Handle basic lands differently, incrementing land count
        deckStatistics.intLandCount += deckStatistics.currentQuantity;
    } else if (cardType.startsWith("Creature") || cardType.startsWith("Legendary Creature")) {
        // Handle creatures (including Legendary Creatures) as the same category
        deckStatistics.intCreatureCount += deckStatistics.currentQuantity;
    } else {
        // For other types of cards (e.g., Instant, Sorcery, etc.)
        // Follow your existing logic
        switch (cardType) {
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
            // Add more cases for other card types as needed
        }
    }
}

function updateColorStatistics(currentCost, currentQuantity) {
	if (currentQuantity <= 0 || currentCost.toLowerCase() === "na" || currentCost.toLowerCase() === "unknown") {
        return ''; // Return an empty string if no data is available
    }

    const arrColorDistribution = countColorOccurrences(currentCost);
    updateDeckStatistics(arrColorDistribution, currentQuantity);
    const arrConvertedCost = getConvertedCost(currentCost);
    updateCostCategories(arrConvertedCost, currentQuantity);

    const convertedCost = calculateConvertedCost(arrConvertedCost);

    // Add the calculated converted cost to totConvertedCost
    deckStatistics.totConvertedCost += (convertedCost * currentQuantity);

    // Return the calculated converted cost as a string (or number if desired)
    return convertedCost;
}

function updateDeckStatistics(arrColorDistribution, currentQuantity) {
    const colorProperties = [
        'intBlueCount', 'intBlueCards',
        'intRedCount', 'intRedCards',
        'intBlackCount', 'intBlackCards',
        'intWhiteCount', 'intWhiteCards',
        'intGreenCount', 'intGreenCards',
        'intClearCount', 'intClearCards',
    ];

    for (let i = 0; i < colorProperties.length; i++) {
        deckStatistics[colorProperties[i]] = arrColorDistribution[i];
    }

    updateTotals(arrColorDistribution, currentQuantity);
}

function updateTotals(arrColorDistribution, currentQuantity) {
    const colorCategories = [
        'Blue', 'Red', 'Black', 'White', 'Green', 'Clear'
    ];

    for (let i = 0; i < colorCategories.length; i++) {
        const count = deckStatistics[`int${colorCategories[i]}Count`];
        const cards = deckStatistics[`int${colorCategories[i]}Cards`];
        deckStatistics[`tot${colorCategories[i]}Count`] += count * currentQuantity;
        deckStatistics[`tot${colorCategories[i]}Cards`] += cards * currentQuantity;
    }
}

function updateCostCategories(arrConvertedCost, currentQuantity) {
    const [intColorless, convertedCost] = arrConvertedCost;

    switch (intColorless + convertedCost) {
        case 0: deckStatistics.intzeroCost += currentQuantity; break;
        case 1: deckStatistics.intoneCost += currentQuantity; break;
        case 2: deckStatistics.inttwoCost += currentQuantity; break;
        case 3: deckStatistics.intthreeCost += currentQuantity; break;
        case 4: deckStatistics.intfourCost += currentQuantity; break;
        case 5: deckStatistics.intfiveCost += currentQuantity; break;
        case 6: deckStatistics.intsixCost += currentQuantity; break;
        default: deckStatistics.intsevenmoreCost += currentQuantity;
    }
}

function calculateConvertedCost(arrConvertedCost) {
    return arrConvertedCost[0] + arrConvertedCost[1];
}

function getTableByCardType(cardType) {
    // Check if the card type contains "Land" or starts with "Basic Land"
    if (cardType.includes("Land") || cardType.startsWith("Basic Land")) {
        return "tblLandList";
    }

    // Check if the card type contains "Artifact"
    if (cardType.includes("Artifact")) {
        return "tblArtifactsList";
    }

    // Treat "Creature" and "Legendary Creature" as the same category
    if (cardType.startsWith("Creature") || cardType.startsWith("Legendary Creature")) {
        return "tblCreatureList";
    }

    // Handle Planeswalkers separately
    if (cardType === "Planeswalker") {
        return "tblPlaneswalkersList";
    }

    // Handle Enchantments separately
    if (cardType === "Enchantment") {
        return "tblEnchantmentsList";
    }

    // Handle other spell types (Instant, Sorcery)
    if (cardType === "Instant" || cardType === "Sorcery") {
        return "tblSpellsList";
    }

    // Handle any other cases
    return "";
}




function displayDeck(xmlDoc) {
	var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
	var deckListName = xmlDoc.getElementsByTagName("Decklist")[0].getAttribute("Deck");
	var designGoal = xmlDoc.getElementsByTagName("DesignGoal")[0].firstChild.data;
	var uniqueCards = deckList.getElementsByTagName("Name").length;

	resetDeckStatistics();
	initializeDeckTables();

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
    document.getElementById("ColorlessCost").innerHTML = deckStatistics.totClearCount;
	document.getElementById("ColorlessCards").innerHTML = deckStatistics.totClearCards;
}

function initializeDeckTables() {
    deleteRows("tblCreatureList");
    deleteRows("tblSpellsList");
	deleteRows("tblPlaneswalkersList");
    deleteRows("tblEnchantmentsList");
    deleteRows("tblArtifactsList");
	deleteRows("tblLandList");
    initializeCardTable("tblCreatureList");
	initializeCardTable("tblSpellsList");
	initializeCardTable("tblPlaneswalkersList");
	initializeCardTable("tblEnchantmentsList");
	initializeCardTable("tblArtifactsList");
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

// comment
// 
var xmlDoc;

var xmlFile;

function start() {
var mtgDeck=new Array();
// regular array

		mtgDeck[0] = "./xml/BigRedMachine.xml"; 
		mtgDeck[1] = "./xml/Stasis.xml";
		mtgDeck[2] = "./xml/ZombieRenewal.xml";
		mtgDeck[3] = "./xml/Rith.xml";
		mtgDeck[4] = "./xml/BlackRack.xml";
		mtgDeck[5] = "./xml/Brood.xml";
		mtgDeck[6] = "./xml/CharredDiscard.xml";
		mtgDeck[7] = "./xml/Classic.xml";
		mtgDeck[8] = "./xml/FireandIce.xml";
		mtgDeck[9] = "./xml/GreenWaste.xml";
		mtgDeck[10] = "./xml/GreenWasteOrder.xml";
		mtgDeck[11] = "./xml/GreenWasteSakura.xml";		
		mtgDeck[12] = "./xml/JunkDiver.xml";
		mtgDeck[13] = "./xml/KindofBlue.xml";
		mtgDeck[14] = "./xml/Lumberjack.xml";
		mtgDeck[15] = "./xml/Napoleon.xml";
		mtgDeck[16] = "./xml/Nishoba.xml";
		mtgDeck[17] = "./xml/Outpost.xml";
		mtgDeck[18] = "./xml/PatriotBlock.xml";
		mtgDeck[19] = "./xml/Pernicious.xml";
		mtgDeck[20] = "./xml/Plum.xml";
		mtgDeck[21] = "./xml/PlumGoneBlock.xml";
		mtgDeck[22] = "./xml/RayneForest.xml";
		mtgDeck[23] = "./xml/RedPatrol.xml";
	    mtgDeck[24] = "./xml/affinity.xml";
		mtgDeck[25] = "./xml/hightide.xml";
		mtgDeck[26] = "./xml/oath.xml";
		mtgDeck[27] = "./xml/trix.xml";
		mtgDeck[28] = "./xml/belcher.xml";	
		mtgDeck[29] = "./xml/counterbalance.xml";
		mtgDeck[30] = "./xml/dredge.xml";
		mtgDeck[31] = "./xml/goblins.xml";
		mtgDeck[32] = "./xml/landstill.xml";
		mtgDeck[31] = "./xml/BloodBraidElf.xml";
		mtgDeck[32] = "./xml/BloodBraidEnchantress.xml";
        mtgDeck[33] = "./xml/Patriot.xml";
        mtgDeck[34] = "./xml/WelderGamble.xml"; 
        mtgDeck[35] = "./xml/Welder.xml"; 
        mtgDeck[36] = "./xml/CloudpostWelder.xml"; 
		mtgDeck.push("./xml/IxalanRedBlue.xml");
		mtgDeck.push("./xml/Ixalan_Green_White.xml");
		mtgDeck.push( "./xml/BlackDread.xml");
		mtgDeck.push( "./xml/TronTate.xml");
		
var len=mtgDeck.length;
	for(var i=0; i<len; i++) {
        xmlFile = mtgDeck[i];
        loadXMLDoc(xmlFile);
        //displayDeck();
    }
}

function loadXMLDoc(xmlFile) {
if (window.ActiveXObject) {xmlDoc= new ActiveXObject("Microsoft.XMLDOM");
xmlDoc.async="false";
xmlDoc.load(xmlFile);
rootdisplayDeck();


}else if (document.implementation && document.implementation.createDocument) {


//alert('This is Firefox');


xmlDoc = document.implementation.createDocument("", "", null);

	
//xmlDoc.load(xmlFile);
xmlDoc.async=false;
xmlDoc.onload = function (){};
xmlDoc.load(xmlFile);

	
rootdisplayDeck();
}
}

function rootdisplayDeck() {
displayDeck();


}

function displayDeck() {
var deckList = xmlDoc.getElementsByTagName("Decklist")[0];
var deckListName = xmlDoc.getElementsByTagName("Decklist")[0].getAttribute("Deck");
var uniqueCards = deckList.getElementsByTagName("Name").length;
// get the reference for the body

   
var body = document.getElementsByTagName("body")[0];




// creates a <table> element and a <tbody> element

   
var tbl     = document.createElement("table");


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
		case "Land" : intLandCount = intLandCount + parseInt(currentQuantity);


		break; 
		

case "Creature" : intCreatureCount = intCreatureCount + parseInt(currentQuantity); 
		break; 

	
		case "Instant" : intInstantCount = intInstantCount + parseInt(currentQuantity);

	
		break; 

	
		case "Sorcery" : intSorceryCount = intSorceryCount + parseInt(currentQuantity);

	
		break; 


		case "Enchantment" : intEnchantmentCount = intEnchantmentCount + parseInt(currentQuantity);

	
		break; 


		case "Artifact" : intArtifactCount = intArtifactCount + parseInt(currentQuantity);
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


var intTotalConvertedCost = document.createTextNode(totConvertedCost);

	
var intLandCountNode = document.createTextNode("Lands: " + intLandCount);


var intCreatureCountNode = document.createTextNode("Creatures: " + intCreatureCount);


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


cell.appendChild(intTotalConvertedCost);

  
row.appendChild(cell);



		
var cell = document.createElement("td");


cell.appendChild(intLandCountNode);

  
row.appendChild(cell);

var cell = document.createElement("td");


cell.appendChild(intCreatureCountNode);

       
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




	
// This returns a string with everything but the digits removed.
function getConvertedCost(currentCost) {
var intColorless = currentCost.replace (/[^\d]/g, "");
if (intColorless.length > 0) {

		
var lenintColorless = intColorless.length}

else {


var lenintColorless = 0
intColorless = 0


}
var totStrLength = currentCost.length
var intConvertedCost = parseInt(intColorless) + (parseInt(totStrLength) - parseInt(lenintColorless))

	
return intConvertedCost
}

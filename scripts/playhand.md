**What does this do?**

```javascript
return {
  cardNames,
  deckSize,
  types,
  totalLands,
};
```

This part of the code is creating and returning an object that encapsulates
several variables. The object is constructed using shorthand property names in
JavaScript object literals. Each property of the returned object corresponds to
a variable from within the `getDeckInformationFromXML()` function.

Here's a breakdown of what each property in the returned object represents:

1. `cardNames`: This property contains an array of card names extracted from the
   XML data. These are the names of the cards in the deck.

2. `deckSize`: This property holds the total number of cards in the deck, which
   is essentially the length of the `cardNames` array.

3. `types`: This property is an array that contains the types of the cards in
   the deck. It's populated while iterating over the card names in the XML data.

4. `totalLands`: This property represents the total number of land cards in the
   deck. It's calculated by counting the occurrences of the "Land" type within
   the `types` array.

By returning an object with these properties, the `getDeckInformationFromXML()`
function allows the caller to access all of this relevant information as a
single entity. This makes it convenient to pass around and use these values
together, rather than returning them individually or managing them separately.

```javascript
const deckInformation = getDeckInformationFromXML();
console.log(deckInformation.cardNames); // Array of card names
console.log(deckInformation.deckSize); // Total number of cards
console.log(deckInformation.types); // Array of card types
console.log(deckInformation.totalLands); // Total number of land cards
```

This approach provides a clear and organized way to package and share multiple
related variables.

** Function getCardNames** This contains a loop that iterates through a
collection of "Card" elements within an XML structure. It's extracting
information from each "Card" element and populating arrays with the extracted
data.

Here's a breakdown of what each step does:

1. `for (const card of deckList.getElementsByTagName("Card")) { ... }`: This
   line of code begins a loop that iterates over each "Card" element within the
   `deckList`. The `deckList` is likely a DOM (Document Object Model) element
   representing the XML data that contains a list of "Card" elements.

2. `const name = card.getElementsByTagName("Name")[0].textContent;`: This line
   extracts the text content of the first "Name" element within the current
   "Card" element. It assumes that there is only one "Name" element within each
   "Card" element and assigns its text content to the `name` variable.

3. `console.log(name);`: This line logs the extracted `name` value to the
   console. It's useful for debugging and verifying that the extraction is
   working as expected.

4. `const quantity = card.getElementsByTagName("Quantity")[0].textContent;`:
   Similar to the previous step, this line extracts the text content of the
   first "Quantity" element within the current "Card" element and assigns it to
   the `quantity` variable.

5. `const type = card.getElementsByTagName("Type")[0].textContent;`: This line
   extracts the text content of the first "Type" element within the current
   "Card" element and assigns it to the `type` variable.

6. `cardNames.push(name);`: This line adds the extracted card name (`name`) to
   the `cardNames` array.

7. `quantities.push(quantity);`: Similarly, this line adds the extracted
   quantity (`quantity`) to the `quantities` array.

8. The code excerpt is cut off at `quantities.push(quantity);`, so it's unclear
   what happens after that.

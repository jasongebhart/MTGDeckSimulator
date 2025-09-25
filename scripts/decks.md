The line `var intColorless = currentCost.replace(/[^\d]/g, "");` is a JavaScript
statement that manipulates a string, specifically `currentCost`. Let me break
down what it does:

1. `currentCost` is a string variable that presumably contains some text related
   to the cost of a card in a collectible card game. This text can include
   numbers, symbols, and other characters.

2. `/[^\d]/g` is a regular expression pattern. It's used in the `replace` method
   to search for all non-digit characters in the `currentCost` string.
   - `/` and `/` are delimiters for the regular expression.
   - `[^\d]` is a character class that matches any character that is not a
     digit. `\d` represents a digit (0-9), and the `^` inside the square
     brackets negates the character class to match any character that is not a
     digit.
   - `g` is a flag that stands for "global," indicating that the regular
     expression should replace all occurrences of the pattern in the string.

3. `replace` is a JavaScript string method. When called on a string, it searches
   for a specified pattern (in this case, the non-digit characters) and replaces
   them with the specified replacement.

4. In this context, `replace(/[^\d]/g, "")` replaces all non-digit characters in
   `currentCost` with an empty string `""`, effectively removing them.

So, the line of code is essentially extracting the numeric digits from the
`currentCost` string and storing them in the `intColorless` variable. It's
commonly used in card games to parse the cost of a card, where digits represent
the amount of a specific resource or currency required to play the card.

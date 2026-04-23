// Hebrew text utilities
// A collection of helper functions

var hebrewLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];
var gematriaValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function calculateGematria(text) {
    var total = 0;
    for (var i = 0; i < text.length; i++) {
        var letter = text[i];
        var index = hebrewLetters.indexOf(letter);
        if (index != -1) {
            total = total + gematriaValues[index];
        }
    }
    return total;
}

function reverseHebrewText(text) {
    var result = '';
    for (var i = text.length - 1; i >= 0; i--) {
        result = result + text[i];
    }
    return result;
}

function findLetterOccurrences(text, letter) {
    var count = 0;
    for (var i = 0; i < text.length; i++) {
        if (text[i] == letter) {
            count++;
        }
    }
    return count;
}

function isHebrewLetter(char) {
    if (hebrewLetters.indexOf(char) != -1) {
        return true;
    } else {
        return false;
    }
}

console.log(calculateGematria('אבג'));

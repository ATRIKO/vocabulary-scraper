// Dependencies
var request = require("request");
var cheerio = require("cheerio");
var fs = require("fs");
var vocabularyDatabase = require("./models");


// Global Variables
var lexiconSize = 1000; // Number of words in the file to process
var setSize = 200;      // Target # of words per vocab set
var lexicon = [];
var wordCounter;

vocabularyDatabase.sequelize.sync({ force: true }).then(function () {
 
    fs.readFile("derewo-v-40000g-2009-12-31-0.1", "utf8", function (err, data) {

        lexicon = parseVocabFile(data);
        wordCounter = 0;

        var scrapeCycle = setInterval(scrapeWord, 1000);
    });
});


// Functions
function processNoun($, setNum, word) {

    // All of the rows of the inflection table
    var rows = $("div#mw-content-text table.inflection-table tbody tr");
    var rowIndex, singColIndex, plurColIndex;

    // Find the row index
    rows.each(function (i, element) {

        if ($(this).children().eq(0).text() === "Nominativ") {

            rowIndex = i;

        }
    });

    // Find the column index for singular
    rows.eq(0).children().each(function (i, element) {

        if ($(this).text() === "Singular") {

            singColIndex = i;

        } else if ($(this).text() === "Singular 1") {

            singColIndex = i;
        }
    });

    // Find the column index for plural
    rows.eq(0).children().each(function (i, element) {

        if ($(this).text() === "Plural") {

            plurColIndex = i;

        } else if ($(this).text() === "Plural 1") {

            plurColIndex = i;
        }
    });

    var sing = rows.eq(rowIndex).children().eq(singColIndex).text().trim();
    var plur = rows.eq(rowIndex).children().eq(plurColIndex).text().trim();
    var english = translations($, false);

    // Put in database
    vocabularyDatabase.nouns.create({
        vocab_set: setNum,
        singular: sing,
        plural: plur,
        english_meaning: english
    }).catch(function () {
        skipIt(setNum, word);
    });
}


function processVerb($, setNum, word) {


    // All of the rows of the inflection table
    var rows = $("div#mw-content-text table.inflection-table tbody").children();
    var pres = rows.eq(3).children().eq(1).text().trim();
    var pas = rows.eq(4).children().eq(2).text().trim();
    var pastPart = rows.eq(9).children().eq(0).text().trim();
    var hilfs = rows.eq(9).children().eq(1).text().trim();
    var infin = scrapeName($);
    var english = translations($, true);
   

    vocabularyDatabase.verbs.create({
        vocab_set: setNum,
        infinitive: infin,
        present: pres,
        past: pas,
        past_participle: pastPart,
        helping_verb: hilfs,
        english_meaning: english
    }).catch(function () {
        skipIt(setNum, word);
    });
}


function processAdj($, setNum, word) {

    var adject = scrapeName($);
    var english = translations($, false);

   

    vocabularyDatabase.adjectives.create({
        vocab_set: setNum,
        adjective: adject,
        english_meaning: english
    }).catch(function () {
        skipIt(setNum, word);
    });
    
}


function skipIt(setNum, skippedWord) {

    // Put in skipped table
    vocabularyDatabase.skipped.create({
        vocab_set: setNum,
        word: skippedWord
    }).catch(function (error) {
        console.log(error);
    });
}


function scrapeName($) {

    return $("h1#firstHeading").text().trim();
}


function translations($, to) {

    var trans = $("div#mw-content-text div.mw-collapsible-content table tbody li span[lang=en]");
    var english = "";

    trans.each(function (i, elem) {

        if (english.length >= 1) { english = english + ", " }
        english = english + to?"to ":"" + $(this).text().trim();
    });

    return english;

}


function parseVocabFile(dirtyList) {

    // Trim document heading from file
    const h = eval(dirtyList.indexOf("-------------------------------------------------------------") + 6);
    var data = dirtyList.substring(h);

    // Create array
    var list = data.split("\n");

    // Clean the array elements
    for (i = 0; i < list.length; i++) {
        var n = list[i].search(" ");
        list[i] = list[i].substring(0, n);
    }

    // Trim vocab list to desired size
    var slimList = list.slice(0, lexiconSize);

    // Return array
    return slimList;
}


function scrapeWord() {

    var currentword = lexicon[wordCounter];

    var urlWord = currentword.replace("ä", "%C3%A4").replace("ö", "%C3%B6").replace("ü", "%C3%BC").replace("Ä", "%C3%84").replace("Ö", "%C3%96").replace("Ü", "%C3%9C").replace("ß", "%C3%9F");
    var word = currentword.replace("ä", "\u00E4").replace("ö", "\u00F6").replace("ü", "\u00FC").replace("Ä", "\u00C4").replace("Ö", "\u00D6").replace("Ü", "\u00DC").replace("ß", "\u00DF");
    var URL = "https://de.wiktionary.org/wiki/" + urlWord;

    
    // Get the German wiktionary page HTML for the vocabulary word
    request(URL, function (error, response, html) {

        var $ = cheerio.load(html);

        var speechPart = $("div#mw-content-text h3 span.mw-headline a").text();
        var setNum = Math.floor(parseInt(wordCounter / setSize)) + 1;

        switch (speechPart) {

            case "Substantiv":
                processNoun($, setNum, word);
                break;

            case "Verb":
                processVerb($, setNum, word);
                break;

            case "Adjektiv":
                processAdj($, setNum, word);
                break;

            default:
                skipIt(setNum, word);
        }
    });


    //
    console.log("Word " + wordCounter + " = " + word);

    // Increment counter
    wordCounter++;

    // End
    if (wordCounter >= lexicon.length) {clearInterval(scrapeCycle);}
}









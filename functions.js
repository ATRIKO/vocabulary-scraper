///////////////////////////////////////////////
//////////////// Dependencies /////////////////
///////////////////////////////////////////////

var Table = require("cli-table2");
var request = require("request");
var cheerio = require("cheerio");
var vocabularyDatabase = require("./models");


///////////////////////////////////////////////
////////////////// Functions ///////////////////
///////////////////////////////////////////////

var myFuncs = {


    parseVocabFile: function (unParsedVocabFile, lexiconSize) {

        const fileHeadingJunkIndex = eval(unParsedVocabFile.indexOf("-------------------------------------------------------------") + 6);
        var data = unParsedVocabFile.substring(fileHeadingJunkIndex);
        var vocabArray = data.split("\n");
        for (i = 0; i < vocabArray.length; i++) {
            var n = vocabArray[i].search(" ");
            vocabArray[i] = vocabArray[i].substring(0, n);
        }
        var trimmedVocabArray = vocabArray.slice(2, lexiconSize);
        return trimmedVocabArray;
    },


    validateLexiconSize: function (int) {

        intified = parseInt(int);

        if (typeof intified === "number") {

            if (intified <= 40000 && intified >= 1) { return true; } else { return false; }

        } else { return false; }
    },


    scrapeLexicon: function (lexiconArray) {
        var counter = 0;
        function cycle() {
            myFuncs.scrapePage(lexiconArray[counter], counter);
            counter++;
            if (counter < lexiconArray.length) {
                setTimeout(cycle, 1000);
            }
        }
        cycle();
    },


    scrapePage: function (rawWord, wordIndex) {

        var urlWord = rawWord.replace("ä", "%C3%A4").replace("ö", "%C3%B6").replace("ü", "%C3%BC").replace("Ä", "%C3%84").replace("Ö", "%C3%96").replace("Ü", "%C3%9C").replace("ß", "%C3%9F");
        var cleanedWord = rawWord.replace("ä", "\u00E4").replace("ö", "\u00F6").replace("ü", "\u00FC").replace("Ä", "\u00C4").replace("Ö", "\u00D6").replace("Ü", "\u00DC").replace("ß", "\u00DF");
        var URL = "https://de.wiktionary.org/wiki/" + urlWord;
        var canGoInDB = true;

        if (typeof wordIndex === "number") {
            var vocabSetNumber = Math.floor((wordIndex / 200) + 1);
        } else {
            var vocabSetNumber = 0;
        }

        var resultObject = { vocab_set: vocabSetNumber };
        var skippedObject = { vocab_set: vocabSetNumber, word: cleanedWord };

        request(URL, function (error, response, html) {

            var $ = cheerio.load(html);
            var speechPart = $("div#mw-content-text h3 span.mw-headline a").eq(0).text().trim();
            let advTypes = ["Gradpartikel", "Modaladverb", "Fokuspartikel"];
            if (advTypes.indexOf(speechPart) != -1) { speechPart = "Adverb"; }
            skippedObject.part = speechPart;

            switch (speechPart) {

                case "Substantiv"://////////////////////////////////////////////////////////////////////////

                    var save = vocabularyDatabase.nouns;
                    var tableSavedTo = "Nouns";

                    var inflectionTableRows = $("tbody tr", $("div#mw-content-text table.inflection-table").eq(0));  // $("div#mw-content-text table.inflection-table tbody tr");
                    var rowIndex, singColIndex, plurColIndex;

                    inflectionTableRows.each(function (i, element) {
                        if ($(this).children().eq(0).text().trim() === "Nominativ") {
                            rowIndex = i;
                        }
                    });
                    inflectionTableRows.eq(0).children().each(function (i, element) {
                        if ($(this).text().trim() === "Singular") {
                            singColIndex = i;
                        }
                        else if ($(this).text().trim() === "Singular 1") {
                            singColIndex = i;
                        }
                    });
                    inflectionTableRows.eq(0).children().each(function (i, element) {
                        if ($(this).text().trim() === "Plural") {
                            plurColIndex = i;
                        }
                        else if ($(this).text().trim() === "Plural 1") {
                            plurColIndex = i;
                        }
                    });

                    resultObject.singular = myFuncs.removeParenthesis(inflectionTableRows.eq(rowIndex).children().eq(singColIndex).text().trim());
                    resultObject.plural = myFuncs.removeParenthesis(inflectionTableRows.eq(rowIndex).children().eq(plurColIndex).text().trim());
                    resultObject.english_meaning = myFuncs.translations($, false);

                    break;

                case "Verb":///////////////////////////////////////////////////////////////////////////////

                    var save = vocabularyDatabase.verbs;
                    var tableSavedTo = "Verbs";

                    var rows = $("tbody", $("div#mw-content-text table.inflection-table").eq(0)).children();

                    resultObject.infinitive = $("h1#firstHeading").eq(0).text().trim();
                    resultObject.present = rows.eq(3).children().eq(1).text().trim();
                    resultObject.past = rows.eq(4).children().eq(2).text().trim();
                    resultObject.past_participle = rows.eq(9).children().eq(0).text().trim();
                    resultObject.helping_verb = rows.eq(9).children().eq(1).text().trim();
                    resultObject.english_meaning = myFuncs.translations($, true);

                    break;

                case "Adjektiv":////////////////////////////////////////////////////////////////////////////

                    var save = vocabularyDatabase.adjectives;
                    var tableSavedTo = "Adjectives";

                    resultObject.adjective = $("h1#firstHeading").eq(0).text().trim();
                    resultObject.english_meaning = myFuncs.translations($, false);

                    break;

                case "Adverb":////////////////////////////////////////////////////////////////////////////

                    var save = vocabularyDatabase.adverbs;
                    var tableSavedTo = "Adverbs";

                    resultObject.adverb = $("h1#firstHeading").eq(0).text().trim();
                    resultObject.english_meaning = myFuncs.translations($, false);

                    break;

                default:////////////////////////////////////////////////////////////////////////////////////

                    var tableSavedTo = "Skipped";
                    canGoInDB = false;
            }

            if (myFuncs.validateResultObject(resultObject) === false) {
                canGoInDB = false;
                tableSavedTo = "Skipped";
            }

            myFuncs.displayScrapedDataAsTable(resultObject, cleanedWord, speechPart, tableSavedTo);

            if (canGoInDB === true) {
                save.create(resultObject);
            } else {
                vocabularyDatabase.skipped.create(skippedObject);
            }
        });
    },


    validateResultObject: function (resultObject) {

        for (var prop in resultObject) {
            if (resultObject.hasOwnProperty(prop)) {
                if (resultObject[prop] === "") {
                    return false;
                }
            }
        }
        if ((resultObject.vocab_set === "NaN") || (resultObject.vocab_set < 0)) {
            return false;
        }
        return true;
    },


    displayScrapedDataAsTable: function (resultObject, cleanedWord, speechPart, tableSavedTo) {
        var outputHead = ["Word", "Category", "Table"];
        var outputRow = [cleanedWord, speechPart, tableSavedTo];

        for (var prop in resultObject) {
            if (resultObject.hasOwnProperty(prop)) {
                outputHead.push(prop);
                outputRow.push(resultObject[prop]);
            }
        }
        var output = new Table({ head: outputHead });
        output.push(outputRow);
        console.log(output.toString());
    },


    removeParenthesis: function (noun) {
        var open = noun.indexOf("(");
        var close = noun.indexOf(")");
        if ((open != -1) || (close != -1)) {
            var ddd = noun.slice((open + 1), close);
            if ((ddd === "der") || (ddd === "die") || (ddd === "das")) {
                return noun.replace("(", "").replace(")", "").trim();
            } else {
                var newNoun = noun.substring(0, open);
                newNoun += noun.substring((close + 1), noun.length);
                return newNoun.trim();
            }
        } else {
            return noun;
        }
    },


    translations: function ($, to) {
        var trans = $("table tbody li span[lang = en]", $("div#mw-content-text div.mw-collapsible-content").eq(0));
        var english = "";
        trans.each(function (i, elem) {
            if (i < 5) {
                if (english.length >= 1) { english = english + ", "; }
                if (to) { english = english + "to "; }
                english = english + $(this).text().trim();
            }
        });
        return english;
    }


}


module.exports = myFuncs;








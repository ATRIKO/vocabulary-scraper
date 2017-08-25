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

    scrapeWord: function (currentWord, count) {


        var urlWord = currentWord.replace("ä", "%C3%A4").replace("ö", "%C3%B6").replace("ü", "%C3%BC").replace("Ä", "%C3%84").replace("Ö", "%C3%96").replace("Ü", "%C3%9C").replace("ß", "%C3%9F");
        var word = currentWord.replace("ä", "\u00E4").replace("ö", "\u00F6").replace("ü", "\u00FC").replace("Ä", "\u00C4").replace("Ö", "\u00D6").replace("Ü", "\u00DC").replace("ß", "\u00DF");
        var URL = "https://de.wiktionary.org/wiki/" + urlWord;


        // Get the German wiktionary page HTML for the vocabulary word
        request(URL, function (error, response, html) {

            var $ = cheerio.load(html);

            var speechPart = $("div#mw-content-text h3 span.mw-headline a").eq(0).text().trim();
            var setNum = Math.floor(parseInt(count / 200)) + 1;

            // Console log
            var requestLog = new Table({ head: ["#", "Set", "Word", "Part of Speech"] });
            requestLog.push([count, setNum, word, speechPart]);

            switch (speechPart) {

                case "Substantiv":
                    myFuncs.processNoun($, setNum, word);
                    break;

                case "Verb":
                    myFuncs.processVerb($, setNum, word);
                    break;

                case "Adjektiv":
                    myFuncs.processAdj($, setNum, word);
                    break;

                default:
                    myFuncs.skipIt(setNum, word);
            }
        });
    },


    processNoun: function ($, setNum, word) {

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

            if ($(this).text().trim() === "Singular") {

                singColIndex = i;

            } else if ($(this).text().trim() === "Singular 1") {

                singColIndex = i;
            }
        });

        // Find the column index for plural
        rows.eq(0).children().each(function (i, element) {

            if ($(this).text().trim() === "Plural") {

                plurColIndex = i;

            } else if ($(this).text().trim() === "Plural 1") {

                plurColIndex = i;
            }
        });

        var sing = rows.eq(rowIndex).children().eq(singColIndex).text().trim();
        var plur = rows.eq(rowIndex).children().eq(plurColIndex).text().trim();
        var english = translations($, false);

        // Handle definite articles in parenthesis
        var x = sing.indexOf("(");
        var y = sing.indexOf(")");       
        if (sing.slice(x + 1, y) === "der" || "die" || "das") {
            sing = sing.replace("(", "").replace(")", "");
        } else if (x || y === -1) {
            sing = sing.slice(0, x) + sing.slice(y + 1, sing.length);
        }
        

        // Put in database
        vocabularyDatabase.nouns.create({
            vocab_set: setNum,
            singular: sing,
            plural: plur,
            english_meaning: english
        }).catch(function (err) {
            console.log(err.errors.message);
            skipIt(setNum, word);
        });
    },


    processVerb: function ($, setNum, word) {


        // All of the rows of the inflection table
        var rows = $("div#mw-content-text table.inflection-table tbody").children();
        var pres = rows.eq(3).children().eq(1).text().trim();
        var pas = rows.eq(4).children().eq(2).text().trim();
        var pastPart = rows.eq(9).children().eq(0).text().trim();
        var hilfs = rows.eq(9).children().eq(1).text().trim();
        var infin = myFuncs.scrapeName($);
        var english = translations($, true);


        vocabularyDatabase.verbs.create({
            vocab_set: setNum,
            infinitive: infin,
            present: pres,
            past: pas,
            past_participle: pastPart,
            helping_verb: hilfs,
            english_meaning: english
        }).catch(function (err) {
            console.log(err.errors.message);
            skipIt(setNum, word);
        });
    },


    processAdj: function ($, setNum, word) {

        var adject = scrapeName($);
        var english = translations($, false);
        

        vocabularyDatabase.adjectives.create({
            vocab_set: setNum,
            adjective: adject,
            english_meaning: english
        }).catch(function (err) {
            console.log(err.errors.message);
            skipIt(setNum, word);
        });
    },


    skipIt: function (setNum, skippedWord) {

        // Put in skipped table
        vocabularyDatabase.skipped.create({
            vocab_set: setNum,
            word: skippedWord
        }).catch(function (err) {
            console.log(err.errors.message);
        });
    },


    scrapeName: function ($) {

        return $("h1#firstHeading").text().trim();
    },


    translations: function ($, to) {

        var trans = $("div#mw-content-text div.mw-collapsible-content table tbody li span[lang=en]");
        var english = "";

        trans.each(function (i, elem) {

            if (english.length >= 1) { english = english + ", "; }
            if (to) { english = english + "to "; }
            english = english + $(this).text().trim();
        });

        return english;

    },


    parseVocabFile: function (dirtyList, lexiconSize) {

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
    },


    validateLexiconSize: function (int) {

        intified = parseInt(int);

        if (typeof intified === "number") {

            if (intified <= 40000 && intified >= 1) { return true; } else { return false; }

        } else { return false; }
    }
}


module.exports = myFuncs;


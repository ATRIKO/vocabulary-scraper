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

//
// lexicon = myFuncs.parseVocabFile(file, response.sizeChoice);
// myFuncs.scrapeLexicon(lexicon);
//
// myFuncs.scrapePage(enteredWord.page);

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
            //
            counter++;
            if (counter < lexiconArray.length) {
                setTimeout(cycle, 1000);
            }
        }
        cycle();
    },


    scrapePage: function (rawWord, wordIndex) {
        
        var urlWord = rawWord.replace("�", "%C3%A4").replace("�", "%C3%B6").replace("�", "%C3%BC").replace("�", "%C3%84").replace("�", "%C3%96").replace("�", "%C3%9C").replace("�", "%C3%9F");
        var word = rawWord.replace("�", "\u00E4").replace("�", "\u00F6").replace("�", "\u00FC").replace("�", "\u00C4").replace("�", "\u00D6").replace("�", "\u00DC").replace("�", "\u00DF");
        var URL = "https://de.wiktionary.org/wiki/" + urlWord;
        if (typeof wordIndex === "number") {
            var setNum = Math.floor((wordIndex / 200) + 1);
        } else {
            var setNum = "NA";
        }
        request(URL, function (error, response, html) {

            var $ = cheerio.load(html);
            var speechPart = $("div#mw-content-text h3 span.mw-headline a").eq(0).text().trim();
            switch (speechPart) {

                ////////////////////////////////////////////////////////////////////////////////////////////
                case "Substantiv"://////////////////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////////////////////////////////

                    var inflectionTableRows = $("div#mw-content-text table.inflection-table tbody tr");
                    var rowIndex, singColIndex, plurColIndex;
                    inflectionTableRows.each(function (i, element) {
                        if ($(this).children().eq(0).text().trim() === "Nominativ") { rowIndex = i; }
                    });
                    inflectionTableRows.eq(0).children().each(function (i, element) {
                        if ($(this).text().trim() === "Singular") { singColIndex = i; }
                        else if ($(this).text().trim() === "Singular 1") { singColIndex = i; }
                    });
                    inflectionTableRows.eq(0).children().each(function (i, element) {
                        if ($(this).text().trim() === "Plural") { plurColIndex = i; }
                        else if ($(this).text().trim() === "Plural 1") { plurColIndex = i; }
                    });
                    var sing = inflectionTableRows.eq(rowIndex).children().eq(singColIndex).text().trim();
                    var plur = inflectionTableRows.eq(rowIndex).children().eq(plurColIndex).text().trim();
                    var english = myFuncs.translations($, false);
                    var resultObject = {
                        vocab_set: setNum,
                        singular: sing,
                        plural: plur,
                        english_meaning: english                        
                    };
                    var save = vocabularyDatabase.nouns;
                    break;

                ////////////////////////////////////////////////////////////////////////////////////////////
                case "Verb":///////////////////////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////////////////////////////////

                    var infin = $("h1#firstHeading").text().trim() || cleanedWord;
                    var rows = $("div#mw-content-text table.inflection-table tbody").children();
                    var pres = rows.eq(3).children().eq(1).text().trim();
                    var pas = rows.eq(4).children().eq(2).text().trim();
                    var pastPart = rows.eq(9).children().eq(0).text().trim();
                    var hilfs = rows.eq(9).children().eq(1).text().trim();
                    var english = myFuncs.translations($, true);
                    var resultObject = {
                        vocab_set: setNum,
                        infinitive: infin,
                        present: pres,
                        past: pas,
                        past_participle: pastPart,
                        helping_verb: hilfs,
                        english_meaning: english
                    };
                    var save = vocabularyDatabase.verbs;
                    break;

                ////////////////////////////////////////////////////////////////////////////////////////////
                case "Adjektiv":////////////////////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////////////////////////////////

                    var adject = $("h1#firstHeading").text().trim() || cleanedWord;
                    var english = myFuncs.translations($, false);
                    var resultObject = {
                        vocab_set: setNum,
                        adjective: adject,
                        english_meaning: english
                    };
                    var save = vocabularyDatabase.adjectives;
                    break;

                ////////////////////////////////////////////////////////////////////////////////////////////
                default:////////////////////////////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////////////////////////////////

                    var resultObject = {
                        vocab_set: setNum,
                        adjective: adject,
                        english_meaning: english
                    };
                    var save = vocabularyDatabase.skippeds;
            }
            ////////////////////////////////////////////////////////////////////////////////////////////
            var outputHead = ["Rank", "Part of Speech"];
            var outputRow = [wordIndex, speechPart];
            for (var property in resultObject) {
                if (resultObject.hasOwnProperty(property)) {
                    outputHead.push(property);
                    outputRow.push(resultObject[property]);
                }
            }
            outputHead.push("Saved to Table");
            var output = new Table({ head: outputHead });
            ////////////////////////////////////////////////////////////////////////////////////////////
            save.create(resultObject).then(function (result) {
                outputRow.push(result.constructor.name);
                output.push(outputRow);
                console.log(output.toString());
            }).catch(function (error) {
                vocabularyDatabase.skippeds.create({

                }).then(function (result) {
                    outputRow.push(result.constructor.name);
                    output.push(outputRow);
                    console.log(output.toString());
                });
            });            
            
        });
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
    }


}


module.exports = myFuncs;





    /*

    scrapeWord: function (currentWord, count) {
        
        var urlWord = currentWord.replace("�", "%C3%A4").replace("�", "%C3%B6").replace("�", "%C3%BC").replace("�", "%C3%84").replace("�", "%C3%96").replace("�", "%C3%9C").replace("�", "%C3%9F");
        var word = currentWord.replace("�", "\u00E4").replace("�", "\u00F6").replace("�", "\u00FC").replace("�", "\u00C4").replace("�", "\u00D6").replace("�", "\u00DC").replace("�", "\u00DF");
        var URL = "https://de.wiktionary.org/wiki/" + urlWord;
        
        request(URL, function (error, response, html) {

            var $ = cheerio.load(html);

            var speechPart = $("div#mw-content-text h3 span.mw-headline a").eq(0).text().trim();

            // count is false when testing single page
            if (count != false) { var setNum = Math.floor(parseInt(count / 200)) + 1; }
            else { var setNum = false; }
            
            var requestLog = new Table({ head: ["#", "Word", "Part of Speech"] });
            requestLog.push([count, word, speechPart]);
            console.log(requestLog.toString());

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
        if (!sing) { sing = word; }
        var plur = rows.eq(rowIndex).children().eq(plurColIndex).text().trim();
        var english = myFuncs.translations($, false);

        // Handle definite articles in parenthesis
        var x = sing.indexOf("(");
        var y = sing.indexOf(")");       
        if (sing.slice(x + 1, y) === "der" || "die" || "das") { sing = sing.replace("(", "").replace(")", ""); }
        else if (x || y === -1) { sing = sing.slice(0, x) + sing.slice(y + 1, sing.length); }  
        
        if (setNum != false) { myFuncs.saveNoun(setNum, sing, plur, english); }     


        console.log(!setNum);

        var requestLog = new Table({ head: ["Set", "Singular", "Plural", "English Translation"] });
        requestLog.push([setNum, sing, plur, english]);
        console.log(requestLog.toString());

    },


    saveNoun: function (setNum, sing, plur, english) {

        vocabularyDatabase.nouns.create({
            vocab_set: setNum,
            singular: sing,
            plural: plur,
            english_meaning: english
        }).catch(function (err) {
            console.log(err.errors.message);
            myFuncs.skipIt(setNum, sing);
        });
    },


    processVerb: function ($, setNum, word) {
        
        var rows = $("div#mw-content-text table.inflection-table tbody").children();
        var pres = rows.eq(3).children().eq(1).text().trim();
        var pas = rows.eq(4).children().eq(2).text().trim();
        var pastPart = rows.eq(9).children().eq(0).text().trim();
        var hilfs = rows.eq(9).children().eq(1).text().trim();
        var infin = myFuncs.scrapeName($);
        if (!infin) { infin = word; }
        var english = myFuncs.translations($, true);

        console.log(!setNum);

        if (setNum != false) { myFuncs.saveVerb(setNum, infin, pres, pas, pastPart, hilfs, english); }
        
        var requestLog = new Table({ head: ["Set", "Infinitive", "3rd Present", "Paste", "Past Participle", "Helping Verb", "English Translation"] });
        requestLog.push([setNum, infin, pres, pas, pastPart, hilfs, english]);
        console.log(requestLog.toString());

    },


    saveVerb: function (setNum, infin, pres, pas, pastPart, hilfs, english) {

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
            myFuncs.skipIt(setNum, infin);
        });
    },


    processAdj: function ($, setNum, word) {

        var adject = myFuncs.scrapeName($);
        var english = myFuncs.translations($, false);
        if (!adject) { adject = word; }

        if (setNum != false) { myFuncs.saveAdj(setNum, adject, english); }

        console.log(!setNum);

        var requestLog = new Table({ head: ["Set", "Adjective", "English Translation"] });
        requestLog.push([setNum, adject, english]);
        console.log(requestLog.toString());

    },


    saveAdj: function (setNum, adject, english) {

        vocabularyDatabase.adjectives.create({

            vocab_set: setNum,
            adjective: adject,
            english_meaning: english
        }).catch(function (err) {

            console.log(err.errors.message);
            myFuncs.skipIt(setNum, adject);
        });
    },


    skipIt: function (setNum, skippedWord) {
        
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

*/






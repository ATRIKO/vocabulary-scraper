///////////////////////////////////////////////
//////////////// Dependencies /////////////////
///////////////////////////////////////////////

var fs = require("fs");
var vocabularyDatabase = require("./models");
var inquirer = require("inquirer");
var myFuncs = require("./functions.js");



///////////////////////////////////////////////
////////////// Global Variables ///////////////
///////////////////////////////////////////////

var lexiconSize;
var requestInterval = 1000;
var lexicon = [];
var wordCounter;



///////////////////////////////////////////////
//////////////// Control Flow /////////////////
///////////////////////////////////////////////

vocabularyDatabase.sequelize.sync({ force: true }).then(function () {

    var mainMenu = ["Scrape Top Words", "Test Scrape Single Page"];

    inquirer.prompt({

        type: "list",
        name: "mainMenuSelection",
        message: "Main Menu",
        choices: mainMenu

    }).then(function (selection) {

        switch (selection.mainMenuSelection) {

            case mainMenu[0]:
                inquirer.prompt({

                    type: "input",
                    name: "selectedLexiconSize",
                    message: "How many words? (max 40,000)",
                    validate: myFuncs.validateLexiconSize

                }).then(function (lexiconSize) {

                    fs.readFile("derewo-v-40000g-2009-12-31-0.1", "utf8", function (err, vocabFile) {

                        lexicon = myFuncs.parseVocabFile(vocabFile, lexiconSize.selectedLexiconSize);
                        wordCounter = 0;
                        var scrapeCycle = setInterval(

                            function () {

                                currentWord = lexicon[wordCounter];
                                myFuncs.scrapeWord(currentWord, wordCounter);
                                wordCounter++;

                                if (wordCounter >= lexicon.length) { clearInterval(scrapeCycle); }
                            },
                            requestInterval
                        );
                    });

                });
                break;

            case mainMenu[1]:
                inquirer.prompt({

                    type: "input",
                    name: "page",
                    message: "Enter the word."
                }).then(function (enteredWord) {

                    myFuncs.scrapeWord(enteredWord.page, false);

                });
                break;
        }
    });
});




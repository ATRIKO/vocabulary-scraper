///////////////////////////////////////////////
//////////////// Dependencies /////////////////
///////////////////////////////////////////////

var fs = require("fs");
var vocabularyDatabase = require("./models");
var inquirer = require("inquirer");
var functions = require("./functions.js");



///////////////////////////////////////////////
////////////// Global Variables ///////////////
///////////////////////////////////////////////

var lexiconSize;
var setSize = 200;          // Target # of words per vocab set
var requestInterval = 1000;
var lexicon = [];
var wordCounter;
var scrapeCycle;



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
                    validate: functions.validateLexiconSize

                }).then(function (lexiconSize) {

                    fs.readFile("derewo-v-40000g-2009-12-31-0.1", "utf8", function (err, vocabFile) {

                        lexicon = functions.parseVocabFile(vocabFile, lexiconSize.selectedLexiconSize);
                        wordCounter = 0;

                        currentWord = lexicon[wordCounter];

                        scrapeCycle = setInterval(function () { functions.scrapeWord(currentWord); }, requestInterval);

                    });

                });
                break;

            case mainMenu[1]:
                inquirer.prompt({

                    type: "input",
                    name: "page",
                    message: "Enter the word."
                }).then(function (enteredWord) {

                    functions.scrapeWord(enteredWord);

                });
                break;
        }
    });
});




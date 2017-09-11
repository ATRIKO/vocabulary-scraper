# vocabulary-scraper

## Purpose

I wrote this app to create a large database of vocabulary words for my (upcoming) German language learning website, dasVocab.com.

## Problem

I started with a text file of the top 40,000 German words from the [Institute of German Language](http://www1.ids-mannheim.de/kl/projekte/methoden/derewo.html), which is sorted descending by usage frequency and contains only the principal forms of every word. I needed the words sorted by part of speech and saved into tables accordingly.

## How it Works

The app first prompts the user for the number of words to scrape. Then it parses the vocab file and starts to scrape the German Wiktionary page for each word. The part of speech is read from the page, and if the word is a noun or a verb, then additional information is gleaned from the HTML as detailed below:

* Verbs (all principal parts)
  * Infinitive
  * 3rd person present conjugation
  * Simple past conjugation
  * Past participle
  * Helping verb (for past tense)
* Nouns
  * Gender
  * Singular form
  * Plural form
* Adjectives
  * Root form only
* Adverbs
  * Root form only


A vocabulary set number is also assigned to each word based on its location in the list (and therefore its importance). The app then validates all the scraped data and saves it in the appropriate MySQL table.

![Console display](http://i.imgur.com/VFwlqFv.png)
A live console feed shows the user what is being scraped and where it's being saved to. Any entry which does not pass validation is automattically saved to a "skipped" table for later review.


![The result](https://i.imgur.com/maWhDnY.png)
Voila! Thousands of words with appropriate data.




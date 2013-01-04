Grue
====

Grue is a JavaScript library for constructing interactive fiction games. It provides a
World, Regions, Rooms, and other standard IF constructs. Grue ties its objects together
using a combination of simple events and jQuery-like selectors. The goal is to provide a
fluent, straightforward interface that makes setting scenes and cueing up actions as easy as
possible.

My original plan was to port Inform7 to JavaScript, because as a writer and a coder I find its weird, English-like syntax to be fascinating. Unfortunately I ran into two issues:

* As a user, Inform's syntax is kind of batty and hard to predict. It only _looks_ like English.
* As an implementor, I have no idea even where to start with an Inform7 parser.

As a result, I started working on Grue instead. It uses JavaScript in a natural, descriptive way so that there's not too much coding involved, and it's intended to make it easy to build and change object behavior and relationships without creating spaghetti code. Take a look at test.js to see a simple (and recognizable) example in under 100 lines of code (and it'll be far shorter once the basic parsing rules are moved out into a separate library).

Currently, there are five files that load up the test environment:

* World.js - the main Grue library, which implements the base prototypes and utility functions.
* BaseRules.js - contains the main parser vocabulary for my test game. This will eventually become a generic ruleset that people can build on.
* test.js - builds a small, familiar scene using Grue, as a way of testing the environment.
* almond.js - a small AMD loader by James Burke, used by Grue to load the base ruleset without strongly coupling them together.
* index.html - loads all of the above, and provides a retro-styled interface for the Grue console.

You can view a live version of the current Grue test environment by [visiting the demo page](http://thomaswilburn.github.com/Grue).

My current approach is to write in test.js according to the API I want to see, then do work in the other files to make that API occur--a kind of test-driven development, I guess. I still have to do a bit more work before everything is stable, but at the moment it's enough to build rooms, populate them with objects, and connect them to each other.

_this space intentionally left blank._
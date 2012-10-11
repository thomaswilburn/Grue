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

As a result, I started working on Grue. It uses JavaScript in a natural, descriptive way so that there's not too much coding involved, and it's intended to make it easy to build and change object behavior and relationships without creating spaghetti code. Take a look at test.js to see a simple (and recognizable) example in under 100 lines of code (and it'll be far shorter once the basic parsing rules are moved out into a separate library).

//test case - I write code here the way I'd want to do it, then make it work
//on the back end. Later on, many of the rules tested here will be moved into
//a "base rules" file that you can import before writing your code.

//We're switching to AMD modules because they make loading the dependencies
//much, much easier compared to my original thought (manually hooking
//everything together using a few global scope objects--ugly!).

require(['Grue'], function(World) {

var zork = new World();

// Set up our UI
var input = document.querySelector('#input');
var output = document.querySelector('#output');

zork.io.attach(input, output);

zork.io.onUpdate = function() {
  output.scrollTop = output.scrollHeight - output.offsetHeight;
}

// Here's where the real definition of our world begins. We start by creating
// a "room" and setting it as our world's current location.

var field = zork.Room();
field.description = "You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here.";
zork.currentRoom = field;

// Now we want to add something to the room--a mailbox, which is a kind of
// container.

var mailbox = zork.Container();
field.add(mailbox);
mailbox.open = false;
mailbox.name = "A small mailbox";
mailbox.description = "It's painted red.";
mailbox.pattern = /mail(box)*/;

// And then we create the leaflet, and place it inside of the mailbox for
// players to find.

var leaflet = zork.Thing();
mailbox.add(leaflet);
leaflet.cue('read', "WELCOME TO ZORK!\nZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!");
leaflet.description = "It looks like some kind of product pitch."
leaflet.pattern = /leaflet/;
leaflet.portable = true;
leaflet.name = "A leaflet of some kind."

// Scenery is a special kind of object that's ignored for the purposes of in-
// room inventory lists, but is still interactive. You can use it as a way to
// flesh out a scene, but without adding objects that the player will try to
// pick up or move around.

var door = zork.Scenery();
field.add(door);
door.cue('open', "The door cannot be opened.");
door.cue('cross', "The door is boarded and you can't remove the boards.");
door.description = "It's all boarded up.";
door.pattern = /(boarded )*(front )*door/;

// Finally, we add another room to the world. By positioning it on the n
// property of the field, it's placed to the north. We also link its south
// portal so we can get back to the field.

var northOfHouse = zork.Room();
northOfHouse.description = "You are facing the north side of a white house. There is no door here, and all the windows are boarded up. To the north a narrow path winds through the trees.";
field.n = northOfHouse;
northOfHouse.s = field;

// Hey, how about a darkness (magic missile sold separately!)

var lantern = zork.Thing();
lantern.pattern = /(brass )*lantern/;
lantern.name = "Brass lantern";
lantern.cue('activate', function() {
  this.say("The lantern flickers on, shedding a reluctant light on your surroundings.");
  this.on = true;
});
lantern.cue('deactivate', function() {
  this.say("The lantern's glow fades, sputters, and dies.")
  this.on = false;
});
lantern.on = false;
lantern.portable = true;
lantern.description = "It's a classy-looking lantern";
lantern.cue('look', function() {
  this.say("The lantern is currently " + (this.on ? "lit" : "dark") + ".");
});
northOfHouse.add(lantern);

var darkness = zork.Thing();
darkness.cue('look', function() {
  if (zork.player.inventory.contents.contains(lantern) && lantern.on) {
    return;
  }
  zork.print("It's too dark. You might get eaten by a grue.");
  return false;
});

// We need some places to be dark, then.

var forest = zork.Room();
forest.description = "It's a very nice forest, with paths in every direction. A bit dark though. It'd be easy to get lost.";
forest.s = northOfHouse;
northOfHouse.n = forest;
forest.e = forest.n = forest.w = forest;
forest.regions.add(darkness);

// Let's start off by looking around to set the scene.

zork.currentRoom.ask('look');

});

//test case - I write code here the way I'd want to do it, then make it work
//on the back end. Later on, many of the rules tested here will be moved into
//a "base rules" file that you can import before writing your code.

var zork = new World();

// Set up our UI
var input = document.querySelector('#input');
var output = document.querySelector('#output');

zork.io.attach(input, output);

zork.io.onUpdate = function() {
  output.scrollTop = output.scrollHeight - output.offsetHeight;
}

// These are the basic parsing rules for interacting with the world. Once
// these are stable and generic, I'll move them into a separate base rules
// file, the same way Inform7 has a base set of rules governing how items
// work.

zork.parser.addRule(/(look|examine|describe)( at )*([\w\s]+)*/i, function(match) {
  var awake = this.currentRoom.contents.invoke('nudge', match[3]).first();
  if (!awake && match[3]) return false;
  if (awake) {
    awake.ask('look');
  } else if (!match[3]) {
    this.currentRoom.ask('look');
  }
});

zork.parser.addRule(/(open|close) ([\s\w]+)/i, function(match) {
  var verb = match[1];
  var awake = field.contents.invoke('nudge', match[2]).first();
  if (awake) {
    awake.ask(verb);
  } else {
    zork.print("You can't open that.");
  }
});

zork.parser.addRule(/(take|get|pick up) (\w+)(?: from )*(\w*)/, function(match) {
  var allTheThings = field.contents.toArray();
  var containers = field.query('type="Container",open=true');
  containers.each(function(c) {
    allTheThings = allTheThings.concat(c.contents.toArray());
  });
  allTheThings = zork.Bag(allTheThings);
  var portable = allTheThings.invoke('nudge', match[2]).query('portable=true').first();
  if (!portable) return zork.print("You can't take that with you.");
  portable.parent.remove(portable);
  zork.print('Taken');
  this.player.inventory.add(portable);
});

zork.parser.addRule(/read ([\w\s]+\w)/, function(match) {
  var awake = zork.getLocalThings().invoke('nudge', match[1]).first();
  awake.ask('read');
});

zork.parser.addRule(/^i(nventory)*$/, function() {
  var listing = zork.player.inventory.ask('contents');
  if (!listing) {
    zork.print("You're not carrying anything.");
  } else {
    zork.print(listing);
  }
});

zork.parser.addRule(/^go ([\w]+)|^(n|north|s|south|e|east|w|west|in|inside|out|outside|up|down)$/i, function(match) {
  zork.currentRoom.ask('go', {direction: match[1] || match[2]});
});

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

// Let's start off by looking around to set the scene.

zork.currentRoom.ask('look');
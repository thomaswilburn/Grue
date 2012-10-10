
//test case - make this work

var zork = new World();

var input = document.querySelector('#input');
var output = document.querySelector('#output');

zork.io.attach(input, output);

zork.parser.addRule(/(look|examine|describe) (at )*([\w\s]+)/i, function(match) {
  var awake = field.contents.invoke('nudge', match[3]).first();
  if (awake) {
    awake.ask('look');
  }
});

zork.parser.addRule(/(open|close) ([\s\w]+)/i, function(match) {
  var verb = match[1];
  var awake = field.contents.invoke('nudge', match[2]).first();
  if (awake) {
    awake.ask(verb);
  }
});

zork.parser.addRule(/take (\w+)(?: from )*(\w*)/, function(match) {
  var allTheThings = field.contents.toArray();
  var containers = field.contents.query('type=Container');
  containers.each(function(c) {
    allTheThings = allTheThings.concat(c.contents.toArray());
  });
  allTheThings = zork.Bag(allTheThings);
  var portable = allTheThings.query('portable=true').first();
  portable.parent.remove(portable);
  inventory.add(portable);
});

zork.parser.addRule(/read ([\w\s]+\w)/, function(match) {
  var awake = zork.getLocalThings().invoke('nudge', match[1]).first();
  awake.ask('read');
});

var inventory = zork.Container();
zork.considerLocal(inventory);

var field = zork.Room();
field.description = "You are standing in an open field west of a white house, with a boarded front door.\nThere is a small mailbox here.";
zork.currentRoom = field;

var mailbox = zork.Container();
field.add(mailbox);
mailbox.open = false;
mailbox.description = "It's painted red."
mailbox.pattern = /mail(box)*/;

var leaflet = zork.Thing();
mailbox.add(leaflet);
leaflet.cue('read', "WELCOME TO ZORK!\nZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!");
leaflet.description = "It looks like some kind of product pitch."
leaflet.pattern = /leaflet/;
leaflet.portable = true;

var door = zork.Scenery();
field.add(door);
door.cue('open', "The door cannot be opened.");
door.cue('cross', "The door is boarded and you can't remove the boards.");
door.description = "It's all boarded up.";
door.pattern = /(boarded\s)*(front\s)*door/;

var player = zork.Player();
player.location = field;
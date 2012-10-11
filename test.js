
//test case - I write code here the way I'd want to do it, then make it work
//on the back end. Later on, many of the rules tested here will be moved into
//a "base rules" file that you can import before writing your code.

var zork = new World();

var input = document.querySelector('#input');
var output = document.querySelector('#output');

zork.io.attach(input, output);

zork.io.onUpdate = function() {
  output.scrollTop = output.scrollHeight - output.offsetHeight;
}

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

var field = zork.Room();
field.description = "You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here.";
zork.currentRoom = field;

var mailbox = zork.Container();
field.add(mailbox);
mailbox.open = false;
mailbox.name = "A small mailbox";
mailbox.description = "It's painted red.";
mailbox.pattern = /mail(box)*/;

var leaflet = zork.Thing();
mailbox.add(leaflet);
leaflet.cue('read', "WELCOME TO ZORK!\nZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!");
leaflet.description = "It looks like some kind of product pitch."
leaflet.pattern = /leaflet/;
leaflet.portable = true;
leaflet.name = "A leaflet of some kind."

var door = zork.Scenery();
field.add(door);
door.cue('open', "The door cannot be opened.");
door.cue('cross', "The door is boarded and you can't remove the boards.");
door.description = "It's all boarded up.";
door.pattern = /(boarded )*(front )*door/;

var northOfHouse = zork.Room();
northOfHouse.description = "You are facing the north side of a white house. There is no door here, and all the windows are boarded up. To the north a narrow path winds through the trees.";
field.n = northOfHouse;
northOfHouse.s = field;

zork.currentRoom.ask('look');
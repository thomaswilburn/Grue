
//test case - make this work

var zork = new World();

var field = zork.Room();
field.description = "You are standing in an open field west of a white house, with a boarded front door.\nThere is a small mailbox here.";

var mailbox = zork.Container();
field.add(mailbox);
mailbox.open = false;
mailbox.description = "It's painted red."

var leaflet = zork.Thing();
mailbox.add(leaflet);
leaflet.cue('read', "WELCOME TO ZORK!\nZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!");
leaflet.description = "It looks like some kind of product pitch."

var door = zork.Scenery();
field.add(door);
door.cue('open', "The door cannot be opened.");
door.cue('cross', "The door is boarded and you can't remove the boards.");
door.description = "It's all boarded up.";

var player = zork.Player();
player.location = field;
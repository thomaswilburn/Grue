
//test case - make this work

var zork = new World();

var field = zork.Room();
field.description = "You are standing in an open field west of a white house, with a boarded front door.\nThere is a small mailbox here.";

var mailbox = zork.Container();
field.contains(mailbox);
mailbox.open = false;
mailbox.name = "the small mailbox";
mailbox.description = function() {
  if (this.open) {
    return this.say('contents');
  } else {
    return this.name + " is closed.";
  }
}

var leaflet = zork.Thing();
mailbox.contains(leaflet);
leaflet.name = "a leaflet";
leaflet.description = "WELCOME TO ZORK!\nZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!";

var door = zork.Scenery();
field.contains(door);
door.name = 'door';
door.actions.open = "The door cannot be opened.";
door.actions.cross = "The door is boarded and you can't remove the boards."

var player = zork.Player();
player.location = field;
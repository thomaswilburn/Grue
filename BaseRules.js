define('Grue/BaseRules', {

  /*

  To match Zork, we need:
    north/northeast/east/southeast/south/southwest/west/northwest
    up/down
    look
    save/restore (?)
    restart
    verbose
    score
    diagnostic

    take [all]
    throw X at Y
    open X
    read X
    drop X
    put X in Y
    turn X with Y
    turn on X
    turn off X
    move X
    attack X with Y
    examine X
    inventory
    eat X
    shout
    close X
    tie X to Y
    kill self with X

  */

  /*

  Placing the rules in the init property of this object is partly a response
  to the way RequireJS works, but it also has the side-effect of letting us
  segment rules into groups: some of which exist at the start, both others
  that we could call later on, in response to rule changes.

  */

  init: function(world) {

    world.parser.addRule(/(look|examine|describe)( at )*([\w\s]+)*/i, function(match) {
      var object = match[3];
      if (object) {
        world.askLocal('look', match[3]);  
      } else if (world.currentRoom.check('look')) {
        world.currentRoom.ask('look');
      }
    });

    world.parser.addRule(/(open|close) ([\s\w]+)/i, function(match) {
      var verb = match[1];
      var awake = world.getLocal(false, match[2]);
      if (awake) {
        awake.ask(verb);
      } else {
        world.print("You can't open that.");
      }
    });

    world.parser.addRule(/read ([\w\s]+\w)/, function(match) {
      var awake = world.getLocal(false, match[1]);
      if (awake) {
        awake.ask('read');
      } else {
        world.print("I don't think you can read that right now.")
      }
    });

    world.parser.addRule("turn :item on", function(matches) {
      var awake = world.getLocal(false, matches.item);
      if (awake) {
        awake.ask('activate');
      } else {
        world.print('Turn what on?');
      }
    });

    world.parser.addRule("turn :item off", function(matches) {
      var awake = world.getLocal(false, matches.item);
      if (awake) {
        awake.ask('deactivate');
      } else {
        world.print('Turn what off?');
      }
    });

    world.parser.addRule(/^go ([\w]+)|^(n|north|s|south|e|east|w|west|in|inside|out|outside|up|down)$/i, function(match) {
      world.currentRoom.ask('go', {direction: match[1] || match[2]});
    });

    world.parser.addRule(/(take|get|pick up) (\w+)(?: from )*(\w*)/, function(match) {
      var portable = world.getLocal('portable=true', match[2]);
      if (!portable) return world.print("You can't take that with you.");
      portable.parent.remove(portable);
      portable.ask('taken');
      world.print('Taken.');
      this.player.inventory.add(portable);
    });

    world.parser.addRule("drop :item", function(match) {
      var dropped = this.player.inventory.contents.invoke('nudge', match.item).first();
      if (!dropped) return world.print("You don't have any of those.");
      this.player.inventory.remove(dropped);
      this.currentRoom.add(dropped);
      dropped.ask('dropped');
      world.print("Dropped.");
    });

    world.parser.addRule(/^i(nventory)*$/, function() {
      var listing = world.player.inventory.ask('contents');
      if (!listing) {
        world.print("You're not carrying anything.");
      } else {
        world.print(listing);
      }
    });

  }

})
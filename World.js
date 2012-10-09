var Entity = function(world) {
  this.name = "";
  this.classes = [];
  this.actions = {};
  this.cues = {};
  if (world) {
    this.world = world;
    world.things.push(this);
  }
};
Entity.prototype = {
  get: function(key) {
    if (!this[key]) return null;
    if (typeof this[key] == 'function') {
      return this[key]();
    } else {
      return this[key];
    }
  },
  act: function(action, event) {
    if (!this.actions[action]) return false;
    this.actions[action].call(this, event);
  },
  on: function(action, callback) {
    this.actions[action] = callback;
  },
  say: function(key) {
    if (!this.cues[key]) return "";
    if (typeof this.cues[key] == 'function') {
      return this.cues[key]();
    } else {
      return this.cues[key];
    }
  },
  cue: function(key, value) {
    this.cues[key] = value;
  }
}

Entity.mutate = function(f) {
  f = f || function() {};
  var C = function(world) {
    if (!(this instanceof C)) {
      if (this instanceof World) return new C(this);
      return new C();
    }
    Entity.call(this);
    f.call(this);
    if (world) {
      this.world = world;
      world.things.push(this);
    }
  };
  C.prototype = new Entity();
  return C;
};

var Region = Entity.mutate(function() {
  this.rooms = [];
});

var Room = Entity.mutate(function() {
  this.contents = [];
})
Room.prototype.contains = function(o) {
  this.contents.push(o);
  o.act('entered', {subject: this});
};

var Thing = Entity.mutate();

var Person = Entity.mutate();

var Player = Entity.mutate();

var Container = Entity.mutate(function() {
  this.contents = [];
});
Container.prototype.contains = function(o) {
  this.contents.push(o);
  o.act('inserted', {subject: this});
}

var Supporter = Entity.mutate(function() {
  this.under = [];
});

var Scenery = Entity.mutate();
Scenery.prototype.enumerate = false;

var match = {
  TYPE: "^([A-Z][a-zA-Z]*)",
  CLASS: "\\.([\\w-]+)",
  ID: "#([\\w-]+)",
  ATTRIBUTE: '\\[([\\w-]+)\\s*([!<>=]{1,2})\\s*\"*([\\w-]+)\\"*\\]'
};

var check = function(selector, item) {
  var typeTest = new RegExp(match.TYPE).exec(selector);
  if (typeTest) {
    var className = typeTest[1];
    var isType = new Function("item", "return typeof " + className + " != 'undefined' && item instanceof " + className);
    if (!isType(item)) return false;
  }
  return true;
};

var Filterable = function(array) {
  if (!(this instanceof Filterable)) return new Filterable(array);
  this.items = array;
};
Filterable.prototype.find = function(selector) {
  var filtered = [];
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    if (check(selector, item)) {
      filtered.push(item);
    }
  }
  return new Filterable(filtered);
};
Filterable.prototype.get = function() {
  return this.items;
};
Filterable.prototype.make = function(key, value) {
  for (var i = 0; i < this.items.length; i++) {
    this.items[i][key] = value;
  }
};

var World = function() {
  this.things = [];
  this.player = null;
};
World.prototype = {
  Region: Region,
  Room: Room,
  Player: Player,
  Thing: Thing,
  Container: Container,
  Supporter: Supporter,
  Scenery: Scenery,
  parse: function() {},
  find: function(selector) {

  }
};